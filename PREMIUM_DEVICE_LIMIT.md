# Premium Device Limit

Exprésate allows a Premium subscription on up to **two active devices**. Free accounts are never restricted. A third device remains signed in and can use free content, but Premium lessons stay locked until an older device is deactivated.

## Deployment

1. Open the Supabase SQL editor.
2. Run `supabase/user_devices.sql`.
3. Confirm Row Level Security is enabled on `public.user_devices`.
4. Test with a Premium account on three separate browser profiles or devices.

The frontend fails open when `user_devices` is unavailable. This lets the static site deploy before the table without locking out existing subscribers.

## Selection Policy

- Each browser installation receives an anonymous UUID stored under `expresate_device_id` in local storage.
- Login/session load upserts the current device and refreshes `last_seen`.
- The first two active devices by `first_seen` are allowed Premium access.
- A later active device is marked limited until one of the first two is deactivated.
- Deactivation moves that device to the back of the priority order. If its old session is used again, it cannot displace the two devices the user kept.
- Logging out deactivates the current device before the Supabase session is cleared.

Clearing browser storage creates a new device identity. Users can deactivate older devices from `devices.html`.

## Security Boundary

This phase is client-enforced. RLS protects one user’s device rows from other users, but a determined user can modify frontend JavaScript or manipulate their own rows. Strong enforcement should later move registration and entitlement checks into a Supabase Edge Function or database RPC that atomically:

1. registers the current device;
2. selects the two allowed devices;
3. returns a signed/effective Premium entitlement;
4. rejects Premium API operations from unapproved devices.

The current implementation is appropriate as sharing deterrence for a static GitHub Pages application, not as a hard security boundary.
