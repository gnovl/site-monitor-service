.PHONY: all build clean test lint security deploy-dev deploy-staging deploy-prod docker-build docker-push

# Variables
IMAGE_NAME ?= site-monitor-app
DOCKER_USERNAME ?= yourusername
DOCKER_TAG ?= latest
ENV ?= dev
NAMESPACE ?= site-monitor-$(ENV)

# Common targets
all: lint test build

build:
	@echo "Building application..."
	cd backend && python setup.py build

clean:
	@echo "Cleaning build artifacts..."
	cd backend && python setup.py clean
	rm -rf build/ dist/ *.egg-info
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Testing and quality
test:
	@echo "Running tests..."
	cd backend && PYTHONPATH=$${PYTHONPATH}:$(PWD)/backend pytest

test-coverage:
	@echo "Running tests with coverage..."
	cd backend && PYTHONPATH=$${PYTHONPATH}:$(PWD)/backend pytest --cov=app --cov-report=xml --cov-report=term

lint:
	@echo "Running linters..."
	cd backend && flake8 app
	cd backend && isort --check-only --profile black app
	cd backend && black --check app

format:
	@echo "Formatting code..."
	cd backend && isort --profile black app
	cd backend && black app

security:
	@echo "Running security checks..."
	cd backend && bandit -r app
	cd backend && safety check -r requirements.txt

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_USERNAME)/$(IMAGE_NAME):$(DOCKER_TAG) -f backend/Dockerfile .

docker-push: docker-build
	@echo "Pushing Docker image..."
	docker push $(DOCKER_USERNAME)/$(IMAGE_NAME):$(DOCKER_TAG)

# Local development
run-local:
	@echo "Starting application locally..."
	cd backend && python run.py

run-docker:
	@echo "Starting application with Docker Compose..."
	docker-compose up -d

stop-docker:
	@echo "Stopping Docker Compose services..."
	docker-compose down

# Kubernetes deployment
deploy-dev:
	@echo "Deploying to development environment..."
	chmod +x ./helm/deploy.sh
	./helm/deploy.sh dev site-monitor-dev

deploy-staging:
	@echo "Deploying to staging environment..."
	chmod +x ./helm/deploy.sh
	./helm/deploy.sh staging site-monitor-staging

deploy-prod:
	@echo "Deploying to production environment..."
	chmod +x ./helm/deploy.sh
	./helm/deploy.sh prod site-monitor-production

# Infrastructure management
terraform-init:
	@echo "Initializing Terraform..."
	cd terraform && terraform init

terraform-plan:
	@echo "Creating Terraform plan..."
	cd terraform && terraform plan -var="aws_region=$(AWS_REGION)" -var="app_name=$(APP_NAME)" -var="environment=$(ENV)"

terraform-apply:
	@echo "Applying Terraform changes..."
	cd terraform && terraform apply -var="aws_region=$(AWS_REGION)" -var="app_name=$(APP_NAME)" -var="environment=$(ENV)"

terraform-destroy:
	@echo "Destroying Terraform resources..."
	cd terraform && terraform destroy -var="aws_region=$(AWS_REGION)" -var="app_name=$(APP_NAME)" -var="environment=$(ENV)"

# Monitoring and observability
install-monitoring:
	@echo "Installing monitoring stack..."
	kubectl apply -f monitoring/prometheus/prometheus.yml
	kubectl apply -f monitoring/grafana/provisioning/datasources/prometheus.yml
	kubectl apply -f monitoring/grafana/provisioning/dashboards/dashboard.yml

# Documentation
generate-api-docs:
	@echo "Generating API documentation..."
	cd backend && python -c "import app; from app import create_app; create_app().run()" &
	sleep 5
	wget http://localhost:5000/docs/apispec.json -O api-docs.json
	pkill -f "python -c import app; from app import create_app"

# Help
help:
	@echo "Site Monitor Pro - DevOps Makefile"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  all             Run lint, test, and build"
	@echo "  build           Build the application"
	@echo "  clean           Clean build artifacts"
	@echo "  test            Run tests"
	@echo "  test-coverage   Run tests with coverage report"
	@echo "  lint            Run code linters"
	@echo "  format          Format code"
	@echo "  security        Run security checks"
	@echo "  docker-build    Build Docker image"
	@echo "  docker-push     Build and push Docker image"
	@echo "  run-local       Run application locally"
	@echo "  run-docker      Run application with Docker Compose"
	@echo "  stop-docker     Stop Docker Compose services"
	@echo "  deploy-dev      Deploy to development environment"
	@echo "  deploy-staging  Deploy to staging environment"
	@echo "  deploy-prod     Deploy to production environment"
	@echo "  terraform-init  Initialize Terraform"
	@echo "  terraform-plan  Create Terraform plan"
	@echo "  terraform-apply Apply Terraform changes"
	@echo "  terraform-destroy Destroy Terraform resources"
	@echo "  install-monitoring Install monitoring stack"
	@echo "  generate-api-docs Generate API documentation"
	@echo ""
	@echo "Variables:"
	@echo "  DOCKER_USERNAME Default: $(DOCKER_USERNAME)"
	@echo "  DOCKER_TAG      Default: $(DOCKER_TAG)"
	@echo "  ENV             Default: $(ENV)"
	@echo "  NAMESPACE       Default: $(NAMESPACE)"
	@echo "  AWS_REGION      AWS region for Terraform"
	@echo "  APP_NAME        Application name for Terraform"