package utils

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"khairul169/garage-webui/schema"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type Database struct {
	Users    map[string]*schema.User    `json:"users"`
	Tenants  map[string]*schema.Tenant  `json:"tenants"`
	Sessions map[string]*schema.Session `json:"sessions"`
	mutex    sync.RWMutex
}

var DB = &Database{
	Users:    make(map[string]*schema.User),
	Tenants:  make(map[string]*schema.Tenant),
	Sessions: make(map[string]*schema.Session),
}

func InitDatabase() error {
	// Create data directory if it doesn't exist
	dataDir := GetEnv("DATA_DIR", "./data")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %w", err)
	}

	// Load existing data
	if err := DB.Load(); err != nil {
		return fmt.Errorf("failed to load database: %w", err)
	}

	// Create default admin user if no users exist
	if len(DB.Users) == 0 {
		if err := DB.CreateDefaultAdmin(); err != nil {
			return fmt.Errorf("failed to create default admin: %w", err)
		}
	}

	return nil
}

func (db *Database) Load() error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	dataPath := filepath.Join(GetEnv("DATA_DIR", "./data"), "database.json")

	// If file doesn't exist, start with empty database
	if _, err := os.Stat(dataPath); os.IsNotExist(err) {
		return nil
	}

	data, err := os.ReadFile(dataPath)
	if err != nil {
		return err
	}

	return json.Unmarshal(data, db)
}

func (db *Database) Save() error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	dataPath := filepath.Join(GetEnv("DATA_DIR", "./data"), "database.json")

	data, err := json.MarshalIndent(db, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(dataPath, data, 0600)
}

// saveUnsafe saves without acquiring locks (for use when lock is already held)
func (db *Database) saveUnsafe() error {
	dataPath := filepath.Join(GetEnv("DATA_DIR", "./data"), "database.json")

	data, err := json.MarshalIndent(db, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(dataPath, data, 0600)
}

func (db *Database) CreateDefaultAdmin() error {
	// Check if we should create from environment variables (legacy support)
	userPass := strings.Split(GetEnv("AUTH_USER_PASS", ""), ":")
	if len(userPass) >= 2 {
		return db.createUserFromEnv(userPass[0], userPass[1])
	}

	// Create default admin user
	defaultPassword := "admin"
	fmt.Printf("Creating default admin user with password: %s\n", defaultPassword)
	fmt.Println("IMPORTANT: Change this password after first login!")

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	admin := &schema.User{
		ID:           GenerateID(),
		Username:     "admin",
		Email:        "admin@localhost",
		PasswordHash: string(hashedPassword),
		Role:         schema.RoleAdmin,
		Enabled:      true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	db.Users[admin.ID] = admin
	return db.Save()
}

func (db *Database) createUserFromEnv(username, passwordHash string) error {
	admin := &schema.User{
		ID:           GenerateID(),
		Username:     username,
		Email:        username + "@localhost",
		PasswordHash: passwordHash,
		Role:         schema.RoleAdmin,
		Enabled:      true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	db.Users[admin.ID] = admin
	return db.Save()
}

// User operations
func (db *Database) CreateUser(req *schema.CreateUserRequest) (*schema.User, error) {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	// Check if username already exists
	for _, user := range db.Users {
		if user.Username == req.Username {
			return nil, errors.New("username already exists")
		}
		if user.Email == req.Email {
			return nil, errors.New("email already exists")
		}
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &schema.User{
		ID:           GenerateID(),
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         req.Role,
		TenantID:     req.TenantID,
		Enabled:      req.Enabled,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	db.Users[user.ID] = user

	if err := db.saveUnsafe(); err != nil {
		return nil, err
	}

	return user, nil
}

func (db *Database) GetUser(id string) (*schema.User, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	user, exists := db.Users[id]
	if !exists {
		return nil, errors.New("user not found")
	}

	return user, nil
}

func (db *Database) GetUserByUsername(username string) (*schema.User, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	for _, user := range db.Users {
		if user.Username == username {
			return user, nil
		}
	}

	return nil, errors.New("user not found")
}

func (db *Database) UpdateUser(id string, req *schema.UpdateUserRequest) (*schema.User, error) {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	user, exists := db.Users[id]
	if !exists {
		return nil, errors.New("user not found")
	}

	if req.Username != nil {
		user.Username = *req.Username
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Password != nil {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.PasswordHash = string(hashedPassword)
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.TenantID != nil {
		user.TenantID = req.TenantID
	}
	if req.Enabled != nil {
		user.Enabled = *req.Enabled
	}

	user.UpdatedAt = time.Now()

	if err := db.saveUnsafe(); err != nil {
		return nil, err
	}

	return user, nil
}

func (db *Database) DeleteUser(id string) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	if _, exists := db.Users[id]; !exists {
		return errors.New("user not found")
	}

	delete(db.Users, id)
	return db.saveUnsafe()
}

func (db *Database) ListUsers() ([]*schema.User, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	users := make([]*schema.User, 0, len(db.Users))
	for _, user := range db.Users {
		users = append(users, user)
	}

	return users, nil
}

// Tenant operations
func (db *Database) CreateTenant(req *schema.CreateTenantRequest) (*schema.Tenant, error) {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	// Check if name already exists
	for _, tenant := range db.Tenants {
		if tenant.Name == req.Name {
			return nil, errors.New("tenant name already exists")
		}
	}

	tenant := &schema.Tenant{
		ID:          GenerateID(),
		Name:        req.Name,
		Description: req.Description,
		Enabled:     req.Enabled,
		MaxBuckets:  req.MaxBuckets,
		MaxKeys:     req.MaxKeys,
		QuotaBytes:  req.QuotaBytes,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	db.Tenants[tenant.ID] = tenant

	if err := db.saveUnsafe(); err != nil {
		return nil, err
	}

	return tenant, nil
}

func (db *Database) GetTenant(id string) (*schema.Tenant, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	tenant, exists := db.Tenants[id]
	if !exists {
		return nil, errors.New("tenant not found")
	}

	return tenant, nil
}

func (db *Database) UpdateTenant(id string, req *schema.UpdateTenantRequest) (*schema.Tenant, error) {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	tenant, exists := db.Tenants[id]
	if !exists {
		return nil, errors.New("tenant not found")
	}

	if req.Name != nil {
		tenant.Name = *req.Name
	}
	if req.Description != nil {
		tenant.Description = *req.Description
	}
	if req.Enabled != nil {
		tenant.Enabled = *req.Enabled
	}
	if req.MaxBuckets != nil {
		tenant.MaxBuckets = *req.MaxBuckets
	}
	if req.MaxKeys != nil {
		tenant.MaxKeys = *req.MaxKeys
	}
	if req.QuotaBytes != nil {
		tenant.QuotaBytes = req.QuotaBytes
	}

	tenant.UpdatedAt = time.Now()

	if err := db.saveUnsafe(); err != nil {
		return nil, err
	}

	return tenant, nil
}

func (db *Database) DeleteTenant(id string) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	if _, exists := db.Tenants[id]; !exists {
		return errors.New("tenant not found")
	}

	delete(db.Tenants, id)
	return db.saveUnsafe()
}

func (db *Database) ListTenants() ([]*schema.Tenant, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	tenants := make([]*schema.Tenant, 0, len(db.Tenants))
	for _, tenant := range db.Tenants {
		tenants = append(tenants, tenant)
	}

	return tenants, nil
}

// Session operations
func (db *Database) CreateSession(userID string) (*schema.Session, error) {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	token, err := GenerateToken()
	if err != nil {
		return nil, err
	}

	session := &schema.Session{
		ID:        GenerateID(),
		UserID:    userID,
		Token:     token,
		ExpiresAt: time.Now().Add(24 * time.Hour), // 24 hours expiry
		CreatedAt: time.Now(),
	}

	db.Sessions[session.ID] = session

	if err := db.saveUnsafe(); err != nil {
		return nil, err
	}

	return session, nil
}

func (db *Database) GetSessionByToken(token string) (*schema.Session, error) {
	db.mutex.RLock()
	defer db.mutex.RUnlock()

	for _, session := range db.Sessions {
		if session.Token == token {
			if time.Now().After(session.ExpiresAt) {
				return nil, errors.New("session expired")
			}
			return session, nil
		}
	}

	return nil, errors.New("session not found")
}

func (db *Database) DeleteSession(id string) error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	delete(db.Sessions, id)
	return db.saveUnsafe()
}

func (db *Database) CleanupExpiredSessions() error {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	now := time.Now()
	for id, session := range db.Sessions {
		if now.After(session.ExpiresAt) {
			delete(db.Sessions, id)
		}
	}

	return db.saveUnsafe()
}

// Utility functions
func GenerateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func GenerateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// AuthenticateUser validates credentials and returns user
func (db *Database) AuthenticateUser(username, password string) (*schema.User, error) {
	user, err := db.GetUserByUsername(username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !user.Enabled {
		return nil, errors.New("user account is disabled")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Update last login
	user.LastLogin = &[]time.Time{time.Now()}[0]
	// Note: last login time will be saved when session is created

	return user, nil
}
