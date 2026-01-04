package model

// UserReport represents a user report
type UserReport struct {
	ID            int                    `json:"id" db:"id"`
	UserID        int                    `json:"user_id" db:"user_id"`
	TaskID        string                 `json:"task_id" db:"task_id"`
	Dataset       string                 `json:"dataset" db:"dataset"`
	Model         string                 `json:"model" db:"model"`
	ReportContent string                 `json:"report_content" db:"report_content"` // JSON string
	Timestamp     string                 `json:"timestamp" db:"timestamp"`
	Summary       map[string]interface{} `json:"summary" db:"summary"`
	CreatedAt     string                 `json:"created_at" db:"created_at"`
}

// UserReportCreate represents create user report request
type UserReportCreate struct {
	UserID        int                    `json:"user_id" binding:"required"`
	TaskID        string                 `json:"task_id" binding:"required"`
	Dataset       string                 `json:"dataset" binding:"required"`
	Model         string                 `json:"model" binding:"required"`
	ReportContent string                 `json:"report_content" binding:"required"`
	Timestamp     string                 `json:"timestamp" binding:"required"`
	Summary       map[string]interface{} `json:"summary" binding:"required"`
}

// ReportSummary represents report summary
type ReportSummary struct {
	Dataset   string                 `json:"dataset"`
	Model     string                 `json:"model"`
	ReportPath string                 `json:"report_path"`
	Timestamp  string                 `json:"timestamp"`
	Summary   map[string]interface{} `json:"summary"`
}
