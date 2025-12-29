package repository

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/wzyjerry/llm-judge/internal/model"
)

// CreateModelConfig creates a new model config
func CreateModelConfig(config *model.ModelConfigCreate) (int, error) {
	now := time.Now().Format(time.RFC3339)
	apiUrlsJSON, _ := json.Marshal(config.APIUrls)

	query := `
		INSERT INTO model_configs (model_name, api_urls, api_key, temperature, top_p, max_tokens, timeout, max_concurrency, description, is_active, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
	`

	result, err := db.Exec(query,
		config.ModelName, string(apiUrlsJSON), config.APIKey,
		config.Temperature, config.TopP, config.MaxTokens,
		config.Timeout, config.MaxConcurrency, config.Description, now, now)
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
		SELECT id, model_name, api_urls, api_key, temperature, top_p, max_tokens, timeout, max_concurrency, description, is_active, created_at, updated_at
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
			&config.IsActive, &config.CreatedAt, &config.UpdatedAt,
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
		SELECT id, model_name, api_urls, api_key, temperature, top_p, max_tokens, timeout, max_concurrency, description, is_active, created_at, updated_at
		FROM model_configs WHERE id = ?
	`

	config := &model.ModelConfig{}
	var apiUrlsStr, apiKeyStr sql.NullString

	err := db.QueryRow(query, configID).Scan(
		&config.ID, &config.ModelName, &apiUrlsStr, &apiKeyStr,
		&config.Temperature, &config.TopP, &config.MaxTokens,
		&config.Timeout, &config.MaxConcurrency, &config.Description,
		&config.IsActive, &config.CreatedAt, &config.UpdatedAt,
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
		SELECT id, model_name, api_urls, api_key, temperature, top_p, max_tokens, timeout, max_concurrency, description, is_active, created_at, updated_at
		FROM model_configs WHERE model_name = ?
	`

	config := &model.ModelConfig{}
	var apiUrlsStr, apiKeyStr sql.NullString

	err := db.QueryRow(query, modelName).Scan(
		&config.ID, &config.ModelName, &apiUrlsStr, &apiKeyStr,
		&config.Temperature, &config.TopP, &config.MaxTokens,
		&config.Timeout, &config.MaxConcurrency, &config.Description,
		&config.IsActive, &config.CreatedAt, &config.UpdatedAt,
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
			if urls, ok := value.([]string); ok {
				urlsJSON, _ := json.Marshal(urls)
				setClause += ", api_urls = ?"
				args = append(args, string(urlsJSON))
				continue
			}
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
