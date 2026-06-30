# Exprésate Studio publishing

Phase 7 keeps Studio authoring in `localStorage` and adds explicit cloud publishing for lessons. It does not put a service-role key or any other secret in the browser.

## One-time Supabase setup

1. Open the Supabase SQL Editor for the Exprésate project.
2. Run [`supabase/studio_publishing.sql`](supabase/studio_publishing.sql).
3. Confirm the final seed statement inserted the intended Studio administrator into `public.admin_users`.
4. If another administrator is needed, add their authenticated user ID explicitly:

```sql
insert into public.admin_users (user_id, email)
select id, lower(email)
from auth.users
where lower(email) = 'admin@example.com'
on conflict (user_id) do update set email = excluded.email;
```

The frontend email allowlist controls whether the Studio link and UI appear. The database `admin_users` table and RLS policies control whether writes are actually allowed. Both must include an administrator.

## Tables

- `studio_lessons`: lesson metadata, cloud status, XP, Premium flag, and author.
- `studio_lesson_blocks`: ordered JSON block payloads attached to a lesson.
- `admin_users`: authenticated users permitted to write Studio content.

Vocabulary and Media Library records remain local in Phase 7. Vocabulary blocks publish a sanitized snapshot of the selected vocabulary so learners on other devices can render the lesson. Image and audio paths remain project-relative static asset paths.

## Publishing workflow

- **Save Local Draft** writes only to `expresate_studio_lessons_v1` in the current browser.
- **Publish to Supabase** validates the title, slug, and blocks, then atomically upserts metadata and replaces ordered blocks through `publish_studio_lesson`.
- **Unpublish** changes the cloud lesson to `draft`; public RLS immediately hides it.
- **Sync from Supabase** imports cloud lessons into the current browser. Matching local slugs are replaced after confirmation.

Cloud state is tracked locally under `expresate_studio_publish_state_v1` so Studio can distinguish local-only, published, cloud-draft, and locally-updated content.

## Learner loading order

1. Handcrafted course lessons always render first.
2. `curso.html` fetches published cloud lessons and appends them as a Studio module.
3. On localhost, published local lessons remain available for testing and are de-duplicated by slug against cloud lessons.
4. `lesson.html?slug=...` requests a published cloud lesson first, then falls back to a published local lesson.

Supabase failures do not block handcrafted lessons. Supabase API requests remain external-origin, network-only requests and are not cached by the service worker.

## Security boundary

- Anonymous and authenticated learners can select only `published` lessons and their blocks.
- Authenticated Studio admins can read drafts and insert, update, or delete content.
- `publish_studio_lesson` runs with the caller's permissions and remains subject to RLS.
- Draft and archived lessons are not visible through the public client.
- Never add `SUPABASE_SERVICE_ROLE_KEY` to frontend code.
