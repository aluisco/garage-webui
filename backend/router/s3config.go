package router

import (
	"encoding/json"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"
)

type S3Config struct{}

// S3ConfigResponse represents S3 configuration response
type S3ConfigResponse struct {
	Region      string `json:"region"`
	Endpoint    string `json:"endpoint"`
	AdminAPI    string `json:"admin_api"`
	AdminToken  string `json:"admin_token,omitempty"`
	WebEndpoint string `json:"web_endpoint,omitempty"`
}

// UpdateS3ConfigRequest represents S3 config update request
type UpdateS3ConfigRequest struct {
	Region      *string `json:"region,omitempty"`
	Endpoint    *string `json:"endpoint,omitempty"`
	AdminAPI    *string `json:"admin_api,omitempty"`
	AdminToken  *string `json:"admin_token,omitempty"`
	WebEndpoint *string `json:"web_endpoint,omitempty"`
}

func (s *S3Config) GetConfig(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !s.checkPermission(r, schema.PermissionSystemAdmin) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	response := S3ConfigResponse{
		Region:      utils.Garage.GetS3Region(),
		Endpoint:    utils.Garage.GetS3Endpoint(),
		AdminAPI:    utils.Garage.GetAdminEndpoint(),
		WebEndpoint: utils.Garage.GetWebEndpoint(),
		// Don't send admin token for security
	}

	utils.ResponseSuccess(w, response)
}

func (s *S3Config) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !s.checkPermission(r, schema.PermissionSystemAdmin) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	var req UpdateS3ConfigRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Update configuration values
	if req.Region != nil {
		utils.SetEnv("S3_REGION", *req.Region)
	}
	if req.Endpoint != nil {
		utils.SetEnv("S3_ENDPOINT_URL", *req.Endpoint)
	}
	if req.AdminAPI != nil {
		utils.SetEnv("API_BASE_URL", *req.AdminAPI)
	}
	if req.AdminToken != nil {
		utils.SetEnv("API_ADMIN_KEY", *req.AdminToken)
	}

	// Reload garage configuration
	if err := utils.Garage.LoadConfig(); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Return updated config
	response := S3ConfigResponse{
		Region:      utils.Garage.GetS3Region(),
		Endpoint:    utils.Garage.GetS3Endpoint(),
		AdminAPI:    utils.Garage.GetAdminEndpoint(),
		WebEndpoint: utils.Garage.GetWebEndpoint(),
	}

	utils.ResponseSuccess(w, response)
}

func (s *S3Config) TestConnection(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !s.checkPermission(r, schema.PermissionSystemAdmin) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	// Test Garage API connection
	_, err := utils.Garage.Fetch("/status", &utils.FetchOptions{
		Method: "GET",
	})

	if err != nil {
		utils.ResponseErrorStatus(w, err, http.StatusServiceUnavailable)
		return
	}

	utils.ResponseSuccess(w, map[string]interface{}{
		"status":  "connected",
		"message": "Connection to Garage API successful",
	})
}

func (s *S3Config) GetStatus(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !s.checkPermission(r, schema.PermissionReadCluster) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	// Get status from Garage API
	data, err := utils.Garage.Fetch("/status", &utils.FetchOptions{
		Method: "GET",
	})

	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Parse response
	var status map[string]interface{}
	if err := json.Unmarshal(data, &status); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Add our own status info
	response := map[string]interface{}{
		"garage":          status,
		"webui_version":   "1.1.0",
		"authentication":  true,
		"users_count":     len(utils.DB.Users),
		"tenants_count":   len(utils.DB.Tenants),
		"sessions_count":  len(utils.DB.Sessions),
	}

	utils.ResponseSuccess(w, response)
}

func (s *S3Config) checkPermission(r *http.Request, permission schema.Permission) bool {
	userID := utils.Session.Get(r, "user_id")
	if userID == nil {
		return false
	}

	user, err := utils.DB.GetUser(userID.(string))
	if err != nil {
		return false
	}

	return user.HasPermission(permission)
}