import logging
import os
from logging.handlers import RotatingFileHandler

def configure_logging(app):
    """Configure logging for the Flask application."""
    # Set log level based on environment
    log_level = logging.DEBUG if app.config.get('DEBUG') else logging.INFO
    
    # Create formatter
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )
    
    # Configure root logger for console output
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(log_level)
    
    # Add handler to the root logger
    app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)
    
    # If we're not running in a cloud environment, also log to file
    if not os.environ.get('RENDER') and not os.environ.get('KUBERNETES_SERVICE_HOST'):
        # Ensure log directory exists
        log_dir = os.path.join(os.path.dirname(app.instance_path), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        # Create file handler
        file_handler = RotatingFileHandler(
            os.path.join(log_dir, 'site_monitor.log'),
            maxBytes=10485760,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(log_level)
        
        # Add file handler to the app logger
        app.logger.addHandler(file_handler)
    
    # Log app startup
    app.logger.info('Site Monitor Pro startup')
    
    return app