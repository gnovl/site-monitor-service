#!/bin/bash
# This script deploys the Site Monitor application to a Kubernetes cluster using Helm
# Usage: ./deploy.sh <environment> <namespace>

set -e

# Check if the correct number of arguments is provided
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <environment> [namespace]"
    echo "Environment: dev, staging, prod"
    echo "Namespace: (optional) Kubernetes namespace to deploy to (defaults to site-monitor-<environment>)"
    exit 1
fi

# Configuration
ENVIRONMENT=$1
NAMESPACE=${2:-"site-monitor-$ENVIRONMENT"}
DOCKER_USERNAME=${DOCKER_USERNAME:-"yourusername"}
RELEASE_NAME="site-monitor"
CHART_DIR="./helm/site-monitor"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: dev, staging, prod"
    exit 1
fi

# Set values file based on environment
VALUES_FILE="$CHART_DIR/values-$ENVIRONMENT.yaml"
if [ ! -f "$VALUES_FILE" ]; then
    echo "Values file not found: $VALUES_FILE"
    exit 1
fi

# Check if kubectl and helm are installed
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is not installed. Please install it and try again."
    exit 1
fi

if ! command -v helm &> /dev/null; then
    echo "helm is not installed. Please install it and try again."
    exit 1
fi

# Check if the namespace exists, create it if it doesn't
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo "Creating namespace $NAMESPACE..."
    kubectl create namespace "$NAMESPACE"
fi

# Switch to the namespace
kubectl config set-context --current --namespace="$NAMESPACE"

# Add Helm repositories if needed
echo "Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Deploy the application using Helm
echo "Deploying Site Monitor to $ENVIRONMENT environment in namespace $NAMESPACE..."

# Set custom values
CUSTOM_VALUES=(
    "--set" "image.repository=${DOCKER_USERNAME}/site-monitor-app"
)

# Additional values for each environment
if [ "$ENVIRONMENT" == "prod" ]; then
    CUSTOM_VALUES+=(
        "--set" "appConfig.env=production"
        "--set" "secrets.secretKey=${SECRET_KEY:-changeme-in-production}"
    )
elif [ "$ENVIRONMENT" == "staging" ]; then
    CUSTOM_VALUES+=(
        "--set" "appConfig.env=staging"
        "--set" "secrets.secretKey=${SECRET_KEY:-changeme-in-staging}"
    )
else  # dev
    CUSTOM_VALUES+=(
        "--set" "appConfig.env=development"
        "--set" "secrets.secretKey=${SECRET_KEY:-dev-key-for-site-monitor}"
    )
fi

# Install/upgrade the Helm chart
helm upgrade --install "$RELEASE_NAME" "$CHART_DIR" \
    --namespace "$NAMESPACE" \
    --values "$VALUES_FILE" \
    "${CUSTOM_VALUES[@]}" \
    --timeout 10m

echo "Deployment completed successfully!"
echo ""
echo "To access the Site Monitor UI:"
echo "kubectl port-forward -n $NAMESPACE svc/$RELEASE_NAME 8080:80"
echo "Then open http://localhost:8080 in your browser"
echo ""
echo "To access Grafana:"
echo "kubectl port-forward -n $NAMESPACE svc/$RELEASE_NAME-grafana 3000:80"
echo "Then open http://localhost:3000 in your browser"
echo "Default credentials: admin / admin"