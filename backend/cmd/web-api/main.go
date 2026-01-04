package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/api"
	"github.com/wzyjerry/llm-judge/internal/pkg/config"
	"github.com/wzyjerry/llm-judge/internal/pkg/logger"
	"github.com/wzyjerry/llm-judge/internal/pkg/redis"
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

	logger.Info("Starting LLM Judge Web API")

	// Initialize database
	if err := repository.InitDB(cfg.DatabaseService.DatabaseURL); err != nil {
		zap.L().Fatal("Failed to initialize database",
			zap.Error(err))
	}
	defer repository.Close()

	// Initialize Redis (optional)
	if err := redis.Init(cfg); err != nil {
		zap.L().Warn("Redis initialization failed, rate limiting will be disabled",
			zap.Error(err))
	} else {
		defer redis.Close()
	}

	// Set Gin mode
	gin.SetMode(gin.ReleaseMode)

	// Create router
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())

	// Setup routes
	api.SetupRouter(r)

	// Print startup info
	fmt.Println("=" + makeString(60, "="))
	fmt.Println("🌐 Starting Web API Service")
	fmt.Println("=" + makeString(60, "="))
	fmt.Printf("📊 Service: LLM Judge Web API\n")
	fmt.Printf("🌐 URL: http://%s\n", cfg.GetWebServiceAddr())
	fmt.Printf("💾 Database: %s\n", cfg.DatabaseService.DatabaseURL)
	fmt.Println("=" + makeString(60, "="))

	// Start server
	if err := r.Run(fmt.Sprintf("%s:%d", cfg.WebService.Host, cfg.WebService.Port)); err != nil {
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
