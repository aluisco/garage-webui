package middleware

import (
	"khairul169/garage-webui/utils"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

// CORSMiddleware adds CORS headers to responses
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get allowed origins from environment or use default
		allowedOrigins := utils.GetEnv("CORS_ALLOWED_ORIGINS", "http://localhost:*,http://127.0.0.1:*")
		origins := strings.Split(allowedOrigins, ",")

		origin := r.Header.Get("Origin")
		allowed := false

		// Check if origin is allowed
		for _, allowedOrigin := range origins {
			if matchOrigin(strings.TrimSpace(allowedOrigin), origin) {
				allowed = true
				break
			}
		}

		if allowed || len(origin) == 0 {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "86400") // 24 hours

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// matchOrigin checks if an origin matches the pattern (supports wildcard *)
func matchOrigin(pattern, origin string) bool {
	if pattern == "*" {
		return true
	}
	if !strings.Contains(pattern, "*") {
		return pattern == origin
	}

	// Simple wildcard matching for ports
	if strings.HasSuffix(pattern, ":*") {
		basePattern := strings.TrimSuffix(pattern, ":*")
		return strings.HasPrefix(origin, basePattern)
	}

	return pattern == origin
}

// SecurityHeadersMiddleware adds security headers
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		next.ServeHTTP(w, r)
	})
}

// Rate limiting
type RateLimiter struct {
	requests map[string][]time.Time
	mutex    sync.RWMutex
	limit    int
	window   time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

func (rl *RateLimiter) Allow(ip string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()

	// Get requests for this IP
	requests := rl.requests[ip]

	// Remove old requests outside the window
	var validRequests []time.Time
	for _, reqTime := range requests {
		if now.Sub(reqTime) <= rl.window {
			validRequests = append(validRequests, reqTime)
		}
	}

	// Check if limit exceeded
	if len(validRequests) >= rl.limit {
		rl.requests[ip] = validRequests
		return false
	}

	// Add current request
	validRequests = append(validRequests, now)
	rl.requests[ip] = validRequests

	return true
}

func (rl *RateLimiter) Cleanup() {
	ticker := time.NewTicker(rl.window)
	go func() {
		for range ticker.C {
			rl.mutex.Lock()
			now := time.Now()
			for ip, requests := range rl.requests {
				var validRequests []time.Time
				for _, reqTime := range requests {
					if now.Sub(reqTime) <= rl.window {
						validRequests = append(validRequests, reqTime)
					}
				}
				if len(validRequests) == 0 {
					delete(rl.requests, ip)
				} else {
					rl.requests[ip] = validRequests
				}
			}
			rl.mutex.Unlock()
		}
	}()
}

var defaultRateLimiter *RateLimiter

func init() {
	// Default: 100 requests per minute per IP
	limit, _ := strconv.Atoi(utils.GetEnv("RATE_LIMIT_REQUESTS", "100"))
	window, _ := time.ParseDuration(utils.GetEnv("RATE_LIMIT_WINDOW", "1m"))

	defaultRateLimiter = NewRateLimiter(limit, window)
	defaultRateLimiter.Cleanup()
}

// RateLimitMiddleware applies rate limiting
func RateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get client IP
		ip := getClientIP(r)

		// Check rate limit
		if !defaultRateLimiter.Allow(ip) {
			w.Header().Set("Retry-After", "60")
			utils.ResponseErrorStatus(w, nil, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// getClientIP extracts the real client IP from request
func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Use remote address
	ip := r.RemoteAddr
	if colon := strings.LastIndex(ip, ":"); colon != -1 {
		ip = ip[:colon]
	}

	return ip
}