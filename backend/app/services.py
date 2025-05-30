import requests
import time
from datetime import datetime
from prometheus_client import Counter, Gauge, Histogram
import threading
import logging
from collections import deque

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
site_history = {}  # Store history for each site

def check_site(site):
    """Check a site's status and update its metrics. Each call should add exactly 1 history entry."""
    start_time = time.time()
    
    logger.info(f"Starting check for site {site.id}: {site.url}")
    
    # Get current history count before check
    with site_lock:
        if site.id not in sites:
            logger.warning(f"Site {site.id} no longer exists, canceling check")
            return False
        
        pre_check_count = len(site_history.get(site.id, []))
        logger.info(f"Site {site.id} has {pre_check_count} history entries before check")
    
    try:
        response = requests.get(site.url, timeout=10)
        response_time = time.time() - start_time
        status_code = response.status_code
        
        with site_lock:
            if site.id not in sites:
                logger.warning(f"Site {site.id} no longer exists during check, canceling")
                return False
            
            # Update site status
            site.status = f"OK ({status_code})" if response.ok else f"Error ({status_code})"
            site.response_time = round(response_time * 1000, 2)  # Convert to ms
            site.last_checked = datetime.now().isoformat()
            
            # Ensure history exists for this site
            if site.id not in site_history:
                site_history[site.id] = deque(maxlen=50)
                logger.warning(f"History was missing for site {site.id}, recreated")
            
            # Add exactly ONE history entry
            add_to_history(site.id, site.status, site.response_time)
            
            # Verify history count increased by exactly 1
            post_check_count = len(site_history[site.id])
            expected_count = pre_check_count + 1
            
            if post_check_count == expected_count:
                logger.info(f"SUCCESS: Site {site.id} history count correctly increased from {pre_check_count} to {post_check_count}")
            else:
                logger.error(f"ERROR: Site {site.id} history count should be {expected_count} but is {post_check_count}")
            
            logger.info(f"Site {site.id} checked successfully: {site.status}, response time: {site.response_time}ms")
        
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
                
            # Update site with error status
            site.status = f"Error: {str(e)}"
            site.response_time = 0
            site.last_checked = datetime.now().isoformat()
            
            # Ensure history exists for this site
            if site.id not in site_history:
                site_history[site.id] = deque(maxlen=50)
                logger.warning(f"History was missing for site {site.id}, recreated")
            
            # Add exactly ONE history entry for the error
            add_to_history(site.id, site.status, site.response_time)
            
            # Verify history count increased by exactly 1
            post_check_count = len(site_history[site.id])
            expected_count = pre_check_count + 1
            
            if post_check_count == expected_count:
                logger.info(f"SUCCESS: Site {site.id} error history count correctly increased from {pre_check_count} to {post_check_count}")
            else:
                logger.error(f"ERROR: Site {site.id} error history count should be {expected_count} but is {post_check_count}")
        
        # Update Prometheus metrics
        REQUEST_COUNT.labels(site=site.url, status="error").inc()
        SITE_UP.labels(site=site.url).set(0)
        
        return False

def add_to_history(site_id, status, response_time):
    """Add a check result to the site's history."""
    with site_lock:
        if site_id not in site_history:
            site_history[site_id] = deque(maxlen=50)  # Keep last 50 checks
        
        history_entry = {
            'timestamp': datetime.now().isoformat(),
            'status': status,
            'response_time': response_time
        }
        
        site_history[site_id].append(history_entry)
        logger.info(f"Added history entry for site {site_id}: {status}, {response_time}ms. Total entries: {len(site_history[site_id])}")

def get_site_history(site_id, limit=20):
    """Get the history for a specific site."""
    with site_lock:
        if site_id not in site_history:
            logger.warning(f"No history found for site {site_id}")
            return []
        
        # Convert deque to list and return most recent entries first
        history = list(site_history[site_id])
        history.reverse()  # Most recent first
        result = history[:limit]
        logger.info(f"Retrieved {len(result)} history entries for site {site_id} (total available: {len(history)})")
        return result

def calculate_uptime_percentage(site_id):
    """Calculate the uptime percentage based on history."""
    with site_lock:
        if site_id not in site_history or len(site_history[site_id]) == 0:
            logger.info(f"No history for uptime calculation for site {site_id}, returning 100%")
            return 100.0
        
        history = list(site_history[site_id])
        total_checks = len(history)
        successful_checks = sum(1 for check in history if check['status'].startswith('OK'))
        
        uptime = round((successful_checks / total_checks) * 100, 2)
        logger.info(f"Calculated uptime for site {site_id}: {uptime}% ({successful_checks}/{total_checks})")
        return uptime

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
        
        # Initialize empty history for this site immediately
        site_history[site_id] = deque(maxlen=50)
        logger.info(f"Initialized empty history for site {site_id}")
    
    # Perform initial check - this should add exactly 1 history entry
    logger.info(f"Performing initial check for site {site_id}")
    check_result = check_site(new_site)
    
    # Verify exactly 1 history entry was created
    with site_lock:
        history_count = len(site_history.get(site_id, []))
        logger.info(f"After initial check, site {site_id} has {history_count} history entries. Check result: {check_result}")
        
        if history_count != 1:
            logger.error(f"UNEXPECTED: Site {site_id} should have exactly 1 history entry after initial check, but has {history_count}")
    
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
            
            # Remove history
            if site_id in site_history:
                del site_history[site_id]
                
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
        
        # Wait for the check interval before the first automatic check
        # This prevents duplicate checks when a site is first added
        initial_wait = 0
        while initial_wait < self.site.check_interval and not self.stop_event.is_set():
            time.sleep(min(1, self.site.check_interval - initial_wait))
            initial_wait += 1
        
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