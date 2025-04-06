import os
import re

def rename_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace YBS with YBS, being careful about quotes and word boundaries
    modified = re.sub(r'\bYSB\b', 'YBS', content)
    modified = re.sub(r"'YBS'", "'YBS'", modified)
    modified = re.sub(r'"YBS"', '"YBS"', modified)
    modified = re.sub(r'/ybs/', '/ybs/', modified)
    modified = re.sub(r'\bysb\b', 'ybs', modified)
    
    # Write back if changes were made
    if content != modified:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(modified)
        print(f"Updated: {file_path}")

def walk_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.py', '.html', '.js', '.jsx')):
                file_path = os.path.join(root, file)
                rename_in_file(file_path)

if __name__ == "__main__":
    backend_dir = '.'
    walk_directory(backend_dir)
    print("Backend renaming completed.")