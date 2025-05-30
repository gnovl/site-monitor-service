from datetime import datetime

class Site:
    def __init__(self, id, url, name=None, check_interval=60):
        self.id = id
        self.url = url
        self.name = name or url
        self.check_interval = check_interval
        self.status = "Unknown"
        self.response_time = 0
        self.last_checked = None
        # New: History tracking - store last 10 check results
        self.history = []  # List of {"timestamp": "...", "status": "...", "response_time": 0}
        
    def add_to_history(self, status, response_time):
        """Add a new check result to the history, keeping only the last 10 entries."""
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "status": status,
            "response_time": response_time
        }
        
        # Add to the beginning of the list (most recent first)
        self.history.insert(0, history_entry)
        
        # Keep only the last 10 entries
        if len(self.history) > 10:
            self.history = self.history[:10]
    
    def get_uptime_percentage(self):
        """Calculate uptime percentage based on history."""
        if not self.history:
            return 0
        
        successful_checks = sum(1 for entry in self.history if entry["status"].startswith("OK"))
        return round((successful_checks / len(self.history)) * 100, 1)
        
    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "name": self.name,
            "check_interval": self.check_interval,
            "status": self.status,
            "response_time": self.response_time,
            "last_checked": self.last_checked,
            "history": self.history,
            "uptime_percentage": self.get_uptime_percentage()
        }