# Site Monitor Pro - DevOps Showcase

A modern DevOps project that demonstrates a complete deployment pipeline for a site monitoring service with a modern UI.

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

- `/backend` - Python Flask API
- `/frontend` - React frontend
- `/monitoring` - Prometheus and Grafana configurations
- `/terraform` - Infrastructure as Code
- `/.github/workflows` - CI/CD pipelines

## Backend API

The backend provides a RESTful API for managing monitored sites:

- `GET /api/sites` - List all monitored sites
- `POST /api/sites` - Add a new site to monitor
- `GET /api/sites/{id}` - Get details for a specific site
- `PUT /api/sites/{id}` - Update a monitored site
- `DELETE /api/sites/{id}` - Remove a site from monitoring
- `POST /api/sites/{id}/check` - Manually trigger a site check

## Frontend

The React frontend provides an intuitive UI for:

- Viewing the status of all monitored sites
- Adding new sites to monitor
- Removing sites from monitoring
- Manually triggering site checks
- Visualizing response time data

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

1. **Backend failing to start**

   - Check for compatible Flask and Werkzeug versions in requirements.txt
   - Ensure all Python dependencies are correctly installed

2. **Frontend not connecting to backend**

   - Verify the proxy settings in nginx.conf
   - Check that backend service is running and accessible

3. **Prometheus or Grafana issues**
   - Ensure volumes are properly mounted
   - Check configuration files for correct targets

### Docker Commands

Useful Docker commands for troubleshooting:

```
# View logs for a specific service
docker-compose logs backend
docker-compose logs frontend

# Restart a specific service
docker-compose restart backend

# Rebuild services
docker-compose build --no-cache
```

## License

MIT
