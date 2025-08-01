import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User

def create_admin_user():
    """
    Create an admin user if one doesn't exist already
    """
    try:
        # Check if admin user exists
        if User.objects.filter(employee_id='ADMIN001').exists():
            print("\nAdmin user already exists with employee ID: ADMIN001")
            choice = input("Do you want to reset the password? (y/n): ").lower()
            if choice == 'y':
                admin = User.objects.get(employee_id='ADMIN001')
                password = input("Enter new password: ")
                admin.set_password(password)
                admin.save()
                print("\nPassword updated successfully!\n")
            return
        
        # Get admin info
        print("\nCreating admin user...")
        employee_id = input("Employee ID (default: ADMIN001): ") or 'ADMIN001'
        email = input("Email (default: admin@example.com): ") or 'admin@example.com'
        full_name = input("Full name (default: Admin User): ") or 'Admin User'
        password = input("Password (default: admin123): ") or 'admin123'
        
        # Create the admin user
        admin = User.objects.create_superuser(
            employee_id=employee_id,
            email=email,
            full_name=full_name,
            password=password,
            user_type='admin'
        )
        
        print(f"\nAdmin user created successfully!\n")
        print(f"Employee ID: {admin.employee_id}")
        print(f"Email: {admin.email}")
        print(f"Password: {'*' * len(password)}")
        print(f"User type: {admin.user_type}")
    except Exception as e:
        print(f"\nError creating admin user: {e}\n")
        sys.exit(1)

if __name__ == '__main__':
    create_admin_user()