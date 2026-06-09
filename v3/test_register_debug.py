#!/usr/bin/env python
import urllib.request
import urllib.error
import json

print('=== API Connectivity Test ===')
print()

# Test root endpoint
print('Testing root endpoint...')
try:
    with urllib.request.urlopen('http://127.0.0.1:8000/', timeout=5) as response:
        print(f'✓ Root endpoint: Status {response.status}')
        content = response.read().decode('utf-8')
        print(f'  Response: {content}')
except Exception as e:
    print(f'✗ Error: {e}')
    exit(1)

print()
print('=== Testing Register ===')
register_data = json.dumps({
    'username': 'devtest',
    'email': 'dev@test.com',
    'password': 'TestPass123',
    'role': 'buyer'
}).encode('utf-8')

req = urllib.request.Request(
    'http://127.0.0.1:8000/auth/register',
    data=register_data,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req, timeout=5) as response:
        print(f'✓ Status: {response.status}')
        content = response.read().decode('utf-8')
        print(f'  Response: {content}')
except urllib.error.HTTPError as e:
    print(f'✗ HTTP Error {e.code}')
    try:
        error_body = e.read().decode('utf-8')
        print(f'  Body: {error_body}')
    except:
        print(f'  (Empty response body)')
except Exception as e:
    print(f'✗ Error: {e}')
