# Turgus Deployment Guide

This guide provides step-by-step instructions for deploying the Turgus marketplace application to Google Cloud Platform.

## Prerequisites

Before starting the deployment process, ensure you have:

1. **Google Cloud Platform Account** with billing enabled
2. **Google Cloud CLI** installed and configured
3. **Terraform** (version >= 1.0) installed
4. **Docker** installed for local testing
5. **Git** for version control
6. **Node.js** (version >= 18) for local development

## Quick Start

For a complete deployment from scratch:

```bash
# 1. Clone the repository
git clone <repository-url>
cd turgus

# 2. Set up GCP project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 3. Deploy infrastructure
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
../scripts/deploy-infrastructure.sh deploy -p YOUR_PROJECT_ID

# 4. Set up CI/CD
../scripts/setup-cicd.sh -p YOUR_PROJECT_ID -o YOUR_GITHUB_USERNAME

# 5. Set up monitoring
../scripts/setup-monitoring.sh -p YOUR_PROJECT_ID -e your-email@example.com

# 6. Deploy application
./deploy.sh prod
```

## Detailed Deployment Steps

### Step 1: GCP Project Setup

1. **Create a new GCP project** (or use existing):
   ```bash
   gcloud projects create YOUR_PROJECT_ID
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable billing** for the project through the GCP Console

3. **Authenticate with GCP**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

### Step 2: Infrastructure Deployment

1. **Navigate to the terraform directory**:
   ```bash
   cd infrastructure/terraform
   ```

2. **Configure variables**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```
   
   Edit `terraform.tfvars` with your values:
   ```hcl
   project_id = "your-gcp-project-id"
   region     = "us-central1"
   environment = "prod"
   db_password = "your-secure-database-password"
   jwt_secret  = "your-jwt-secret-key-min-32-chars"
   ```

3. **Deploy infrastructure**:
   ```bash
   ../scripts/deploy-infrastructure.sh deploy -p YOUR_PROJECT_ID
   ```

   This will create:
   - Cloud SQL PostgreSQL instance
   - Cloud Storage bucket for images
   - Redis instance for caching
   - Service accounts and IAM roles
   - Secret Manager secrets

### Step 3: CI/CD Pipeline Setup

1. **Set up CI/CD pipeline**:
   ```bash
   infrastructure/scripts/setup-cicd.sh -p YOUR_PROJECT_ID -o YOUR_GITHUB_USERNAME
   ```

2. **Connect GitHub repository** in GCP Console:
   - Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
   - Click "Connect Repository"
   - Follow the instructions to connect your GitHub repository

3. **Create build triggers**:
   - **Staging trigger**: Builds on pull requests using `cloudbuild-staging.yaml`
   - **Production trigger**: Builds on main branch using `cloudbuild.yaml`

### Step 4: Monitoring and Logging Setup

1. **Set up monitoring**:
   ```bash
   infrastructure/scripts/setup-monitoring.sh -p YOUR_PROJECT_ID -e your-email@example.com
   ```

2. **Configure alert policies** in GCP Console:
   - Go to [Monitoring](https://console.cloud.google.com/monitoring)
   - Import alert policies from `infrastructure/monitoring/alerts.yaml`

3. **Set up dashboards**:
   - Import dashboard configuration from `infrastructure/monitoring/dashboard-config.json`

### Step 5: Application Deployment

1. **Manual deployment** (first time):
   ```bash
   ./deploy.sh prod
   ```

2. **Automatic deployment** (after CI/CD setup):
   - Push to main branch triggers production deployment
   - Pull requests trigger staging deployment

### Step 6: Post-Deployment Configuration

1. **Update frontend environment variables**:
   - Get the backend Cloud Run URL from GCP Console
   - Update `frontend/.env.production` with the correct API URL

2. **Test the deployment**:
   ```bash
   # Check backend health
   curl https://YOUR_BACKEND_URL/health
   
   # Check frontend
   curl https://YOUR_FRONTEND_URL/health
   ```

3. **Configure domain** (optional):
   - Set up custom domain in Cloud Run
   - Configure SSL certificate
   - Update DNS records

## Environment Configuration

### Production Environment

- **Database**: Cloud SQL PostgreSQL with automated backups
- **Storage**: Cloud Storage with global CDN
- **Compute**: Cloud Run with auto-scaling (1-10 instances)
- **Cache**: Redis Memorystore
- **Monitoring**: Cloud Monitoring with alerts
- **Logging**: Structured logging to Cloud Logging

### Staging Environment

- **Database**: Separate Cloud SQL instance (smaller tier)
- **Storage**: Separate Cloud Storage bucket
- **Compute**: Cloud Run with limited scaling (1-3 instances)
- **Testing**: Automated tests run on every PR

## Security Configuration

### Secrets Management

All sensitive data is stored in Secret Manager:
- Database passwords
- JWT secrets
- API keys

### Network Security

- HTTPS enforced for all endpoints
- CORS configured for frontend domain
- Private networking for database connections
- IAM roles with least-privilege access

### Application Security

- JWT-based authentication
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure file upload handling

## Monitoring and Alerting

### Key Metrics Monitored

- **Application Performance**:
  - Response times (95th percentile)
  - Error rates
  - Request throughput

- **Infrastructure Health**:
  - CPU and memory usage
  - Database connections
  - Storage usage

- **Business Metrics**:
  - User registrations
  - Product uploads
  - Purchase transactions

### Alert Policies

- High error rate (>5% for 5 minutes)
- High response time (>2s for 5 minutes)
- Service unavailability
- Database connection issues
- High resource usage

## Backup and Recovery

### Database Backups

- Automated daily backups
- Point-in-time recovery enabled
- 7-day retention policy
- Cross-region backup replication

### Application Recovery

- Immutable container images
- Infrastructure as Code for quick rebuilds
- Automated rollback capabilities
- Health checks and auto-healing

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build logs
   gcloud builds log BUILD_ID
   ```

2. **Database Connection Issues**:
   ```bash
   # Check Cloud SQL status
   gcloud sql instances describe INSTANCE_NAME
   ```

3. **Service Not Starting**:
   ```bash
   # Check service logs
   gcloud logs read "resource.type=cloud_run_revision"
   ```

### Performance Issues

1. **Slow Response Times**:
   - Check Cloud Run metrics
   - Review database query performance
   - Analyze image loading times

2. **High Resource Usage**:
   - Monitor CPU and memory usage
   - Check for memory leaks
   - Optimize database queries

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

## Support and Documentation

- **Infrastructure**: See `infrastructure/README.md`
- **API Documentation**: Available at `/api/docs` endpoint
- **Frontend**: See `frontend/README.md`
- **Database Schema**: See `database/README.md`

For issues and questions, check the troubleshooting section or contact the development team.