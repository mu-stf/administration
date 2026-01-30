# Update all HTML files to use responsive CSS
# Simple and safe script

$files = @(
    "dashboard.html",
    "customer-accounts.html",
    "supplies.html",
    "statistics.html",
    "settings.html",
    "invoices.html",
    "new-invoice.html",
    "new-purchase-invoice.html", 
    "edit-purchase-invoice.html",
    "edit-invoice.html",
    "backup.html",
    "receipts.html",
    "new-receipt.html",
    "print-invoice.html",
    "print-purchase-invoice.html",
    "print-receipt.html",
    "register.html",
    "setup.html",
    "customize-user.html",
    "manage-users.html"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        (Get-Content $file -Raw) -replace 'css/style\.css', 'css/style-responsive.css' | Set-Content $file -NoNewline
        Write-Host "✅ $file" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Done!" -ForegroundColor Cyan
