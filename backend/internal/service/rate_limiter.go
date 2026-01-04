package service

import (
	"sync"
	"time"
)

// AutoRegisterRateLimit manages IP-based rate limiting for auto-register
type AutoRegisterRateLimit struct {
	requests map[string][]time.Time
	mu       sync.Mutex
	window   time.Duration
	maxReqs  int
}

// NewAutoRegisterRateLimit creates a new rate limiter
func NewAutoRegisterRateLimit(window time.Duration, maxReqs int) *AutoRegisterRateLimit {
	return &AutoRegisterRateLimit{
		requests: make(map[string][]time.Time),
		window:   window,
		maxReqs:  maxReqs,
	}
}

// Check checks if the IP is within rate limit
func (r *AutoRegisterRateLimit) Check(ip string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()

	// Clean old requests
	if reqs, exists := r.requests[ip]; exists {
		var valid []time.Time
		for _, t := range reqs {
			if now.Sub(t) < r.window {
				valid = append(valid, t)
			}
		}
		r.requests[ip] = valid
	}

	// Check if within limit
	if len(r.requests[ip]) >= r.maxReqs {
		return false
	}

	// Add current request
	r.requests[ip] = append(r.requests[ip], now)
	return true
}
