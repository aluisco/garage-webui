package router

import (
	"khairul169/garage-webui/middleware"
	"net/http"
)

func HandleApiRouter() *http.ServeMux {
	mux := http.NewServeMux()

	auth := &Auth{}
	mux.HandleFunc("POST /auth/login", auth.Login)

	router := http.NewServeMux()
	router.HandleFunc("POST /auth/logout", auth.Logout)
	router.HandleFunc("GET /auth/status", auth.GetStatus)

	config := &Config{}
	router.HandleFunc("GET /config", config.GetAll)

	buckets := &Buckets{}
	router.HandleFunc("GET /buckets", buckets.GetAll)

	browse := &Browse{}
	router.HandleFunc("GET /browse/{bucket}", browse.GetObjects)
	router.HandleFunc("GET /browse/{bucket}/{key...}", browse.GetOneObject)
	router.HandleFunc("PUT /browse/{bucket}/{key...}", browse.PutObject)
	router.HandleFunc("DELETE /browse/{bucket}/{key...}", browse.DeleteObject)

	// User management routes
	users := &Users{}
	router.HandleFunc("GET /users", users.GetAll)
	router.HandleFunc("GET /users/{id}", users.GetOne)
	router.HandleFunc("POST /users", users.Create)
	router.HandleFunc("PUT /users/{id}", users.Update)
	router.HandleFunc("DELETE /users/{id}", users.Delete)

	// Tenant management routes
	tenants := &Tenants{}
	router.HandleFunc("GET /tenants", tenants.GetAll)
	router.HandleFunc("GET /tenants/{id}", tenants.GetOne)
	router.HandleFunc("POST /tenants", tenants.Create)
	router.HandleFunc("PUT /tenants/{id}", tenants.Update)
	router.HandleFunc("DELETE /tenants/{id}", tenants.Delete)
	router.HandleFunc("GET /tenants/{id}/stats", tenants.GetStats)

	// S3 Configuration routes
	s3config := &S3Config{}
	router.HandleFunc("GET /s3/config", s3config.GetConfig)
	router.HandleFunc("PUT /s3/config", s3config.UpdateConfig)
	router.HandleFunc("POST /s3/test", s3config.TestConnection)
	router.HandleFunc("GET /s3/status", s3config.GetStatus)

	// Proxy request to garage api endpoint
	router.HandleFunc("/", ProxyHandler)

	mux.Handle("/", middleware.AuthMiddleware(router))
	return mux
}
