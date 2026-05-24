# Task 6 - Update API Routes for Photo & GPS Data

## Summary
Updated check-in and check-out API routes to accept optional photo and GPS location data.

## Changes Made

### `/src/app/api/attendance/check-in/route.ts`
- Added JSON body parsing for optional `photo`, `latitude`, `longitude` fields
- Photo stored in `checkInPhoto`, latitude in `checkInLat`, longitude in `checkInLng`
- Graceful fallback: if body is missing or invalid JSON, fields default to empty strings
- All existing logic (auth check, duplicate check, LATE/PRESENT status) preserved

### `/src/app/api/attendance/check-out/route.ts`
- Added JSON body parsing for optional `photo`, `latitude`, `longitude` fields
- Photo stored in `checkOutPhoto`, latitude in `checkOutLat`, longitude in `checkOutLng`
- Graceful fallback: if body is missing or invalid JSON, fields default to empty strings
- All existing logic (auth check, must-check-in-first, already-checked-out) preserved

## Database
- Prisma schema already had the new fields (`checkInPhoto`, `checkOutPhoto`, `checkInLat`, `checkInLng`, `checkOutLat`, `checkOutLng`)
- `bun run db:push` confirmed database is in sync

## Notes
- Backward compatible: clients that don't send photo/GPS still work
- Photo stored as base64 data URL (e.g. `data:image/jpeg;base64,...`)
- Coordinates stored as strings (e.g. `"13.7563"`, `"100.5018"`)
