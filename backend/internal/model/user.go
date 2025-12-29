package model

// User represents a user in the system
type User struct {
	ID        int    `json:"id" db:"id"`
	Username  string `json:"username" db:"username"`
	Password  string `json:"-" db:"password_hash"` // Don't serialize password
	Email     string `json:"email" db:"email"`
	CreatedAt string `json:"created_at" db:"created_at"`
	UpdatedAt string `json:"updated_at" db:"updated_at"`
}

// UserRegister represents user registration request
type UserRegister struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email"`
}

// UserLogin represents user login request
type UserLogin struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// TokenResponse represents JWT token response
type TokenResponse struct {
	AccessToken string    `json:"access_token"`
	TokenType   string    `json:"token_type"`
	User        *UserInfo `json:"user"`
}

// UserInfo represents basic user info (for token response)
type UserInfo struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

// CurrentUser represents current user context (from JWT)
type CurrentUser struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
}
