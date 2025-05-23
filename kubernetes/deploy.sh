#!/bin/bash
# This script deploys the Site Monitor application to a Kubernetes cluster

set -e

# Configuration
NAMESPACE=${NAMESPACE:-"site-monitor"}
DOCKER_USERNAME=${DOCKER_USERNAME:-"yourusername"}
ENVIRONMENT=${ENVIRONMENT:-"dev"}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is not installed. Please install it and try again."
    exit 1
fi

# Check if the namespace exists, create it if it doesn't
if ! kubectl get namespace ${NAMESPACE} &> /dev/null; then
    echo "Creating namespace ${NAMESPACE}..."
    kubectl create namespace ${NAMESPACE}
fi

# Switch to the namespace
kubectl config set-context --current --namespace=${NAMESPACE}

# Create configmaps and secrets
echo "Creating ConfigMaps and Secrets..."

# Replace the Docker username in the manifests
sed -i "s/\${DOCKER_USERNAME}/${DOCKER_USERNAME}/g" kubernetes/app.yaml

# Apply the manifests
echo "Applying Kubernetes manifests..."
kubectl apply -f kubernetes/app.yaml
kubectl apply -f kubernetes/monitoring.yaml

# Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/site-monitor
kubectl rollout status deployment/prometheus
kubectl rollout status deployment/grafana

echo "Deployment completed successfully!"
echo ""
echo "To access the Site Monitor UI:"
echo "kubectl port-forward svc/site-monitor 8080:80"
echo "Then open http://localhost:8080 in your browser"
echo ""
echo "To access Prometheus:"
echo "kubectl port-forward svc/prometheus 9090:9090"
echo "Then open http://localhost:9090 in your browser"
echo ""
echo "To access Grafana:"
echo "kubectl port-forward svc/grafana 3000:3000"
echo "Then open http://localhost:3000 in your browser"
echo "Username: admin, Password: password"