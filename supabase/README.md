# Supabase setup

Apply the migrations in filename order. Either paste each file into the Supabase SQL editor, or, if the Supabase CLI is linked to your project, run:

```sh
supabase db push
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` locally as documented in `.env.example`. Never expose the service-role key to this frontend.

Both tables enable Row Level Security. Anonymous visitors may only insert rows whose status is `pending`; they can only read moderated public rows. Guestbook deletion is soft deletion through `deleted_at`. Moderation itself should be performed from a trusted dashboard/server context.

The browser cooldown is a usability measure, not abuse protection. A future server-side function or rate-limited API should enforce submission frequency by `client_id`; Realtime Broadcast reactions likewise have no table RLS.
