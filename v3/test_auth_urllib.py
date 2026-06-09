#!/usr/bin/env python
import urllib.request
import urllib.error
import json
import sys

print('=== API Connectivity Test ===')
print()

def make_request(method, url, data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            content = response.read().decode('utf-8')
            return status, json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        content = e.read().decode('utf-8')
        return e.code, json.loads(content) if content else {'error': str(e)}
    except Exception as e:
        return None, {'error': str(e)}

# Test root endpoint
print('Testing root endpoint...')
status, resp = make_request('GET', 'http://127.0.0.1:8000/')
if status == 200:
    print(f'✓ Root endpoint: Status {status}')
    print(f'  Response: {resp}')
else:
    print(f'✗ Error: Status {status}')
    if resp:
        print(f'  {resp}')
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

status, resp = make_request('POST', 'http://127.0.0.1:8000/auth/register', register_data)
print(f'Status: {status}')
if status == 201:
    print('✓ Registration successful')
    print(f'  {json.dumps(resp, indent=2)}')
elif resp and 'error' in resp:
    print(f'  Error: {resp["error"]}')
else:
    print(f'Response: {json.dumps(resp, indent=2) if resp else "No response"}')

print()
print('2. Login:')
login_data = {
    'email': 'dev@test.com',
    'password': 'TestPass123'
}

status, resp = make_request('POST', 'http://127.0.0.1:8000/auth/login', login_data)
print(f'Status: {status}')

if status == 200 and resp and 'access_token' in resp:
    token = resp['access_token']
    print('✓ Login successful')
    print(f'  Token: {token[:20]}...')
    
    print()
    print('3. Get Current User (using JWT):')
    headers = {'Authorization': f'Bearer {token}'}
    status, resp = make_request('GET', 'http://127.0.0.1:8000/auth/me', headers=headers)
    print(f'Status: {status}')
    if status == 200:
        print('✓ JWT authentication successful')
        print(f'  {json.dumps(resp, indent=2)}')
    else:
        print(f'Response: {json.dumps(resp, indent=2) if resp else "No response"}')
else:
    print(f'Response: {json.dumps(resp, indent=2) if resp else "No response"}')

print()
print('=== All Tests Complete ===')
