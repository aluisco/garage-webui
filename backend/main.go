package main

import (
	"fmt"
	"khairul169/garage-webui/middleware"
	"khairul169/garage-webui/router"
	"khairul169/garage-webui/ui"
	"khairul169/garage-webui/utils"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// Initialize app
	godotenv.Load()
	utils.InitCacheManager()
	sessionMgr := utils.InitSessionManager()

	// Initialize database
	if err := utils.InitDatabase(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	if err := utils.Garage.LoadConfig(); err != nil {
		log.Println("Cannot load garage config!", err)
	}

	basePath := os.Getenv("BASE_PATH")
	mux := http.NewServeMux()

	// Serve API
	apiPrefix := basePath + "/api"
	apiHandler := http.StripPrefix(apiPrefix, router.HandleApiRouter())
	mux.Handle(apiPrefix+"/", apiHandler)

	// Static files
	ui.ServeUI(mux)

	// Redirect to UI if BASE_PATH is set
	if basePath != "" {
		mux.Handle("/", http.RedirectHandler(basePath, http.StatusMovedPermanently))
	}

	// Apply security middleware
	handler := sessionMgr.LoadAndSave(mux)
	handler = middleware.CORSMiddleware(handler)
	handler = middleware.SecurityHeadersMiddleware(handler)
	handler = middleware.RateLimitMiddleware(handler)

	host := utils.GetEnv("HOST", "0.0.0.0")
	port := utils.GetEnv("PORT", "3909")

	addr := fmt.Sprintf("%s:%s", host, port)
	log.Printf("Starting secure server on http://%s", addr)
	log.Printf("Authentication: enabled")
	log.Printf("Rate limiting: %s requests per %s",
		utils.GetEnv("RATE_LIMIT_REQUESTS", "100"),
		utils.GetEnv("RATE_LIMIT_WINDOW", "1m"))

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}
