package model

// EvaluationConfig represents evaluation configuration
type EvaluationConfig struct {
	APIUrls            []string `json:"api_urls" binding:"required"`
	Model              string   `json:"model" binding:"required"`
	DataFile           string   `json:"data_file" binding:"required"` // data_id as string
	Scoring            string   `json:"scoring" binding:"required"`
	ScoringModule      string   `json:"scoring_module"`
	MaxWorkers         int      `json:"max_workers"`
	BadcaseThreshold   float64  `json:"badcase_threshold"`
	ReportFormat       string   `json:"report_format"`
	TestMode           bool     `json:"test_mode"`
	SampleSize         int      `json:"sample_size"`
	CheckpointPath     string   `json:"checkpoint_path"`
	CheckpointInterval int      `json:"checkpoint_interval"`
	Resume             bool     `json:"resume"`
	Role               string   `json:"role"`
	Timeout            int      `json:"timeout"`
	MaxTokens          int      `json:"max_tokens"`
	APIKey             string   `json:"api_key"`
	IsVLLM             bool     `json:"is_vllm"`
	Temperature        *float64 `json:"temperature"`
	TopP               *float64 `json:"top_p"`
}

// EvaluationResult represents a single evaluation result
type EvaluationResult struct {
	Index           int                    `json:"index"`
	OriginalIndex   int                    `json:"original_index"`
	ExpandedIndex   int                    `json:"expanded_index"`
	UserInput       []Message              `json:"user_input"`
	ModelOutput     string                 `json:"model_output"`
	ReferenceOutput string                 `json:"reference_output"`
	Score           float64                `json:"score"`
	IsBadcase       int                    `json:"is_badcase"`
	Details         map[string]interface{} `json:"details"`
	InferenceTime   float64                `json:"inference_time"`
	TestMode        bool                   `json:"test_mode"`
	Error           string                 `json:"error,omitempty"`
}

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`    // system, user, assistant
	Content string `json:"content"`
}

// ModelCallRequest represents model call request
type ModelCallRequest struct {
	APIUrl      string              `json:"api_url" binding:"required"`
	APIKey      string              `json:"api_key" binding:"required"`
	Messages    []map[string]string `json:"messages" binding:"required"`
	Model       string              `json:"model" binding:"required"`
	Temperature float64             `json:"temperature"`
	MaxTokens   int                 `json:"max_tokens"`
	Timeout     int                 `json:"timeout"`
	IsVLLM      bool                `json:"is_vllm"`
	TopP        float64             `json:"top_p"`
}

// ModelCallResponse represents model call response
type ModelCallResponse struct {
	Success bool   `json:"success"`
	Content string `json:"content"`
	Error   string `json:"error,omitempty"`
}

// ConcurrencyStatus represents model concurrency status
type ConcurrencyStatus struct {
	Model             string `json:"model"`
	CurrentConcurrency int   `json:"current_concurrency"`
	MaxConcurrency    int   `json:"max_concurrency"`
	AvailableSlots    int   `json:"available_slots"`
	Error             string `json:"error,omitempty"`
}

// JSONLData represents a single JSONL data item
type JSONLData struct {
	Meta  map[string]interface{} `json:"meta,omitempty"`
	Turns []Turn                 `json:"turns,omitempty"`
}

// Turn represents a conversation turn
type Turn struct {
	Role string `json:"role"`
	Text string `json:"text"`
}
