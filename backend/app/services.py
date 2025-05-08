import requests
import time
from datetime import datetime
from prometheus_client import Counter, Gauge, Histogram
import threading
import logging

# Prometheus metrics
REQUEST_COUNT = Counter('site_monitor_requests_total', 'Total site monitor requests', ['site', 'status'])
RESPONSE_TIME = Histogram('site_monitor_response_time_seconds', 'Response time in seconds', ['site'])
SITE_UP = Gauge('site_monitor_up', 'Site up status (1 for up, 0 for down)', ['site'])

# In-memory storage
sites = {}
site_id_counter = 1

def check_site(site):
    start_time = time.time()
    try:
        response = requests.get(site.url, timeout=10)
        response_time = time.time() - start_time
        status_code = response.status_code
        
        site.status = f"OK ({status_code})" if response.ok else f"Error ({status_code})"
        site.response_time = round(response_time * 1000, 2)  # Convert to ms
        site.last_checked = datetime.now().isoformat()
        
        # Update Prometheus metrics
        REQUEST_COUNT.labels(site=site.url, status=status_code).inc()
        RESPONSE_TIME.labels(site=site.url).observe(response_time)
        SITE_UP.labels(site=site.url).set(1 if response.ok else 0)
        
        return True
    except Exception as e:
        logging.error(f"Error checking {site.url}: {str(e)}")
        site.status = f"Error: {str(e)}"
        site.response_time = 0
        site.last_checked = datetime.now().isoformat()
        
        # Update Prometheus metrics
        REQUEST_COUNT.labels(site=site.url, status="error").inc()
        SITE_UP.labels(site=site.url).set(0)
        
        return False

def add_site(url, name=None, check_interval=60):
    global site_id_counter
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
    return sites.get(site_id)

def get_all_sites():
    return list(sites.values())

def delete_site(site_id):
    if site_id in sites:
        del sites[site_id]
        return True
    return False

def update_site(site_id, url=None, name=None, check_interval=None):
    site = get_site(site_id)
    if not site:
        return None
    
    if url:
        site.url = url
    if name:
        site.name = name
    if check_interval:
        site.check_interval = check_interval
    
    # Re-check site with new parameters
    check_site(site)
    
    return site

def start_monitoring(site):
    def monitor_site():
        while site.id in sites:
            check_site(site)
            time.sleep(site.check_interval)
    
    thread = threading.Thread(target=monitor_site)
    thread.daemon = True
    thread.start()

# Add the Site class (missed in the previous definition)
class Site:
    def __init__(self, id, url, name=None, check_interval=60):
        self.id = id
        self.url = url
        self.name = name or url
        self.check_interval = check_interval
        self.status = "Unknown"
        self.response_time = 0
        self.last_checked = None
        
    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "name": self.name,
            "check_interval": self.check_interval,
            "status": self.status,
            "response_time": self.response_time,
            "last_checked": self.last_checked
        }