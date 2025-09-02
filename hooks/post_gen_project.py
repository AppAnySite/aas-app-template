#!/usr/bin/env python3
"""
Post-generation hook for AppAnySite Template
Copies source files that should not be processed by Jinja2
"""

import os
import shutil

def main():
    """Copy source files after project generation"""
    project_dir = os.getcwd()
    
    # Find the template directory using the hook file's location
    hook_file = os.path.abspath(__file__)
    hook_dir = os.path.dirname(hook_file)
    
    print(f"🔍 Debug: project_dir = {project_dir}")
    print(f"🔍 Debug: hook_file = {hook_file}")
    print(f"🔍 Debug: hook_dir = {hook_dir}")
    
    # Cookiecutter copies hooks to a temporary directory, so we need to find the original template
    # Use dynamic path discovery that works in any environment (local or Docker)
    
    template_dir = None
    
    # Strategy 1: Check if we're in the original template directory
    if os.path.exists(os.path.join(hook_dir, "source")):
        template_dir = hook_dir
        print(f"🔍 Debug: Found template in original location: {template_dir}")
    
    # Strategy 2: Search upward from project directory for .template folder
    if template_dir is None:
        current_dir = project_dir
        while current_dir != os.path.dirname(current_dir):  # Stop at root
            # Check for both "hooks" and ".template/hooks"
            hooks_dir = os.path.join(current_dir, "hooks")
            template_hooks_dir = os.path.join(current_dir, ".template", "hooks")
            
            if os.path.exists(hooks_dir) and os.path.isdir(hooks_dir):
                # We found a hooks directory, check if it has source
                if os.path.exists(os.path.join(hooks_dir, "source")):
                    template_dir = current_dir
                    print(f"🔍 Debug: Found template by searching upward (hooks): {template_dir}")
                    break
            
            elif os.path.exists(template_hooks_dir) and os.path.isdir(template_hooks_dir):
                # We found a .template/hooks directory, check if it has source
                if os.path.exists(os.path.join(template_hooks_dir, "source")):
                    template_dir = os.path.join(current_dir, ".template")
                    print(f"🔍 Debug: Found template by searching upward (.template): {template_dir}")
                    break
            
            current_dir = os.path.dirname(current_dir)
    
    # Strategy 3: Search in common container paths (Docker environment)
    if template_dir is None:
        container_template_paths = [
            "/app/bin/.template",
            "/app/template", 
            "/app/.template",
            "/usr/local/template",
            "/opt/template"
        ]
        
        for container_path in container_template_paths:
            source_check = os.path.join(container_path, "hooks", "source")
            if os.path.exists(source_check):
                template_dir = container_path
                print(f"🔍 Debug: Found template in container path: {template_dir}")
                break
    
    # Strategy 4: Search in common local development paths
    if template_dir is None:
        # Get the user's home directory dynamically
        home_dir = os.path.expanduser("~")
        local_template_paths = [
            os.path.join(home_dir, "Documents", "aas-core-appgen", ".template"),
            os.path.join(home_dir, "aas-core-appgen", ".template"),
            os.path.join(home_dir, "workspace", "aas-core-appgen", ".template"),
            os.path.join(home_dir, "projects", "aas-core-appgen", ".template")
        ]
        
        for local_path in local_template_paths:
            source_check = os.path.join(local_path, "hooks", "source")
            if os.path.exists(source_check):
                template_dir = local_path
                print(f"🔍 Debug: Found template in local path: {template_dir}")
                break
    
    if template_dir is None:
        print("❌ Error: Could not find template directory with hooks/source folder")
        print("🔍 Debug: Searched paths:")
        print(f"   - Hook directory: {hook_dir}")
        print(f"   - Project directory: {project_dir}")
        print(f"   - Current working directory: {os.getcwd()}")
        print("🔍 Debug: Container paths checked:")
        for path in ["/app/bin/.template", "/app/template", "/app/.template"]:
            print(f"   - {path}: {'EXISTS' if os.path.exists(path) else 'NOT FOUND'}")
        return
    
    print(f"🔍 Debug: Final template_dir = {template_dir}")
    
    # Check if the template directory has the hooks/source folder
    source_dir = os.path.join(template_dir, "hooks", "source")
    
    if not os.path.exists(source_dir):
        print(f"❌ Error: Source directory not found at {source_dir}")
        print(f"❌ Template directory contents: {os.listdir(template_dir) if os.path.exists(template_dir) else 'DOES NOT EXIST'}")
        if os.path.exists(template_dir) and os.path.exists(os.path.join(template_dir, "hooks")):
            print(f"❌ Hooks directory contents: {os.listdir(os.path.join(template_dir, 'hooks'))}")
        return
    
    print("🚀 Post-generation: Copying source files...")
    
    # Files to copy from hooks/source to the generated project
    files_to_copy = [
        "src/",
        "app-config.json",
        "App.tsx"
    ]
    
    # Copy each file/directory
    for item in files_to_copy:
        src_path = os.path.join(source_dir, item)
        dst_path = os.path.join(project_dir, item)
        
        if os.path.exists(src_path):
            if os.path.isdir(src_path):
                # Copy directory
                if os.path.exists(dst_path):
                    shutil.rmtree(dst_path)
                shutil.copytree(src_path, dst_path)
                print(f"📁 Copied directory: {item}")
            else:
                # Copy file
                shutil.copy2(src_path, dst_path)
                print(f"📄 Copied file: {item}")
        else:
            print(f"⚠️  Warning: Source not found: {src_path}")
    
    print("✅ Post-generation completed successfully!")

if __name__ == "__main__":
    main()
