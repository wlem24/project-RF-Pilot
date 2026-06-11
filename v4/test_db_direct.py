#!/usr/bin/env python
import sys
sys.path.insert(0, 'D:\\workdev\\website\\ecom\\v2\\project-RF-Pilot-git\\v3\\starter')

print('Testing database and auth functions...')
print()

try:
    print('1. Importing store module...')
    from store import create_user, get_user_by_email, init_db
    print('   ✓ Store imported successfully')
    print()
    
    print('2. Initializing database...')
    init_db()
    print('   ✓ Database initialized')
    print()
    
    print('3. Testing get_user_by_email...')
    existing_user = get_user_by_email('test@nonexistent.com')
    print(f'   ✓ Query returned: {existing_user}')
    print()
    
    print('4. Importing auth_utils...')
    from auth_utils import hash_password
    print('   ✓ auth_utils imported')
    print()
    
    print('5. Testing password hashing...')
    hashed = hash_password('TestPass123')
    print(f'   ✓ Hashed password: {hashed[:20]}...')
    print()
    
    print('6. Testing create_user...')
    user = create_user(
        username='testuser',
        email='test@local.com',
        hashed_password=hashed,
        role='buyer'
    )
    print(f'   ✓ User created: {user}')
    print()
    
    print('7. Verifying user was saved...')
    retrieved = get_user_by_email('test@local.com')
    print(f'   ✓ Retrieved user: {retrieved}')
    
except Exception as e:
    print(f'✗ Error: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()
