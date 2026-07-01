$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "Starting server in a new PowerShell window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command cd '$projectDir'; npm start"

Start-Sleep -Seconds 3

Write-Host "Starting ngrok tunnel in a new PowerShell window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command cd '$projectDir'; npx ngrok http 3000"

Write-Host "Done. تأكد من أن كلا النافذتين تعملان، ثم انسخ رابط ngrok الخارجي."