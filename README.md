# Turgus Marketplace

Mobile-first bilingual marketplace platform built with React and Node.js.

## Project Structure

```
turgus-marketplace/
├── frontend/          # React TypeScript frontend with Vite
├── backend/           # Node.js TypeScript backend with Express
├── .kiro/            # Kiro specifications and configuration
└── package.json      # Root package.json for monorepo management
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose
- Make (for using Makefile commands)

### One-Command Deployment

Deploy the entire application locally with database:

```bash
make deploy
```

This will:
- Install all dependencies
- Set up PostgreSQL and Redis databases
- Build the application
- Start all services with Docker

### Development Setup

For development with hot-reload:

```bash
make deploy-dev  # Set up database and install dependencies
make dev         # Start development servers
```

### Manual Setup (Alternative)

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
# Copy example environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

3. Start development servers:
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:3001
```

## Makefile Commands

Run `make help` to see all available commands:

### Quick Commands
- `make deploy` - 🚀 Full local deployment (install + database + build + start)
- `make deploy-dev` - 🚀 Development deployment (install + database + dev servers)
- `make dev` - Start development servers (frontend + backend)
- `make stop` - Stop all services
- `make status` - Check status of all services
- `make logs` - Show application logs

### Database Commands
- `make db-setup` - Set up database with Docker
- `make db-reset` - Reset database (drop and recreate)
- `make db-migrate` - Run database migrations
- `make db-seed` - Seed database with initial data

### Development Commands
- `make install` - Install all dependencies
- `make build` - Build both frontend and backend
- `make test` - Run all tests
- `make lint` - Run linting for all projects
- `make clean` - Clean build artifacts and node_modules

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run test` - Run tests for both frontend and backend
- `npm run lint` - Lint both frontend and backend
- `npm run format` - Format all code with Prettier

### Frontend (React + Vite)
- `npm run dev --workspace=frontend` - Start development server
- `npm run build --workspace=frontend` - Build for production
- `npm run test --workspace=frontend` - Run tests
- `npm run lint --workspace=frontend` - Run ESLint

### Backend (Node.js + Express)
- `npm run dev --workspace=backend` - Start development server with hot reload
- `npm run build --workspace=backend` - Build TypeScript to JavaScript
- `npm run start --workspace=backend` - Start production server
- `npm run test --workspace=backend` - Run tests

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for state management and API caching
- **i18next** for internationalization (Portuguese/English)
- **Vitest** for testing

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **PostgreSQL** for database
- **Redis** for caching and sessions
- **JWT** for authentication
- **Multer + Sharp** for image upload and processing
- **Zod** for data validation
- **Vitest** for testing

## Services

When deployed, the following services will be available:

- **Frontend**: http://localhost:3000 - React application
- **Backend**: http://localhost:3001 - Express.js API
- **Database**: localhost:5432 - PostgreSQL database
- **Cache**: localhost:6379 - Redis cache
- **Admin Panel**: http://localhost:8080 - Database admin (optional)

## Features

- 📱 Mobile-first responsive design
- 🌍 Bilingual support (Portuguese/English)
- 📸 Photo-first product creation workflow
- 🛒 Instagram-like product browsing feed
- 👤 Seller and buyer user roles
- 📋 Want list functionality for buyers
- 🔐 JWT-based authentication
- 🖼️ Image upload and optimization
- 🎨 Modern UI with Tailwind CSS
- 🐳 Docker containerization for easy deployment

## Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write tests for critical functionality
- Follow mobile-first design principles
- Implement proper error handling
- Use semantic commit messages