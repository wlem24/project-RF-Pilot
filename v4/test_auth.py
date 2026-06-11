import requests
import json

print('=== Testing Authentication API ===')
print()

# Test 1: Register
print('1. Testing Register Endpoint:')
register_data = {
    'username': 'testuser',
    'email': 'test@example.com',
    'password': 'testpass123',
    'role': 'buyer'
}

try:
    resp = requests.post('http://127.0.0.1:8000/auth/register', json=register_data)
    print(f'Status: {resp.status_code}')
    print(f'Response: {json.dumps(resp.json(), indent=2)}')
except Exception as e:
    print(f'Error: {e}')

print()
print('2. Testing Login Endpoint:')
login_data = {
    'email': 'test@example.com',
    'password': 'testpass123'
}

try:
    resp = requests.post('http://127.0.0.1:8000/auth/login', json=login_data)
    print(f'Status: {resp.status_code}')
    response_data = resp.json()
    print(f'Response: {json.dumps(response_data, indent=2)}')
    token = response_data.get('access_token')
    
    if token:
        print()
        print('3. Testing /auth/me with JWT:')
        headers = {'Authorization': f'Bearer {token}'}
        resp = requests.get('http://127.0.0.1:8000/auth/me', headers=headers)
        print(f'Status: {resp.status_code}')
        print(f'Response: {json.dumps(resp.json(), indent=2)}')
except Exception as e:
    print(f'Error: {e}')
