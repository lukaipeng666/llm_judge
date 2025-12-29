package database

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/model"
	"github.com/wzyjerry/llm-judge/internal/repository"
)

// SetupDatabaseRoutes configures all database service routes
func SetupDatabaseRoutes(r *gin.Engine) {
	// API v1 group
	v1 := r.Group("/api")
	{
		// Health check
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "ok",
				"service": "database-service",
			})
		})

		// User data routes
		v1.GET("/user-data/:user_id/:data_id", getUserData)
		v1.PUT("/user-data/:user_id/:data_id/content", updateUserDataContent)

		// User tasks routes
		v1.POST("/user-tasks", createUserTask)
		v1.PUT("/user-tasks/:task_id", updateUserTask)
		v1.GET("/user-tasks/:user_id", getUserTasks)
		v1.GET("/user-tasks/:user_id/:task_id", getUserTaskByID)
		v1.DELETE("/user-tasks/:user_id/:task_id", deleteUserTask)

		// Model config routes
		v1.GET("/model-configs", getModelConfigs)
		v1.GET("/model-configs/:config_id", getModelConfigByID)
		v1.GET("/model-configs/by-name/:model_name", getModelConfigByName)
		v1.POST("/model-configs", createModelConfig)
		v1.PUT("/model-configs/:config_id", updateModelConfig)
		v1.DELETE("/model-configs/:config_id", deleteModelConfig)

		// User reports routes
		v1.POST("/user-reports", createUserReport)
		v1.GET("/user-reports/list/:user_id", getUserReports)
		v1.GET("/user-reports/:user_id/:report_id", getUserReportByID)
		v1.DELETE("/user-reports/:user_id/:report_id", deleteUserReport)
	}
}

// getUserData retrieves user data by ID
func getUserData(c *gin.Context) {
	userID := c.Param("user_id")
	dataID := c.Param("data_id")

	// Convert string to int
	uid, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid user ID"})
		return
	}

	did, err := strconv.Atoi(dataID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid data ID"})
		return
	}

	// Retrieve from database
	data, err := repository.GetUserDataByID(uid, did)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if data == nil {
		c.JSON(404, gin.H{"error": "Data not found"})
		return
	}

	// Map to response format
	response := gin.H{
		"user_id":      data.UserID,
		"data_id":      data.ID,
		"filename":     data.Filename,
		"file_content": data.FileContent,
	}

	c.JSON(200, response)
}

// updateUserDataContent updates user data content
func updateUserDataContent(c *gin.Context) {
	userID := c.Param("user_id")
	dataID := c.Param("data_id")

	var req struct {
		FileContent string `json:"file_content"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement proper update logic
	c.JSON(200, gin.H{
		"message": "User data updated",
		"user_id": userID,
		"data_id": dataID,
	})
}

// createUserTask creates a new user task
func createUserTask(c *gin.Context) {
	var req struct {
		UserID  int                    `json:"user_id"`
		TaskID  string                 `json:"task_id"`
		Config  map[string]interface{} `json:"config"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	taskID, err := repository.CreateUserTask(req.UserID, req.TaskID, req.Config)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"task_id": taskID,
		"message": "Task created successfully",
	})
}

// updateUserTask updates user task
func updateUserTask(c *gin.Context) {
	taskID := c.Param("task_id")

	var req struct {
		Updates map[string]interface{} `json:"updates"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	success, err := repository.UpdateUserTask(taskID, req.Updates)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if !success {
		c.JSON(404, gin.H{"error": "Task not found"})
		return
	}

	c.JSON(200, gin.H{"message": "Task updated successfully"})
}

// getUserTasks retrieves all tasks for a user
func getUserTasks(c *gin.Context) {
	userID := c.Param("user_id")

	// Convert string to int
	uid, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid user ID"})
		return
	}

	tasks, err := repository.GetUserTasks(uid)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"tasks": tasks})
}

// getUserTaskByID retrieves a specific task by ID
func getUserTaskByID(c *gin.Context) {
	userID := c.Param("user_id")
	taskID := c.Param("task_id")

	// TODO: Implement proper task retrieval
	c.JSON(200, gin.H{
		"user_id": userID,
		"task_id": taskID,
		"status":  "pending",
	})
}

// deleteUserTask deletes a user task
func deleteUserTask(c *gin.Context) {
	userID := c.Param("user_id")
	taskID := c.Param("task_id")

	// TODO: Implement proper deletion logic
	c.JSON(200, gin.H{
		"message": "Task deleted successfully",
		"user_id": userID,
		"task_id": taskID,
	})
}

// getModelConfigs retrieves all model configs
func getModelConfigs(c *gin.Context) {
	includeInactive := c.DefaultQuery("include_inactive", "false") == "true"

	configs, err := repository.GetAllModelConfigs(includeInactive)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"configs": configs})
}

// getModelConfigByID retrieves a model config by ID
func getModelConfigByID(c *gin.Context) {
	configID := c.Param("config_id")

	// TODO: Implement proper retrieval
	c.JSON(200, gin.H{
		"config_id": configID,
	})
}

// getModelConfigByName retrieves a model config by name
func getModelConfigByName(c *gin.Context) {
	modelName := c.Param("model_name")

	config, err := repository.GetModelConfigByName(modelName)
	if err != nil {
		c.JSON(404, gin.H{"error": "Model config not found"})
		return
	}

	c.JSON(200, config)
}

// createModelConfig creates a new model config
func createModelConfig(c *gin.Context) {
	var config model.ModelConfigCreate
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	configID, err := repository.CreateModelConfig(&config)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{
		"config_id": configID,
		"message": "Model config created successfully",
	})
}

// updateModelConfig updates a model config
func updateModelConfig(c *gin.Context) {
	configID := c.Param("config_id")

	// Convert string to int
	configIDInt, err := strconv.Atoi(configID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid config ID"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	success, err := repository.UpdateModelConfig(configIDInt, updates)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if !success {
		c.JSON(404, gin.H{"error": "Model config not found"})
		return
	}

	c.JSON(200, gin.H{"message": "Model config updated successfully"})
}

// deleteModelConfig deletes a model config
func deleteModelConfig(c *gin.Context) {
	configID := c.Param("config_id")

	// Convert string to int
	configIDInt, err := strconv.Atoi(configID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid config ID"})
		return
	}

	success, err := repository.DeleteModelConfig(configIDInt)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if !success {
		c.JSON(404, gin.H{"error": "Model config not found"})
		return
	}

	c.JSON(200, gin.H{"message": "Model config deleted successfully"})
}

// createUserReport creates a new user report
func createUserReport(c *gin.Context) {
	var report model.UserReportCreate
	if err := c.ShouldBindJSON(&report); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	reportID, err := repository.CreateUserReport(&report)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"report_id": reportID,
		"message": "Report created successfully",
	})
}

// getUserReports retrieves all reports for a user
func getUserReports(c *gin.Context) {
	userID := c.Param("user_id")

	// Convert string to int
	uid, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid user ID"})
		return
	}

	reports, err := repository.GetUserReports(uid)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"reports": reports})
}

// getUserReportByID retrieves a specific report by ID
func getUserReportByID(c *gin.Context) {
	userID := c.Param("user_id")
	reportID := c.Param("report_id")

	// Convert strings to int
	uid, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid user ID"})
		return
	}

	rid, err := strconv.Atoi(reportID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid report ID"})
		return
	}

	report, err := repository.GetUserReportByID(uid, rid)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, report)
}

// deleteUserReport deletes a user report
func deleteUserReport(c *gin.Context) {
	userID := c.Param("user_id")
	reportID := c.Param("report_id")

	// Convert strings to int
	uid, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid user ID"})
		return
	}

	rid, err := strconv.Atoi(reportID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid report ID"})
		return
	}

	success, err := repository.DeleteUserReport(uid, rid)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if !success {
		c.JSON(404, gin.H{"error": "Report not found"})
		return
	}

	c.JSON(200, gin.H{"message": "Report deleted successfully"})
}

