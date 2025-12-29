package service

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"

	"github.com/wzyjerry/llm-judge/internal/model"
	"github.com/wzyjerry/llm-judge/internal/pkg/jwt"
	"github.com/wzyjerry/llm-judge/internal/repository"
)

var (
	ErrUsernameExists = errors.New("username already exists")
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserNotFound = errors.New("user not found")
)

// Register creates a new user and returns JWT token
func Register(username, password, email string) (*model.TokenResponse, error) {
	// Check if user exists
	exists, err := repository.UserExists(username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrUsernameExists
	}

	// Hash password
	passwordHash := hashPassword(password)

	// Create user
	userID, err := repository.CreateUser(username, passwordHash, email)
	if err != nil {
		return nil, err
	}

	// Generate token
	token, err := jwt.GenerateToken(userID, username)
	if err != nil {
		return nil, err
	}

	return &model.TokenResponse{
		AccessToken: token,
		TokenType:   "bearer",
		User: &model.UserInfo{
			ID:       userID,
			Username: username,
			Email:    email,
		},
	}, nil
}

// Login authenticates a user and returns JWT token
func Login(username, password string) (*model.TokenResponse, error) {
	// Hash password
	passwordHash := hashPassword(password)

	// Verify user
	user, err := repository.VerifyUser(username, passwordHash)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrInvalidCredentials
	}

	// Generate token
	token, err := jwt.GenerateToken(user.ID, user.Username)
	if err != nil {
		return nil, err
	}

	return &model.TokenResponse{
		AccessToken: token,
		TokenType:   "bearer",
		User: &model.UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	}, nil
}

// GetUserByID returns user by ID
func GetUserByID(userID int) (*model.User, error) {
	user, err := repository.GetUserByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

// hashPassword hashes a password using SHA256
func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}
