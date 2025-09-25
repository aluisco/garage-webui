# Garage WebUI Development Makefile

# Variables
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
DOCKER_COMPOSE_PROD = docker-compose -f docker-compose.yml

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

.PHONY: help dev dev-docker dev-frontend dev-backend dev-fullstack build clean test lint install

# Default target
help: ## Show this help message
	@echo "${BLUE}Garage WebUI Development Commands${NC}"
	@echo ""
	@echo "Usage: make [command]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "${GREEN}%-20s${NC} %s\n", $$1, $$2}'

# Development Commands
dev: ## Start local development (requires local Garage)
	@echo "${BLUE}Starting local development...${NC}"
	pnpm run dev

dev-docker: ## Start Docker development environment
	@echo "${BLUE}Starting Docker development environment...${NC}"
	$(DOCKER_COMPOSE_DEV) up --build

dev-logs: ## Show development logs
	@echo "${BLUE}Showing development logs...${NC}"
	$(DOCKER_COMPOSE_DEV) logs -f

dev-stop: ## Stop development environment
	@echo "${YELLOW}Stopping development environment...${NC}"
	$(DOCKER_COMPOSE_DEV) down

dev-clean: ## Clean development environment and volumes
	@echo "${RED}Cleaning development environment...${NC}"
	$(DOCKER_COMPOSE_DEV) down -v
	docker system prune -f

# Build Commands
build: ## Build for production
	@echo "${BLUE}Building for production...${NC}"
	pnpm run build

build-dev: ## Build for development
	@echo "${BLUE}Building for development...${NC}"
	pnpm run build:dev

build-backend: ## Build backend only
	@echo "${BLUE}Building backend...${NC}"
	cd backend && go build -o main .

build-docker: ## Build production Docker images
	@echo "${BLUE}Building production Docker images...${NC}"
	$(DOCKER_COMPOSE_PROD) build

# Install Commands
install: ## Install all dependencies
	@echo "${BLUE}Installing dependencies...${NC}"
	pnpm install
	$(MAKE) install-backend

install-backend: ## Install Go dependencies
	@echo "${BLUE}Installing Go dependencies...${NC}"
	cd backend && go mod download

# Test Commands
test: ## Run all tests
	@echo "${BLUE}Running tests...${NC}"
	$(MAKE) test-backend
	$(MAKE) type-check

test-backend: ## Run Go tests
	@echo "${BLUE}Running Go tests...${NC}"
	cd backend && go test ./...

test-frontend: ## Run frontend tests (if they exist)
	@echo "${BLUE}Running frontend tests...${NC}"
	pnpm test

type-check: ## Check TypeScript types
	@echo "${BLUE}Checking TypeScript types...${NC}"
	pnpm run type-check

# Lint Commands
lint: ## Run linters
	@echo "${BLUE}Running linters...${NC}"
	pnpm run lint
	$(MAKE) lint-backend

lint-fix: ## Fix linting issues automatically
	@echo "${BLUE}Fixing linting issues...${NC}"
	pnpm run lint:fix

lint-backend: ## Lint Go code
	@echo "${BLUE}Linting Go code...${NC}"
	cd backend && go fmt ./...
	cd backend && go vet ./...

# Clean Commands
clean: ## Clean build artifacts and cache
	@echo "${YELLOW}Cleaning build artifacts...${NC}"
	rm -rf dist
	rm -rf node_modules/.vite
	rm -rf backend/tmp
	rm -rf backend/main

clean-all: ## Clean everything including node_modules
	@echo "${RED}Cleaning everything...${NC}"
	$(MAKE) clean
	rm -rf node_modules
	cd backend && go clean -cache -modcache -i -r

# Database Commands
db-backup: ## Backup development database
	@echo "${BLUE}Backing up development database...${NC}"
	mkdir -p dev-data/backups
	$(DOCKER_COMPOSE_DEV) exec webui-backend cp /app/data/database.json /data/backups/database-backup-$$(date +%Y%m%d-%H%M%S).json
	@echo "${GREEN}Database backup created in dev-data/backups/${NC}"

db-restore: ## Restore development database from backup (specify BACKUP_FILE)
	@echo "${BLUE}Restoring development database...${NC}"
	@if [ -z "$(BACKUP_FILE)" ]; then echo "${RED}Please specify BACKUP_FILE. Example: make db-restore BACKUP_FILE=database-backup-20231201-120000.json${NC}"; exit 1; fi
	$(DOCKER_COMPOSE_DEV) exec webui-backend cp /data/backups/$(BACKUP_FILE) /app/data/database.json
	@echo "${GREEN}Database restored from $(BACKUP_FILE)${NC}"

db-reset: ## Reset development database (creates fresh admin user)
	@echo "${YELLOW}Resetting development database...${NC}"
	$(DOCKER_COMPOSE_DEV) exec webui-backend rm -f /app/data/database.json
	$(DOCKER_COMPOSE_DEV) restart webui-backend
	@echo "${GREEN}Database reset. Default admin user created (admin/admin)${NC}"

# Debug Commands
debug-frontend: ## Access frontend container shell
	@echo "${BLUE}Accessing frontend container...${NC}"
	$(DOCKER_COMPOSE_DEV) exec webui-frontend sh

debug-backend: ## Access backend container shell
	@echo "${BLUE}Accessing backend container...${NC}"
	$(DOCKER_COMPOSE_DEV) exec webui-backend sh

debug-garage: ## Access garage container shell
	@echo "${BLUE}Accessing garage container...${NC}"
	$(DOCKER_COMPOSE_DEV) exec garage sh

debug-logs-frontend: ## Show frontend logs only
	$(DOCKER_COMPOSE_DEV) logs -f webui-frontend

debug-logs-backend: ## Show backend logs only
	$(DOCKER_COMPOSE_DEV) logs -f webui-backend

debug-logs-garage: ## Show garage logs only
	$(DOCKER_COMPOSE_DEV) logs -f garage

# Status Commands
status: ## Show development environment status
	@echo "${BLUE}Development environment status:${NC}"
	$(DOCKER_COMPOSE_DEV) ps

health: ## Check health of all services
	@echo "${BLUE}Checking service health...${NC}"
	@echo "Frontend: http://localhost:5173"
	@curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:5173 || echo "Frontend: ${RED}DOWN${NC}"
	@curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:3909/api/auth/status || echo "Backend: ${RED}DOWN${NC}"
	@curl -s -o /dev/null -w "Garage: %{http_code}\n" http://localhost:3903/status || echo "Garage: ${RED}DOWN${NC}"

# Production Commands
prod-build: ## Build production images
	@echo "${BLUE}Building production images...${NC}"
	$(DOCKER_COMPOSE_PROD) build

prod-up: ## Start production environment
	@echo "${BLUE}Starting production environment...${NC}"
	$(DOCKER_COMPOSE_PROD) up -d

prod-down: ## Stop production environment
	@echo "${YELLOW}Stopping production environment...${NC}"
	$(DOCKER_COMPOSE_PROD) down

prod-logs: ## Show production logs
	$(DOCKER_COMPOSE_PROD) logs -f

# Utility Commands
ports: ## Show all used ports
	@echo "${BLUE}Development ports:${NC}"
	@echo "Frontend (Vite):     http://localhost:5173"
	@echo "Backend (API):       http://localhost:3909"
	@echo "Garage (S3):         http://localhost:3900"
	@echo "Garage (Admin):      http://localhost:3903"
	@echo "Garage (RPC):        http://localhost:3901"
	@echo "Garage (Web):        http://localhost:3902"
	@echo ""
	@echo "${BLUE}Fullstack alternative ports:${NC}"
	@echo "Frontend:            http://localhost:5174"
	@echo "Backend:             http://localhost:3910"

urls: ## Show all useful URLs
	@echo "${BLUE}Development URLs:${NC}"
	@echo "WebUI:               http://localhost:5173"
	@echo "Admin Dashboard:     http://localhost:5173/admin"
	@echo "Login:               http://localhost:5173/auth/login"
	@echo "API Status:          http://localhost:3909/api/auth/status"
	@echo "Garage Status:       http://localhost:3903/status"

# First time setup
setup: ## First time setup (install deps + start dev environment)
	@echo "${GREEN}Setting up Garage WebUI development environment...${NC}"
	$(MAKE) install
	@echo "${YELLOW}Creating garage.toml if it doesn't exist...${NC}"
	@if [ ! -f garage.toml ]; then \
		echo "Creating garage.toml from template..."; \
		cp garage.toml.example garage.toml 2>/dev/null || echo "Please create garage.toml manually"; \
	fi
	@echo "${GREEN}Setup complete! Run 'make dev-docker' to start development.${NC}"

# Quick commands for daily development
quick-start: dev-docker ## Quick start development environment
quick-stop: dev-stop ## Quick stop development environment
quick-restart: ## Quick restart development environment
	$(MAKE) dev-stop
	$(MAKE) dev-docker

# Git hooks (optional)
install-hooks: ## Install git pre-commit hooks
	@echo "${BLUE}Installing git hooks...${NC}"
	@echo '#!/bin/sh\nmake lint && make type-check' > .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "${GREEN}Pre-commit hooks installed${NC}"