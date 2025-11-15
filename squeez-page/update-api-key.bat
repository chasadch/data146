@echo off
echo.
echo ============================================
echo   Update Resend API Key in Vercel
echo ============================================
echo.
echo Step 1: Get your new API key from https://resend.com/api-keys
echo.
set /p API_KEY="Paste your new Resend API key here: "
echo.
echo Removing old API key...
call vercel env rm RESEND_API_KEY production --yes
echo.
echo Adding new API key...
echo %API_KEY% | vercel env add RESEND_API_KEY production
echo.
echo Redeploying...
call vercel --prod --yes
echo.
echo ============================================
echo   Done! Test your signup now.
echo ============================================
pause

