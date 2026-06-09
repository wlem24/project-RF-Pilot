#!/usr/bin/env python
import requests
import json
import sys

print('=== API Connectivity Test ===')
print()

# Test root endpoint
print('Testing root endpoint...')
try:
    resp = requests.get('http://127.0.0.1:8000/', timeout=5)
    print(f'✓ Root endpoint: Status {resp.status_code}')
    print(f'  Response: {resp.json()}')
except Exception as e:
    print(f'✗ Error connecting to root: {e}')
    sys.exit(1)

print()
print('=== Testing Authentication Endpoints ===')
print()

# Test Register
print('1. Register New User:')
register_data = {
    'username': 'devtest',
    'email': 'dev@test.com',
    'password': 'TestPass123',
    'role': 'buyer'
}

try:
    resp = requests.post('http://127.0.0.1:8000/auth/register', json=register_data, timeout=5)
    print(f'Status: {resp.status_code}')
    if resp.status_code == 201:
        print('✓ Registration successful')
        print(f'  {json.dumps(resp.json(), indent=2)}')
    else:
        print(f'Response: {json.dumps(resp.json(), indent=2)}')
except Exception as e:
    print(f'✗ Registration error: {e}')

print()
print('2. Login:')
login_data = {
    'email': 'dev@test.com',
    'password': 'TestPass123'
}

try:
    resp = requests.post('http://127.0.0.1:8000/auth/login', json=login_data, timeout=5)
    print(f'Status: {resp.status_code}')
    response_data = resp.json()
    
    if resp.status_code == 200 and 'access_token' in response_data:
        token = response_data['access_token']
        print('✓ Login successful')
        print(f'  Token: {token[:20]}...')
        
        print()
        print('3. Get Current User (using JWT):')
        headers = {'Authorization': f'Bearer {token}'}
        resp = requests.get('http://127.0.0.1:8000/auth/me', headers=headers, timeout=5)
        print(f'Status: {resp.status_code}')
        if resp.status_code == 200:
            print('✓ JWT authentication successful')
            print(f'  {json.dumps(resp.json(), indent=2)}')
        else:
            print(f'Response: {resp.text}')
    else:
        print(f'Response: {json.dumps(response_data, indent=2)}')
except Exception as e:
    print(f'✗ Login error: {e}')

print()
print('=== All Tests Complete ===')
