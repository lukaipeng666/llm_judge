package auth

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/wzyjerry/llm-judge/internal/model"
	"github.com/wzyjerry/llm-judge/internal/pkg/config"
	"github.com/wzyjerry/llm-judge/internal/pkg/jwt"
	"github.com/wzyjerry/llm-judge/internal/service"
)

var (
	rateLimiter = service.NewAutoRegisterRateLimit(5*time.Minute, 10)
)

// Register handles user registration
func Register(c *gin.Context) {
	var req model.UserRegister
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	tokenResp, err := service.Register(req.Username, req.Password, req.Email)
	if err != nil {
		if err == service.ErrUsernameExists {
			c.JSON(http.StatusBadRequest, gin.H{"detail": "Username already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tokenResp)
}

// Login handles user login
func Login(c *gin.Context) {
	var req model.UserLogin
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	tokenResp, err := service.Login(req.Username, req.Password)
	if err != nil {
		if err == service.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, gin.H{"detail": "Invalid username or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tokenResp)
}

// AutoLogin handles auto-register and login
func AutoLogin(c *gin.Context) {
	var req model.UserLogin
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": err.Error()})
		return
	}

	// Admin users cannot use auto-login
	if config.IsAdmin(req.Username) {
		c.JSON(http.StatusForbidden, gin.H{"detail": "Admin users cannot use auto-login. Please use the regular login endpoint."})
		return
	}

	// Check rate limit
	clientIP := c.ClientIP()
	if !rateLimiter.Check(clientIP) {
		c.JSON(http.StatusTooManyRequests, gin.H{"detail": "Too many auto-register requests. Maximum 10 requests per 5 minutes."})
		return
	}

	// Try login first
	tokenResp, err := service.Login(req.Username, req.Password)
	if err == nil {
		c.JSON(http.StatusOK, tokenResp)
		return
	}

	// Login failed, try register
	tokenResp, err = service.Register(req.Username, req.Password, "")
	if err != nil {
		if err == service.ErrUsernameExists {
			// User exists but password wrong
			c.JSON(http.StatusUnauthorized, gin.H{"detail": "Invalid username or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tokenResp)
}

// AuthMiddleware validates JWT token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"detail": "Authorization header missing"})
			c.Abort()
			return
		}

		token, err := jwt.ExtractTokenFromHeader(authHeader)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"detail": "Invalid authorization header format"})
			c.Abort()
			return
		}

		claims, err := jwt.ValidateToken(token)
		if err != nil {
			if err == jwt.ErrExpiredToken {
				c.JSON(http.StatusUnauthorized, gin.H{"detail": "Token has expired"})
			} else {
				c.JSON(http.StatusUnauthorized, gin.H{"detail": "Invalid token"})
			}
			c.Abort()
			return
		}

		// Set user context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Next()
	}
}

// GetCurrentUser returns the current user
func GetCurrentUser(c *gin.Context) {
	userID := c.GetInt("user_id")

	user, err := service.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"detail": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// AdminMiddleware checks if user is admin
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		username := c.GetString("username")
		if !config.IsAdmin(username) {
			c.JSON(http.StatusForbidden, gin.H{"detail": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
