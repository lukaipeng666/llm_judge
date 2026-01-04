package api

import (
	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/api/admin"
	"github.com/wzyjerry/llm-judge/internal/api/auth"
	"github.com/wzyjerry/llm-judge/internal/api/data"
	databaseapi "github.com/wzyjerry/llm-judge/internal/api/database"
	"github.com/wzyjerry/llm-judge/internal/api/model"
	"github.com/wzyjerry/llm-judge/internal/api/proxy"
	"github.com/wzyjerry/llm-judge/internal/api/report"
	"github.com/wzyjerry/llm-judge/internal/api/task"
)

// SetupDatabaseRoutes configures database service routes
func SetupDatabaseRoutes(r *gin.Engine) {
	databaseapi.SetupDatabaseRoutes(r)
}



// SetupRouter configures all routes
func SetupRouter(r *gin.Engine) {
	// CORS middleware
	r.Use(CORSMiddleware())

	// Health check
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "LLM Judge Web API is running",
			"version": "1.0.0",
		})
	})

	// Auth routes (no authentication required)
	authRoutes := r.Group("/api/auth")
	{
		authRoutes.POST("/register", auth.Register)
		authRoutes.POST("/login", auth.Login)
		authRoutes.POST("/auto-login", auth.AutoLogin)
		authRoutes.GET("/me", auth.AuthMiddleware(), auth.GetCurrentUser)
	}

	// API routes that require authentication
	api := r.Group("/api")
	api.Use(auth.AuthMiddleware())
	{
		// Data management
		dataGroup := api.Group("/user/data")
		{
			dataGroup.GET("", data.GetDataFiles)
			dataGroup.POST("", data.UploadData)
			dataGroup.POST("/validate-csv", data.ValidateCSV)
			dataGroup.GET("/:data_id/content", data.GetDataContent)
			dataGroup.PUT("/:data_id", data.UpdateDataInfo)
			dataGroup.DELETE("/:data_id", data.DeleteData)
		}

		// Data files list (for frontend compatibility)
		api.GET("/data-files", data.GetDataFilesList)

		// Task management
		taskGroup := api.Group("/tasks")
		{
			taskGroup.POST("", task.StartEvaluation)
			taskGroup.GET("", task.GetAllTasks)
			taskGroup.GET("/:task_id", task.GetTaskStatus)
			taskGroup.DELETE("/:task_id", task.DeleteTask)
			taskGroup.PUT("/:task_id", task.UpdateTaskInfo)
		}

		// Evaluation endpoint (alias for /tasks)
		api.POST("/evaluate", task.StartEvaluation)

		// Report management
		reportGroup := api.Group("/reports")
		{
			reportGroup.GET("", report.GetReports)
			reportGroup.GET("/detail", report.GetReportDetail)
			reportGroup.DELETE("/:report_id", report.DeleteReport)
		}

		// Model and scoring functions
		api.GET("/scoring-functions", model.GetScoringFunctions)
		api.GET("/models", model.GetAvailableModels)
		api.GET("/model-configs", model.GetModelConfigs)

		// Model call proxy (with authentication)
		api.POST("/model-call", proxy.ModelCallWithRateLimit)
		api.GET("/model-call/status/:model_name", proxy.GetModelConcurrencyStatus)

		// Admin routes
		adminGroup := api.Group("/admin")
		adminGroup.Use(auth.AdminMiddleware())
		{
			adminGroup.GET("/users", admin.GetUsers)
			adminGroup.DELETE("/users/:user_id", admin.DeleteUser)
			adminGroup.GET("/tasks", admin.GetAllTasks)
			adminGroup.POST("/tasks/:task_id/terminate", admin.TerminateTask)
			adminGroup.GET("/data", admin.GetAllData)
			adminGroup.DELETE("/users/:user_id/data/:data_id", admin.DeleteUserData)

			// Model config management (admin)
			adminGroup.GET("/model-configs", model.AdminGetModelConfigs)
			adminGroup.POST("/model-configs", model.CreateModelConfig)
			adminGroup.PUT("/model-configs/:config_id", model.UpdateModelConfig)
			adminGroup.DELETE("/model-configs/:config_id", model.DeleteModelConfig)
		}
	}
}

// CORSMiddleware provides CORS support
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
