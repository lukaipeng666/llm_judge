package service

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/wzyjerry/llm-judge/internal/model"
	"github.com/wzyjerry/llm-judge/internal/pkg/config"
	"github.com/wzyjerry/llm-judge/internal/pkg/jwt"
	"github.com/wzyjerry/llm-judge/internal/repository"
	"go.uber.org/zap"
)

var (
	runningTasks = make(map[string]*exec.Cmd)
	tasksMutex   sync.RWMutex
)

// EvaluationConfig represents evaluation configuration from API
type EvaluationConfig struct {
	APIUrls            []interface{} `json:"api_urls"`
	Model              string        `json:"model"`
	DataFile           string        `json:"data_file"`
	Scoring            string        `json:"scoring"`
	ScoringModule      string        `json:"scoring_module"`
	MaxWorkers         int           `json:"max_workers"`
	BadcaseThreshold   float64       `json:"badcase_threshold"`
	ReportFormat       string        `json:"report_format"`
	TestMode           bool          `json:"test_mode"`
	SampleSize         int           `json:"sample_size"`
	CheckpointPath     string        `json:"checkpoint_path"`
	CheckpointInterval int           `json:"checkpoint_interval"`
	Resume             bool          `json:"resume"`
	Role               string        `json:"role"`
	Timeout            int           `json:"timeout"`
	MaxTokens          int           `json:"max_tokens"`
	APIKey             string        `json:"api_key"`
	IsVLLM             bool          `json:"is_vllm"`
	Temperature        float64       `json:"temperature"`
	TopP               float64       `json:"top_p"`
}

// StartEvaluation starts an evaluation task
func StartEvaluation(userID int, config *EvaluationConfig) (string, error) {
	// Generate task ID
	taskID := time.Now().Format("20060102_150405")

	// Generate JWT token for Python evaluation tasks (for internal API authentication)
	token, err := jwt.GenerateToken(userID, "system_evaluation")
	if err != nil {
		return "", fmt.Errorf("failed to generate auth token: %w", err)
	}

	// Convert config map to struct
	configMap := map[string]interface{}{
		"api_urls":            config.APIUrls,
		"model":               config.Model,
		"data_file":           config.DataFile,
		"scoring":             config.Scoring,
		"scoring_module":      config.ScoringModule,
		"max_workers":         config.MaxWorkers,
		"badcase_threshold":   config.BadcaseThreshold,
		"report_format":       config.ReportFormat,
		"test_mode":           config.TestMode,
		"sample_size":         config.SampleSize,
		"checkpoint_path":     config.CheckpointPath,
		"checkpoint_interval": config.CheckpointInterval,
		"resume":              config.Resume,
		"role":                config.Role,
		"timeout":             config.Timeout,
		"max_tokens":          config.MaxTokens,
		"api_key":             config.APIKey,
		"is_vllm":             config.IsVLLM,
		"temperature":         config.Temperature,
		"top_p":               config.TopP,
		"data_filename":       config.DataFile,
	}

	// Create task record in database
	_, err = repository.CreateUserTask(userID, taskID, configMap)
	if err != nil {
		return "", fmt.Errorf("failed to create task: %w", err)
	}

	// Start evaluation in background with auth token
	go runEvaluationTask(userID, taskID, config, token)

	return taskID, nil
}

// runEvaluationTask runs the Python evaluation script
func runEvaluationTask(userID int, taskID string, config *EvaluationConfig, authToken string) {
	zap.L().Info("Starting evaluation task",
		zap.Int("user_id", userID),
		zap.String("task_id", taskID))

	// Build command line arguments with auth token
	args := buildPythonArgs(userID, taskID, config, authToken)

	// Find Python interpreter
	pythonCmd, err := findPythonCommand()
	if err != nil {
		updateTaskStatus(taskID, "failed", 0, err.Error())
		return
	}

	// Create command
	cmdArgs := append([]string{"main.py"}, args...)
	cmd := exec.Command(pythonCmd, cmdArgs...)
	// Use current working directory instead of hardcoded path
	if cwd, err := os.Getwd(); err == nil {
		cmd.Dir = cwd
	} else {
		cmd.Dir = "." // Fallback to current directory
	}

	// Setup pipes for stdout and stderr
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		updateTaskStatus(taskID, "failed", 0, fmt.Sprintf("Failed to create stdout pipe: %v", err))
		return
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		updateTaskStatus(taskID, "failed", 0, fmt.Sprintf("Failed to create stderr pipe: %v", err))
		return
	}

	// Store command reference
	tasksMutex.Lock()
	runningTasks[taskID] = cmd
	tasksMutex.Unlock()

	// Start command
	if err := cmd.Start(); err != nil {
		updateTaskStatus(taskID, "failed", 0, fmt.Sprintf("Failed to start Python process: %v", err))
		return
	}

	// Update status to running
	updateTaskStatus(taskID, "running", 0, "Evaluation started")

	// Read output in goroutine
	go readOutput(stdout, stderr, userID, taskID)

	// Wait for command to finish
	go func() {
		err := cmd.Wait()
		tasksMutex.Lock()
		delete(runningTasks, taskID)
		tasksMutex.Unlock()

		if err != nil {
			updateTaskStatus(taskID, "failed", 0, fmt.Sprintf("Evaluation failed: %v", err))
		} else {
			updateTaskStatus(taskID, "completed", 100, "Evaluation completed successfully")
		}
	}()
}

// buildPythonArgs builds command line arguments for Python script
func buildPythonArgs(userID int, taskID string, evalConfig *EvaluationConfig, authToken string) []string {
	var args []string

	// API URLs
	apiUrls := buildAPIUrls(evalConfig.APIUrls)
	args = append(args, "--api_urls")
	// Split by space to get individual URLs
	for _, url := range strings.Split(apiUrls, " ") {
		args = append(args, url)
	}

	// Model
	args = append(args, "--model", evalConfig.Model)

	// Data ID
	args = append(args, "--data_id", evalConfig.DataFile)

	// Scoring
	args = append(args, "--scoring", evalConfig.Scoring)
	args = append(args, "--scoring_module", evalConfig.ScoringModule)

	// Max workers
	args = append(args, "--max_workers", strconv.Itoa(evalConfig.MaxWorkers))

	// Badcase threshold
	args = append(args, "--badcase_threshold", fmt.Sprintf("%.2f", evalConfig.BadcaseThreshold))

	// Report format
	args = append(args, "--report_format", evalConfig.ReportFormat)

	// Role - always pass it
	args = append(args, "--role", evalConfig.Role)

	// Timeout
	args = append(args, "--timeout", strconv.Itoa(evalConfig.Timeout))

	// Max tokens (use --max-tokens)
	args = append(args, "--max-tokens", strconv.Itoa(evalConfig.MaxTokens))

	// API key
	args = append(args, "--api_key", evalConfig.APIKey)

	// Temperature - always pass it (even if 0.0)
	args = append(args, "--temperature", fmt.Sprintf("%.1f", evalConfig.Temperature))

	// Top P - always pass it (even if 1.0)
	args = append(args, "--top-p", fmt.Sprintf("%.2f", evalConfig.TopP))

	// Output JSON mode
	args = append(args, "--output_json")

	// User ID
	args = append(args, "--user_id", strconv.Itoa(userID))

	// Task ID
	args = append(args, "--task_id", taskID)

	// Database service URL - get from global config
	loadedConfig := config.Get()
	if loadedConfig != nil {
		args = append(args, "--database_service_url", fmt.Sprintf("http://%s:%d", loadedConfig.DatabaseService.Host, loadedConfig.DatabaseService.Port))
	} else {
		// Fallback to default
		args = append(args, "--database_service_url", "http://localhost:16384")
	}

	// Is vLLM
	if evalConfig.IsVLLM {
		args = append(args, "--is_vllm")
	}

	// Test mode (use --test-mode)
	if evalConfig.TestMode {
		args = append(args, "--test-mode")
	}

	// Sample size (use --sample-size)
	if evalConfig.SampleSize > 0 {
		args = append(args, "--sample-size", strconv.Itoa(evalConfig.SampleSize))
	}

	// Checkpoint
	if evalConfig.CheckpointPath != "" {
		args = append(args, "--checkpoint_path", evalConfig.CheckpointPath)
		args = append(args, "--checkpoint_interval", strconv.Itoa(evalConfig.CheckpointInterval))
	}

	// Resume
	if evalConfig.Resume {
		args = append(args, "--resume")
	}

	// Auth token (for backend API authentication)
	args = append(args, "--auth_token", authToken)

	return args
}

// buildAPIUrls converts API URLs from config to command line format
func buildAPIUrls(apiUrls []interface{}) string {
	var urls []string
	for _, u := range apiUrls {
		if str, ok := u.(string); ok {
			urls = append(urls, str)
		}
	}
	if len(urls) == 0 {
		zap.L().Error("No API URLs provided in evaluation config")
		return ""
	}

	// Join with space for command line
	return strings.Join(urls, " ")
}

// findPythonCommand finds the Python executable
func findPythonCommand() (string, error) {
	// Try python3 first
	if _, err := exec.LookPath("python3"); err == nil {
		return "python3", nil
	}
	// Try python
	if _, err := exec.LookPath("python"); err == nil {
		return "python", nil
	}
	return "", fmt.Errorf("Python not found")
}

// readOutput reads stdout and stderr from the Python process
func readOutput(stdout, stderr io.Reader, userID int, taskID string) {
	// Read stdout
	go func() {
		scanner := NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			zap.L().Debug("Python stdout",
				zap.String("task_id", taskID),
				zap.String("line", line))

			// Parse progress from output
			parseAndUpdateProgress(line, taskID)
		}
	}()

	// Read stderr
	go func() {
		scanner := NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			zap.L().Debug("Python stderr",
				zap.String("task_id", taskID),
				zap.String("line", line))
		}
	}()
}

// parseAndUpdateProgress parses progress information from Python output
func parseAndUpdateProgress(line, taskID string) {
	// Example: "加载完成，共 100 条数据"
	if strings.Contains(line, "加载完成，共") {
		// Data loaded
		updateTaskStatus(taskID, "running", 10, "Data loaded")
	}
	// Example: "获取模型输出: 50/100 (30.0%)"
	if strings.Contains(line, "获取模型输出:") {
		updateTaskStatus(taskID, "running", 50, "Getting model outputs")
	}
	// Example: "评分处理: 80/100 (68.0%)"
	if strings.Contains(line, "评分处理:") {
		updateTaskStatus(taskID, "running", 70, "Scoring")
	}
	// Example: "保存报告"
	if strings.Contains(line, "保存报告") {
		updateTaskStatus(taskID, "running", 90, "Saving reports")
	}
}

// updateTaskStatus updates task status in database
func updateTaskStatus(taskID, status string, progress float64, message string) {
	updates := map[string]interface{}{
		"status":   status,
		"progress": progress,
		"message":  message,
	}

	repository.UpdateUserTask(taskID, updates)
}

// CancelTask cancels a running task
func CancelTask(userID int, taskID string) error {
	tasksMutex.RLock()
	cmd, exists := runningTasks[taskID]
	tasksMutex.RUnlock()

	if !exists {
		return fmt.Errorf("task not found or not running")
	}

	// Kill the process
	if cmd.Process != nil {
		if err := cmd.Process.Kill(); err != nil {
			return fmt.Errorf("failed to kill task: %w", err)
		}
	}

	// Update status
	updateTaskStatus(taskID, "cancelled", 0, "Task cancelled by user")

	return nil
}

// SimpleScanner wraps bufio.Scanner for line-by-line reading
type SimpleScanner struct {
	lines []string
	index int
}

// NewScanner creates a new scanner from an io.Reader
func NewScanner(r io.Reader) *SimpleScanner {
	data, err := io.ReadAll(r)
	if err != nil {
		return &SimpleScanner{lines: []string{}}
	}

	lines := strings.Split(string(data), "\n")
	return &SimpleScanner{lines: lines}
}

// Scan reads the next line
func (s *SimpleScanner) Scan() bool {
	if s.index >= len(s.lines) {
		return false
	}
	s.index++
	return true
}

// Text returns the current line
func (s *SimpleScanner) Text() string {
	if s.index-1 >= 0 && s.index-1 < len(s.lines) {
		return s.lines[s.index-1]
	}
	return ""
}

// GetTaskStatus gets the current status of a task
func GetTaskStatus(userID int, taskID string) (*model.UserTask, error) {
	return repository.GetUserTaskByID(userID, taskID)
}

// GetAllTasks gets all tasks for a user
func GetAllTasks(userID int) ([]model.UserTask, error) {
	return repository.GetUserTasks(userID)
}
