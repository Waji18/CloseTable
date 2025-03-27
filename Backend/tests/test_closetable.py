import os
import io
import pytest
import bcrypt
import json
from datetime import datetime, timedelta
from bson import ObjectId
from jsonschema import validate
from dotenv import load_dotenv
from src.main import app

# Load test environment variables
load_dotenv('.env.test')

# Test schemas
USER_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "email": {"type": "string", "format": "email"},
        "role": {"type": "string", "enum": ["Customer", "Restaurant Owner", "Admin"]}
    },
    "required": ["id", "email", "role"]
}

RESERVATION_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "status": {"type": "string"},
        "party_size": {"type": "number"}
    },
    "required": ["id", "status"]
}

@pytest.fixture(scope='module')
def test_client():
    app.config.update({
        'TESTING': True,
        'MONGO_URI': os.getenv('MONGO_URI')
    })
    with app.test_client() as client:
        yield client

@pytest.fixture(scope='module')
def mongo():
    return PyMongo(app)

@pytest.fixture(autouse=True)
def reset_db(mongo):
    # Clean database before each test
    mongo.db.users.delete_many({})
    mongo.db.restaurants.delete_many({})
    mongo.db.reservations.delete_many({})
    mongo.db.reviews.delete_many({})
    mongo.db.role_upgrade_requests.delete_many({})

def create_test_user(mongo, role='Customer'):
    hashed_pw = bcrypt.hashpw('testpass123'.encode(), bcrypt.gensalt()).decode()
    user_id = mongo.db.users.insert_one({
        'email': f'test_{role.lower()}@example.com',
        'password': hashed_pw,
        'role': role,
        'first_name': 'Test',
        'last_name': 'User'
    }).inserted_id
    return str(user_id)

def get_auth_headers(test_client, email, password):
    response = test_client.post('/api/login', json={
        'email': email,
        'password': password
    })
    return {'Authorization': f'Bearer {response.json["access_token"]}'}

# Add all test functions from previous message here
# (test_full_restaurant_workflow, test_image_upload_workflow, etc.)

def test_user_registration(test_client, mongo):
    response = test_client.post('/api/signup', json={
        'first_name': 'New',
        'last_name': 'User',
        'email': 'new.user@example.com',
        'password': 'SecurePass123!'
    })
    assert response.status_code == 201
    assert mongo.db.users.find_one({'email': 'new.user@example.com'}) is not None

def test_jwt_revocation(test_client, mongo):
    user_id = create_test_user(mongo)
    headers = get_auth_headers(test_client, 'test_customer@example.com', 'testpass123')
    
    # Revoke token
    logout_response = test_client.post('/api/logout', headers=headers)
    assert logout_response.status_code == 200
    
    # Try accessing protected endpoint
    profile_response = test_client.get('/api/profile', headers=headers)
    assert profile_response.status_code == 401

def test_admin_restaurant_approval(test_client, mongo):
    # Create owner and restaurant
    owner_id = create_test_user(mongo, 'Restaurant Owner')
    owner_headers = get_auth_headers(test_client, 'test_restaurant owner@example.com', 'testpass123')
    
    # Create pending restaurant
    restaurant_response = test_client.post('/api/restaurants', json={
        'name': 'Pending Restaurant',
        'address': '123 Test St',
        'city/location': 'Test City',
        'cuisine': 'Test'
    }, headers=owner_headers)
    
    # Admin approval
    admin_id = create_test_user(mongo, 'Admin')
    admin_headers = get_auth_headers(test_client, 'test_admin@example.com', 'testpass123')
    
    approve_response = test_client.put(
        f'/api/admin/restaurants/{restaurant_response.json["restaurant_id"]}/approve',
        headers=admin_headers
    )
    assert approve_response.status_code == 200
    
    # Verify status
    restaurant = mongo.db.restaurants.find_one()
    assert restaurant['status'] == 'approved'

if __name__ == "__main__":
    pytest.main(["-v", "tests/test_closetable.py"])