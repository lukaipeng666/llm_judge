package repository

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/wzyjerry/llm-judge/internal/model"
)

// CreateUserReport creates a new user report
func CreateUserReport(report *model.UserReportCreate) (int, error) {
	now := time.Now().Format(time.RFC3339)
	summaryJSON, _ := json.Marshal(report.Summary)

	query := `
		INSERT INTO user_reports (user_id, task_id, dataset, model, report_content, timestamp, summary, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query,
		report.UserID, report.TaskID, report.Dataset, report.Model,
		report.ReportContent, report.Timestamp, string(summaryJSON), now)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// GetUserReports returns all reports for a user
func GetUserReports(userID int) ([]model.UserReport, error) {
	query := `
		SELECT id, user_id, task_id, dataset, model, report_content, timestamp, summary, created_at
		FROM user_reports WHERE user_id = ? ORDER BY created_at DESC
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []model.UserReport
	for rows.Next() {
		var report model.UserReport
		var summaryStr sql.NullString

		err := rows.Scan(
			&report.ID, &report.UserID, &report.TaskID, &report.Dataset,
			&report.Model, &report.ReportContent, &report.Timestamp,
			&summaryStr, &report.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse JSON field
		if summaryStr.Valid {
			json.Unmarshal([]byte(summaryStr.String), &report.Summary)
		}

		reports = append(reports, report)
	}

	return reports, nil
}

// GetUserReportByID returns a report by ID
func GetUserReportByID(userID int, reportID int) (*model.UserReport, error) {
	query := `
		SELECT id, user_id, task_id, dataset, model, report_content, timestamp, summary, created_at
		FROM user_reports WHERE id = ? AND user_id = ?
	`

	report := &model.UserReport{}
	var summaryStr sql.NullString

	err := db.QueryRow(query, reportID, userID).Scan(
		&report.ID, &report.UserID, &report.TaskID, &report.Dataset,
		&report.Model, &report.ReportContent, &report.Timestamp,
		&summaryStr, &report.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Parse JSON field
	if summaryStr.Valid {
		json.Unmarshal([]byte(summaryStr.String), &report.Summary)
	}

	return report, nil
}

// GetUserReportByPath returns a report by dataset and model
func GetUserReportByPath(userID int, dataset, modelName string) (*model.UserReport, error) {
	query := `
		SELECT id, user_id, task_id, dataset, model, report_content, timestamp, summary, created_at
		FROM user_reports WHERE user_id = ? AND dataset = ? AND model = ?
		ORDER BY created_at DESC LIMIT 1
	`

	report := &model.UserReport{}
	var summaryStr sql.NullString

	err := db.QueryRow(query, userID, dataset, modelName).Scan(
		&report.ID, &report.UserID, &report.TaskID, &report.Dataset,
		&report.Model, &report.ReportContent, &report.Timestamp,
		&summaryStr, &report.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Parse JSON field
	if summaryStr.Valid {
		json.Unmarshal([]byte(summaryStr.String), &report.Summary)
	}

	return report, nil
}

// DeleteUserReport deletes a report
func DeleteUserReport(userID int, reportID int) (bool, error) {
	query := `DELETE FROM user_reports WHERE id = ? AND user_id = ?`
	result, err := db.Exec(query, reportID, userID)
	if err != nil {
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	return rowsAffected > 0, nil
}
