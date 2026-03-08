# Mafia Vape System

Electron + React + Firebase desktop system for Mafia Vape.

## Included
- Device approval gate from Firestore
- Manual GitHub releases auto-update check
- Arabic / English
- Dark / Light theme
- Shift names, inventory, invoice builder, invoice edits
- Local daily / monthly Excel exports
- Owner password protected sections
- Hidden admin-email setup dot

## First run
1. `npm install`
2. `npm run dev`
3. Approve the device in Firestore collection `devices`
4. Set the owner email/password on first launch

## Build
1. Put your logo/icon later in `build/icons/icon.ico`
2. `npm run dist`
3. Upload release files manually to GitHub Releases

## Important Firestore collections used by the app
- `settings/main`
- `devices/{deviceId}`
- `inventory_items`
- `shift_users`
- `transactions`
- `transaction_edits`
- `audit_logs`

## Suggested Firestore rule during local testing only
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```