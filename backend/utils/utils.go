package utils

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
)

var envMutex sync.RWMutex

func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return defaultValue
	}
	return value
}

// SetEnv sets an environment variable (thread-safe)
func SetEnv(key, value string) error {
	envMutex.Lock()
	defer envMutex.Unlock()
	return os.Setenv(key, value)
}

// GetAllEnv returns all environment variables as a map
func GetAllEnv() map[string]string {
	envMutex.RLock()
	defer envMutex.RUnlock()

	result := make(map[string]string)
	for _, env := range os.Environ() {
		parts := strings.SplitN(env, "=", 2)
		if len(parts) == 2 {
			result[parts[0]] = parts[1]
		}
	}
	return result
}

func LastString(str []string) string {
	return str[len(str)-1]
}

func ResponseError(w http.ResponseWriter, err error) {
	ResponseErrorStatus(w, err, http.StatusInternalServerError)
}

func ResponseErrorStatus(w http.ResponseWriter, err error, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("X-XSS-Protection", "1; mode=block")
	w.WriteHeader(status)

	message := "Internal server error"
	if err != nil {
		message = err.Error()
	}

	response := map[string]interface{}{
		"success": false,
		"message": message,
	}

	// Add error details for development (remove in production)
	if status >= 500 && err != nil {
		log.Printf("Server error: %v", err)
	}

	json.NewEncoder(w).Encode(response)
}

func ResponseSuccess(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("X-XSS-Protection", "1; mode=block")
	w.WriteHeader(http.StatusOK)

	response := map[string]interface{}{
		"success": true,
		"data":    data,
	}

	json.NewEncoder(w).Encode(response)
}
