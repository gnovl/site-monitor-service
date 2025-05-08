import pytest
from app import create_app
from app.services import add_site, get_site, delete_site

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'

def test_add_site():
    # Test add_site function
    site = add_site('https://example.com', 'Example Site')
    assert site.url == 'https://example.com'
    assert site.name == 'Example Site'
    
    # Clean up
    delete_site(site.id)

def test_get_site():
    # First add a site
    site = add_site('https://example.com', 'Example Site')
    
    # Test get_site function
    retrieved_site = get_site(site.id)
    assert retrieved_site is not None
    assert retrieved_site.url == 'https://example.com'
    assert retrieved_site.name == 'Example Site'
    
    # Clean up
    delete_site(site.id)