package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/api"
	"github.com/wzyjerry/llm-judge/internal/pkg/config"
	"github.com/wzyjerry/llm-judge/internal/pkg/logger"
	"github.com/wzyjerry/llm-judge/internal/repository"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize logger
	if err := logger.Init(cfg.Log.Level, cfg.Log.Format); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	logger.Info("Starting LLM Judge Database Service")

	// Initialize database
	if err := repository.InitDB(cfg.DatabaseService.DatabaseURL); err != nil {
		zap.L().Fatal("Failed to initialize database",
			zap.Error(err))
	}
	defer repository.Close()

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "database-service",
		})
	})

	// Root endpoint
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "LLM Judge Database Service is running",
			"version": "1.0.0",
		})
	})

	// Setup database API routes
	api.SetupDatabaseRoutes(r)

	// Print startup info
	fmt.Println("=" + makeString(60, "="))
	fmt.Println("🚀 Starting Database Service")
	fmt.Println("=" + makeString(60, "="))
	fmt.Printf("📊 Service: LLM Judge Database API\n")
	fmt.Printf("🌐 URL: http://%s\n", cfg.GetDatabaseServiceAddr())
	fmt.Printf("💾 Database: %s\n", cfg.DatabaseService.DatabaseURL)
	fmt.Println("=" + makeString(60, "="))
	fmt.Println("Database service started (tables initialized)")

	// Start HTTP server
	addr := fmt.Sprintf("%s:%d", cfg.DatabaseService.Host, cfg.DatabaseService.Port)
	if err := r.Run(addr); err != nil {
		zap.L().Fatal("Failed to start server",
			zap.Error(err))
	}
}

func makeString(n int, s string) string {
	result := ""
	for i := 0; i < n; i++ {
		result += s
	}
	return result
}
