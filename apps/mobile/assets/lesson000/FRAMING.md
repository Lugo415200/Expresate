# Lesson 000 artwork framing

The `*-framed.png` files are lossless crops of the adjacent original PNGs, not regenerated illustrations. The original Apple/Airplane files contain baked-in card borders, word labels, and part of a speaker button. Their canvas centers do not represent the objects' centers.

Crop rectangles in original 320 × 320 pixel coordinates (left, top, right, bottom):
- apple: (80, 35, 288, 226)
- airplane: (48, 55, 314, 182)
- dog: (16, 14, 276, 313)

The crops preserve each complete visible object and its existing background. Lesson.tsx fits them with `contain` into equal 94 × 94 frames. The wider airplane deliberately retains its natural aspect ratio. Original files are retained.

Character WebPs already have close transparent framing (Sofía greeting: x=0–343 of 351; questioning: x=9–305 of 313; celebrating: x=11–360 of 371; Professor: full 348-pixel width). Their scene alignment was primarily caused by negative side offsets and fixed dialogue overlap. ImmersiveScene centers the stage and reserves the measured full dialogue height, with safe-area insets and a scrollable dialogue for large text.
