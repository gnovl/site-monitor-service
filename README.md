# Site Monitor Pro - DevOps Showcase

A modern DevOps project that demonstrates a complete deployment pipeline for a site monitoring service with a simple Python Flask application.

## Features

- **Real-time Monitoring:** Track website availability and performance
- **Custom Site Management:** Add, remove, and check custom sites on demand
- **Detailed Metrics:** Response time, status codes, and error tracking
- **API Endpoints:** Full RESTful API for programmatic access
- **Prometheus Integration:** Advanced metrics collection
- **Grafana Dashboards:** Pre-configured visualization dashboards
- **Docker Deployment:** Containerized for easy deployment
- **CI/CD Pipeline:** GitHub Actions workflows included

## DevOps Skills Demonstrated

- **Containerization** with Docker and Docker Compose
- **Continuous Integration/Continuous Deployment** with GitHub Actions
- **Monitoring and Observability** with Prometheus and Grafana
- **Infrastructure as Code** with Terraform
- **Automated Testing** with Pytest
- **Application Deployment** to cloud providers
- **Web Application** built with Python Flask and Jinja2 templates

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Running Locally

1. Clone the repository:

   ```
   git clone https://github.com/gnovl/site-monitor-service.git
   cd site-monitor-pro
   ```

2. Start the application:

   ```
   docker-compose up -d
   ```

3. Access the services:
   - Site Monitor UI: http://localhost
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000 (default credentials: admin/password)

## Deployment

This project includes Terraform configurations for deploying to AWS:

1. Navigate to terraform directory:

   ```
   cd terraform
   ```

2. Initialize terraform:

   ```
   terraform init
   ```

3. Plan and apply the infrastructure:
   ```
   terraform plan
   terraform apply
   ```

## Project Structure

- `/backend` - Python Flask application
- `/monitoring` - Prometheus and Grafana configurations
- `/terraform` - Infrastructure as Code
- `/.github/workflows` - CI/CD pipelines

## Backend Application

The backend is a Flask application that provides:

- Web interface for monitoring sites
- RESTful API for managing monitored sites

### API Endpoints

- `GET /api/sites` - List all monitored sites
- `POST /api/sites` - Add a new site to monitor
- `GET /api/sites/{id}` - Get details for a specific site
- `PUT /api/sites/{id}` - Update a monitored site
- `DELETE /api/sites/{id}` - Remove a site from monitoring
- `POST /api/sites/{id}/check` - Manually trigger a site check

### Web Interface

- `/` - Dashboard showing all monitored sites
- `/add` - Form to add a new site
- `/site/{id}` - Details for a specific site
- `/site/{id}/check` - Manually trigger a site check
- `/site/{id}/delete` - Remove a site from monitoring

## Monitoring Setup

### Prometheus

Prometheus collects metrics from the application, including:

- Site response times
- Site availability (up/down status)
- Request counts by status code

### Grafana

Pre-configured Grafana dashboards visualize the metrics collected by Prometheus:

- Site uptime dashboard
- Response time trends
- Status code distribution

## CI/CD Pipeline

The GitHub Actions workflows handle:

- Running tests on every commit
- Building Docker images
- Publishing Docker images to DockerHub (on tagged releases)
- Deploying to AWS (on tagged releases)

## Troubleshooting

### Common Issues

1. **Application failing to start**

   - Check for compatible Flask and Werkzeug versions in requirements.txt
   - Ensure all Python dependencies are correctly installed

2. **Prometheus or Grafana issues**
   - Ensure volumes are properly mounted
   - Check configuration files for correct targets

### Docker Commands

Useful Docker commands for troubleshooting:

```
# View logs for a specific service
docker-compose logs app
docker-compose logs prometheus

# Restart a specific service
docker-compose restart app

# Rebuild services
docker-compose build --no-cache
```

## License

MIT
