package proxy

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/model"
	"github.com/wzyjerry/llm-judge/internal/pkg/redis"
	"go.uber.org/zap"
)

// ModelCallWithRateLimit handles model call with rate limiting
func ModelCallWithRateLimit(c *gin.Context) {
	// Read body for logging before binding
	bodyBytes, _ := io.ReadAll(c.Request.Body)
	// Restore the body for ShouldBindJSON
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req model.ModelCallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Log the actual error and request body for debugging
		zap.L().Error("Failed to bind model call request",
			zap.Error(err),
			zap.String("body", string(bodyBytes)))
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	zap.L().Info("Model call request received",
		zap.String("model", req.Model),
		zap.String("api_url", req.APIUrl),
		zap.Int("max_tokens", req.MaxTokens))

	result, err := performModelCall(&req)
	if err != nil {
		zap.L().Error("Model call failed",
			zap.String("model", req.Model),
			zap.Error(err))
		c.JSON(http.StatusOK, model.ModelCallResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, model.ModelCallResponse{
		Success: true,
		Content: result,
	})
}

// GetModelConcurrencyStatus returns model concurrency status
func GetModelConcurrencyStatus(c *gin.Context) {
	modelName := c.Param("model_name")

	redisKey := fmt.Sprintf("model_concurrency:%s", modelName)

	currentCount, err := redis.GetCurrentConcurrency(redisKey)
	if err != nil {
		c.JSON(http.StatusOK, model.ConcurrencyStatus{
			Model:  modelName,
			Error:  "Redis connection failed",
		})
		return
	}

	// Get max concurrency from model config or use default
	maxConcurrency := 10 // Default

	c.JSON(http.StatusOK, model.ConcurrencyStatus{
		Model:              modelName,
		CurrentConcurrency: currentCount,
		MaxConcurrency:     maxConcurrency,
		AvailableSlots:     max(0, maxConcurrency-currentCount),
	})
}

// performModelCall performs the actual model call with rate limiting
func performModelCall(req *model.ModelCallRequest) (string, error) {
	redisKey := fmt.Sprintf("model_concurrency:%s", req.Model)

	// Get max concurrency (default 10)
	maxConcurrency := 10

	// Try to acquire slot with timeout
	maxWaitTime := 300 * time.Second
	startTime := time.Now()

	for time.Since(startTime) < maxWaitTime {
		acquired, err := redis.AcquireSlot(redisKey, maxConcurrency)
		if err != nil {
			// Redis error, fallback to direct call
			zap.L().Warn("Redis error, falling back to direct call",
				zap.String("model", req.Model),
				zap.Error(err))
			return callModelDirect(req)
		}

		if acquired {
			defer redis.ReleaseSlot(redisKey)

			// Perform actual model call
			return callModelDirect(req)
		}

		// Wait before retry
		time.Sleep(2 * time.Second)
	}

	return "", fmt.Errorf("timeout waiting for concurrency slot")
}

// callModelDirect calls the model API directly
func callModelDirect(req *model.ModelCallRequest) (string, error) {
	if req.IsVLLM {
		return callVLLMAPI(req)
	}
	return callOpenAIAPI(req)
}

// callVLLMAPI calls vLLM API
func callVLLMAPI(req *model.ModelCallRequest) (string, error) {
	// Build URL exactly like Python implementation (model_call.py:246-250)
	// 1. Strip trailing slash
	baseURL := req.APIUrl
	for len(baseURL) > 0 && baseURL[len(baseURL)-1] == '/' {
		baseURL = baseURL[:len(baseURL)-1]
	}

	// 2. Add /v1 if not present
	if !endsWith(baseURL, "/v1") {
		baseURL += "/v1"
	}

	// 3. Add endpoint
	fullURL := baseURL + "/chat/completions"

	// Build request payload
	payload := map[string]interface{}{
		"model":       req.Model,
		"messages":    req.Messages,
		"temperature": req.Temperature,
		"top_p":       req.TopP,
		"max_tokens":  req.MaxTokens,
		"stream":      false,
	}

	doSample := req.Temperature > 0.0
	payload["do_sample"] = doSample
	payload["chat_template_kwargs"] = map[string]interface{}{
		"enable_thinking": false,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request with timeout
	client := &http.Client{
		Timeout: time.Duration(req.Timeout) * time.Second,
	}

	httpReq, err := http.NewRequest("POST", fullURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
			Delta struct {
				Content string `json:"content"`
			} `json:"delta"`
		} `json:"choices"`
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	return result.Choices[0].Message.Content, nil
}

// callOpenAIAPI calls OpenAI-compatible API
func callOpenAIAPI(req *model.ModelCallRequest) (string, error) {
	// Build URL exactly like Python implementation (model_call.py:246-250)
	// 1. Strip trailing slash
	baseURL := req.APIUrl
	for len(baseURL) > 0 && baseURL[len(baseURL)-1] == '/' {
		baseURL = baseURL[:len(baseURL)-1]
	}

	// 2. Add /v1 if not present
	if !endsWith(baseURL, "/v1") {
		baseURL += "/v1"
	}

	// 3. Add endpoint
	fullURL := baseURL + "/chat/completions"

	// Build request payload
	payload := map[string]interface{}{
		"model":       req.Model,
		"messages":    req.Messages,
		"temperature": req.Temperature,
		"top_p":       req.TopP,
		"max_tokens":  req.MaxTokens,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request with timeout
	client := &http.Client{
		Timeout: time.Duration(req.Timeout) * time.Second,
	}

	httpReq, err := http.NewRequest("POST", fullURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	// For OpenAI-compatible APIs
	// Set Authorization header only if API key is provided and not the default placeholder
	if req.APIKey != "" && req.APIKey != "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" {
		httpReq.Header.Set("Authorization", "Bearer "+req.APIKey)
	}
	// Note: Some APIs may not require authentication and will work without Authorization header

	// Send request
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	return result.Choices[0].Message.Content, nil
}

// contains checks if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && indexOf(s, substr) >= 0)
}

// endsWith checks if a string ends with a suffix
func endsWith(s, suffix string) bool {
	return len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix
}

// indexOf finds the index of a substring
func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
