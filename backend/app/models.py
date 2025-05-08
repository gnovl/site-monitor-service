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