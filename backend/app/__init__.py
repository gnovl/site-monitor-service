from flask import Flask
from flask_cors import CORS
from prometheus_client import make_wsgi_app
from werkzeug.middleware.dispatcher import DispatcherMiddleware
import os
from app.logging_config import configure_logging

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Set a secret key for flashing messages
    app.secret_key = os.environ.get('SECRET_KEY', 'dev_key_for_site_monitor')
    
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
    
    return app