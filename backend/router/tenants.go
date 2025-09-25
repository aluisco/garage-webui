package router

import (
	"encoding/json"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"
)

type Tenants struct{}

func (t *Tenants) GetAll(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !t.checkPermission(r, schema.PermissionReadTenants) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	tenants, err := utils.DB.ListTenants()
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, tenants)
}

func (t *Tenants) GetOne(w http.ResponseWriter, r *http.Request) {
	tenantID := r.PathValue("id")
	if tenantID == "" {
		utils.ResponseErrorStatus(w, nil, http.StatusBadRequest)
		return
	}

	// Check permissions
	if !t.checkPermission(r, schema.PermissionReadTenants) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	tenant, err := utils.DB.GetTenant(tenantID)
	if err != nil {
		utils.ResponseErrorStatus(w, err, http.StatusNotFound)
		return
	}

	utils.ResponseSuccess(w, tenant)
}

func (t *Tenants) Create(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !t.checkPermission(r, schema.PermissionWriteTenants) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	var req schema.CreateTenantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Validate request
	if req.Name == "" {
		utils.ResponseErrorStatus(w, nil, http.StatusBadRequest)
		return
	}

	tenant, err := utils.DB.CreateTenant(&req)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, tenant)
}

func (t *Tenants) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := r.PathValue("id")
	if tenantID == "" {
		utils.ResponseErrorStatus(w, nil, http.StatusBadRequest)
		return
	}

	// Check permissions
	if !t.checkPermission(r, schema.PermissionWriteTenants) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	var req schema.UpdateTenantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	tenant, err := utils.DB.UpdateTenant(tenantID, &req)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, tenant)
}

func (t *Tenants) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := r.PathValue("id")
	if tenantID == "" {
		utils.ResponseErrorStatus(w, nil, http.StatusBadRequest)
		return
	}

	// Check permissions
	if !t.checkPermission(r, schema.PermissionDeleteTenants) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	err := utils.DB.DeleteTenant(tenantID)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, map[string]bool{"success": true})
}

func (t *Tenants) GetStats(w http.ResponseWriter, r *http.Request) {
	tenantID := r.PathValue("id")
	if tenantID == "" {
		utils.ResponseErrorStatus(w, nil, http.StatusBadRequest)
		return
	}

	// Check permissions
	if !t.checkPermission(r, schema.PermissionReadTenants) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	// Get tenant
	tenant, err := utils.DB.GetTenant(tenantID)
	if err != nil {
		utils.ResponseErrorStatus(w, err, http.StatusNotFound)
		return
	}

	// Get stats from Garage API
	// This would need to be implemented to get actual usage statistics
	// For now, return basic info
	stats := map[string]interface{}{
		"tenant":      tenant,
		"bucket_count": 0,
		"key_count":   0,
		"total_size":  0,
		"user_count":  t.getUserCountForTenant(tenantID),
	}

	utils.ResponseSuccess(w, stats)
}

func (t *Tenants) checkPermission(r *http.Request, permission schema.Permission) bool {
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

func (t *Tenants) getUserCountForTenant(tenantID string) int {
	users, err := utils.DB.ListUsers()
	if err != nil {
		return 0
	}

	count := 0
	for _, user := range users {
		if user.TenantID != nil && *user.TenantID == tenantID {
			count++
		}
	}

	return count
}