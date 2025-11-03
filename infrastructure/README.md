# Turgus Infrastructure and Deployment

This directory contains all the infrastructure configuration and deployment scripts for the Turgus marketplace application.

## Overview

The Turgus application is deployed on Google Cloud Platform (GCP) using:
- **Cloud Run** for containerized application hosting
- **Cloud SQL (PostgreSQL)** for the database
- **Cloud Storage** for image file storage
- **Redis (Memorystore)** for caching and sessions
- **Cloud Build** for CI/CD pipelines
- **Secret Manager** for sensitive configuration

## Directory Structure

```
infrastructure/
├── terraform/              # Infrastructure as Code
│   ├── main.tf             # Main Terraform configuration
│   ├── outputs.tf          # Output values
│   └── terraform.tfvars.example  # Example variables
├── scripts/                # Deployment scripts
│   ├── deploy-infrastructure.sh  # Infrastructure deployment
│   └── setup-cicd.sh       # CI/CD setup
└── README.md               # This file
```

## Prerequisites

1. **Google Cloud CLI** - Install from https://cloud.google.com/sdk/docs/install
2. **Terraform** - Install from https://terraform.io/downloads
3. **Docker** - For local testing
4. **Git** - For version control

## Setup Instructions

### 1. Initial GCP Setup

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable billing (required for Cloud resources)
# This must be done through the GCP Console
```

### 2. Infrastructure Deployment

```bash
# Navigate to terraform directory
cd infrastructure/terraform

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Deploy infrastructure
../scripts/deploy-infrastructure.sh deploy -p YOUR_PROJECT_ID
```

### 3. CI/CD Setup

```bash
# Set up CI/CD pipeline
infrastructure/scripts/setup-cicd.sh -p YOUR_PROJECT_ID -o YOUR_GITHUB_USERNAME
```

### 4. Manual Deployment

```bash
# Deploy application manually
./deploy.sh prod
```

## Environment Configuration

### Production Environment
- **Database**: Cloud SQL PostgreSQL with automated backups
- **Storage**: Cloud Storage with CDN
- **Compute**: Cloud Run with auto-scaling
- **Monitoring**: Cloud Monitoring and Logging

### Staging Environment
- **Database**: Separate Cloud SQL instance
- **Storage**: Separate Cloud Storage bucket
- **Compute**: Cloud Run with limited scaling
- **Testing**: Automated testing in CI/CD pipeline

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (seller vs buyer)
- Secure password hashing with bcrypt

### Data Protection
- All secrets stored in Secret Manager
- Database encryption at rest and in transit
- HTTPS enforcement for all endpoints
- CORS configuration for API security

### Infrastructure Security
- Non-root containers
- Private networking where possible
- IAM least-privilege access
- Regular security updates

## Monitoring and Logging

### Cloud Monitoring
- Application performance metrics
- Infrastructure resource utilization
- Custom business metrics
- Alerting for critical issues

### Cloud Logging
- Structured application logs
- Error tracking and aggregation
- Audit logs for security events
- Log-based metrics and alerts

## Backup and Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery enabled
- 7-day backup retention
- Cross-region backup replication

### Application Recovery
- Immutable container images
- Infrastructure as Code for quick rebuilds
- Automated deployment rollbacks
- Health checks and auto-healing

## Cost Optimization

### Resource Sizing
- Right-sized compute instances
- Auto-scaling based on demand
- Efficient image storage and delivery
- Connection pooling for database

### Cost Monitoring
- Budget alerts and notifications
- Resource usage tracking
- Regular cost optimization reviews
- Reserved capacity where applicable

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check Cloud Build logs
   gcloud builds log BUILD_ID
   
   # Check service logs
   gcloud logs read "resource.type=cloud_run_revision"
   ```

2. **Database Connection Issues**
   ```bash
   # Check Cloud SQL status
   gcloud sql instances describe INSTANCE_NAME
   
   # Test database connectivity
   gcloud sql connect INSTANCE_NAME --user=USERNAME
   ```

3. **Storage Issues**
   ```bash
   # Check bucket permissions
   gsutil iam get gs://BUCKET_NAME
   
   # Test file upload
   gsutil cp test-file.jpg gs://BUCKET_NAME/
   ```

### Performance Issues

1. **Slow Response Times**
   - Check Cloud Run metrics in GCP Console
   - Review database query performance
   - Analyze image loading times

2. **High Resource Usage**
   - Monitor CPU and memory usage
   - Check for memory leaks
   - Optimize database queries

### Deployment Issues

1. **Failed Deployments**
   - Check Cloud Build logs
   - Verify environment variables
   - Test Docker images locally

2. **Configuration Problems**
   - Validate Terraform configuration
   - Check Secret Manager values
   - Verify IAM permissions

## Maintenance

### Regular Tasks
- Monitor application performance
- Review security logs
- Update dependencies
- Optimize costs

### Updates
- Application updates via CI/CD
- Infrastructure updates via Terraform
- Security patches automatically applied
- Database maintenance windows

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review GCP Console logs and metrics
3. Consult the application documentation
4. Contact the development team

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)