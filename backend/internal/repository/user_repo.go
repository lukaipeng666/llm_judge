package repository

import (
	"database/sql"
	"time"

	"github.com/wzyjerry/llm-judge/internal/model"
)

// CreateUser creates a new user
func CreateUser(username, password, email string) (int, error) {
	now := time.Now().Format(time.RFC3339)
	query := `
		INSERT INTO users (username, password_hash, email, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query, username, password, email, now, now)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// VerifyUser verifies user credentials and returns user info
func VerifyUser(username, password string) (*model.User, error) {
	query := `
		SELECT id, username, password_hash, email, created_at, updated_at
		FROM users WHERE username = ?
	`

	user := &model.User{}
	var email sql.NullString

	err := db.QueryRow(query, username).Scan(
		&user.ID, &user.Username, &user.Password, &email,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Handle NULL email
	if email.Valid {
		user.Email = email.String
	} else {
		user.Email = ""
	}

	// Check password
	if user.Password != password {
		return nil, nil
	}

	return user, nil
}

// GetUserByID returns a user by ID
func GetUserByID(userID int) (*model.User, error) {
	query := `
		SELECT id, username, password_hash, email, created_at, updated_at
		FROM users WHERE id = ?
	`

	user := &model.User{}
	var email sql.NullString

	err := db.QueryRow(query, userID).Scan(
		&user.ID, &user.Username, &user.Password, &email,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Handle NULL email
	if email.Valid {
		user.Email = email.String
	} else {
		user.Email = ""
	}

	return user, nil
}

// GetAllUsers returns all users
func GetAllUsers() ([]model.User, error) {
	query := `
		SELECT id, username, email, created_at, updated_at
		FROM users ORDER BY id
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var user model.User
		var email sql.NullString
		err := rows.Scan(&user.ID, &user.Username, &email, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, err
		}

		// Handle NULL email
		if email.Valid {
			user.Email = email.String
		} else {
			user.Email = ""
		}

		users = append(users, user)
	}

	return users, nil
}

// DeleteUser deletes a user by ID
func DeleteUser(userID int) (bool, error) {
	query := `DELETE FROM users WHERE id = ?`
	result, err := db.Exec(query, userID)
	if err != nil {
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return rowsAffected > 0, nil
}

// UserExists checks if a user exists by username
func UserExists(username string) (bool, error) {
	query := `SELECT 1 FROM users WHERE username = ?`
	var exists int
	err := db.QueryRow(query, username).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}
