import os
import sys
import subprocess
import django
import time

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings

def run_command(command):
    """Run a system command and print output"""
    print(f"\n> {command}")
    result = subprocess.run(command, shell=True, text=True, capture_output=True)
    
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(f"Error: {result.stderr}")
    
    return result.returncode == 0

def reset_database():
    """Reset the database and run migrations"""
    print("\n===== Database Reset Script =====")
    
    # Get database configuration
    db_config = settings.DATABASES['default']
    db_engine = db_config['ENGINE']
    db_name = db_config['NAME']
    
    if 'mysql' in db_engine:
        # MySQL reset
        db_user = db_config['USER']
        db_password = db_config['PASSWORD']
        db_host = db_config['HOST']
        db_port = db_config['PORT']
        
        print(f"\nResetting MySQL database: {db_name}")
        mysql_cmd = f"mysql -u {db_user} -p{db_password}"
        
        if db_host:
            mysql_cmd += f" -h {db_host}"
        if db_port:
            mysql_cmd += f" -P {db_port}"
            
        # Drop and recreate database
        drop_cmd = f"{mysql_cmd} -e 'DROP DATABASE IF EXISTS {db_name};'"
        create_cmd = f"{mysql_cmd} -e 'CREATE DATABASE {db_name} CHARACTER SET utf8mb4;'"
        
        if not run_command(drop_cmd):
            print("Failed to drop database. Make sure MySQL is running and credentials are correct.")
            return False
        
        if not run_command(create_cmd):
            print("Failed to create database.")
            return False
    
    elif 'sqlite3' in db_engine:
        # SQLite reset
        db_path = db_name
        if os.path.exists(db_path):
            os.remove(db_path)
            print(f"Removed SQLite database: {db_path}")
    
    else:
        print(f"Unsupported database engine: {db_engine}")
        print("Please manually reset your database and then run migrations.")
        return False
    
    print("\nDatabase reset successfully.")
    
    # Run migrations
    print("\nApplying migrations...")
    if not run_command("python manage.py makemigrations"):
        print("Failed to create migrations.")
        return False
    
    if not run_command("python manage.py migrate"):
        print("Failed to apply migrations.")
        return False
    
    print("\nMigrations applied successfully.")
    
    # Create superuser automatically
    from users.models import User
    
    print("\nCreating admin superuser...")
    User.objects.create_superuser(
        email='admin@example.com',
        full_name='Admin User',
        password='admin123',
        user_type='admin',
        department='Administration'
    )
    print("Admin user created!")
    print("\nEmail: admin@example.com")
    print("Password: admin123")
    
    print("\n===== Database reset and setup completed! =====")
    return True

if __name__ == '__main__':
    # Ask for confirmation before resetting
    print("\n⚠️  WARNING: This will DELETE ALL DATA in your database and recreate it! ⚠️")
    confirm = input("Are you sure you want to continue? (yes/no): ")
    
    if confirm.lower() == 'yes':
        if reset_database():
            print("\nYou can now start your application with a fresh database.")
        else:
            print("\nDatabase reset encountered errors. See messages above.")
    else:
        print("\nDatabase reset cancelled.")