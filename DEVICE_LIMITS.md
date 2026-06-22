# Premium Device Limits

## Policy

Premium accounts may use Premium content on up to two active devices. Free accounts are unrestricted. A third Premium device remains signed in and can use free content, but Premium access is withheld until an older device is deactivated.

The single policy constant is `MAX_PREMIUM_DEVICES` in `access.js`. Its default value is `2`. `devices.html` does not duplicate that number; `devices.js` renders the limit from `Access.getDeviceLimitState().maxDevices`.

## Device Identity and Registration

Each browser installation receives an anonymous UUID stored in local storage as `expresate_device_id`. On initial session load and subsequent Supabase auth events, `access.js` upserts the current browser into `public.user_devices`, updates `last_seen`, and marks it active.

The first active devices, ordered by `first_seen`, receive the available Premium slots. Device registration does not restrict free accounts.

## Access Enforcement

`Access.hasPremiumSubscription()` checks the subscription entitlement. `Access.hasPremium()` combines that entitlement with the current device state. Existing lesson and course gates call `Access.hasPremium()`, so an over-limit device loses only Premium access, not its authenticated session or free content.

If the device registry cannot be reached, its table has not been deployed, or its query fails, device enforcement fails open: the existing Premium entitlement remains available. This prevents a temporary device-registry failure from locking out subscribers.

## Device Management and Logout

`devices.html` lists the signed-in user's active and inactive devices, identifies the current browser, and marks devices that hold a Premium slot. Users can deactivate an older device from this page. Deactivation updates `is_active`, moves that device behind retained devices in the priority order, and refreshes access immediately.

Both logout paths call `Access.deactivateCurrentDevice()` before `supabase.auth.signOut()`, so a normal logout releases that device's active slot.

## Data Isolation

`supabase/user_devices.sql` enables Row Level Security. Its select, insert, and update policies require `auth.uid() = user_id`, preventing authenticated users from reading or changing another user's device rows.

## Security Boundary

This implementation is a sharing deterrent for a static client application. RLS protects account isolation, but determined users can modify client code or their own device rows. Strong enforcement should eventually move registration and entitlement decisions into a Supabase Edge Function or transactional database RPC.
