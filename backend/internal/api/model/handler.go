package model

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/model"
	"github.com/wzyjerry/llm-judge/internal/repository"
)

// GetScoringFunctions returns available scoring functions from plugin.py
func GetScoringFunctions(c *gin.Context) {
	fmt.Println("[DEBUG] GetScoringFunctions called")

	// 获取可执行文件所在目录
	execPath, err := os.Executable()
	if err != nil {
		fmt.Printf("[ERROR] Failed to get executable path: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"detail": "Failed to locate executable",
		})
		return
	}
	execDir := filepath.Dir(execPath)
	fmt.Printf("[DEBUG] Executable dir: %s\n", execDir)
	fmt.Printf("[DEBUG] Current working dir: %s\n", mustGetWd())

	// 尝试多个可能的脚本位置
	possiblePaths := []string{
		// 相对于当前工作目录（项目根目录启动时）
		filepath.Join(mustGetWd(), "backend", "scripts", "get_scoring_functions.py"),
		// 相对于可执行文件目录
		filepath.Join(execDir, "..", "scripts", "get_scoring_functions.py"),
		filepath.Join(execDir, "scripts", "get_scoring_functions.py"),
		// 相对于当前工作目录
		filepath.Join(mustGetWd(), "scripts", "get_scoring_functions.py"),
	}

	var scriptPath string
	for _, path := range possiblePaths {
		absPath, err := filepath.Abs(path)
		fmt.Printf("[DEBUG] Checking path: %s (abs: %s)\n", path, absPath)
		if err == nil {
			if _, statErr := os.Stat(absPath); statErr == nil {
				scriptPath = absPath
				fmt.Printf("[DEBUG] Found script at: %s\n", scriptPath)
				break
			}
		}
	}

	if scriptPath == "" {
		fmt.Println("[ERROR] Scoring functions script not found in any location")
		c.JSON(http.StatusInternalServerError, gin.H{
			"detail": "Scoring functions script not found in any expected location",
		})
		return
	}

	// 执行Python脚本获取评分函数列表
	fmt.Printf("[DEBUG] Executing script: %s\n", scriptPath)
	cmd := exec.Command("python3", scriptPath)
	output, err := cmd.Output()
	if err != nil {
		fmt.Printf("[ERROR] Failed to execute script: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"detail": fmt.Sprintf("Failed to execute scoring functions script: %v", err),
		})
		return
	}

	fmt.Printf("[DEBUG] Script output: %s\n", string(output))

	// 解析JSON输出为函数信息数组
	type FunctionInfo struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	var functionsInfo []FunctionInfo
	if err := json.Unmarshal(output, &functionsInfo); err != nil {
		fmt.Printf("[ERROR] Failed to parse JSON: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"detail": fmt.Sprintf("Failed to parse scoring functions: %v", err),
		})
		return
	}

	fmt.Printf("[DEBUG] Successfully parsed %d functions\n", len(functionsInfo))
	c.JSON(http.StatusOK, gin.H{
		"scoring_functions": functionsInfo,
	})
}

// Helper function to get working directory
func mustGetWd() string {
	wd, err := os.Getwd()
	if err != nil {
		return "."
	}
	return wd
}

// GetAvailableModels returns available models from user history
func GetAvailableModels(c *gin.Context) {
	userID := c.GetInt("user_id")

	reports, err := repository.GetUserReports(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	// Extract unique models
	modelMap := make(map[string]bool)
	for _, report := range reports {
		if report.Model != "" {
			modelMap[report.Model] = true
		}
	}

	models := make([]string, 0, len(modelMap))
	for modelName := range modelMap {
		models = append(models, modelName)
	}

	c.JSON(http.StatusOK, gin.H{"models": models})
}

// GetModelConfigs returns model configs (for regular users)
func GetModelConfigs(c *gin.Context) {
	includeInactive := c.DefaultQuery("include_inactive", "false") == "true"

	configs, err := repository.GetAllModelConfigs(includeInactive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	// Fix null api_urls to empty array
	for i := range configs {
		if configs[i].APIUrls == nil {
			configs[i].APIUrls = []string{}
		}
	}

	c.JSON(http.StatusOK, gin.H{"configs": configs})
}

// AdminGetModelConfigs returns all model configs (admin)
func AdminGetModelConfigs(c *gin.Context) {
	configs, err := repository.GetAllModelConfigs(true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	// Fix null api_urls to empty array
	for i := range configs {
		if configs[i].APIUrls == nil {
			configs[i].APIUrls = []string{}
		}
	}

	c.JSON(http.StatusOK, gin.H{"configs": configs})
}

// CreateModelConfig creates a model config (admin)
func CreateModelConfig(c *gin.Context) {
	var req model.ModelConfigCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	configID, err := repository.CreateModelConfig(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"config_id": configID,
		"message":   "Model config created successfully",
	})
}

// UpdateModelConfig updates a model config (admin)
func UpdateModelConfig(c *gin.Context) {
	configID := c.Param("config_id")

	var id int
	if _, err := fmt.Sscanf(configID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid config ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	// Normalize types for all fields
	for key, value := range updates {
		switch key {
		case "api_urls":
			// Convert []interface{} to []string, or keep []string as is
			switch v := value.(type) {
			case []interface{}:
				urls := make([]string, len(v))
				for i, item := range v {
					if str, ok := item.(string); ok {
						urls[i] = str
					} else {
						urls[i] = fmt.Sprintf("%v", item)
					}
				}
				updates[key] = urls
			case []string:
				// Already correct type, keep as is
			default:
				// Remove invalid api_urls from updates to prevent SQL errors
				delete(updates, key)
			}
		case "max_tokens", "timeout", "max_concurrency":
			// Convert float64 to int for integer fields
			if f, ok := value.(float64); ok {
				updates[key] = int(f)
			}
		case "temperature", "top_p":
			// Ensure these are float64
			if i, ok := value.(int); ok {
				updates[key] = float64(i)
			}
		case "is_active", "is_vllm":
			// Convert to int
			switch v := value.(type) {
			case float64:
				updates[key] = int(v)
			case bool:
				if v {
					updates[key] = 1
				} else {
					updates[key] = 0
				}
			case int:
				// Already correct
			default:
				// Try to convert to int
				updates[key] = 1 // Default to 1
			}
		}
	}

	success, err := repository.UpdateModelConfig(id, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Model config not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Model config updated successfully"})
}

// DeleteModelConfig deletes a model config (admin)
func DeleteModelConfig(c *gin.Context) {
	configID := c.Param("config_id")

	var id int
	if _, err := fmt.Sscanf(configID, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "Invalid config ID"})
		return
	}

	success, err := repository.DeleteModelConfig(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Model config not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Model config deleted successfully"})
}
