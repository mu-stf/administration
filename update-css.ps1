# سكريبت تحديث CSS في جميع ملفات HTML
# ====================================

Write-Host "🎨 بدء تحديث ملفات الCSS..." -ForegroundColor Cyan
Write-Host ""

$oldCSS = '<link rel="stylesheet" href="css/style.css">'
$newCSS = '<link rel="stylesheet" href="css/style-responsive.css">'

# الحصول على جميع ملفات HTML
$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -File

$updatedCount = 0
$skippedCount = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    if ($content -match [regex]::Escape($oldCSS)) {
        $newContent = $content -replace [regex]::Escape($oldCSS), $newCSS
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "✅ تم تحديث: $($file.Name)" -ForegroundColor Green
        $updatedCount++
    } else {
        Write-Host "⏭️  تخطي: $($file.Name) (غير موجود أو محدّث مسبقاً)" -ForegroundColor Yellow
        $skippedCount++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 النتائج:" -ForegroundColor Cyan
Write-Host "   ✅ تم التحديث: $updatedCount ملف" -ForegroundColor Green
Write-Host "   ⏭️  تم التخطي: $skippedCount ملف" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 تم الانتهاء! افتح الموقع في المتصفح لرؤية التصميم الجديد." -ForegroundColor Green
