package model

// UserTask represents a user task
type UserTask struct {
	ID        int                    `json:"id" db:"id"`
	UserID    int                    `json:"user_id" db:"user_id"`
	TaskID    string                 `json:"task_id" db:"task_id"`
	Status    string                 `json:"status" db:"status"` // pending, running, completed, failed, cancelled
	Progress  float64                `json:"progress" db:"progress"`
	Message   string                 `json:"message" db:"message"`
	Config    map[string]interface{} `json:"config" db:"config"`
	Result    map[string]interface{} `json:"result" db:"result"`
	CreatedAt string                 `json:"created_at" db:"created_at"`
	UpdatedAt string                 `json:"updated_at" db:"updated_at"`
}

// UserTaskCreate represents create user task request
type UserTaskCreate struct {
	UserID int                    `json:"user_id" binding:"required"`
	TaskID string                 `json:"task_id" binding:"required"`
	Config map[string]interface{} `json:"config" binding:"required"`
}

// UserTaskUpdate represents update user task request
type UserTaskUpdate struct {
	Updates map[string]interface{} `json:"updates" binding:"required"`
}

// TaskStatus represents task status response
type TaskStatus struct {
	TaskID    string                 `json:"task_id"`
	Status    string                 `json:"status"`
	Progress  float64                `json:"progress"`
	Message   string                 `json:"message"`
	Config    map[string]interface{} `json:"config,omitempty"`
	Result    map[string]interface{} `json:"result,omitempty"`
	CreatedAt string                 `json:"created_at,omitempty"`
	UpdatedAt string                 `json:"updated_at,omitempty"`
}
