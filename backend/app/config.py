import os
from datetime import timedelta

class Config:
    """Base configuration class."""
    # App settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_key_for_site_monitor')
    APP_VERSION = os.environ.get('APP_VERSION', '0.1.0')
    
    # Monitoring settings
    DEFAULT_CHECK_INTERVAL = int(os.environ.get('DEFAULT_CHECK_INTERVAL', '60'))
    MIN_CHECK_INTERVAL = int(os.environ.get('MIN_CHECK_INTERVAL', '10'))
    
    # Performance settings
    DEFAULT_TIMEOUT = int(os.environ.get('REQUEST_TIMEOUT', '10'))
    DEFAULT_RESPONSE_TIME_THRESHOLD = int(os.environ.get('RESPONSE_TIME_THRESHOLD', '1000'))
    
    # Logging settings
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    
    # OpenTelemetry settings
    OTLP_ENDPOINT = os.environ.get('OTLP_ENDPOINT')
    
    # Cache settings (if implemented)
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes
    
    # Rate limiting - more generous defaults for cloud platforms
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = "1000/hour"  # Increased default limit
    
    @classmethod
    def init_app(cls, app):
        app.config.from_object(cls)

class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True
    # Override base configuration for development environment
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'DEBUG')
    CACHE_DEFAULT_TIMEOUT = 60  # 1 minute for dev
    RATELIMIT_ENABLED = False  # Disable rate limiting in development

class TestingConfig(Config):
    """Testing environment configuration."""
    TESTING = True
    # Override base configuration for testing environment
    DEFAULT_CHECK_INTERVAL = 1  # Faster for tests
    DEFAULT_TIMEOUT = 1  # Faster for tests
    RATELIMIT_ENABLED = False  # Disable rate limiting for tests

class ProductionConfig(Config):
    """Production environment configuration."""
    # More generous rate limiting for production with cloud health checks
    RATELIMIT_DEFAULT = "2000/hour"  # Higher limit for production to handle health checks
    
    # More conservative settings for production
    MIN_CHECK_INTERVAL = int(os.environ.get('MIN_CHECK_INTERVAL', '30'))  # More conservative min interval
    
    # Enable caching in production for better performance
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = os.environ.get('REDIS_URL')
    CACHE_DEFAULT_TIMEOUT = 600  # 10 minutes for production
    
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        
        # Configure additional production-specific settings
        # For example, configure Sentry for error reporting if SENTRY_DSN is provided
        sentry_dsn = os.environ.get('SENTRY_DSN')
        if sentry_dsn:
            import sentry_sdk
            from sentry_sdk.integrations.flask import FlaskIntegration
            
            sentry_sdk.init(
                dsn=sentry_dsn,
                integrations=[FlaskIntegration()],
                environment="production",
                release=cls.APP_VERSION
            )

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'staging': ProductionConfig,  # Staging uses the same config as production but with different env vars
    
    # Default configuration
    'default': DevelopmentConfig
}

def get_config():
    """Get the appropriate configuration class based on the environment."""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])