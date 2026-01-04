package repository

import (
	"database/sql"
	"time"

	"github.com/wzyjerry/llm-judge/internal/model"
)

// CreateUserData creates a new user data record
func CreateUserData(userID int, filename, fileContent, description string) (int, error) {
	now := time.Now().Format(time.RFC3339)
	fileSize := len(fileContent)

	query := `
		INSERT INTO user_data (user_id, filename, description, file_content, file_size, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query, userID, filename, description, fileContent, fileSize, now, now)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// GetUserDataList returns all data files for a user
func GetUserDataList(userID int) ([]model.UserData, error) {
	query := `
		SELECT id, user_id, filename, description, file_size, created_at, updated_at
		FROM user_data WHERE user_id = ? ORDER BY created_at DESC
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dataList []model.UserData
	for rows.Next() {
		var data model.UserData
		err := rows.Scan(
			&data.ID, &data.UserID, &data.Filename, &data.Description,
			&data.FileSize, &data.CreatedAt, &data.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		dataList = append(dataList, data)
	}

	return dataList, nil
}

// GetUserDataAdapterByID returns user data by ID (without file content)
func GetUserDataAdapterByID(userID, dataID int) (*model.UserData, error) {
	query := `
		SELECT id, user_id, filename, description, file_size, created_at, updated_at
		FROM user_data WHERE id = ? AND user_id = ?
	`

	data := &model.UserData{}
	err := db.QueryRow(query, dataID, userID).Scan(
		&data.ID, &data.UserID, &data.Filename, &data.Description,
		&data.FileSize, &data.CreatedAt, &data.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return data, nil
}

// GetUserDataByID returns user data by ID (with file content)
func GetUserDataByID(userID, dataID int) (*model.UserData, error) {
	query := `
		SELECT id, user_id, filename, description, file_content, file_size, created_at, updated_at
		FROM user_data WHERE id = ? AND user_id = ?
	`

	data := &model.UserData{}
	err := db.QueryRow(query, dataID, userID).Scan(
		&data.ID, &data.UserID, &data.Filename, &data.Description,
		&data.FileContent, &data.FileSize, &data.CreatedAt, &data.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return data, nil
}

// UpdateUserData updates user data description
func UpdateUserData(userID, dataID int, description string) (bool, error) {
	now := time.Now().Format(time.RFC3339)
	query := `UPDATE user_data SET description = ?, updated_at = ? WHERE id = ? AND user_id = ?`

	result, err := db.Exec(query, description, now, dataID, userID)
	if err != nil {
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return rowsAffected > 0, nil
}

// UpdateUserDataContent updates user data file content
func UpdateUserDataContent(userID, dataID int, fileContent string) (bool, error) {
	now := time.Now().Format(time.RFC3339)
	fileSize := len(fileContent)
	query := `UPDATE user_data SET file_content = ?, file_size = ?, updated_at = ? WHERE id = ? AND user_id = ?`

	result, err := db.Exec(query, fileContent, fileSize, now, dataID, userID)
	if err != nil {
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return rowsAffected > 0, nil
}

// DeleteUserData deletes user data
func DeleteUserData(userID, dataID int) (bool, error) {
	query := `DELETE FROM user_data WHERE id = ? AND user_id = ?`
	result, err := db.Exec(query, dataID, userID)
	if err != nil {
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return rowsAffected > 0, nil
}

// GetAllDataGlobal returns all data files (admin)
func GetAllDataGlobal() ([]model.UserData, error) {
	query := `
		SELECT id, user_id, filename, description, file_size, created_at, updated_at
		FROM user_data ORDER BY created_at DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dataList []model.UserData
	for rows.Next() {
		var data model.UserData
		err := rows.Scan(
			&data.ID, &data.UserID, &data.Filename, &data.Description,
			&data.FileSize, &data.CreatedAt, &data.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		dataList = append(dataList, data)
	}

	return dataList, nil
}
