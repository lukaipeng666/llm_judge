package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/wzyjerry/llm-judge/internal/model"
)

// CreateUserTask creates a new user task
func CreateUserTask(userID int, taskID string, config map[string]interface{}) (int, error) {
	now := time.Now().Format(time.RFC3339)
	configJSON, _ := json.Marshal(config)

	query := `
		INSERT INTO user_tasks (user_id, task_id, status, progress, message, config, created_at, updated_at)
		VALUES (?, ?, 'pending', 0.0, '', ?, ?, ?)
	`

	result, err := db.Exec(query, userID, taskID, string(configJSON), now, now)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// GetUserTasks returns all tasks for a user
func GetUserTasks(userID int) ([]model.UserTask, error) {
	query := `
		SELECT id, user_id, task_id, status, progress, message, config, result, created_at, updated_at
		FROM user_tasks WHERE user_id = ? ORDER BY created_at DESC
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []model.UserTask
	for rows.Next() {
		var task model.UserTask
		var configStr, resultStr sql.NullString

		err := rows.Scan(
			&task.ID, &task.UserID, &task.TaskID, &task.Status,
			&task.Progress, &task.Message, &configStr, &resultStr,
			&task.CreatedAt, &task.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse JSON fields
		if configStr.Valid {
			json.Unmarshal([]byte(configStr.String), &task.Config)
		}
		if resultStr.Valid {
			json.Unmarshal([]byte(resultStr.String), &task.Result)
		}

		tasks = append(tasks, task)
	}

	return tasks, nil
}

// GetUserTaskByID returns a task by task ID
func GetUserTaskByID(userID int, taskID string) (*model.UserTask, error) {
	query := `
		SELECT id, user_id, task_id, status, progress, message, config, result, created_at, updated_at
		FROM user_tasks WHERE task_id = ? AND user_id = ?
	`

	task := &model.UserTask{}
	var configStr, resultStr sql.NullString

	err := db.QueryRow(query, taskID, userID).Scan(
		&task.ID, &task.UserID, &task.TaskID, &task.Status,
		&task.Progress, &task.Message, &configStr, &resultStr,
		&task.CreatedAt, &task.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Parse JSON fields
	if configStr.Valid {
		json.Unmarshal([]byte(configStr.String), &task.Config)
	}
	if resultStr.Valid {
		json.Unmarshal([]byte(resultStr.String), &task.Result)
	}

	return task, nil
}

// UpdateUserTask updates a task
func UpdateUserTask(taskID string, updates map[string]interface{}) (bool, error) {
	now := time.Now().Format(time.RFC3339)

	// Build update query dynamically
	setClause := "updated_at = ?"
	args := []interface{}{now}

	for key, value := range updates {
		setClause += ", " + key + " = ?"
		args = append(args, value)
	}

	args = append(args, taskID)

	query := fmt.Sprintf("UPDATE user_tasks SET %s WHERE task_id = ?", setClause)
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

// DeleteUserTask deletes a task
func DeleteUserTask(userID int, taskID string) (bool, error) {
	query := `DELETE FROM user_tasks WHERE task_id = ? AND user_id = ?`
	result, err := db.Exec(query, taskID, userID)
	if err != nil {
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return rowsAffected > 0, nil
}

// GetAllTasksGlobal returns all tasks (admin)
func GetAllTasksGlobal() ([]model.UserTask, error) {
	query := `
		SELECT id, user_id, task_id, status, progress, message, config, result, created_at, updated_at
		FROM user_tasks ORDER BY created_at DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []model.UserTask
	for rows.Next() {
		var task model.UserTask
		var configStr, resultStr sql.NullString

		err := rows.Scan(
			&task.ID, &task.UserID, &task.TaskID, &task.Status,
			&task.Progress, &task.Message, &configStr, &resultStr,
			&task.CreatedAt, &task.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse JSON fields
		if configStr.Valid {
			json.Unmarshal([]byte(configStr.String), &task.Config)
		}
		if resultStr.Valid {
			json.Unmarshal([]byte(resultStr.String), &task.Result)
		}

		tasks = append(tasks, task)
	}

	return tasks, nil
}
