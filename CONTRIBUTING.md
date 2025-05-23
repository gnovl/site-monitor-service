# Contributing to Site Monitor Pro

Thank you for considering contributing to Site Monitor Pro! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Environment Setup](#development-environment-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)
- [DevOps Practices](#devops-practices)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Environment Setup

### Prerequisites

- Python 3.9+
- Docker and Docker Compose
- kubectl (for Kubernetes deployment)
- Helm (for Kubernetes package management)
- Make

### Setting Up Local Development Environment

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/site-monitor-pro.git
   cd site-monitor-pro
   ```

2. Install Python dependencies:

   ```bash
   cd backend
   python -m pip install -r requirements.txt
   python -m pip install -r requirements-dev.txt  # Development dependencies
   ```

3. Run the application locally:

   ```bash
   python run.py
   ```

4. Alternatively, use Docker Compose:

   ```bash
   docker-compose up -d
   ```

## Development Workflow

We follow a standard Git workflow with feature branches:

1. Create a new branch for each feature or bug fix:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number-bug-description
   ```

2. Make your changes, adhering to our code style.

3. Test your changes:

   ```bash
   make test
   ```

4. Format and lint your code:

   ```bash
   make format
   make lint
   ```

5. Run security checks:

   ```bash
   make security
   ```

6. Commit your changes with a descriptive message:

   ```bash
   git commit -m "Add feature: description of your feature"
   ```

7. Push your branch and create a pull request:

   ```bash
   git push origin feature/your-feature-name
   ```

## Testing

The project uses pytest for testing. To run tests:

```bash
make test
```

For test coverage:

```bash
make test-coverage
```

## Pull Request Process

1. Ensure your code passes all tests, linting, and security checks.
2. Update documentation if necessary.
3. Fill out the pull request template with all relevant information.
4. Request a review from at least one maintainer.
5. Address any feedback from reviewers.
6. Once approved, a maintainer will merge your PR.

## Style Guide

We follow standard Python style conventions:

- We use [Black](https://github.com/psf/black) for code formatting
- We follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- We use [isort](https://github.com/PyCQA/isort) for sorting imports
- Docstrings follow the [Google style](https://google.github.io/styleguide/pyguide.html)

## DevOps Practices

For changes to infrastructure or deployment processes:

1. **Infrastructure as Code (IaC)**:

   - All infrastructure changes must be done via Terraform or Kubernetes manifests
   - Test changes in the dev environment before applying to production

2. **CI/CD Pipeline**:

   - The GitHub Actions workflow will automatically run tests and checks on your PR
   - Ensure your changes don't break the CI/CD pipeline

3. **Monitoring and Observability**:

   - Ensure important functions are properly logged with structured logging
   - Add Prometheus metrics for new features where appropriate
   - Update Grafana dashboards if necessary

4. **Security**:

   - Address any security issues identified by automated scans
   - Follow the principle of least privilege
   - Never commit secrets or credentials

5. **Documentation**:
   - Update API documentation for any API changes
   - Update infrastructure documentation for infrastructure changes
   - Keep the README and other docs up to date

## Get Help

If you need help, you can:

- Open an issue on GitHub
- Contact the maintainers via email
- Join our community chat

Thank you for contributing to Site Monitor Pro!
