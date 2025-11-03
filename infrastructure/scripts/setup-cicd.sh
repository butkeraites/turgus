#!/bin/bash

# Turgus CI/CD Setup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REPO_NAME="turgus"
REPO_OWNER=""
GITHUB_TOKEN=""
REGION="us-central1"

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
    
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install git first."
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
    log_info "Enabling required GCP APIs..."
    
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        containerregistry.googleapis.com \
        secretmanager.googleapis.com \
        sourcerepo.googleapis.com
    
    log_info "APIs enabled successfully."
}

setup_cloud_build_triggers() {
    log_info "Setting up Cloud Build triggers..."
    
    # Create trigger for staging (on pull requests)
    gcloud builds triggers create github \
        --repo-name="$REPO_NAME" \
        --repo-owner="$REPO_OWNER" \
        --pull-request-pattern=".*" \
        --build-config="cloudbuild-staging.yaml" \
        --name="turgus-staging-pr" \
        --description="Build and deploy to staging on pull requests"
    
    # Create trigger for production (on main branch)
    gcloud builds triggers create github \
        --repo-name="$REPO_NAME" \
        --repo-owner="$REPO_OWNER" \
        --branch-pattern="^main$" \
        --build-config="cloudbuild.yaml" \
        --name="turgus-production" \
        --description="Build and deploy to production on main branch"
    
    log_info "Cloud Build triggers created successfully."
}

setup_secrets() {
    log_info "Setting up secrets in Secret Manager..."
    
    # Check if secrets already exist
    if ! gcloud secrets describe "turgus-db-password-prod" &>/dev/null; then
        log_info "Creating database password secret..."
        echo -n "$(openssl rand -base64 32)" | gcloud secrets create "turgus-db-password-prod" --data-file=-
    fi
    
    if ! gcloud secrets describe "turgus-jwt-secret-prod" &>/dev/null; then
        log_info "Creating JWT secret..."
        echo -n "$(openssl rand -base64 64)" | gcloud secrets create "turgus-jwt-secret-prod" --data-file=-
    fi
    
    if ! gcloud secrets describe "turgus-db-password-staging" &>/dev/null; then
        log_info "Creating staging database password secret..."
        echo -n "$(openssl rand -base64 32)" | gcloud secrets create "turgus-db-password-staging" --data-file=-
    fi
    
    if ! gcloud secrets describe "turgus-jwt-secret-staging" &>/dev/null; then
        log_info "Creating staging JWT secret..."
        echo -n "$(openssl rand -base64 64)" | gcloud secrets create "turgus-jwt-secret-staging" --data-file=-
    fi
    
    log_info "Secrets created successfully."
}

setup_iam_permissions() {
    log_info "Setting up IAM permissions for Cloud Build..."
    
    # Get Cloud Build service account
    PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
    CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
    
    # Grant necessary permissions
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$CLOUD_BUILD_SA" \
        --role="roles/run.admin"
    
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$CLOUD_BUILD_SA" \
        --role="roles/iam.serviceAccountUser"
    
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$CLOUD_BUILD_SA" \
        --role="roles/secretmanager.secretAccessor"
    
    log_info "IAM permissions configured successfully."
}

create_deployment_script() {
    log_info "Creating manual deployment script..."
    
    cat > deploy.sh << 'EOF'
#!/bin/bash

# Manual deployment script for Turgus

set -e

ENVIRONMENT=${1:-prod}
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ]; then
    echo "Error: No GCP project set. Run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

echo "Deploying Turgus to $ENVIRONMENT environment..."

# Build and push images
gcloud builds submit --config cloudbuild.yaml \
    --substitutions _ENVIRONMENT="$ENVIRONMENT"

echo "Deployment completed successfully!"
EOF
    
    chmod +x deploy.sh
    log_info "Manual deployment script created: deploy.sh"
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --project PROJECT_ID    GCP Project ID"
    echo "  -r, --repo REPO_NAME        GitHub repository name (default: turgus)"
    echo "  -o, --owner REPO_OWNER      GitHub repository owner/organization"
    echo "  -t, --token GITHUB_TOKEN    GitHub personal access token"
    echo "  -h, --help                  Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 -p my-gcp-project -o myusername -t ghp_xxxxxxxxxxxx"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--repo)
            REPO_NAME="$2"
            shift 2
            ;;
        -o|--owner)
            REPO_OWNER="$2"
            shift 2
            ;;
        -t|--token)
            GITHUB_TOKEN="$2"
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

# Validate required parameters
if [ -z "$REPO_OWNER" ]; then
    log_error "Repository owner is required. Use -o or --owner option."
    show_usage
    exit 1
fi

# Main execution
main() {
    log_info "Starting Turgus CI/CD setup..."
    log_info "Project ID: $PROJECT_ID"
    log_info "Repository: $REPO_OWNER/$REPO_NAME"
    
    check_dependencies
    setup_gcp_auth
    enable_apis
    setup_secrets
    setup_iam_permissions
    
    if [ -n "$GITHUB_TOKEN" ]; then
        log_info "Setting up GitHub integration..."
        # Note: This requires additional setup in the GCP Console
        log_warn "GitHub integration setup requires manual configuration in GCP Console."
        log_warn "Please visit: https://console.cloud.google.com/cloud-build/triggers"
    fi
    
    create_deployment_script
    
    log_info "CI/CD setup completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Connect your GitHub repository in GCP Console: https://console.cloud.google.com/cloud-build/triggers"
    log_info "2. Create Cloud Build triggers using the provided configurations"
    log_info "3. Deploy infrastructure using: infrastructure/scripts/deploy-infrastructure.sh"
    log_info "4. Test manual deployment using: ./deploy.sh"
}

# Run main function
main