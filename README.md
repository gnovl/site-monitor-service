# Site Monitor Pro - DevOps Showcase

[![Site Monitor Pro CI/CD](https://github.com/gnovl/site-monitor-service/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/gnovl/site-monitor-service/actions/workflows/ci-cd.yml)
[![Code Coverage](https://codecov.io/gh/yourusername/site-monitor-pro/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/site-monitor-pro)
[![Security Scan](https://img.shields.io/badge/security-scanned-green.svg)](https://github.com/yourusername/site-monitor-pro/security/code-scanning)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A comprehensive DevOps showcase project that demonstrates a complete deployment pipeline for a site monitoring service with a Python Flask application.

## 🚀 DevOps Practices Demonstrated

This project showcases a wide range of DevOps practices and technologies:

### Infrastructure as Code (IaC)

- **Terraform** for provisioning cloud infrastructure on AWS
- **Kubernetes manifests** for container orchestration
- **Helm charts** for Kubernetes package management with multi-environment support

### CI/CD Pipeline

- **GitHub Actions** workflow with comprehensive stages:
  - Testing
  - Security scanning
  - Building & pushing Docker images
  - Multi-environment deployments (dev, staging, production)
  - Release management

### DevSecOps Integration

- **Dependency vulnerability scanning** with Safety
- **Static Application Security Testing (SAST)** with Bandit
- **Container vulnerability scanning** with Trivy
- **Security-focused configuration** across environments

### Containerization

- **Docker** for application containerization
- **Docker Compose** for local development
- **Multi-stage Docker builds** for optimized images

### Configuration Management

- **Environment-specific configurations** with proper separation of concerns
- **Secret management** integration
- **Feature flags** based on environment

### Observability

- **Prometheus** for metrics collection
- **Grafana** for metrics visualization and dashboards
- **Structured JSON logging** for better log processing
- **Distributed tracing** with OpenTelemetry

### Deployment Strategies

- **Multi-environment deployment** (dev, staging, production)
- **Kubernetes-based deployment** with proper resource management
- **Rolling updates** for zero-downtime deployments

### Documentation

- **API documentation** with Swagger/OpenAPI
- **Infrastructure documentation** with diagrams
- **Runbook automation** via Makefile

## 📋 Features

- **Real-time Monitoring:** Track website availability and performance
- **Custom Site Management:** Add, remove, and check custom sites on demand
- **Detailed Metrics:** Response time, status codes, and error tracking
- **API Endpoints:** Full RESTful API for programmatic access
- **Prometheus Integration:** Advanced metrics collection
- **Grafana Dashboards:** Pre-configured visualization dashboards
- **Multi-environment Support:** Configurations for dev, staging, and production

## 🛠️ Technology Stack

- **Backend:** Python Flask
- **Containerization:** Docker, Docker Compose
- **CI/CD:** GitHub Actions
- **Infrastructure as Code:** Terraform, Kubernetes, Helm
- **Monitoring:** Prometheus, Grafana
- **Observability:** OpenTelemetry, Structured Logging
- **Security:** Bandit, Safety, Trivy
- **API Documentation:** Swagger/OpenAPI

## 🏗️ Architecture

The application follows a microservices architecture pattern:

```
                             ┌─────────────┐
                             │   Ingress   │
                             └──────┬──────┘
                                    │
                             ┌──────▼──────┐
                             │ Site Monitor │
                             │  Service    │
                             └──────┬──────┘
                                    │
              ┌───────────┬─────────┴─────────┬───────────┐
              │           │                   │           │
      ┌───────▼──────┐   ┌▼─────────────┐    ┌▼────────┐  ┌▼────────────┐
      │  Prometheus  │   │   Grafana    │    │ Tracing │  │ Kubernetes  │
      │              │   │              │    │ Collector│  │ API         │
      └──────────────┘   └──────────────┘    └─────────┘  └─────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- kubectl for Kubernetes deployment
- Helm for Kubernetes package management
- Terraform for infrastructure provisioning
- AWS CLI (if deploying to AWS)

### Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/site-monitor-pro.git
   cd site-monitor-pro
   ```

2. Start the application using Docker Compose:

   ```bash
   make run-docker
   ```

   Alternatively, run the application locally:

   ```bash
   cd backend
   pip install -r requirements.txt
   python run.py
   ```

3. Access the services:
   - Site Monitor UI: http://localhost:80
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000 (default credentials: admin/password)
   - API Documentation: http://localhost:5000/docs/

### Development Workflow

```bash
# Run tests
make test

# Run linting
make lint

# Format code
make format

# Run security checks
make security

# Build Docker image
make docker-build
```

## 🌐 Deployment

### Infrastructure Provisioning with Terraform

```bash
# Initialize Terraform
make terraform-init

# Create execution plan
make terraform-plan AWS_REGION=us-east-1 ENV=dev

# Apply changes
make terraform-apply AWS_REGION=us-east-1 ENV=dev
```

### Kubernetes Deployment with Helm

```bash
# Deploy to development environment
make deploy-dev

# Deploy to staging environment
make deploy-staging

# Deploy to production environment
make deploy-prod
```

## 📦 CI/CD Pipeline

The project includes a comprehensive CI/CD pipeline using GitHub Actions:

1. **Pull Request/Commit Stage:**

   - Run tests
   - Code linting
   - Security scanning

2. **Build Stage:**

   - Build Docker image
   - Push to Docker registry

3. **Deployment Stages:**
   - Deploy to development (on commit to develop branch)
   - Deploy to staging (on commit to main branch)
   - Deploy to production (on tagged release)

## 📊 Monitoring and Observability

### Metrics

The application exposes Prometheus metrics at `/metrics` endpoint:

- Response time histograms by site
- Availability (up/down) metrics by site
- Request count by status code

### Dashboards

Pre-configured Grafana dashboards provide insights into:

- Site uptime and response time trends
- Status code distribution
- Error rates and alerts

### Logging

Structured JSON logs include:

- Request/response details
- Site monitoring events
- System events
- Correlation IDs for distributed tracing

## 🔒 Security

The project implements several security best practices:

- Regular dependency vulnerability scanning
- Static application security testing (SAST)
- Container image scanning
- Secure configuration across environments
- Rate limiting protection
- Proper secret management

## 📚 API Documentation

The REST API is documented using Swagger/OpenAPI and available at `/docs/` endpoint.

Key endpoints:

- `GET /api/sites` - List all monitored sites
- `POST /api/sites` - Add a new site to monitor
- `GET /api/sites/{id}` - Get details for a specific site
- `PUT /api/sites/{id}` - Update a monitored site
- `DELETE /api/sites/{id}` - Remove a site from monitoring
- `POST /api/sites/{id}/check` - Manually trigger a site check

## 🤝 Contributing

Contributions are welcome! Please check out our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
