# Turgus Marketplace - Local Development & Deployment
.PHONY: help install dev build test lint clean deploy stop logs db-setup db-migrate db-seed docker-build docker-up docker-down

# Default target
help: ## Show this help message
	@echo "Turgus Marketplace - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Installation
install: ## Install all dependencies
	@echo "Installing dependencies..."
	npm install
	npm run install:all

# Development
dev: ## Start development servers (frontend + backend)
	@echo "Starting development servers..."
	npm run dev

dev-frontend: ## Start only frontend development server
	@echo "Starting frontend development server..."
	npm run dev:frontend

dev-backend: ## Start only backend development server
	@echo "Starting backend development server..."
	npm run dev:backend

# Building
build: ## Build both frontend and backend for production
	@echo "Building application..."
	npm run build

build-frontend: ## Build only frontend
	@echo "Building frontend..."
	npm run build:frontend

build-backend: ## Build only backend
	@echo "Building backend..."
	npm run build:backend

# Testing
test: ## Run all tests
	@echo "Running tests..."
	npm run test

test-frontend: ## Run frontend tests
	@echo "Running frontend tests..."
	npm run test:frontend

test-backend: ## Run backend tests
	@echo "Running backend tests..."
	npm run test:backend

# Code Quality
lint: ## Run linting for all projects
	@echo "Running linters..."
	npm run lint

lint-fix: ## Fix linting issues
	@echo "Fixing linting issues..."
	npm run lint:fix

format: ## Format code with Prettier
	@echo "Formatting code..."
	npm run format

# Cleanup
clean: ## Clean build artifacts and node_modules
	@echo "Cleaning up..."
	rm -rf node_modules
	rm -rf frontend/node_modules frontend/dist
	rm -rf backend/node_modules backend/dist
	npm run clean

clean-docker: ## Clean Docker containers and images
	@echo "Cleaning Docker resources..."
	docker-compose down -v
	docker system prune -f

clean-ports: ## Check and display processes using application ports
	@echo "Checking ports 3000, 3001, 5432, 6379..."
	@ss -tulpn | grep -E ':(3000|3001|5432|6379)\s' || echo "No processes found on application ports"

# Database Operations
db-setup: ## Set up database with Docker
	@echo "Setting up database..."
	docker-compose up -d postgres redis
	@echo "Waiting for database to be ready..."
	@sleep 10
	@echo "Database is ready!"

db-migrate: ## Run database migrations
	@echo "Running database migrations..."
	@echo "Database migrations are handled automatically on backend startup"

db-seed: ## Seed database with initial data
	@echo "Seeding database..."
	@echo "Database seeding is handled automatically on backend startup"

db-reset: ## Reset database (drop and recreate)
	@echo "Resetting database..."
	docker-compose down -v
	docker-compose up -d postgres redis
	@sleep 10
	@echo "Database reset complete!"

# Docker Operations
docker-build: ## Build Docker images
	@echo "Building Docker images..."
	docker-compose build

docker-up: ## Start all services with Docker Compose
	@echo "Starting all services..."
	docker-compose up -d

docker-down: ## Stop all Docker services
	@echo "Stopping all services..."
	docker-compose down

docker-logs: ## Show Docker logs
	@echo "Showing Docker logs..."
	docker-compose logs -f

# Full Deployment Commands
deploy: clean-docker db-setup docker-build docker-up ## Full local deployment (clean + database + build + start)
	@echo ""
	@echo "Waiting for services to start..."
	@sleep 5
	@echo ""
	@echo "Turgus Marketplace deployed successfully!"
	@echo ""
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:3001"
	@echo "Database: localhost:5432"
	@echo "Redis:    localhost:6379"
	@echo ""
	@echo "Use 'make logs' to view application logs"
	@echo "Use 'make stop' to stop all services"

deploy-fresh: clean-docker db-reset ## Fresh deployment (clean + reset + build + start)
	@echo "Building fresh Docker images..."
	@docker-compose build --no-cache
	@echo "Starting services..."
	@docker-compose up -d
	@echo ""
	@echo "Waiting for services to start..."
	@sleep 10
	@echo ""
	@echo "Fresh deployment complete!"
	@echo ""
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:3001"
	@echo ""
	@echo "Use 'make logs' to view application logs"

deploy-dev: install db-setup ## Development deployment (install + database + dev servers)
	@echo ""
	@echo "Development environment ready!"
	@echo ""
	@echo "Run 'make dev' to start development servers"

stop: docker-down ## Stop all services
	@echo "All services stopped"

logs: ## Show application logs
	@echo "Application logs:"
	docker-compose logs -f app-frontend app-backend

# Status and Health Checks
status: ## Check status of all services
	@echo "Service Status:"
	@echo ""
	@echo "Docker Services:"
	@docker-compose ps
	@echo ""
	@echo "Port Usage:"
	@ss -tulpn | grep -E ':(3000|3001|5432|6379)\s' | awk '{print $$5}' | sort -u || echo "No ports in use"
	@echo ""
	@echo "Health Checks:"
	@curl -s http://localhost:3001/health | jq . || echo "Backend not responding"
	@timeout 2 bash -c 'cat < /dev/null > /dev/tcp/localhost/3000' && echo "Frontend: Port 3000 is open" || echo "Frontend: Port 3000 is not accessible"

health: ## Run health checks
	@echo "Running health checks..."
	@curl -s http://localhost:3001/health | jq . || echo "Backend health check failed"
	@echo "Health checks complete"

# Quick Commands
quick-start: ## Quick start for development (assumes dependencies installed)
	@echo "Quick starting development environment..."
	make db-setup
	make dev

restart: stop deploy ## Restart all services

# Environment Setup
env-setup: ## Set up environment files
	@echo "Setting up environment files..."
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "Created backend/.env from example"; \
	else \
		echo "backend/.env already exists"; \
	fi

# Development Utilities
watch-logs: ## Watch application logs in real-time
	@echo "Watching logs..."
	docker-compose logs -f

shell-backend: ## Open shell in backend container
	@echo "Opening backend shell..."
	docker-compose exec app-backend sh

shell-db: ## Open PostgreSQL shell
	@echo "Opening database shell..."
	docker-compose exec postgres psql -U turgus -d turgus_db
