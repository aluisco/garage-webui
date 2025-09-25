package router

import (
	"encoding/json"
	"khairul169/garage-webui/schema"
	"khairul169/garage-webui/utils"
	"net/http"
)

type Users struct{}

func (u *Users) GetAll(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !u.checkPermission(r, schema.PermissionReadUsers) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	users, err := utils.DB.ListUsers()
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, users)
}

func (u *Users) GetOne(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		utils.ResponseErrorStatus(w, nil, http.StatusBadRequest)
		return
	}

	// Check permissions
	if !u.checkPermission(r, schema.PermissionReadUsers) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	user, err := utils.DB.GetUser(userID)
	if err != nil {
		utils.ResponseErrorStatus(w, err, http.StatusNotFound)
		return
	}

	utils.ResponseSuccess(w, user)
}

func (u *Users) Create(w http.ResponseWriter, r *http.Request) {
	// Check permissions
	if !u.checkPermission(r, schema.PermissionWriteUsers) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	var req schema.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	// Validate request
	if req.Username == "" || req.Email == "" || req.Password == "" {
		utils.ResponseErrorStatus(w, nil, http.StatusBadRequest)
		return
	}

	user, err := utils.DB.CreateUser(&req)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, user)
}

func (u *Users) Update(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		utils.ResponseErrorStatus(w, nil, http.StatusBadRequest)
		return
	}

	// Check permissions
	if !u.checkPermission(r, schema.PermissionWriteUsers) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	var req schema.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ResponseError(w, err)
		return
	}

	user, err := utils.DB.UpdateUser(userID, &req)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, user)
}

func (u *Users) Delete(w http.ResponseWriter, r *http.Request) {
	userID := r.PathValue("id")
	if userID == "" {
		utils.ResponseErrorStatus(w, nil, http.StatusBadRequest)
		return
	}

	// Check permissions
	if !u.checkPermission(r, schema.PermissionDeleteUsers) {
		utils.ResponseErrorStatus(w, nil, http.StatusForbidden)
		return
	}

	// Prevent self-deletion
	currentUserID := utils.Session.Get(r, "user_id")
	if currentUserID != nil && currentUserID.(string) == userID {
		utils.ResponseErrorStatus(w, nil, http.StatusBadRequest)
		return
	}

	err := utils.DB.DeleteUser(userID)
	if err != nil {
		utils.ResponseError(w, err)
		return
	}

	utils.ResponseSuccess(w, map[string]bool{"success": true})
}

func (u *Users) checkPermission(r *http.Request, permission schema.Permission) bool {
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