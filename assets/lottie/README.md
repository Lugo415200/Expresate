# assets/lottie/

## Animation approach

All microinteractions in Exprésate are implemented as **pure CSS animations**
rather than Lottie JSON files. This was a deliberate design decision:

| Factor | CSS animations | Lottie JSON |
|---|---|---|
| External dependency | None | Requires `@lottiefiles/lottie-player` CDN or npm |
| File size | ~0 KB (rules in existing CSS) | 10–150 KB per animation + 60 KB runtime |
| Licensing | No restrictions | LottieFiles assets mix CC-BY, Editorial, and Premium licenses — requires per-file review |
| GitHub Pages | Always works offline | CDN failures break animations |
| `prefers-reduced-motion` | Single `@media` block | Requires JS opt-out per player instance |
| Performance | GPU-composited transforms | Depends on animation complexity |

## Animations implemented

| # | Use case | CSS class / trigger | File |
|---|---|---|---|
| 1 | Premium lock wiggle | `.lock-icon` on `<span>` inside `.premium-lock-overlay` | `gamify.css` |
| 2 | Step completion pop | `.step-complete-pop` added to `.stepNum` in `applyLocks()` | `gamify.css` |
| 3 | XP reward pop | `.xp-value-pop` added to `#xp-stat-value` in `renderProgressPanel()` | `gamify.css` |
| 4 | Skeleton shimmer | `.skeleton-pulse` — apply to any loading placeholder element | `theme-light.css` |
| 5 | Audio button ripple | `.is-playing` — added by `app.js` via `_setPlayingBtn()` | `theme-light.css` |

## If you later want real Lottie files

1. Choose animations from [LottieFiles](https://lottiefiles.com/) — filter by
   **Free** license only.
2. Download the `.json` file and save it here.
3. Add `<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>`
   to the relevant HTML page.
4. Replace the CSS-animated element with:
   ```html
   <lottie-player src="assets/lottie/your-file.json"
                  background="transparent" speed="1"
                  autoplay loop>
   </lottie-player>
   ```
5. Wrap in a `prefers-reduced-motion` check in JS or CSS.
6. **Credit the author** per their license terms (usually requires attribution
   in UI or source comments).
