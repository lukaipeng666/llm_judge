package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// Config represents the application configuration
type Config struct {
	DatabaseService DatabaseServiceConfig `mapstructure:"database_service"`
	WebService      WebServiceConfig      `mapstructure:"web_service"`
	FrontendService FrontendServiceConfig `mapstructure:"frontend_service"`
	RedisService    RedisServiceConfig    `mapstructure:"redis_service"`
	JWT             JWTConfig             `mapstructure:"jwt"`
	Log             LogConfig             `mapstructure:"log"`
	Admin           AdminConfig           `mapstructure:"admin"`
}

type DatabaseServiceConfig struct {
	Host        string `mapstructure:"host"`
	Port        int    `mapstructure:"port"`
	DatabaseURL string `mapstructure:"database_url"`
}

type WebServiceConfig struct {
	Host               string `mapstructure:"host"`
	Port               int    `mapstructure:"port"`
	DatabaseServiceURL string `mapstructure:"database_service_url"`
}

type FrontendServiceConfig struct {
	Host string `mapstructure:"host"`
	Port int    `mapstructure:"port"`
}

type RedisServiceConfig struct {
	Host        string `mapstructure:"host"`
	Port        int    `mapstructure:"port"`
	DB          int    `mapstructure:"db"`
	MaxWaitTime int    `mapstructure:"max_wait_time"`
}

type JWTConfig struct {
	SecretKey   string `mapstructure:"secret_key"`
	ExpireHours int    `mapstructure:"expire_hours"`
}

type LogConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
	Output string `mapstructure:"output"`
}

type AdminConfig struct {
	Username     string `mapstructure:"username"`
	PasswordHash string `mapstructure:"password_hash"`
}

var cfg *Config

// Load loads the configuration from config.yaml
func Load(configPath string) (*Config, error) {
	v := viper.New()
	v.SetConfigFile(configPath)
	v.SetConfigType("yaml")

	// Read config file
	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	cfg = &Config{}
	if err := v.Unmarshal(cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return cfg, nil
}

// Get returns the loaded configuration
func Get() *Config {
	return cfg
}

// GetDatabaseServiceAddr returns the database service address
func (c *Config) GetDatabaseServiceAddr() string {
	return fmt.Sprintf("%s:%d", c.DatabaseService.Host, c.DatabaseService.Port)
}

// GetWebServiceAddr returns the web service address
func (c *Config) GetWebServiceAddr() string {
	return fmt.Sprintf("%s:%d", c.WebService.Host, c.WebService.Port)
}

// GetFrontendServiceAddr returns the frontend service address
func (c *Config) GetFrontendServiceAddr() string {
	return fmt.Sprintf("%s:%d", c.FrontendService.Host, c.FrontendService.Port)
}

// GetRedisAddr returns the redis address
func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%d", c.RedisService.Host, c.RedisService.Port)
}

// IsAdmin checks if the username is admin
func IsAdmin(username string) bool {
	globalConfig := Get()
	if globalConfig != nil {
		return strings.ToLower(strings.TrimSpace(username)) == strings.ToLower(strings.TrimSpace(globalConfig.Admin.Username))
	}
	// Fallback to default
	return strings.ToLower(strings.TrimSpace(username)) == "admin"
}
