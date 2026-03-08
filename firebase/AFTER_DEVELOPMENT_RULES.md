Replace the open dev rule later with stricter rules once the app is running.
Suggested direction:
- settings: owner only
- devices: read/write for approved app flow, owner edits status manually in console
- inventory_items: authenticated owner write, app read
- transactions: app write, owner read/write
- transaction_edits: owner/app write