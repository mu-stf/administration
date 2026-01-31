# -*- coding: utf-8 -*-
import os
import sys

def read_file_raw(filepath):
    """Read file with multiple encoding attempts"""
    encodings = ['utf-8', 'cp1256', 'windows-1256', 'iso-8859-6', 'latin-1']
    
    for encoding in encodings:
        try:
            with open(filepath, 'r', encoding=encoding, errors='ignore') as f:
                return f.read()
        except:
            continue
    
    # Last resort: binary read
    with open(filepath, 'rb') as f:
        return f.read().decode('utf-8', errors='ignore')

def write_file_utf8(filepath, content):
    """Write file as UTF-8 without BOM"""
    with open(filepath, 'w', encoding='utf-8', newline='\r\n') as f:
        f.write(content)

def fix_arabic_text(content):
    """Fix common Arabic text corruptions"""
    
    # Map of corrupted text -> correct text
    # Using the most common patterns
    fixes = {
        # Emojis/Icons (these get corrupted to ??)
        '??⏳': '⏳',
        '??📊': '📊',
        '??👥': '👥',
        '??📦': '📦',
        '??🧾': '🧾',
        '??⚙️': '⚙️',
        '??⚡': '⚡',
        '??🚚': '🚚',
        
        # Remove duplicate BOMs
        '﻿﻿': '﻿',
        
        # Fix weird concatenations caused by previous script
        'أهلاً صرفأهلاً المنتج': 'تسجيل الخروج',
        '??أهلاً المنتج': 'لوحة التحكم',
        'مثالأهلاً مثال?': 'فاتورة جديدة',
        
        # Common corrupted patterns
        '?????': '',
        '????': '',
        '???': '',
        '??': '',
    }
    
    for old, new in fixes.items():
        content = content.replace(old, new)
    
    return content

def main():
    import glob
    
    html_files = glob.glob('*.html')
    print(f"Processing {len(html_files)} HTML files...")
    print("-" * 50)
    
    for filepath in html_files:
        try:
            # Read current content
            content = read_file_raw(filepath)
            
            # Fix known issues
            content = fix_arabic_text(content)
            
            # Remove BOM if exists, we'll add clean version
            if content.startswith('\ufeff'):
                content = content[1:]
            if content.startswith('﻿'):
                content = content[1:]
            
            # Write clean UTF-8
            write_file_utf8(filepath, content)
            
            print(f"✓ {filepath}")
        except Exception as e:
            print(f"✗ {filepath}: {e}")
    
    print("-" * 50)
    print("Done! Please check the files manually.")

if __name__ == "__main__":
    main()
