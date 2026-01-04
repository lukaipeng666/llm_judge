package repository

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/wzyjerry/llm-judge/internal/pkg/config"
	"go.uber.org/zap"
)

var (
	db   *sql.DB
	once sync.Once
)

// InitDB initializes the database connection and creates tables
func InitDB(dbPath string) error {
	// Ensure data directory exists
	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	var err error
	once.Do(func() {
		db, err = sql.Open("sqlite3", dbPath)
		if err != nil {
			return
		}

		// Enable foreign key constraints
		if _, err := db.Exec("PRAGMA foreign_keys = ON;"); err != nil {
			err = fmt.Errorf("failed to enable foreign keys: %w", err)
			return
		}

		// Set connection pool parameters
		db.SetMaxOpenConns(25)
		db.SetMaxIdleConns(5)
		db.SetConnMaxLifetime(5 * 60) // 5 minutes
	})

	if err != nil {
		return err
	}

	// Create tables
	if err := createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	// Initialize admin user
	if err := initializeAdminUser(); err != nil {
		zap.L().Error("Failed to initialize admin user", zap.Error(err))
		// Don't fail the entire initialization if admin creation fails
	}

	zap.L().Info("Database initialized successfully",
		zap.String("path", dbPath))

	return nil
}

// initializeAdminUser creates the admin user if it doesn't exist
func initializeAdminUser() error {
	zap.L().Debug("Starting admin user initialization")

	// Get admin config
	configData := config.Get()
	if configData == nil {
		zap.L().Error("Config not loaded")
		return fmt.Errorf("config not loaded")
	}

	adminUsername := configData.Admin.Username
	adminPasswordHash := configData.Admin.PasswordHash

	zap.L().Debug("Admin config loaded",
		zap.String("username", adminUsername),
		zap.String("password_hash", adminPasswordHash))

	// Check if admin user already exists
	var exists int
	query := `SELECT 1 FROM users WHERE username = ?`
	err := db.QueryRow(query, adminUsername).Scan(&exists)
	if err == nil {
		// Admin user already exists, nothing to do
		zap.L().Info("Admin user already exists, skipping creation")
		return nil
	} else if err != sql.ErrNoRows {
		// Some other error occurred
		zap.L().Error("Failed to check if admin user exists", zap.Error(err))
		return fmt.Errorf("failed to check if admin user exists: %w", err)
	}

	zap.L().Debug("Admin user does not exist, creating...")

	// Admin user doesn't exist, create it
	now := time.Now().Format(time.RFC3339)
	insertQuery := `INSERT INTO users (username, password_hash, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
	_, err = db.Exec(insertQuery, adminUsername, adminPasswordHash, "admin@llm-judge.com", now, now)
	if err != nil {
		zap.L().Error("Failed to create admin user", zap.Error(err))
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	zap.L().Info("Admin user created successfully", zap.String("username", adminUsername))
	return nil
}

// GetDB returns the database instance
func GetDB() *sql.DB {
	return db
}

// Close closes the database connection
func Close() error {
	if db != nil {
		return db.Close()
	}
	return nil
}

// createTables creates all tables if they don't exist
func createTables() error {
	tables := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			email TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,

		`CREATE TABLE IF NOT EXISTS user_data (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			filename TEXT NOT NULL,
			description TEXT,
			file_content TEXT NOT NULL,
			file_size INTEGER,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id)`,

		`CREATE TABLE IF NOT EXISTS user_tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			task_id TEXT UNIQUE NOT NULL,
			status TEXT NOT NULL,
			progress REAL DEFAULT 0.0,
			message TEXT,
			config TEXT,
			result TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
		`CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id)`,

		`CREATE TABLE IF NOT EXISTS user_reports (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			task_id TEXT NOT NULL,
			dataset TEXT NOT NULL,
			model TEXT NOT NULL,
			report_content TEXT NOT NULL,
			timestamp TEXT NOT NULL,
			summary TEXT,
			created_at TEXT NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (task_id) REFERENCES user_tasks(task_id) ON DELETE CASCADE
		)`,
		`CREATE INDEX IF NOT EXISTS idx_user_reports_user_id ON user_reports(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_user_reports_task_id ON user_reports(task_id)`,

		`CREATE TABLE IF NOT EXISTS model_configs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			model_name TEXT UNIQUE NOT NULL,
			api_urls TEXT NOT NULL,
			api_key TEXT,
			temperature REAL DEFAULT 0.0,
			top_p REAL DEFAULT 1.0,
			max_tokens INTEGER DEFAULT 1024,
			timeout INTEGER DEFAULT 10,
			max_concurrency INTEGER DEFAULT 10,
			description TEXT,
			is_active INTEGER DEFAULT 1,
			is_vllm INTEGER DEFAULT 1,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE INDEX IF NOT EXISTS idx_model_configs_model_name ON model_configs(model_name)`,
		`CREATE INDEX IF NOT EXISTS idx_model_configs_is_active ON model_configs(is_active)`,
	}

	for _, table := range tables {
		if _, err := db.Exec(table); err != nil {
			return fmt.Errorf("failed to execute SQL: %s, error: %w", table, err)
		}
	}

	return nil
}

// WithTx executes a function within a transaction
func WithTx(fn func(*sql.Tx) error) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		} else if err != nil {
			tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()

	err = fn(tx)
	return err
}
