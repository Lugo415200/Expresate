# Sofía V2 art notes

Asset: `sofia-pixel-v2.png`, transparent RGBA PNG, 1024 × 1536.
Created with built-in imagegen as a new finer pixel-art drawing using V1 and the
original greeting image as identity/pose references. Neither reference was
modified. V2 remains an optional development comparison. The user approved V1 as
the actual app default; see `../../PIXEL-CAST.md`. No dependency, release or remote update added.

The drawing aims at roughly double V1's logical resolution per direction, with
smaller contour steps, detailed eyes/smile, hair and fabric shading clusters.
This is generated concept art rather than a hand-authored indexed sprite;
logical grid dimensions describe intended rendering and are not a claim of
perfectly enforced palette indexing in every delivered source pixel.

Reviewed the rendered V2, V1 and original against the actual classroom and
dialogue controls, including a 3× display-density browser proxy. Check native
iPhone/Android edge resampling, safe areas and Dynamic Type on a phone before
approving a production replacement.

See `SOFIA-PIXEL.md` for opening/reload instructions and comparison controls.

## Generation prompt

Use case: identity-preserve pixel-art redraw. Create Sofía V2 as a NEW DRAWING at a FINER PIXEL ART RESOLUTION. Reference image 1 is V1: preserve its exact recognizable character identity, normal body proportions, hair silhouette, friendly waving pose, outfit, head-to-upper-thigh framing and expression. Reference image 2 is the original Sofía: identity/clothing and expressive face reference only. V1 is too chunky; redraw V2 at approximately 128 by 192 logical pixels, DOUBLE V1's linear drawing resolution and FOUR TIMES the pixel detail. Deliver a 1024x1536 transparent PNG using consistent small crisp pixel clusters (approximately 8x8 delivered squares rather than V1's large blocks). This is NOT enlargement, interpolation, blur, sharpening or a pixel filter on V1. Redesign the curves as smoother finely stepped contours, clean single-logical-pixel stair steps around cheeks/jaw/nose, hair strands in coherent slim clusters, refined readable fingers and friendly waving hand, smaller garment folds, expressive warm brown eyes with carefully placed pixels, readable eyebrows and warm smile. Long dark brown flowing hair, warm tan skin, ivory V-neck sweater, blue jeans and brown belt, simple small gold earrings/necklace. Keep clean intentional palette-limited pixel shading with 3-5 discrete color ramps per material, no noise or photo fabric texture. Crisp deliberate edges and clean shading; visibly pixel art at actual phone size but less blocky and more nuanced than V1. Preserve character proportions rather than chibi. Entire head and waving hand visible; lower jeans terminate at bottom for an app dialogue panel to overlap. Single stationary character. GENUINE transparent background/alpha, minimal outer transparent padding, no backdrop, no haze, no glow, no floor, no drop shadow, no UI, no text, no badges, no glossy 3D, no photorealism, no blur or smooth airbrush gradients.
