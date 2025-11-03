# Turgus Marketplace - Local Development & Deployment
.PHONY: help install dev build test lint clean deploy stop logs db-setup db-migrate db-seed docker-build docker-up docker-down

# Default target
help: ## Show this help message
	@echo "Turgus Marketplace - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Installation
install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	npm install
	npm run install:all

# Development
dev: ## Start development servers (frontend + backend)
	@echo "🚀 Starting development servers..."
	npm run dev

dev-frontend: ## Start only frontend development server
	@echo "🎨 Starting frontend development server..."
	npm run dev:frontend

dev-backend: ## Start only backend development server
	@echo "⚙️  Starting backend development server..."
	npm run dev:backend

# Building
build: ## Build both frontend and backend for production
	@echo "🔨 Building application..."
	npm run build

build-frontend: ## Build only frontend
	@echo "🎨 Building frontend..."
	npm run build:frontend

build-backend: ## Build only backend
	@echo "⚙️  Building backend..."
	npm run build:backend

# Testing
test: ## Run all tests
	@echo "🧪 Running tests..."
	npm run test

test-frontend: ## Run frontend tests
	@echo "🎨 Running frontend tests..."
	npm run test:frontend

test-backend: ## Run backend tests
	@echo "⚙️  Running backend tests..."
	npm run test:backend

# Code Quality
lint: ## Run linting for all projects
	@echo "🔍 Running linters..."
	npm run lint

lint-fix: ## Fix linting issues
	@echo "🔧 Fixing linting issues..."
	npm run lint:fix

format: ## Format code with Prettier
	@echo "💅 Formatting code..."
	npm run format

# Cleanup
clean: ## Clean build artifacts and node_modules
	@echo "🧹 Cleaning up..."
	rm -rf node_modules
	rm -rf frontend/node_modules frontend/dist
	rm -rf backend/node_modules backend/dist
	npm run clean

# Database Operations
db-setup: ## Set up database with Docker
	@echo "🗄️  Setting up database..."
	docker-compose up -d postgres redis
	@echo "⏳ Waiting for database to be ready..."
	sleep 10
	@echo "✅ Database is ready!"

db-migrate: ## Run database migrations (placeholder)
	@echo "🔄 Running database migrations..."
	@echo "⚠️  Database migrations not implemented yet"

db-seed: ## Seed database with initial data (placeholder)
	@echo "🌱 Seeding database..."
	@echo "⚠️  Database seeding not implemented yet"

db-reset: ## Reset database (drop and recreate)
	@echo "🔄 Resetting database..."
	docker-compose down -v
	docker-compose up -d postgres redis
	sleep 10
	@echo "✅ Database reset complete!"

# Docker Operations
docker-build: ## Build Docker images
	@echo "🐳 Building Docker images..."
	docker-compose build

docker-up: ## Start all services with Docker Compose
	@echo "🐳 Starting all services..."
	docker-compose up -d

docker-down: ## Stop all Docker services
	@echo "🐳 Stopping all services..."
	docker-compose down

docker-logs: ## Show Docker logs
	@echo "📋 Showing Docker logs..."
	docker-compose logs -f

# Full Deployment Commands
deploy: install db-setup build docker-up ## 🚀 Full local deployment (install + database + build + start)
	@echo ""
	@echo "🎉 Turgus Marketplace deployed successfully!"
	@echo ""
	@echo "📱 Frontend: http://localhost:3000"
	@echo "⚙️  Backend:  http://localhost:3001"
	@echo "🗄️  Database: localhost:5432"
	@echo "🔴 Redis:    localhost:6379"
	@echo ""
	@echo "Use 'make logs' to view application logs"
	@echo "Use 'make stop' to stop all services"

deploy-dev: install db-setup ## 🚀 Development deployment (install + database + dev servers)
	@echo ""
	@echo "🎉 Development environment ready!"
	@echo ""
	@echo "Run 'make dev' to start development servers"

stop: docker-down ## Stop all services
	@echo "🛑 All services stopped"

logs: ## Show application logs
	@echo "📋 Application logs:"
	docker-compose logs -f app-frontend app-backend

# Status and Health Checks
status: ## Check status of all services
	@echo "📊 Service Status:"
	@echo ""
	@echo "Docker Services:"
	@docker-compose ps
	@echo ""
	@echo "Health Checks:"
	@curl -s http://localhost:3001/health | jq . || echo "❌ Backend not responding"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend responding" || echo "❌ Frontend not responding"

health: ## Run health checks
	@echo "🏥 Running health checks..."
	@curl -s http://localhost:3001/health | jq . || echo "❌ Backend health check failed"
	@echo "✅ Health checks complete"

# Quick Commands
quick-start: ## Quick start for development (assumes dependencies installed)
	@echo "⚡ Quick starting development environment..."
	make db-setup
	make dev

restart: stop deploy ## Restart all services

# Environment Setup
env-setup: ## Set up environment files
	@echo "⚙️  Setting up environment files..."
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "✅ Created backend/.env from example"; \
	else \
		echo "ℹ️  backend/.env already exists"; \
	fi

# Development Utilities
watch-logs: ## Watch application logs in real-time
	@echo "👀 Watching logs..."
	docker-compose logs -f

shell-backend: ## Open shell in backend container
	@echo "🐚 Opening backend shell..."
	docker-compose exec app-backend sh

shell-db: ## Open PostgreSQL shell
	@echo "🗄️  Opening database shell..."
	docker-compose exec postgres psql -U turgus -d turgus_db