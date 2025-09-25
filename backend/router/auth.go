package router

import (
	"encoding/json"
	"fmt"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"
)

type Auth struct{}

func (c *Auth) Login(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Login attempt started")
	var body schema.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		fmt.Printf("Failed to decode request body: %v\n", err)
		utils.ResponseError(w, err)
		return
	}
	fmt.Printf("Login request for user: %s\n", body.Username)

	// Authenticate user
	user, err := utils.DB.AuthenticateUser(body.Username, body.Password)
	if err != nil {
		fmt.Printf("Authentication failed: %v\n", err)
		utils.ResponseErrorStatus(w, err, 401)
		return
	}
	fmt.Println("User authenticated successfully")

	// Create session
	session, err := utils.DB.CreateSession(user.ID)
	if err != nil {
		fmt.Printf("Failed to create session: %v\n", err)
		utils.ResponseError(w, err)
		return
	}
	fmt.Println("Session created successfully")

	// Set session in cookie/session store
	utils.Session.Set(r, "user_id", user.ID)
	utils.Session.Set(r, "session_id", session.ID)
	utils.Session.Set(r, "authenticated", true)
	fmt.Println("Session data set")

	response := schema.LoginResponse{
		User:      *user,
		Token:     session.Token,
		ExpiresAt: session.ExpiresAt,
	}

	fmt.Println("Sending login response")
	utils.ResponseSuccess(w, response)
}

func (c *Auth) Logout(w http.ResponseWriter, r *http.Request) {
	// Get session ID from session store
	sessionID := utils.Session.Get(r, "session_id")
	if sessionID != nil {
		// Delete session from database
		utils.DB.DeleteSession(sessionID.(string))
	}

	utils.Session.Clear(r)
	utils.ResponseSuccess(w, map[string]bool{"success": true})
}

func (c *Auth) GetStatus(w http.ResponseWriter, r *http.Request) {
	fmt.Println("GetStatus: Checking authentication status")
	enabled := true // Authentication is always enabled now
	authenticated := false
	var user *schema.User

	authSession := utils.Session.Get(r, "authenticated")
	userID := utils.Session.Get(r, "user_id")

	fmt.Printf("GetStatus: authSession=%v, userID=%v\n", authSession, userID)

	if authSession != nil && authSession.(bool) && userID != nil {
		authenticated = true
		fmt.Println("GetStatus: User is authenticated")
		// Get user details
		if u, err := utils.DB.GetUser(userID.(string)); err == nil {
			user = u
			fmt.Printf("GetStatus: User found: %s\n", user.Username)
		} else {
			fmt.Printf("GetStatus: Failed to get user: %v\n", err)
		}
	} else {
		fmt.Println("GetStatus: User is not authenticated")
	}

	response := schema.AuthStatusResponse{
		Enabled:       enabled,
		Authenticated: authenticated,
		User:          user,
	}

	utils.ResponseSuccess(w, response)
}