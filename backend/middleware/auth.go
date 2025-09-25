package middleware

import (
	"errors"
	"khairul169/garage-webui/utils"
	"net/http"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := utils.Session.Get(r, "authenticated")
		userID := utils.Session.Get(r, "user_id")

		// Check if user is authenticated
		if auth == nil || !auth.(bool) || userID == nil {
			utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
			return
		}

		// Verify user still exists and is enabled
		user, err := utils.DB.GetUser(userID.(string))
		if err != nil || !user.Enabled {
			// Clear invalid session
			utils.Session.Clear(r)
			utils.ResponseErrorStatus(w, errors.New("unauthorized"), http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
