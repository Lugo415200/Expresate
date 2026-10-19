# Native pixel cast milestone

## Defaults and rollback

`src/characterArt.ts` selects Sofía V2 (`assets/concepts/sofia-pixel-v2.png`)
and the clearer professor V2 (`assets/characters/professor-pixel-v2.png`).
Both are transparent 1024 × 1536 PNG portraits. Sofía is shared by the actual
orientation/story, Lesson 000 final challenge and course map. Both V1 assets
and the original shared illustrations remain available for rollback.

The professor V2 was generated once with built-in imagegen. Sofía V2 supplied
the finer pixel-art style; professor V1 supplied identity, pose and composition.
The generation preserved rectangular glasses, dark wavy hair, facial hair,
navy sweater, blue collar/cuffs, marker, belt and khaki trousers. No new screen
art or classroom was generated.

Classroom artwork remains separate at
`../../assets/backgrounds/classroom/classroom-day.webp`. Portrait framing,
logical rendering grid, stationary characters and the 12px dialogue-panel
overlap are unchanged. Audio, typewriter, navigation and rewards are unchanged.
Core native Image resampling still requires a physical-phone visual check.

## Development comparison

Home's development-only Sofía preview starts on V2 and cycles V2 → original →
V1 → V2. It is silent and does not save progress. Release bundles have no preview
control. Original illustrations and V1 are retained; no destructive asset edits.

## Professor V2 generation specification

One transparent character-only 2:3 portrait, same composition and pose as V1.
Use approved Sofía V2 as the style reference for finer intentional pixel clusters,
smooth stepped contours, readable facial details and controlled color ramps.
Preserve his glasses, hair, facial hair, friendly expression, outfit and marker.
Entire head, marker and hands visible; lower trousers meet the bottom for panel
overlap. No classroom baked into the image, blur, glossy 3D or photorealism.
