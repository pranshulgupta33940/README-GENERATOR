import os


repo_base_path = None

def set_repo_path(path):
    global repo_base_path
    repo_base_path = path


# Step 1: List all files in the cloned repo (recursively) with filtering
def get_file_tree():
    file_tree = []
    
    # Directories to skip completely
    skip_dirs = {
        'node_modules', '.git', '__pycache__', '.venv', 'venv', 'env',
        'dist', 'build', '.next', '.nuxt', 'coverage', '.nyc_output',
        '.cache', 'tmp', 'temp', '.tmp', '.temp', 'logs', '.DS_Store',
        'vendor', 'bower_components', '.gradle', '.idea', '.vscode',
        '.pytest_cache', '.mypy_cache', '.tox', '.eggs'
    }
    
    # File extensions to skip
    skip_extensions = {
        '.pyc', '.pyo', '.pyd', '.so', '.dll', '.dylib', '.exe', '.bin',
        '.log', '.tmp', '.temp', '.cache', '.pid', '.lock', '.swp', '.swo',
        '.DS_Store', '.coverage', '.nyc_output', '.min.js', '.min.css'
    }
    
    for dirpath, dirnames, filenames in os.walk(repo_base_path):
        # Filter out directories we want to skip
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]
        
        for filename in filenames:
            # Skip files with problematic extensions
            if any(filename.endswith(ext) for ext in skip_extensions):
                continue
                
            # Skip hidden files (except important ones)
            if filename.startswith('.') and filename not in {'.env', '.gitignore', '.dockerignore'}:
                continue
                
            full_path = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(full_path, repo_base_path) 
            file_tree.append(rel_path)
    '''
    ✅ What it does:
        Converts the full absolute file path to a relative path from temp/.
        For example:
        If the file is at temp/src/index.js, rel_path becomes src/index.js.
        Then appends it to file_tree.
    '''

    return file_tree

# Step 2: Read content of a file, safely
def read_file(path):

    '''
    ✅ What it does:
    upr wale function ne jo her file k aage se /temp hataya tha aur file ka naam save kiya tha jo imp lagi 
    to ab ye vala function pehle vaps /temp lgayega taaki files read ho sake
    '''
    full_path = os.path.join(repo_base_path, path)

    try:
        with open(full_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"Error reading {path}: {e}"