from flask import Flask
from flask_cors import CORS
from prometheus_client import make_wsgi_app
from werkzeug.middleware.dispatcher import DispatcherMiddleware
import os
import logging
from app.logging_config import configure_logging
from app.config import get_config

# Optional imports - only import if available
try:
    from flasgger import Swagger
    SWAGGER_AVAILABLE = True
except ImportError:
    SWAGGER_AVAILABLE = False

try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    LIMITER_AVAILABLE = True
except ImportError:
    LIMITER_AVAILABLE = False

# Create limiter for rate limiting if available
limiter = None
if LIMITER_AVAILABLE:
    def is_health_check():
        """Function to identify health check endpoints that should be exempt from rate limiting"""
        from flask import request
        # Check if the current request is to a health check endpoint
        return request.endpoint in ['api.health_check', 'api.detailed_health_check']
    
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["100 per hour"],
        storage_uri="memory://",
        # Exempt health check endpoints from rate limiting
        exempt_when=is_health_check
    )

def create_app(config_name=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Load configuration
    config = get_config()
    config.init_app(app)
    
    # Initialize rate limiting if available
    if limiter and app.config.get('RATELIMIT_ENABLED', True):
        limiter.init_app(app)
        app.logger.info(f"Rate limiting enabled: {app.config.get('RATELIMIT_DEFAULT')} (health checks exempt)")
    
    # Add prometheus wsgi middleware to route /metrics requests
    app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
        '/metrics': make_wsgi_app()
    })
    
    # Configure Jinja to not trim blocks (helps with whitespace control)
    app.jinja_env.trim_blocks = False
    app.jinja_env.lstrip_blocks = False
    
    # Register the blueprints
    from app.routes import api_bp
    app.register_blueprint(api_bp)
    
    # Configure logging
    configure_logging(app)
    
    # Initialize Swagger documentation if available
    if SWAGGER_AVAILABLE:
        swagger_config = {
            "headers": [],
            "specs": [
                {
                    "endpoint": "apispec",
                    "route": "/apispec.json",
                    "rule_filter": lambda rule: True,  # all in
                    "model_filter": lambda tag: True,  # all in
                }
            ],
            "static_url_path": "/flasgger_static",
            "swagger_ui": True,
            "specs_route": "/docs/"
        }
        
        swagger_template = {
            "info": {
                "title": "Site Monitor Pro API",
                "description": "API for monitoring websites and collecting performance metrics",
                "version": app.config.get('APP_VERSION', '0.1.0'),
                "contact": {
                    "name": "DevOps Team",
                    "url": "https://github.com/gnovl/site-monitor-service",
                },
            }
        }
        
        Swagger(app, config=swagger_config, template=swagger_template)
        app.logger.info("API documentation initialized at /docs/")
    else:
        app.logger.info("Swagger not available - API documentation disabled")
    
    # Log application startup
    app.logger.info(f"Site Monitor Pro started in {app.config.get('ENV')} environment (v{app.config.get('APP_VERSION')})")
    
    return app