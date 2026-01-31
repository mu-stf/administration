# -*- coding: utf-8 -*-
"""
Fix Arabic encoding by converting from Windows-1256/CP1256 to UTF-8
"""
import os
import glob
import codecs

def detect_and_read(filepath):
    """Try to read file with correct encoding"""
    # Try common Arabic encodings
    encodings = ['cp1256', 'windows-1256', 'iso-8859-6', 'utf-8']
    
    for enc in encodings:
        try:
            with codecs.open(filepath, 'r', encoding=enc) as f:
                content = f.read()
                # Check if Arabic text looks correct
                if 'ÇáãÊÌÑ' in content or 'الم' in content:
                    # Found it!
                    return content, enc
        except (UnicodeDecodeError, LookupError):
            continue
    
    # Fallback: read as UTF-8 with errors ignored
    with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read(), 'utf-8'

def write_utf8(filepath, content):
    """Write file as UTF-8"""
    with codecs.open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    html_files = glob.glob('*.html')
    
    print(f"Found {len(html_files)} HTML files")
    print("=" * 60)
    
    success = 0
    failed = 0
    
    for filepath in sorted(html_files):
        try:
            # Read with original encoding
            content, detected_enc = detect_and_read(filepath)
            
            # Write as UTF-8
            write_utf8(filepath, content)
            
            print(f"✓ {filepath:30s} ({detected_enc} -> UTF-8)")
            success += 1
            
        except Exception as e:
            print(f"✗ {filepath:30s} ERROR: {e}")
            failed += 1
    
    print("=" * 60)
    print(f"\nResults: {success} succeeded, {failed} failed")
    print("\nNow refresh your browser (Ctrl+F5) to see Arabic text correctly!")

if __name__ == "__main__":
    main()
