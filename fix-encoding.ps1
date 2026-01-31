# Fix Arabic encoding for all HTML files
# This script converts files to UTF-8 with BOM

$files = Get-ChildItem -Path "*.html" -Recurse

Write-Host "Found $($files.Count) HTML files to process..." -ForegroundColor Cyan

foreach ($file in $files) {
    try {
        Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
        
        # Read file content
        $content = Get-Content -Path $file.FullName -Raw -Encoding Default
        
        # Write back as UTF-8 with BOM
        $utf8WithBom = New-Object System.Text.UTF8Encoding $true
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8WithBom)
        
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done! All HTML files have been converted to UTF-8 with BOM." -ForegroundColor Green
Write-Host "Please refresh your browser to see the changes." -ForegroundColor Cyan
