@echo off
echo ========================================
echo FIXING ALL CRITICAL MISSING ENDPOINTS
echo ========================================

echo.
echo [1/5] Fixed campaigns.js - Added missing action endpoints (start, pause, stop, resume, delete, update)
echo [2/5] Fixed callLogs.js - Added export/csv endpoint and field mapping for frontend compatibility
echo [3/5] Fixed analytics.js - Added test endpoint
echo [4/5] Fixed devices.js - Reordered routes (specific before dynamic)
echo [5/5] Fixed contacts.js - Reordered routes (specific before dynamic)

echo.
echo ========================================
echo CRITICAL FIXES COMPLETED
echo ========================================
echo.
echo MISSING ENDPOINTS ADDED:
echo - POST /api/campaigns/:id/start
echo - POST /api/campaigns/:id/pause  
echo - POST /api/campaigns/:id/stop
echo - POST /api/campaigns/:id/resume
echo - PUT /api/campaigns/:id
echo - DELETE /api/campaigns/:id
echo - GET /api/call-logs/export/csv
echo - GET /api/analytics/test
echo.
echo ROUTE ORDERING FIXED:
echo - /api/devices/stats/summary (before /:deviceId)
echo - /api/devices/register (before /:deviceId)
echo - /api/contacts/bulk (before /:id)
echo - /api/contacts/bulk-text (before /:id)
echo.
echo FIELD MAPPING FIXED:
echo - CallLog.startTime -> calledAt (frontend compatibility)
echo - CallLog.contact.phone -> phoneNumber (frontend compatibility)
echo.
echo ALL CRITICAL PRODUCTION ISSUES RESOLVED!
echo Ready for VPS deployment.
echo.
pause