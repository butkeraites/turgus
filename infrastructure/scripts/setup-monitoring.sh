#!/bin/bash

# Turgus Monitoring Setup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
NOTIFICATION_EMAIL=""
SLACK_WEBHOOK=""

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v gcloud &> /dev/null; then
        log_error "Google Cloud CLI is not installed. Please install gcloud first."
        exit 1
    fi
    
    log_info "Dependencies check passed."
}

setup_gcp_auth() {
    log_info "Setting up GCP authentication..."
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_warn "No active GCP authentication found. Please run 'gcloud auth login'"
        exit 1
    fi
    
    # Set project if provided
    if [ -n "$PROJECT_ID" ]; then
        gcloud config set project "$PROJECT_ID"
        log_info "Set GCP project to: $PROJECT_ID"
    else
        PROJECT_ID=$(gcloud config get-value project)
        if [ -z "$PROJECT_ID" ]; then
            log_error "No GCP project set. Please set PROJECT_ID variable or run 'gcloud config set project YOUR_PROJECT_ID'"
            exit 1
        fi
    fi
    
    log_info "Using GCP project: $PROJECT_ID"
}

enable_apis() {
    log_info "Enabling required APIs..."
    
    gcloud services enable \
        monitoring.googleapis.com \
        logging.googleapis.com \
        clouderrorreporting.googleapis.com \
        cloudtrace.googleapis.com
    
    log_info "Monitoring APIs enabled successfully."
}

create_notification_channels() {
    log_info "Creating notification channels..."
    
    # Create email notification channel
    if [ -n "$NOTIFICATION_EMAIL" ]; then
        cat > /tmp/email-channel.json << EOF
{
  "type": "email",
  "displayName": "Turgus Email Notifications",
  "description": "Email notifications for Turgus alerts",
  "labels": {
    "email_address": "$NOTIFICATION_EMAIL"
  }
}
EOF
        
        gcloud alpha monitoring channels create --channel-content-from-file=/tmp/email-channel.json
        log_info "Email notification channel created for: $NOTIFICATION_EMAIL"
        rm /tmp/email-channel.json
    fi
    
    # Create Slack notification channel
    if [ -n "$SLACK_WEBHOOK" ]; then
        cat > /tmp/slack-channel.json << EOF
{
  "type": "slack",
  "displayName": "Turgus Slack Notifications",
  "description": "Slack notifications for Turgus alerts",
  "labels": {
    "url": "$SLACK_WEBHOOK"
  }
}
EOF
        
        gcloud alpha monitoring channels create --channel-content-from-file=/tmp/slack-channel.json
        log_info "Slack notification channel created"
        rm /tmp/slack-channel.json
    fi
}

create_log_sinks() {
    log_info "Creating log sinks for structured logging..."
    
    # Create log sink for errors
    gcloud logging sinks create turgus-errors \
        bigquery.googleapis.com/projects/$PROJECT_ID/datasets/turgus_logs \
        --log-filter='severity>=ERROR AND (resource.type="cloud_run_revision" OR resource.type="cloud_sql_database")' \
        --use-partitioned-tables || log_warn "Error log sink already exists"
    
    # Create log sink for business events
    gcloud logging sinks create turgus-business-events \
        bigquery.googleapis.com/projects/$PROJECT_ID/datasets/turgus_logs \
        --log-filter='jsonPayload.type="business_event" AND resource.type="cloud_run_revision"' \
        --use-partitioned-tables || log_warn "Business events log sink already exists"
    
    # Create log sink for performance metrics
    gcloud logging sinks create turgus-performance \
        bigquery.googleapis.com/projects/$PROJECT_ID/datasets/turgus_logs \
        --log-filter='jsonPayload.type="performance" AND resource.type="cloud_run_revision"' \
        --use-partitioned-tables || log_warn "Performance log sink already exists"
    
    log_info "Log sinks created successfully."
}

create_bigquery_dataset() {
    log_info "Creating BigQuery dataset for logs..."
    
    # Create dataset
    bq mk --dataset \
        --description="Turgus application logs and metrics" \
        --location=US \
        $PROJECT_ID:turgus_logs || log_warn "BigQuery dataset already exists"
    
    log_info "BigQuery dataset created successfully."
}

setup_uptime_checks() {
    log_info "Setting up uptime monitoring..."
    
    # Get Cloud Run service URLs
    BACKEND_URL=$(gcloud run services describe turgus-backend-prod --region=us-central1 --format="value(status.url)" 2>/dev/null || echo "")
    FRONTEND_URL=$(gcloud run services describe turgus-frontend-prod --region=us-central1 --format="value(status.url)" 2>/dev/null || echo "")
    
    if [ -n "$BACKEND_URL" ]; then
        cat > /tmp/backend-uptime.json << EOF
{
  "displayName": "Turgus Backend Uptime Check",
  "httpCheck": {
    "path": "/health",
    "port": 443,
    "useSsl": true,
    "validateSsl": true
  },
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {
      "project_id": "$PROJECT_ID",
      "host": "$(echo $BACKEND_URL | sed 's|https://||')"
    }
  },
  "timeout": "10s",
  "period": "300s"
}
EOF
        
        gcloud monitoring uptime create --config-from-file=/tmp/backend-uptime.json
        log_info "Backend uptime check created"
        rm /tmp/backend-uptime.json
    fi
    
    if [ -n "$FRONTEND_URL" ]; then
        cat > /tmp/frontend-uptime.json << EOF
{
  "displayName": "Turgus Frontend Uptime Check",
  "httpCheck": {
    "path": "/health",
    "port": 443,
    "useSsl": true,
    "validateSsl": true
  },
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {
      "project_id": "$PROJECT_ID",
      "host": "$(echo $FRONTEND_URL | sed 's|https://||')"
    }
  },
  "timeout": "10s",
  "period": "300s"
}
EOF
        
        gcloud monitoring uptime create --config-from-file=/tmp/frontend-uptime.json
        log_info "Frontend uptime check created"
        rm /tmp/frontend-uptime.json
    fi
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --project PROJECT_ID       GCP Project ID"
    echo "  -e, --email EMAIL              Email for notifications"
    echo "  -s, --slack WEBHOOK_URL        Slack webhook URL for notifications"
    echo "  -h, --help                     Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 -p my-gcp-project -e admin@example.com"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -e|--email)
            NOTIFICATION_EMAIL="$2"
            shift 2
            ;;
        -s|--slack)
            SLACK_WEBHOOK="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_info "Starting Turgus monitoring setup..."
    log_info "Project ID: $PROJECT_ID"
    
    check_dependencies
    setup_gcp_auth
    enable_apis
    create_bigquery_dataset
    create_log_sinks
    
    if [ -n "$NOTIFICATION_EMAIL" ] || [ -n "$SLACK_WEBHOOK" ]; then
        create_notification_channels
    fi
    
    setup_uptime_checks
    
    log_info "Monitoring setup completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Configure alert policies in GCP Console"
    log_info "2. Set up custom dashboards for business metrics"
    log_info "3. Configure log-based metrics for specific events"
    log_info "4. Test notification channels"
}

# Run main function
main