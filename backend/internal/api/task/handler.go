package task

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/repository"
	"github.com/wzyjerry/llm-judge/internal/service"
)

// StartEvaluation starts an evaluation task
func StartEvaluation(c *gin.Context) {
	userID := c.GetInt("user_id")

	var config service.EvaluationConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	// Validate required fields
	if config.Model == "" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "model is required"})
		return
	}
	if config.DataFile == "" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "data_file is required"})
		return
	}
	if config.Scoring == "" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "scoring is required"})
		return
	}

	// Load model config from database to get API URLs and other settings
	modelConfig, err := repository.GetModelConfigByName(config.Model)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Failed to load model config"})
		return
	}
	if modelConfig == nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Model config not found for: " + config.Model})
		return
	}

	// Use API URLs from database config if not provided
	if len(config.APIUrls) == 0 && len(modelConfig.APIUrls) > 0 {
		// Convert []string to []interface{}
		config.APIUrls = make([]interface{}, len(modelConfig.APIUrls))
		for i, url := range modelConfig.APIUrls {
			config.APIUrls[i] = url
		}
	}

	// Use API key from database config if not provided
	if config.APIKey == "" || config.APIKey == "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" {
		if modelConfig.APIKey != "" {
			config.APIKey = modelConfig.APIKey
		}
	}

	// Set default values
	if config.MaxWorkers == 0 {
		config.MaxWorkers = 4
	}
	if config.BadcaseThreshold == 0 {
		config.BadcaseThreshold = 1.0
	}
	if config.ReportFormat == "" {
		config.ReportFormat = "json, txt, badcases"
	}
	if config.Timeout == 0 || config.Timeout == 600 {
		config.Timeout = modelConfig.Timeout
	}
	if config.MaxTokens == 0 || config.MaxTokens == 16384 {
		config.MaxTokens = modelConfig.MaxTokens
	}
	if config.ScoringModule == "" {
		config.ScoringModule = "./function_register/plugin.py"
	}
	if config.APIKey == "" {
		config.APIKey = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
	}
	// Use temperature and top_p from model config if not explicitly set
	if config.Temperature == 0.0 {
		config.Temperature = modelConfig.Temperature
	}
	if config.TopP == 0.0 {
		config.TopP = modelConfig.TopP
	}

	// Use is_vllm from model config (convert int to bool)
	config.IsVLLM = modelConfig.IsVLLM == 1

	// Start evaluation
	taskID, err := service.StartEvaluation(userID, &config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"task_id": taskID,
		"status":  "pending",
		"message": "Evaluation task created",
	})
}

// GetTaskStatus returns task status
func GetTaskStatus(c *gin.Context) {
	userID := c.GetInt("user_id")
	taskID := c.Param("task_id")

	task, err := service.GetTaskStatus(userID, taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Task not found or access denied"})
		return
	}

	c.JSON(http.StatusOK, task)
}

// GetAllTasks returns all tasks for current user
func GetAllTasks(c *gin.Context) {
	userID := c.GetInt("user_id")

	tasks, err := service.GetAllTasks(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}

// DeleteTask deletes/cancels a task
func DeleteTask(c *gin.Context) {
	userID := c.GetInt("user_id")
	taskID := c.Param("task_id")

	// Check if task exists
	task, err := repository.GetUserTaskByID(userID, taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "Task not found or access denied"})
		return
	}

	// Cancel running process if needed
	if task.Status == "running" || task.Status == "pending" {
		if err := service.CancelTask(userID, taskID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
			return
		}
	} else {
		// Just delete from database
		_, err = repository.DeleteUserTask(userID, taskID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

// UpdateTaskInfo updates task info (only message field)
func UpdateTaskInfo(c *gin.Context) {
	taskID := c.Param("task_id")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	// Only allow updating message field
	allowedFields := map[string]interface{}{}
	if msg, ok := updates["message"]; ok {
		allowedFields["message"] = msg
	}

	if len(allowedFields) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "No valid fields to update"})
		return
	}

	success, err := repository.UpdateUserTask(taskID, allowedFields)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}
	if !success {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Failed to update task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task updated successfully"})
}
