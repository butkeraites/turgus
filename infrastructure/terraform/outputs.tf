# Output values for the infrastructure

output "database_connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.turgus_db.connection_name
}

output "database_private_ip" {
  description = "Database private IP address"
  value       = google_sql_database_instance.turgus_db.private_ip_address
}

output "database_public_ip" {
  description = "Database public IP address"
  value       = google_sql_database_instance.turgus_db.public_ip_address
}

output "storage_bucket_name" {
  description = "Cloud Storage bucket name for images"
  value       = google_storage_bucket.turgus_images.name
}

output "storage_bucket_url" {
  description = "Cloud Storage bucket URL"
  value       = google_storage_bucket.turgus_images.url
}

output "redis_host" {
  description = "Redis instance host"
  value       = google_redis_instance.turgus_cache.host
}

output "redis_port" {
  description = "Redis instance port"
  value       = google_redis_instance.turgus_cache.port
}

output "backend_service_url" {
  description = "Cloud Run backend service URL"
  value       = google_cloud_run_service.turgus_backend.status[0].url
}

output "service_account_email" {
  description = "Backend service account email"
  value       = google_service_account.turgus_backend.email
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}