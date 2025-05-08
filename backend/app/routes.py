from flask import Blueprint, jsonify, request
from app.services import add_site, get_site, get_all_sites, delete_site, update_site, check_site

api_bp = Blueprint('api', __name__)

@api_bp.route('/api/sites', methods=['GET'])
def get_sites():
    sites = get_all_sites()
    return jsonify([site.to_dict() for site in sites])

@api_bp.route('/api/sites', methods=['POST'])
def create_site():
    data = request.get_json()
    
    if not data or 'url' not in data:
        return jsonify({"error": "URL is required"}), 400
    
    url = data['url']
    name = data.get('name')
    check_interval = data.get('check_interval', 60)
    
    site = add_site(url, name, check_interval)
    return jsonify(site.to_dict()), 201

@api_bp.route('/api/sites/<int:site_id>', methods=['GET'])
def get_single_site(site_id):
    site = get_site(site_id)
    if not site:
        return jsonify({"error": "Site not found"}), 404
    
    return jsonify(site.to_dict())

@api_bp.route('/api/sites/<int:site_id>', methods=['PUT'])
def update_single_site(site_id):
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

@api_bp.route('/api/sites/<int:site_id>', methods=['DELETE'])
def delete_single_site(site_id):
    success = delete_site(site_id)
    if not success:
        return jsonify({"error": "Site not found"}), 404
    
    return jsonify({"message": "Site deleted successfully"})

@api_bp.route('/api/sites/<int:site_id>/check', methods=['POST'])
def check_single_site(site_id):
    site = get_site(site_id)
    if not site:
        return jsonify({"error": "Site not found"}), 404
    
    check_site(site)
    return jsonify(site.to_dict())

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})