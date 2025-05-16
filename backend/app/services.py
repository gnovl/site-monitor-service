import requests
import time
from datetime import datetime
from prometheus_client import Counter, Gauge, Histogram
import threading
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('site_monitor')

# Prometheus metrics
REQUEST_COUNT = Counter('site_monitor_requests_total', 'Total site monitor requests', ['site', 'status'])
RESPONSE_TIME = Histogram('site_monitor_response_time_seconds', 'Response time in seconds', ['site'])
SITE_UP = Gauge('site_monitor_up', 'Site up status (1 for up, 0 for down)', ['site'])

# In-memory storage
sites = {}
site_id_counter = 1
monitoring_threads = {}  # Keep track of monitoring threads
site_lock = threading.RLock()  # For thread-safe access to sites dictionary

def check_site(site):
    """Check a site's status and update its metrics."""
    start_time = time.time()
    try:
        logger.info(f"Checking site {site.id}: {site.url}")
        response = requests.get(site.url, timeout=10)
        response_time = time.time() - start_time
        status_code = response.status_code
        
        with site_lock:
            if site.id not in sites:
                logger.warning(f"Site {site.id} no longer exists, canceling check")
                return False  # Site was deleted
            
            site.status = f"OK ({status_code})" if response.ok else f"Error ({status_code})"
            site.response_time = round(response_time * 1000, 2)  # Convert to ms
            site.last_checked = datetime.now().isoformat()
            logger.info(f"Site {site.id} checked: {site.status}, response time: {site.response_time}ms")
        
        # Update Prometheus metrics
        REQUEST_COUNT.labels(site=site.url, status=str(status_code)).inc()
        RESPONSE_TIME.labels(site=site.url).observe(response_time)
        SITE_UP.labels(site=site.url).set(1 if response.ok else 0)
        
        return True
    except Exception as e:
        logger.error(f"Error checking site {site.id} - {site.url}: {str(e)}")
        
        with site_lock:
            if site.id not in sites:
                return False  # Site was deleted
                
            site.status = f"Error: {str(e)}"
            site.response_time = 0
            site.last_checked = datetime.now().isoformat()
        
        # Update Prometheus metrics
        REQUEST_COUNT.labels(site=site.url, status="error").inc()
        SITE_UP.labels(site=site.url).set(0)
        
        return False

def add_site(url, name=None, check_interval=60):
    """Add a new site to monitor."""
    global site_id_counter
    
    # Ensure check_interval is an integer and has a reasonable minimum value
    try:
        check_interval = int(check_interval)
        if check_interval < 10:  # Set a minimum value
            check_interval = 10
    except (ValueError, TypeError):
        check_interval = 60  # Default if invalid
    
    logger.info(f"Adding new site: {url}, check interval: {check_interval}s")
    
    with site_lock:
        site_id = site_id_counter
        site_id_counter += 1
        
        new_site = Site(site_id, url, name, check_interval)
        sites[site_id] = new_site
    
    # Perform initial check
    check_site(new_site)
    
    # Start monitoring thread for this site
    start_monitoring(new_site)
    
    return new_site

def get_site(site_id):
    """Get a site by ID."""
    with site_lock:
        return sites.get(site_id)

def get_all_sites():
    """Get all monitored sites."""
    with site_lock:
        return list(sites.values())

def delete_site(site_id):
    """Delete a site by ID."""
    logger.info(f"Deleting site {site_id}")
    with site_lock:
        if site_id in sites:
            # First remove from the sites dictionary to stop monitoring
            del sites[site_id]
            
            # Stop the monitoring thread if it exists
            if site_id in monitoring_threads:
                logger.info(f"Stopping monitoring thread for site {site_id}")
                monitoring_threads[site_id].stop()
                del monitoring_threads[site_id]
                
            return True
    return False

def update_site(site_id, url=None, name=None, check_interval=None):
    """Update a site's details."""
    with site_lock:
        site = sites.get(site_id)
        if not site:
            return None
        
        if url:
            logger.info(f"Updating site {site_id} URL from {site.url} to {url}")
            site.url = url
        if name:
            logger.info(f"Updating site {site_id} name from {site.name} to {name}")
            site.name = name
        
        # If check interval changed, restart the monitoring thread
        if check_interval is not None:
            try:
                check_interval = int(check_interval)
                if check_interval < 10:  # Set a minimum value
                    check_interval = 10
            except (ValueError, TypeError):
                check_interval = site.check_interval  # Keep existing if invalid
                
            if check_interval != site.check_interval:
                logger.info(f"Updating site {site_id} check interval from {site.check_interval}s to {check_interval}s")
                site.check_interval = check_interval
                
                # Restart monitoring with new interval
                if site_id in monitoring_threads:
                    logger.info(f"Restarting monitoring thread for site {site_id}")
                    monitoring_threads[site_id].stop()
                    start_monitoring(site)
        
    # Re-check site with new parameters
    check_site(site)
    
    return site

class MonitoringThread:
    """Thread class for monitoring a site at regular intervals."""
    def __init__(self, site):
        self.site = site
        self.stop_event = threading.Event()
        self.thread = threading.Thread(target=self._monitor_site, name=f"monitor-{site.id}")
        self.thread.daemon = True
        logger.info(f"Created monitoring thread for site {site.id} with interval {site.check_interval}s")
    
    def start(self):
        """Start the monitoring thread."""
        logger.info(f"Starting monitoring thread for site {self.site.id}")
        self.thread.start()
    
    def stop(self):
        """Signal the thread to stop."""
        logger.info(f"Stopping monitoring thread for site {self.site.id}")
        self.stop_event.set()
        
    def _monitor_site(self):
        """Main monitoring loop."""
        logger.info(f"Monitoring thread for site {self.site.id} started")
        while not self.stop_event.is_set():
            try:
                # Check if site still exists
                with site_lock:
                    if self.site.id not in sites:
                        logger.warning(f"Site {self.site.id} no longer exists, stopping monitoring")
                        break
                
                # Get the current check interval (it might have changed)
                current_interval = self.site.check_interval
                
                # Check the site
                check_site(self.site)
                
                # Sleep for the check_interval, but can be interrupted if stop is called
                # Use small sleep increments to respond quickly to stop events
                sleep_time = 0
                while sleep_time < current_interval and not self.stop_event.is_set():
                    # Sleep in small increments (1 second) to be more responsive to stop signals
                    time.sleep(min(1, current_interval - sleep_time))
                    sleep_time += 1
                    
            except Exception as e:
                logger.error(f"Error in monitoring thread for site {self.site.id}: {str(e)}")
                # Sleep a bit to avoid tight error loops
                time.sleep(5)
        
        logger.info(f"Monitoring thread for site {self.site.id} stopped")

def start_monitoring(site):
    """Start a monitoring thread for a site."""
    with site_lock:
        # Stop existing monitoring thread if any
        if site.id in monitoring_threads:
            monitoring_threads[site.id].stop()
        
        # Create and start new monitoring thread
        monitor = MonitoringThread(site)
        monitoring_threads[site.id] = monitor
        monitor.start()

# Site class
class Site:
    """Represents a website being monitored."""
    def __init__(self, id, url, name=None, check_interval=60):
        self.id = id
        self.url = url
        self.name = name or url
        self.check_interval = int(check_interval)
        self.status = "Unknown"
        self.response_time = 0
        self.last_checked = None
        
    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "url": self.url,
            "name": self.name,
            "check_interval": self.check_interval,
            "status": self.status,
            "response_time": self.response_time,
            "last_checked": self.last_checked
        }