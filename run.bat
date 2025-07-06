:: bat script
@echo off

:: Open first terminal for backend
start cmd /k "cd /d C:\Users\jiyat\Desktop\hiba-lls\hiba-lls-codespace-upgraded-journey-jj7vv79wxv6hq9gj\backend && python manage.py runserver 0.0.0.0:8000"

:: Wait briefly to ensure first terminal opens
timeout /t 1

:: Open second terminal for frontend
start cmd /k "cd /d C:\Users\jiyat\Desktop\hiba-lls\hiba-lls-codespace-upgraded-journey-jj7vv79wxv6hq9gj\frontend && npm run dev"

exit
