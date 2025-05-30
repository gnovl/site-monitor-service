# Site Monitor Pro - DevOps Showcase

[![Site Monitor Pro CI/CD](https://github.com/gnovl/site-monitor-service/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/gnovl/site-monitor-service/actions/workflows/ci-cd.yml)
[![Code Coverage](https://codecov.io/gh/gnovl/site-monitor-service/branch/main/graph/badge.svg)](https://codecov.io/gh/gnovl/site-monitor-service)
[![Security Scan](https://img.shields.io/badge/security-scanned-green.svg)](https://github.com/gnovl/site-monitor-service/security/code-scanning)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A comprehensive DevOps showcase project that demonstrates a complete deployment pipeline for a site monitoring service with a Python Flask application, featuring a modern compact UI design and real-time monitoring capabilities.

## 🌐 Live Demo

**Try the application live:** [https://site-monitor-service.onrender.com](https://site-monitor-service.onrender.com)

_Deployed on Render platform with automatic deployments from the main branch._

## 🚀 DevOps Practices Demonstrated

This project showcases a wide range of DevOps practices and technologies:

### Infrastructure as Code (IaC)

- **Terraform** for provisioning cloud infrastructure on AWS
- **Kubernetes manifests** for container orchestration
- **Helm charts** for Kubernetes package management with multi-environment support
- **Render deployment** configuration for cloud platform deployment

### CI/CD Pipeline

- **GitHub Actions** workflow with comprehensive stages:
  - Testing and code quality checks
  - Security scanning with Bandit and Safety
  - Building & pushing Docker images
  - Automated deployment to Render
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
- **Production-ready** container configuration

### Configuration Management

- **Environment-specific configurations** with proper separation of concerns
- **Secret management** integration with cloud platforms
- **Feature flags** based on environment
- **Render-optimized** configuration

### Observability

- **Prometheus** for metrics collection
- **Grafana** for metrics visualization and dashboards
- **Structured JSON logging** for better log processing
- **Real-time monitoring** with automatic refresh
- **Site history tracking** and uptime calculations

### Modern UI/UX Design

- **Compact, responsive design** optimized for all screen sizes
- **Modal-based interactions** for seamless user experience
- **Real-time updates** without page refreshes
- **Interactive charts** using Chart.js
- **Professional dashboard** with modern card-based layout

## 📋 Features

### Core Monitoring Features

- **Real-time Site Monitoring:** Track website availability and performance with automatic checks
- **Custom Site Management:** Add, remove, and manually check sites with an intuitive interface
- **Detailed Metrics:** Response time tracking, status codes, and comprehensive error reporting
- **Site History:** Track up to 50 recent checks per site with trend analysis
- **Uptime Calculations:** Automatic uptime percentage calculations based on check history
- **Status Badges:** Embeddable status badges for README files and documentation

### API & Integration

- **Full RESTful API:** Complete programmatic access to all functionality
- **Swagger Documentation:** Interactive API documentation at `/docs/`
- **Prometheus Integration:** Advanced metrics collection for monitoring systems
- **Health Check Endpoints:** Kubernetes and load balancer compatible health checks

### User Interface

- **Modern Dashboard:** Clean, compact design with real-time data visualization
- **Response Time Charts:** Visual representation of site performance over time
- **Interactive Modals:** Streamlined site details and management interface
- **Mobile Responsive:** Optimized for desktop, tablet, and mobile devices
- **Dark/Light Indicators:** Visual status indicators throughout the interface

### Monitoring & Alerts

- **Configurable Check Intervals:** Set custom monitoring frequencies per site
- **Response Time Thresholds:** Visual warnings for slow-performing sites
- **Site Status Tracking:** Comprehensive status monitoring with detailed error messages
- **Real-time Updates:** Automatic refresh of site statuses every 30 seconds

## 🛠️ Technology Stack

- **Backend:** Python Flask with structured logging and error handling
- **Frontend:** Modern HTML5/CSS3 with Chart.js for data visualization
- **Containerization:** Docker and Docker Compose
- **CI/CD:** GitHub Actions with automated testing and deployment
- **Infrastructure as Code:** Terraform, Kubernetes, Helm
- **Monitoring:** Prometheus, Grafana
- **Observability:** Structured JSON logging, health checks
- **Security:** Bandit (SAST), Safety (dependency scanning), Trivy (container scanning)
- **API Documentation:** Swagger/OpenAPI with interactive documentation
- **Deployment:** Render platform with automatic deployments

## 🏗️ Architecture

The application follows a microservices-ready architecture pattern:

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
      │  Prometheus  │   │   Grafana    │    │ Health  │  │ Status      │
      │  Metrics     │   │  Dashboard   │    │ Checks  │  │ Badges      │
      └──────────────┘   └──────────────┘    └─────────┘  └─────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.9+ (for local development)
- kubectl (for Kubernetes deployment)
- Helm (for Kubernetes package management)
- Terraform (for infrastructure provisioning)

### Quick Start with Docker

1. **Clone the repository:**

   ```bash
   git clone https://github.com/gnovl/site-monitor-service.git
   cd site-monitor-service
   ```

2. **Start the application:**

   ```bash
   make run-docker
   ```

3. **Access the services:**
   - **Site Monitor UI:** http://localhost:80
   - **Prometheus:** http://localhost:9090
   - **Grafana:** http://localhost:3000 (credentials: admin/password)
   - **API Documentation:** http://localhost:5000/docs/

### Local Development

```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Development Workflow

```bash
# Run tests
make test

# Run linting and formatting
make lint
make format

# Run security checks
make security

# Build Docker image
make docker-build
```

## 🌐 Deployment

### Render Platform (Production)

The application is automatically deployed to Render when changes are pushed to the main branch:

- **Live URL:** [https://site-monitor-service.onrender.com](https://site-monitor-service.onrender.com)
- **Automatic deployments** from GitHub
- **Environment variables** managed through Render dashboard
- **SSL certificates** automatically managed
- **Health checks** integrated with Render's monitoring

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

### Pipeline Stages:

1. **Code Quality & Testing:**

   - Unit tests with pytest
   - Code linting with flake8
   - Code formatting with black
   - Security scanning with Bandit and Safety

2. **Build & Security:**

   - Docker image building
   - Container vulnerability scanning with Trivy
   - Multi-architecture support

3. **Deployment:**
   - Automatic deployment to Render on main branch
   - Environment-specific configurations
   - Health check validation post-deployment

## 📊 Monitoring and Observability

### Application Metrics

The application exposes comprehensive Prometheus metrics at `/metrics`:

- **Response time histograms** by site with percentile tracking
- **Availability metrics** (up/down) by site over time
- **Request count by status code** for error tracking
- **Site check frequency** and success rates

### Real-time Dashboard

- **Live site status updates** every 30 seconds
- **Interactive response time charts** with performance indicators
- **Uptime percentage calculations** based on check history
- **Site management interface** with modal-based interactions

### Logging

Structured JSON logs with comprehensive tracking:

- **Request/response details** with correlation IDs
- **Site monitoring events** with detailed error information
- **System events and health checks**
- **Performance metrics** and timing information

### Pre-configured Dashboards

- **Site uptime and response time trends**
- **Status code distribution analysis**
- **Error rates and alert conditions**
- **Performance monitoring over time**

## 🔒 Security

The project implements comprehensive security practices:

- **Automated dependency vulnerability scanning** with Safety
- **Static application security testing (SAST)** with Bandit
- **Container image scanning** with Trivy
- **Secure configuration management** across all environments
- **Rate limiting protection** against abuse
- **Input validation and sanitization**
- **Secret management** with environment variables

## 📚 API Documentation

Interactive API documentation is available at `/docs/` with full Swagger/OpenAPI specification.

### Key API Endpoints:

```bash
# List all monitored sites
GET /api/sites

# Add a new site to monitor
POST /api/sites

# Get details for a specific site
GET /api/sites/{id}

# Update a monitored site
PUT /api/sites/{id}

# Remove a site from monitoring
DELETE /api/sites/{id}

# Manually trigger a site check
POST /api/sites/{id}/check

# Health check endpoints
GET /health
GET /healthz
```

## 🎯 Performance Features

- **Configurable check intervals** from 10 seconds to custom values
- **Parallel site monitoring** with thread-safe operations
- **Response time thresholds** with visual performance indicators
- **Efficient data storage** with rolling history (last 50 checks per site)
- **Optimized Docker images** with multi-stage builds
- **Responsive UI** with minimal JavaScript for fast loading

## 🤝 Contributing

Contributions are welcome! Please check out our [Contributing Guide](CONTRIBUTING.md) for details on:

- **Development environment setup**
- **Code style guidelines**
- **Testing requirements**
- **Security practices**
- **Pull request process**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 About

Created by [gnovl](https://github.com/gnovl) as a comprehensive DevOps showcase project demonstrating modern development, deployment, and monitoring practices.

---

**Live Demo:** [https://site-monitor-service.onrender.com](https://site-monitor-service.onrender.com)
