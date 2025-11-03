#!/bin/bash

# Wait for services to be ready
echo "🔄 Waiting for services to be ready..."

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U turgus -d turgus_db; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis
echo "⏳ Waiting for Redis..."
until docker-compose exec -T redis redis-cli ping; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Wait for Backend
echo "⏳ Waiting for Backend API..."
until curl -f http://localhost:3001/health; do
  echo "Backend API is unavailable - sleeping"
  sleep 2
done
echo "✅ Backend API is ready!"

# Wait for Frontend
echo "⏳ Waiting for Frontend..."
until curl -f http://localhost:3000; do
  echo "Frontend is unavailable - sleeping"
  sleep 2
done
echo "✅ Frontend is ready!"

echo ""
echo "🎉 All services are ready!"
echo "📱 Frontend: http://localhost:3000"
echo "⚙️  Backend:  http://localhost:3001"
echo "🗄️  Database: localhost:5432"
echo "🔴 Redis:    localhost:6379"
echo "🔧 Adminer:  http://localhost:8080 (run 'docker-compose --profile admin up -d' to enable)"