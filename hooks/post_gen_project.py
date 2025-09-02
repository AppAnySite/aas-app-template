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
    template_dir = os.path.abspath(os.path.join(hook_dir, os.pardir))
    
    print(f"🔍 Debug: project_dir = {project_dir}")
    print(f"🔍 Debug: hook_file = {hook_file}")
    print(f"🔍 Debug: hook_dir = {hook_dir}")
    print(f"🔍 Debug: template_dir = {template_dir}")
    
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
