Database folder for ForgetMeNot (client-side data definitions)

This project stores application data in the browser using IndexedDB via `js/db.js`.

Keys used in the DB (object store `kv`):
- `forgetmenot_users` : array of user objects (without passwords when stored as current user)
- `forgetmenot_current_user` : current logged-in user object
- `forgetmenot_settings` : settings object
- `forgetmenot_decks` : array of deck objects
- `forgetmenot_calendar` : calendar/check-in data
- `forgetmenot_friends` : friends array
- `forgetmenot_groups` : groups array

Seed data is provided in `seed.json` for local testing. Use `js/db.js` to migrate or read these keys at runtime.
