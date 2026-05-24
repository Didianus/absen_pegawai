---
Task ID: 1
Agent: Main Agent
Task: Add Rekapan Kehadiran Karyawan feature with PDF and Excel export

Work Log:
- Explored existing project structure (Next.js SPA with Zustand state management)
- Installed jspdf, jspdf-autotable, and xlsx packages for export functionality
- Created API route /api/attendance/recap for aggregated attendance data
  - Admin: sees all employees with department filter
  - User: sees only personal recap
  - Calculates working days (Mon-Fri), present/late/absent counts, and attendance rate
- Created AdminAttendanceRecap component with:
  - Month selector and department filter
  - Summary cards (total employees, avg attendance rate, total late, total present)
  - Paginated recap table with detail dialog
  - PDF export (landscape A4, with header, summary, table, footer)
  - Excel export (2 sheets: Recap summary + Detail per employee)
- Created UserAttendanceRecap component with:
  - Personal attendance summary cards
  - Progress bar for attendance rate
  - Daily detail table
  - PDF and Excel export for personal data
- Updated auth-store with new tab types (attendance-recap for both admin and user)
- Updated admin-layout sidebar: added ClipboardList icon, Rekapan Kehadiran menu item under "Laporan" section
- Updated user-layout sidebar: added Rekapan Kehadiran menu item under "Laporan" section
- Tested API endpoint /api/attendance/recap - returns correct data
- Server compiles and runs all routes successfully

Stage Summary:
- Rekapan Kehadiran feature fully implemented for both admin and user roles
- PDF export using jspdf + jspdf-autotable (professional layout with header, summary stats, table, footer with timestamp)
- Excel export using xlsx library (2 sheets for admin: summary + detail; 1 sheet for user)
- Both exports include month/department filtering
- All components integrated into sidebar navigation
