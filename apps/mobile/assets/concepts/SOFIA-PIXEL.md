# Sofía pixel artwork and development comparisons

`sofia-pixel-v1.png` and `sofia-pixel-v2.png` are separate generated redraws,
not filters of the existing Sofía illustration. V2 has finer drawing detail,
stepped contours and facial features; it is not an enlarged/blurred V1.
The original greeting/questioning assets and approved V1 file are unchanged.
V2 is now the actual app default; see `../../PIXEL-CAST.md`.
Generated with the built-in imagegen tool; transparent PNGs, 1024 × 1536.

Open with a development Metro server, enter Home, then choose **Sofía pixel art ·
vista previa de desarrollo**. The yellow dialogue button cycles **V2 → original →
V1 → V2** with one deliberate tap. Preview dialogue is immediately
visible and silent; the real lesson keeps its typewriter and audio behavior.
Every opening starts on the approved **SOFÍA PIXEL ART · V2 · DEV** / **PIXEL V2**.
The selection also resets to the concept when this component Fast Refreshes,
instead of retaining an earlier original-image comparison state.
The original comparison is labeled **SOFÍA ORIGINAL · DEV** / **ORIGINAL**.
The X (or Android system back) closes the preview without starting a lesson,
saving progress, changing orientation state, or playing audio.

The preview reuses the actual classroom, current dialogue panel and shared
opening dialogue. All comparison portraits stay stationary. Rendering prefers
integer multiples of logical 128 × 192 (V2) or 64 × 96 (V1) grids in physical
display pixels, rounding down to fit below the measured header and behind the
measured panel. V2 can fall back to half-size on small low-density viewports to
keep enlarged dialogue visible and scrollable. Pixel edges remain crisp on web.
Web additionally requests CSS `image-rendering: pixelated`. Core React Native
Image does not expose a cross-platform nearest-neighbor switch; check native
iPhone/Android resampling before approving this concept. The generated source
is a high-resolution pixel-art concept rather than an authored indexed sprite
with an enforceable 24-color palette or exact grid; production sprite cleanup
may still be desirable after art approval. No new dependencies were added.

The entry point and preview require `__DEV__`. Release bundles offer no preview
control. Expo export uses production mode, so use `start.ps1 -Clear` or
`npx expo start --clear` to review in compatible Expo Go or an existing
development client. A standalone release/internal-distribution build does not
expose this development preview. No build or update was published.

## If the phone still shows the original

The normal orientation and Lesson 000 now use approved V1. The original illustration is retained only as a comparison/rollback asset.
Enter the separate Home development preview, rather than replaying orientation.
Stop the existing Metro terminal with Ctrl+C, then run from `apps/mobile`:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1 -Clear
```

Close and reopen Expo Go/the development client and open this server's fresh QR
code. Enter Home (close orientation if it opens) and choose **Sofía pixel art ·
vista previa de desarrollo**. Confirm the **SOFÍA PIXEL ART · V1 · DEV** header;
an older generic preview header identifies an older client bundle.
Clearing Metro does not require clearing app storage or progress.

Verification checks the image bytes served by Metro against both concept PNGs
and the original WebP, and captures each rendered portrait for visual review.

## V1 generation prompt

Redraw the supplied Sofía concept as a genuinely LOW-RESOLUTION retro game NPC dialogue sprite. Keep the same friendly waving woman, long dark brown hair, warm tan skin, ivory sweater, blue jeans/belt, and head-to-upper-thigh composition. SIMPLIFY radically into a single consistent coarse pixel grid equivalent to 64 pixels wide by 96 pixels high, enlarged exactly 16x for a 1024x1536 delivery canvas: every logical pixel is one perfectly uniform 16x16 flat square. Use no more than 24 flat colors total including dark navy/brown contours. NO microtexture, NO gradients, NO tiny subpixel detail, NO antialiasing, NO softly shaded illustration. Face must be readable with only a few carefully chosen pixel clusters per eye and a friendly simple smile. Hair in large clean shadow/highlight clusters. Sweater in 3 ivory colors with simplified clean shading, jeans in 3 blue colors. This must look like an intentionally drawn game sprite, not a photograph or painting with a pixel filter. Single stationary pose, front-facing friendly wave, normal proportions rather than exaggerated chibi, all of head and hand within bounds, small transparent outer margin, jeans cut at bottom so an app dialogue box can overlap. TRANSPARENT ALPHA BACKGROUND, no colored backdrop, no glow or translucent haze, no shadows outside silhouette, no UI, no text, no props, no checkerboard image.
