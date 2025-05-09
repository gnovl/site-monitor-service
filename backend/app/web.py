from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from datetime import datetime
from app.services import add_site, get_site, get_all_sites, delete_site, update_site, check_site

web_bp = Blueprint('web', __name__)

# Custom filter for formatting datetime
@web_bp.app_template_filter('format_datetime')
def format_datetime(value, format='%Y-%m-%d %H:%M:%S'):
    if value is None:
        return "Never"
    
    dt = datetime.fromisoformat(value) if isinstance(value, str) else value
    now = datetime.now()
    
    # Check if today
    if dt.date() == now.date():
        return f"Today at {dt.strftime('%I:%M %p')}"
    
    # Check if yesterday
    yesterday = now.date().replace(day=now.day-1)
    if dt.date() == yesterday:
        return f"Yesterday at {dt.strftime('%I:%M %p')}"
    
    # If within the last 7 days
    days_diff = (now.date() - dt.date()).days
    if days_diff < 7:
        return f"{dt.strftime('%A')} at {dt.strftime('%I:%M %p')}"
    
    # Otherwise
    return dt.strftime('%b %d') + f" at {dt.strftime('%I:%M %p')}"

@web_bp.context_processor
def inject_globals():
    return {
        'current_year': datetime.now().year,
        'sites': get_all_sites()
    }

@web_bp.route('/')
def index():
    sites = get_all_sites()
    
    # Prepare data for chart
    chart_data = []
    for site in sites:
        chart_data.append({
            'id': site.id,
            'name': site.name or site.url,
            'url': site.url,
            'responseTime': site.response_time,
            'status': site.status,
        })
    
    return render_template('index.html', chart_data=chart_data)

@web_bp.route('/sites/new', methods=['GET', 'POST'])
def new_site():
    if request.method == 'POST':
        url = request.form.get('url')
        name = request.form.get('name')
        check_interval = int(request.form.get('check_interval', 60))
        
        if not url:
            flash('URL is required', 'danger')
            return render_template('new_site.html')
        
        site = add_site(url, name, check_interval)
        flash(f'Site "{site.name}" added successfully!', 'success')
        return redirect(url_for('web.index'))
    
    return render_template('new_site.html')

@web_bp.route('/sites/<int:site_id>')
def site_details(site_id):
    site = get_site(site_id)
    if not site:
        flash('Site not found', 'danger')
        return redirect(url_for('web.index'))
    
    return render_template('site_details.html', site=site)

@web_bp.route('/sites/<int:site_id>/check', methods=['POST'])
def check_site(site_id):
    site = get_site(site_id)
    if not site:
        flash('Site not found', 'danger')
        return redirect(url_for('web.index'))
    
    check_site(site)
    flash(f'Site "{site.name}" checked. Status: {site.status}', 'success')
    
    # Redirect back to the referring page
    return redirect(request.referrer or url_for('web.index'))

@web_bp.route('/sites/<int:site_id>/delete', methods=['POST'])
def delete_site(site_id):
    success = delete_site(site_id)
    if success:
        flash('Site deleted successfully', 'success')
    else:
        flash('Site not found', 'danger')
    
    # Redirect back to the referring page
    return redirect(url_for('web.index'))

# API endpoints for backward compatibility
@web_bp.route('/api/sites', methods=['GET'])
def api_get_sites():
    sites = get_all_sites()
    return jsonify([site.to_dict() for site in sites])

@web_bp.route('/api/sites', methods=['POST'])
def api_create_site():
    data = request.get_json()
    
    if not data or 'url' not in data:
        return jsonify({"error": "URL is required"}), 400
    
    url = data['url']
    name = data.get('name')
    check_interval = data.get('check_interval', 60)
    
    site = add_site(url, name, check_interval)
    return jsonify(site.to_dict()), 201

@web_bp.route('/api/sites/<int:site_id>', methods=['GET'])
def api_get_single_site(site_id):
    site = get_site(site_id)
    if not site:
        return jsonify({"error": "Site not found"}), 404
    
    return jsonify(site.to_dict())

@web_bp.route('/api/sites/<int:site_id>', methods=['PUT'])
def api_update_single_site(site_id):
    data = request.get_json()
    site = update_site(
        site_id,
        url=data.get('url'),
        name=data.get('name'),
        check_interval=data.get('check_interval')
    )
    
    if not site:
        return jsonify({"error": "Site not found"}), 404
    
    return jsonify(site.to_dict())

@web_bp.route('/api/sites/<int:site_id>', methods=['DELETE'])
def api_delete_single_site(site_id):
    success = delete_site(site_id)
    if not success:
        return jsonify({"error": "Site not found"}), 404
    
    return jsonify({"message": "Site deleted successfully"})

@web_bp.route('/api/sites/<int:site_id>/check', methods=['POST'])
def api_check_single_site(site_id):
    site = get_site(site_id)
    if not site:
        return jsonify({"error": "Site not found"}), 404
    
    check_site(site)
    return jsonify(site.to_dict())