package model

// ModelConfig represents a model configuration
type ModelConfig struct {
	ID             int       `json:"id" db:"id"`
	ModelName      string    `json:"model_name" db:"model_name"`
	APIUrls        []string  `json:"api_urls" db:"api_urls"` // JSON array
	APIKey         string    `json:"api_key" db:"api_key"`
	Temperature    float64   `json:"temperature" db:"temperature"`
	TopP           float64   `json:"top_p" db:"top_p"`
	MaxTokens      int       `json:"max_tokens" db:"max_tokens"`
	Timeout        int       `json:"timeout" db:"timeout"`
	MaxConcurrency int       `json:"max_concurrency" db:"max_concurrency"`
	Description    string    `json:"description" db:"description"`
	IsActive       int       `json:"is_active" db:"is_active"` // 0 or 1
	IsVLLM         int       `json:"is_vllm" db:"is_vllm"`     // 0 or 1, default 1
	CreatedAt      string    `json:"created_at" db:"created_at"`
	UpdatedAt      string    `json:"updated_at" db:"updated_at"`
}

// ModelConfigCreate represents create model config request
type ModelConfigCreate struct {
	ModelName      string    `json:"model_name" binding:"required"`
	APIUrls        []string  `json:"api_urls" binding:"required"`
	APIKey         string    `json:"api_key"`
	Temperature    float64   `json:"temperature"`
	TopP           float64   `json:"top_p"`
	MaxTokens      int       `json:"max_tokens"`
	Timeout        int       `json:"timeout"`
	MaxConcurrency int       `json:"max_concurrency"`
	Description    string    `json:"description"`
	IsVLLM         int       `json:"is_vllm"` // 0 or 1, default 1
}

// ModelConfigUpdate represents update model config request
type ModelConfigUpdate struct {
	ModelName      *string   `json:"model_name,omitempty"`
	APIUrls        *[]string `json:"api_urls,omitempty"`
	APIKey         *string   `json:"api_key,omitempty"`
	Temperature    *float64  `json:"temperature,omitempty"`
	TopP           *float64  `json:"top_p,omitempty"`
	MaxTokens      *int      `json:"max_tokens,omitempty"`
	Timeout        *int      `json:"timeout,omitempty"`
	MaxConcurrency *int      `json:"max_concurrency,omitempty"`
	Description    *string   `json:"description,omitempty"`
	IsActive       *int      `json:"is_active,omitempty"`
	IsVLLM         *int      `json:"is_vllm,omitempty"`
}
