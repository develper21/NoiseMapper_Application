Demo checklist — NoiseMapper

1) Git / workspace cleanup
- Ensure `.expo/` is ignored and removed from git if accidentally committed:

  git rm -r --cached .expo || true
  git commit -m "Remove .expo from repo" || true

2) Environment variables
- Create a `.env.local` in the `Application/` folder and include:

  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY

3) Database (Supabase)
- Open Supabase SQL editor and run `supabase-schema.sql` (the file is idempotent and safe to re-run).
- Helpful queries:

  -- List policies
  SELECT polname, polrelid::regclass AS table_name, pg_get_userbyid(polowner) AS owner FROM pg_policy ORDER BY table_name, polname;

  -- List publication members
  SELECT p.pubname, pr.prrelid::regclass AS table_name FROM pg_publication p JOIN pg_publication_rel pr ON pr.prpubid = p.oid WHERE p.pubname = 'supabase_realtime';

- If you see errors like "relation is already member" or "policy already exists", the schema file includes checks that make operations idempotent; re-run it as-is.

4) Install deps & start
- From `Application/`:

  npm install
  npm run type-check
  npm run lint
  npm start

- For web preview:

  npm run web

5) If Expo-doctor reports asset errors
- Confirm assets exist in `Application/assets/` and match `app.json` paths. The repo includes placeholder images; if you want custom art, replace those files.

6) If you need help during the demo
- Copy exact terminal errors and send them to me; I will iterate quickly on fixes.
