from flask import Blueprint, jsonify, request, render_template, redirect, url_for, flash, current_app
from app.services import add_site as service_add_site, get_site, get_all_sites, delete_site as service_delete_site, update_site, check_site as service_check_site
from datetime import datetime
import json
from urllib.parse import quote
from flasgger import swag_from

# Import limiter to exempt specific routes
try:
    from app import limiter
    LIMITER_AVAILABLE = True
except ImportError:
    LIMITER_AVAILABLE = False
    limiter = None

api_bp = Blueprint('api', __name__, template_folder='templates')

# Format the last checked time in a user-friendly way
def format_last_checked(iso_string):
    if not iso_string:
        return None
    
    date = datetime.fromisoformat(iso_string)
    now = datetime.now()
    yesterday = datetime.now().replace(day=now.day-1) if now.day > 1 else datetime.now().replace(month=now.month-1 if now.month > 1 else 12, day=31)
    
    # Check if the date is today
    if date.date() == now.date():
        return f"Today at {date.strftime('%I:%M %p')}"
    
    # Check if the date is yesterday
    if date.date() == yesterday.date():
        return f"Yesterday at {date.strftime('%I:%M %p')}"
    
    # If it's within the last 7 days, show the day name
    days_diff = (now.date() - date.date()).days
    if days_diff < 7:
        return f"{date.strftime('%A')} at {date.strftime('%I:%M %p')}"
    
    # Otherwise, show the date in a readable format
    return f"{date.strftime('%b %d')} at {date.strftime('%I:%M %p')}"

# Generate embeddable status badge for a site
def generate_status_badge(site):
    status_text = site.status.replace('(', '').replace(')', '').replace(' ', '%20')
    status_color = 'green' if site.status.startswith('OK') else 'red'
    return f"https://img.shields.io/badge/status-{status_text}-{status_color}"

# Web routes for the frontend
@api_bp.route('/', methods=['GET'])
def index():
    error = request.args.get('error')
    sites = get_all_sites()
    
    # Prepare data for the template
    sites_with_formatted_dates = []
    for site in sites:
        site_dict = site.to_dict()
        site_dict['last_checked_formatted'] = format_last_checked(site.last_checked) if site.last_checked else None
        sites_with_formatted_dates.append(site_dict)
    
    # Count sites up and down
    sites_up = sum(1 for site in sites if site.status.startswith('OK'))
    sites_down = len(sites) - sites_up
    
    # Prepare chart data
    chart_data = []
    for site in sites:
        chart_data.append({
            'id': site.id,
            'name': site.name or site.url,
            'url': site.url,
            'response_time': site.response_time,
            'status': site.status
        })
    
    return render_template('index.html', 
                          sites=sites_with_formatted_dates, 
                          sites_count=len(sites),
                          sites_up=sites_up,
                          sites_down=sites_down,
                          chart_data=chart_data,
                          error=error,
                          current_year=datetime.now().year)

@api_bp.route('/site/<int:site_id>', methods=['GET'])
def site_details(site_id):
    site = get_site(site_id)
    if not site:
        return redirect(url_for('api.index', error="Site not found"))
    
    site_dict = site.to_dict()
    site_dict['last_checked_formatted'] = format_last_checked(site.last_checked) if site.last_checked else None
    
    badge_url = generate_status_badge(site)
    
    return render_template('site_details.html', 
                          site=site_dict, 
                          badge_url=badge_url,
                          sites_count=len(get_all_sites()),
                          current_year=datetime.now().year)

@api_bp.route('/site/<int:site_id>/check', methods=['GET'])
def check_site_route(site_id):
    site = get_site(site_id)
    if not site:
        return redirect(url_for('api.index', error="Site not found"))
    
    # Use the service to check only this specific site
    service_check_site(site)
    return redirect(url_for('api.site_details', site_id=site_id))

@api_bp.route('/site/<int:site_id>/delete', methods=['GET'])
def delete_site(site_id):
    success = service_delete_site(site_id)
    if not success:
        return redirect(url_for('api.index', error="Site not found"))
    
    return redirect(url_for('api.index'))

# API routes with Swagger documentation
@api_bp.route('/api/sites', methods=['GET'])
@swag_from({
    'tags': ['Sites'],
    'summary': 'Get all monitored sites',
    'description': 'Returns a list of all sites being monitored',
    'responses': {
        200: {
            'description': 'List of monitored sites',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'url': {'type': 'string'},
                        'name': {'type': 'string'},
                        'check_interval': {'type': 'integer'},
                        'status': {'type': 'string'},
                        'response_time': {'type': 'number'},
                        'last_checked': {'type': 'string'},
                        'last_checked_formatted': {'type': 'string'}
                    }
                }
            }
        }
    }
})
def get_sites_api():
    sites = get_all_sites()
    response = []
    
    for site in sites:
        site_dict = site.to_dict()
        site_dict['last_checked_formatted'] = format_last_checked(site.last_checked) if site.last_checked else None
        response.append(site_dict)
    
    return jsonify(response)

@api_bp.route('/api/sites', methods=['POST'])
@swag_from({
    'tags': ['Sites'],
    'summary': 'Add a new site to monitor',
    'description': 'Adds a new site to the monitoring list',
    'parameters': [
        {
            'name': 'site',
            'in': 'body',
            'schema': {
                'type': 'object',
                'required': ['url'],
                'properties': {
                    'url': {'type': 'string', 'description': 'URL to monitor'},
                    'name': {'type': 'string', 'description': 'Custom name for the site (optional)'},
                    'check_interval': {'type': 'integer', 'description': 'Check interval in seconds (optional, default 60)'}
                }
            }
        }
    ],
    'responses': {
        201: {
            'description': 'Site added successfully'
        },
        400: {
            'description': 'Invalid input'
        }
    }
})
def create_site_api():
    # Handle both JSON and form data
    if request.is_json:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({"error": "URL is required"}), 400
        url = data['url']
        name = data.get('name')
        check_interval = data.get('check_interval', 60)
    else:
        # Handle form data from the modal
        url = request.form.get('url')
        name = request.form.get('name')
        check_interval = request.form.get('check_interval', 60)
        
        if not url:
            return "URL is required", 400
    
    try:
        site = service_add_site(url, name, check_interval)
        current_app.logger.info(f"New site added: {url}")
        
        if request.is_json:
            return jsonify(site.to_dict()), 201
        else:
            # For form submissions, return success message
            return "Site added successfully", 200
            
    except Exception as e:
        current_app.logger.error(f"Error adding site: {str(e)}")
        if request.is_json:
            return jsonify({"error": str(e)}), 400
        else:
            return f"Error adding site: {str(e)}", 400

@api_bp.route('/api/sites/<int:site_id>', methods=['GET'])
def get_single_site_api(site_id):
    site = get_site(site_id)
    if not site:
        return jsonify({"error": "Site not found"}), 404
    
    # Get the site dictionary and add the formatted last checked time
    site_dict = site.to_dict()
    site_dict['last_checked_formatted'] = format_last_checked(site.last_checked) if site.last_checked else None
    
    # Add history data directly from services - no modifications
    from app.services import get_site_history, calculate_uptime_percentage
    history = get_site_history(site_id, limit=20)
    
    # Debug logging - but NO modifications to history
    current_app.logger.info(f"API: Site {site_id} - Status: {site.status}, History count: {len(history)}")
    
    site_dict['history'] = history
    site_dict['uptime_percentage'] = calculate_uptime_percentage(site_id)
    
    return jsonify(site_dict)

@api_bp.route('/api/sites/<int:site_id>', methods=['PUT'])
def update_single_site_api(site_id):
    data = request.get_json()
    
    try:
        site = update_site(
            site_id,
            url=data.get('url'),
            name=data.get('name'),
            check_interval=data.get('check_interval')
        )
        
        if not site:
            return jsonify({"error": "Site not found"}), 404
        
        current_app.logger.info(f"Site {site_id} updated")
        return jsonify(site.to_dict())
    except Exception as e:
        current_app.logger.error(f"Error updating site {site_id}: {str(e)}")
        return jsonify({"error": str(e)}), 400

@api_bp.route('/api/sites/<int:site_id>', methods=['DELETE'])
def delete_single_site_api(site_id):
    success = service_delete_site(site_id)
    if not success:
        return jsonify({"error": "Site not found"}), 404
    
    current_app.logger.info(f"Site {site_id} deleted")
    return jsonify({"message": "Site deleted successfully"})

@api_bp.route('/api/sites/<int:site_id>/check', methods=['POST'])
def check_single_site_api(site_id):
    site = get_site(site_id)
    if not site:
        return jsonify({"error": "Site not found"}), 404
    
    # Log before check
    from app.services import get_site_history
    pre_check_history = get_site_history(site_id, limit=20)
    current_app.logger.info(f"API CHECK: Site {site_id} has {len(pre_check_history)} history entries before manual check")
    
    # Use the service to check only this specific site - this should add exactly 1 history entry
    check_result = service_check_site(site)
    
    # Log after check
    post_check_history = get_site_history(site_id, limit=20)
    current_app.logger.info(f"API CHECK: Site {site_id} has {len(post_check_history)} history entries after manual check. Check result: {check_result}")
    
    # Verify the count increased by exactly 1
    if len(post_check_history) == len(pre_check_history) + 1:
        current_app.logger.info(f"API CHECK SUCCESS: Site {site_id} history correctly increased by 1")
    else:
        current_app.logger.error(f"API CHECK ERROR: Site {site_id} history should have increased by 1, but went from {len(pre_check_history)} to {len(post_check_history)}")
    
    # Get formatted last checked time for the response
    site_dict = site.to_dict()
    site_dict['last_checked_formatted'] = format_last_checked(site.last_checked) if site.last_checked else None
    
    # Add history data and uptime percentage
    from app.services import calculate_uptime_percentage
    site_dict['history'] = post_check_history
    site_dict['uptime_percentage'] = calculate_uptime_percentage(site_id)
    
    current_app.logger.info(f"Site {site_id} checked manually")
    
    return jsonify(site_dict)

# Health check endpoints - EXEMPT from rate limiting
@api_bp.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint for load balancers and monitoring systems.
    This endpoint is exempt from rate limiting to allow frequent health checks."""
    return jsonify({"status": "healthy"})

@api_bp.route('/healthz', methods=['GET'])
def detailed_health_check():
    """Detailed health check endpoint for Kubernetes and other cloud platforms.
    This endpoint is exempt from rate limiting to allow frequent health checks."""
    health_data = {
        "status": "healthy",
        "version": current_app.config.get('APP_VERSION', '0.1.0'),
        "timestamp": datetime.now().isoformat(),
        "checks": {
            "app": "ok",
            "sites_count": len(get_all_sites())
        }
    }
    
    return jsonify(health_data)

# Apply exemption to health check endpoints after the blueprint is created
if LIMITER_AVAILABLE and limiter:
    limiter.exempt(health_check)
    limiter.exempt(detailed_health_check)