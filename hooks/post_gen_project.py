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
    
    # If we're in a temporary directory (cookiecutter creates a copy), 
    # we need to find the original template directory
    if not os.path.exists(os.path.join(template_dir, "hooks", "source")):
        # Try to find the original template by looking for the actual template path
        # The template should be in aas-core-appgen/.template or aas-app-template
        possible_template_paths = [
            "/Users/hvetagir/Documents/aas-core-appgen/.template",
            "/Users/hvetagir/Documents/aas-app-template"
        ]
        
        for possible_path in possible_template_paths:
            source_check = os.path.join(possible_path, "hooks", "source")
            if os.path.exists(source_check):
                template_dir = possible_path
                break
        else:
            # Fallback: try to find template directory by walking up from project directory
            current_dir = project_dir
            template_dir = None
            
            while current_dir != os.path.dirname(current_dir):  # Stop at root
                # Check for both "hooks" and ".template/hooks"
                hooks_dir = os.path.join(current_dir, "hooks")
                template_hooks_dir = os.path.join(current_dir, ".template", "hooks")
                
                if os.path.exists(hooks_dir) and os.path.isdir(hooks_dir):
                    template_dir = current_dir
                    break
                elif os.path.exists(template_hooks_dir) and os.path.isdir(template_hooks_dir):
                    template_dir = os.path.join(current_dir, ".template")
                    break
                current_dir = os.path.dirname(current_dir)
    
    if template_dir is None:
        print("❌ Error: Could not find template directory with hooks folder")
        return
    
    source_dir = os.path.join(template_dir, "hooks", "source")
    
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
