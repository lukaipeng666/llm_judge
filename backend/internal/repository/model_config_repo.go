package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/wzyjerry/llm-judge/internal/model"
)

// CreateModelConfig creates a new model config
func CreateModelConfig(config *model.ModelConfigCreate) (int, error) {
	now := time.Now().Format(time.RFC3339)
	apiUrlsJSON, _ := json.Marshal(config.APIUrls)

	// Set default is_vllm to 1 if not provided
	isVLLM := config.IsVLLM
	if isVLLM != 0 && isVLLM != 1 {
		isVLLM = 1
	}

	query := `
		INSERT INTO model_configs (model_name, api_urls, api_key, temperature, top_p, max_tokens, timeout, max_concurrency, description, is_active, is_vllm, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
	`

	result, err := db.Exec(query,
		config.ModelName, string(apiUrlsJSON), config.APIKey,
		config.Temperature, config.TopP, config.MaxTokens,
		config.Timeout, config.MaxConcurrency, config.Description, isVLLM, now, now)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// GetAllModelConfigs returns all model configs
func GetAllModelConfigs(includeInactive bool) ([]model.ModelConfig, error) {
	query := `
		SELECT id, model_name, api_urls, api_key, temperature, top_p, max_tokens, timeout, max_concurrency, description, is_active, is_vllm, created_at, updated_at
		FROM model_configs
	`

	if !includeInactive {
		query += " WHERE is_active = 1"
	}

	query += " ORDER BY created_at DESC"

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []model.ModelConfig
	for rows.Next() {
		var config model.ModelConfig
		var apiUrlsStr, apiKeyStr sql.NullString

		err := rows.Scan(
			&config.ID, &config.ModelName, &apiUrlsStr, &apiKeyStr,
			&config.Temperature, &config.TopP, &config.MaxTokens,
			&config.Timeout, &config.MaxConcurrency, &config.Description,
			&config.IsActive, &config.IsVLLM, &config.CreatedAt, &config.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse JSON fields
		if apiUrlsStr.Valid {
			json.Unmarshal([]byte(apiUrlsStr.String), &config.APIUrls)
		}
		if apiKeyStr.Valid {
			config.APIKey = apiKeyStr.String
		} else {
			config.APIKey = ""
		}

		configs = append(configs, config)
	}

	return configs, nil
}

// GetModelConfigByID returns a model config by ID
func GetModelConfigByID(configID int) (*model.ModelConfig, error) {
	query := `
		SELECT id, model_name, api_urls, api_key, temperature, top_p, max_tokens, timeout, max_concurrency, description, is_active, is_vllm, created_at, updated_at
		FROM model_configs WHERE id = ?
	`

	config := &model.ModelConfig{}
	var apiUrlsStr, apiKeyStr sql.NullString

	err := db.QueryRow(query, configID).Scan(
		&config.ID, &config.ModelName, &apiUrlsStr, &apiKeyStr,
		&config.Temperature, &config.TopP, &config.MaxTokens,
		&config.Timeout, &config.MaxConcurrency, &config.Description,
		&config.IsActive, &config.IsVLLM, &config.CreatedAt, &config.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Parse JSON fields
	if apiUrlsStr.Valid {
		json.Unmarshal([]byte(apiUrlsStr.String), &config.APIUrls)
	}
	if apiKeyStr.Valid {
		config.APIKey = apiKeyStr.String
	} else {
		config.APIKey = ""
	}

	return config, nil
}

// GetModelConfigByName returns a model config by name
func GetModelConfigByName(modelName string) (*model.ModelConfig, error) {
	query := `
		SELECT id, model_name, api_urls, api_key, temperature, top_p, max_tokens, timeout, max_concurrency, description, is_active, is_vllm, created_at, updated_at
		FROM model_configs WHERE model_name = ?
	`

	config := &model.ModelConfig{}
	var apiUrlsStr, apiKeyStr sql.NullString

	err := db.QueryRow(query, modelName).Scan(
		&config.ID, &config.ModelName, &apiUrlsStr, &apiKeyStr,
		&config.Temperature, &config.TopP, &config.MaxTokens,
		&config.Timeout, &config.MaxConcurrency, &config.Description,
		&config.IsActive, &config.IsVLLM, &config.CreatedAt, &config.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Parse JSON fields
	if apiUrlsStr.Valid {
		json.Unmarshal([]byte(apiUrlsStr.String), &config.APIUrls)
	}
	if apiKeyStr.Valid {
		config.APIKey = apiKeyStr.String
	} else {
		config.APIKey = ""
	}

	return config, nil
}

// UpdateModelConfig updates a model config
func UpdateModelConfig(configID int, updates map[string]interface{}) (bool, error) {
	now := time.Now().Format(time.RFC3339)

	// Build update query dynamically
	setClause := "updated_at = ?"
	args := []interface{}{now}

	for key, value := range updates {
		// Handle array types
		if key == "api_urls" {
			var urls []string
			// Try to convert from []string
			if strSlice, ok := value.([]string); ok {
				urls = strSlice
			} else if ifaceSlice, ok := value.([]interface{}); ok {
				// Convert from []interface{} to []string
				urls = make([]string, len(ifaceSlice))
				for i, v := range ifaceSlice {
					if str, ok := v.(string); ok {
						urls[i] = str
					} else {
						// Convert to string if possible
						urls[i] = fmt.Sprintf("%v", v)
					}
				}
			} else {
				// Skip if we can't convert
				continue
			}

			urlsJSON, err := json.Marshal(urls)
			if err != nil {
				return false, fmt.Errorf("failed to marshal api_urls: %w", err)
			}
			setClause += ", api_urls = ?"
			args = append(args, string(urlsJSON))
			continue
		}

		// Skip any slice/array types that aren't api_urls to prevent SQL errors
		// This handles edge cases where complex types might slip through
		switch value.(type) {
		case []interface{}, []string:
			// Skip unexpected array types
			continue
		}

		setClause += ", " + key + " = ?"
		args = append(args, value)
	}

	args = append(args, configID)

	query := "UPDATE model_configs SET " + setClause + " WHERE id = ?"
	result, err := db.Exec(query, args...)
	if err != nil {
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return rowsAffected > 0, nil
}

// DeleteModelConfig deletes a model config
func DeleteModelConfig(configID int) (bool, error) {
	query := `DELETE FROM model_configs WHERE id = ?`
	result, err := db.Exec(query, configID)
	if err != nil {
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return rowsAffected > 0, nil
}
