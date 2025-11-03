# Turgus GCP Infrastructure Configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "cloudsql.googleapis.com",
    "storage.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "redis.googleapis.com"
  ])
  
  project = var.project_id
  service = each.value
  
  disable_dependent_services = true
}

# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "turgus_db" {
  name             = "turgus-${var.environment}"
  database_version = "POSTGRES_15"
  region          = var.region
  
  settings {
    tier = "db-f1-micro"
    
    backup_configuration {
      enabled                        = true
      start_time                    = "03:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
      }
    }
    
    ip_configuration {
      ipv4_enabled    = true
      authorized_networks {
        name  = "all"
        value = "0.0.0.0/0"
      }
    }
    
    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }
  
  deletion_protection = false
  
  depends_on = [google_project_service.apis]
}

# Database
resource "google_sql_database" "turgus_database" {
  name     = "turgus"
  instance = google_sql_database_instance.turgus_db.name
}

# Database user
resource "google_sql_user" "turgus_user" {
  name     = "turgus_user"
  instance = google_sql_database_instance.turgus_db.name
  password = var.db_password
}

# Cloud Storage bucket for images
resource "google_storage_bucket" "turgus_images" {
  name     = "turgus-images-${var.environment}-${random_id.bucket_suffix.hex}"
  location = var.region
  
  uniform_bucket_level_access = true
  
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
  
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }
}

# Random suffix for bucket name uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Make bucket publicly readable
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.turgus_images.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Redis instance for caching
resource "google_redis_instance" "turgus_cache" {
  name           = "turgus-cache-${var.environment}"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region
  
  redis_version = "REDIS_7_0"
  
  depends_on = [google_project_service.apis]
}

# Service account for Cloud Run
resource "google_service_account" "turgus_backend" {
  account_id   = "turgus-backend-${var.environment}"
  display_name = "Turgus Backend Service Account"
}

# Grant necessary permissions to service account
resource "google_project_iam_member" "backend_permissions" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/storage.objectAdmin",
    "roles/redis.editor"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.turgus_backend.email}"
}

# Cloud Run service for backend
resource "google_cloud_run_service" "turgus_backend" {
  name     = "turgus-backend-${var.environment}"
  location = var.region
  
  template {
    spec {
      service_account_name = google_service_account.turgus_backend.email
      
      containers {
        image = "gcr.io/${var.project_id}/turgus-backend:latest"
        
        ports {
          container_port = 3000
        }
        
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        env {
          name  = "PORT"
          value = "3000"
        }
        
        env {
          name  = "DB_HOST"
          value = google_sql_database_instance.turgus_db.private_ip_address
        }
        
        env {
          name  = "DB_NAME"
          value = google_sql_database.turgus_database.name
        }
        
        env {
          name  = "DB_USER"
          value = google_sql_user.turgus_user.name
        }
        
        env {
          name = "DB_PASSWORD"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret_version.db_password.secret
              key  = "latest"
            }
          }
        }
        
        env {
          name  = "REDIS_HOST"
          value = google_redis_instance.turgus_cache.host
        }
        
        env {
          name  = "REDIS_PORT"
          value = tostring(google_redis_instance.turgus_cache.port)
        }
        
        env {
          name  = "STORAGE_BUCKET"
          value = google_storage_bucket.turgus_images.name
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.turgus_db.connection_name
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [google_project_service.apis]
}

# Make Cloud Run service publicly accessible
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.turgus_backend.name
  location = google_cloud_run_service.turgus_backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Secret Manager for sensitive data
resource "google_secret_manager_secret" "db_password" {
  secret_id = "turgus-db-password-${var.environment}"
  
  replication {
    automatic = true
  }
  
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

# JWT secret
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "turgus-jwt-secret-${var.environment}"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}

# Variables for secrets
variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}