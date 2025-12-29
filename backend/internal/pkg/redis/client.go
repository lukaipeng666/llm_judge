package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/wzyjerry/llm-judge/internal/pkg/config"
	"go.uber.org/zap"
)

var (
	client *redis.Client
	ctx    = context.Background()
	log    *zap.Logger
)

// Init initializes the Redis client
func Init(cfg *config.Config) error {
	client = redis.NewClient(&redis.Options{
		Addr:     cfg.GetRedisAddr(),
		Password: "",
		DB:       cfg.RedisService.DB,
	})

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		return err
	}

	log = zap.L().With(zap.String("component", "redis"))
	log.Info("Redis connected successfully",
		zap.String("addr", cfg.GetRedisAddr()))

	return nil
}

// GetClient returns the Redis client
func GetClient() *redis.Client {
	return client
}

// GetLogger returns the logger
func GetLogger() *zap.Logger {
	if log == nil {
		return zap.L()
	}
	return log
}

// Close closes the Redis connection
func Close() error {
	if client != nil {
		return client.Close()
	}
	return nil
}

// AcquireSlot acquires a concurrency slot using Lua script
func AcquireSlot(key string, maxConcurrency int) (bool, error) {
	if client == nil {
		return false, fmt.Errorf("redis client not initialized")
	}

	// Lua script: atomically check and increment counter
	acquireScript := redis.NewScript(`
		local current = tonumber(redis.call('GET', KEYS[1]) or '0')
		local max_concurrency = tonumber(ARGV[1])
		if current < max_concurrency then
			redis.call('INCR', KEYS[1])
			redis.call('EXPIRE', KEYS[1], 3600)
			return 1
		else
			return 0
		end
	`)

	result, err := acquireScript.Run(ctx, client, []string{key}, maxConcurrency).Result()
	if err != nil {
		return false, err
	}

	acquired, ok := result.(int64)
	if !ok {
		return false, fmt.Errorf("unexpected result type")
	}

	return acquired == 1, nil
}

// ReleaseSlot releases a concurrency slot
func ReleaseSlot(key string) error {
	if client == nil {
		return fmt.Errorf("redis client not initialized")
	}

	// Decrement counter
	newCount, err := client.Decr(ctx, key).Result()
	if err != nil {
		return err
	}

	// If count becomes 0 or negative, delete the key
	if newCount <= 0 {
		client.Del(ctx, key)
	}

	return nil
}

// GetCurrentConcurrency gets the current concurrency count
func GetCurrentConcurrency(key string) (int, error) {
	if client == nil {
		return 0, fmt.Errorf("redis client not initialized")
	}

	val, err := client.Get(ctx, key).Result()
	if err == redis.Nil {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}

	var count int
	if _, err := fmt.Sscanf(val, "%d", &count); err != nil {
		return 0, err
	}

	return count, nil
}

// GetInt gets an integer value from Redis
func GetInt(key string) (int, error) {
	if client == nil {
		return 0, fmt.Errorf("redis client not initialized")
	}

	val, err := client.Get(ctx, key).Result()
	if err == redis.Nil {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}

	var result int
	if _, err := fmt.Sscanf(val, "%d", &result); err != nil {
		return 0, err
	}

	return result, nil
}

// SetInt sets an integer value in Redis with expiration
func SetInt(key string, value int, expiration time.Duration) error {
	if client == nil {
		return fmt.Errorf("redis client not initialized")
	}

	return client.Set(ctx, key, value, expiration).Err()
}

// Delete deletes a key from Redis
func Delete(key string) error {
	if client == nil {
		return fmt.Errorf("redis client not initialized")
	}

	return client.Del(ctx, key).Err()
}

// Scan scans for keys matching a pattern
func Scan(pattern string, count int64) ([]string, error) {
	if client == nil {
		return nil, fmt.Errorf("redis client not initialized")
	}

	var keys []string
	var cursor uint64

	for {
		var batch []string
		var err error

		batch, cursor, err = client.Scan(ctx, cursor, pattern, count).Result()
		if err != nil {
			return nil, err
		}

		keys = append(keys, batch...)

		if cursor == 0 {
			break
		}
	}

	return keys, nil
}
