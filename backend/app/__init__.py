from flask import Flask
from flask_cors import CORS
from prometheus_client import make_wsgi_app
from werkzeug.middleware.dispatcher import DispatcherMiddleware
import os

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Add prometheus wsgi middleware to route /metrics requests
    app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
        '/metrics': make_wsgi_app()
    })
    
    from app.routes import api_bp
    app.register_blueprint(api_bp)
    
    return app