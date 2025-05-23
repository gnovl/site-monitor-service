import logging
import os
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger
import datetime

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        
        # Add timestamp
        log_record['timestamp'] = datetime.datetime.now().isoformat()
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        
        # Add application name
        log_record['app'] = 'site-monitor-pro'
        
        # Add environment
        log_record['environment'] = os.environ.get('FLASK_ENV', 'development')
        
        # Add trace context if available
        if hasattr(record, 'trace_id'):
            log_record['trace_id'] = record.trace_id
        if hasattr(record, 'span_id'):
            log_record['span_id'] = record.span_id

def configure_logging(app):
    """Configure logging for the Flask application."""
    # Set log level based on environment
    log_level = logging.DEBUG if app.config.get('DEBUG') else logging.INFO
    
    # Create formatters
    json_formatter = CustomJsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
    text_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )
    
    # Configure root logger for console output
    console_handler = logging.StreamHandler()
    
    # Use JSON formatter in production, text formatter in development
    if os.environ.get('FLASK_ENV') == 'production':
        console_handler.setFormatter(json_formatter)
    else:
        console_handler.setFormatter(text_formatter)
        
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
        
        # Always use JSON formatter for file logging
        file_handler.setFormatter(json_formatter)
        file_handler.setLevel(log_level)
        
        # Add file handler to the app logger
        app.logger.addHandler(file_handler)
    
    # Log app startup
    app.logger.info('Site Monitor Pro startup', extra={
        'event': 'app_startup',
        'version': os.environ.get('APP_VERSION', 'unknown')
    })
    
    return app