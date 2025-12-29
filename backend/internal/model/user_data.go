package model

// UserData represents a user data file
type UserData struct {
	ID          int    `json:"id" db:"id"`
	UserID      int    `json:"user_id" db:"user_id"`
	Filename    string `json:"filename" db:"filename"`
	Description string `json:"description" db:"description"`
	FileContent string `json:"-" db:"file_content"` // Don't serialize large content
	FileSize    int    `json:"file_size" db:"file_size"`
	CreatedAt   string `json:"created_at" db:"created_at"`
	UpdatedAt   string `json:"updated_at" db:"updated_at"`
}

// UserDataCreate represents create user data request
type UserDataCreate struct {
	UserID      int    `json:"user_id" binding:"required"`
	Filename    string `json:"filename" binding:"required"`
	FileContent string `json:"file_content" binding:"required"`
	Description string `json:"description"`
}

// UserDataUpdate represents update user data description request
type UserDataUpdate struct {
	Description string `json:"description" binding:"required"`
}

// UserDataContentUpdate represents update user data content request
type UserDataContentUpdate struct {
	FileContent string `json:"file_content" binding:"required"`
}

// DataEditRequest represents data edit request
type DataEditRequest struct {
	EditType  string  `json:"edit_type" binding:"required,oneof=single batch"`
	ItemIndex *int    `json:"item_index,omitempty"`
	FieldType string  `json:"field_type" binding:"required"`
	Role      string  `json:"role,omitempty"`
	TurnIndex *int    `json:"turn_index,omitempty"`
	NewValue  string  `json:"new_value" binding:"required"`
}

// SingleItemEditRequest represents single item edit request
type SingleItemEditRequest struct {
	ItemIndex  int                    `json:"item_index" binding:"required"`
	EditedItem map[string]interface{} `json:"edited_item" binding:"required"`
}

// BatchDeleteItemsRequest represents batch delete items request
type BatchDeleteItemsRequest struct {
	ItemIndices []int `json:"item_indices" binding:"required"`
}

// AddItemRequest represents add single item request
type AddItemRequest struct {
	NewItem map[string]interface{} `json:"new_item" binding:"required"`
}

// DataFile represents a data file info
type DataFile struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Size        int    `json:"size"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

// DataContentResponse represents data content response
type DataContentResponse struct {
	Filename    string        `json:"filename"`
	Description string        `json:"description"`
	TotalCount  int           `json:"total_count"`
	Data        []interface{} `json:"data"`
	Error       string        `json:"error,omitempty"`
}

// CSVValidationInfo represents CSV validation info
type CSVValidationInfo struct {
	TotalRows   int                    `json:"total_rows"`
	ValidRows   int                    `json:"valid_rows"`
	EmptyRows   int                    `json:"empty_rows"`
	HeadersInfo map[string]interface{} `json:"headers_info"`
	Warnings    []string               `json:"warnings"`
	InvalidRows []map[string]interface{} `json:"invalid_rows"`
	Errors      []string               `json:"errors"`
}
