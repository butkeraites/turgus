#!/bin/bash

# Turgus Infrastructure Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"
PROJECT_ID=""
REGION="us-central1"
ENVIRONMENT="prod"

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
    
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi
    
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

init_terraform() {
    log_info "Initializing Terraform..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    terraform init
    
    # Validate configuration
    terraform validate
    
    log_info "Terraform initialization completed."
}

plan_infrastructure() {
    log_info "Planning infrastructure changes..."
    
    cd "$TERRAFORM_DIR"
    
    # Check if terraform.tfvars exists
    if [ ! -f "terraform.tfvars" ]; then
        log_error "terraform.tfvars file not found. Please copy terraform.tfvars.example and fill in your values."
        exit 1
    fi
    
    # Plan the deployment
    terraform plan \
        -var="project_id=$PROJECT_ID" \
        -var="region=$REGION" \
        -var="environment=$ENVIRONMENT" \
        -out=tfplan
    
    log_info "Infrastructure planning completed. Review the plan above."
}

deploy_infrastructure() {
    log_info "Deploying infrastructure..."
    
    cd "$TERRAFORM_DIR"
    
    # Apply the plan
    terraform apply tfplan
    
    log_info "Infrastructure deployment completed!"
    
    # Output important information
    log_info "Getting deployment outputs..."
    terraform output
}

cleanup_plan() {
    cd "$TERRAFORM_DIR"
    if [ -f "tfplan" ]; then
        rm tfplan
        log_info "Cleaned up Terraform plan file."
    fi
}

show_usage() {
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  init     Initialize Terraform"
    echo "  plan     Plan infrastructure changes"
    echo "  deploy   Deploy infrastructure"
    echo "  destroy  Destroy infrastructure"
    echo "  output   Show Terraform outputs"
    echo ""
    echo "Options:"
    echo "  -p, --project PROJECT_ID    GCP Project ID"
    echo "  -r, --region REGION         GCP Region (default: us-central1)"
    echo "  -e, --env ENVIRONMENT       Environment (default: prod)"
    echo "  -h, --help                  Show this help message"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        init|plan|deploy|destroy|output)
            COMMAND="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if command is provided
if [ -z "$COMMAND" ]; then
    log_error "No command provided."
    show_usage
    exit 1
fi

# Main execution
main() {
    log_info "Starting Turgus infrastructure deployment..."
    log_info "Command: $COMMAND"
    log_info "Environment: $ENVIRONMENT"
    log_info "Region: $REGION"
    
    check_dependencies
    setup_gcp_auth
    
    case $COMMAND in
        init)
            init_terraform
            ;;
        plan)
            init_terraform
            plan_infrastructure
            ;;
        deploy)
            init_terraform
            plan_infrastructure
            echo ""
            read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                deploy_infrastructure
            else
                log_info "Deployment cancelled."
            fi
            cleanup_plan
            ;;
        destroy)
            cd "$TERRAFORM_DIR"
            log_warn "This will destroy all infrastructure resources!"
            read -p "Are you sure you want to destroy the infrastructure? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                terraform destroy \
                    -var="project_id=$PROJECT_ID" \
                    -var="region=$REGION" \
                    -var="environment=$ENVIRONMENT"
                log_info "Infrastructure destroyed."
            else
                log_info "Destruction cancelled."
            fi
            ;;
        output)
            cd "$TERRAFORM_DIR"
            terraform output
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
    
    log_info "Operation completed successfully!"
}

# Trap to cleanup on exit
trap cleanup_plan EXIT

# Run main function
main