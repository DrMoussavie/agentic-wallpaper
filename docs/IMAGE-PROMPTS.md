# Génération des références visuelles

Outil utilisé : génération d’images intégrée (pas de CLI ni de clé API). Les références générées servent à fixer le style ; les 91 PNG opérationnels sont exportés depuis un modèle commun articulé en code. L’image d’ordinateur divergente est rejetée.

## Référence initiale

Use case: stylized-concept. Asset type: pixel art character animation reference sheet for a real 2D desktop wallpaper called Agent Transit.
Create a clean, extremely minimal pixel art sprite animation board on a pure black background. 8 columns by 6 rows of evenly spaced small sprites, no borders or labels. First three rows are the same small off-white square robot with a black rectangular screen face, two cyan square eyes, tiny antenna, simple arms and feet. Last three rows are the same robot with amber eyes and two short side antennae. True flat 2D front/three-quarter sprite view, chunky crisp square pixels, 16x24 pixel-level simplicity, 4-color per character. NOT 3D, NO smooth curves, NO gradients, NO realism, NO room, NO landscape. Each character occupies at most half its cell. In each family: row 1 contains idle, blink, and six walking poses; row 2 contains typing, reading a book, holding a magnifier, carrying a little parcel, waving, celebrating with both hands, confused, sleeping; row 3 contains four simple jump/arrival poses followed by four crouching/hiding-in-a-small-box poses. Strong visual consistency. Strictly aligned flat sprite board with black empty space between every sprite. No text, no watermarks, no giant characters. Palette black #000000, dark bluegray #303b48, off-white #dce9ee, cyan #65d9ed, amber #f5bb67. Charming old handheld-game pixel companions. This is a visual design reference for deterministic code animation, not a realistic illustration.

## Lecture — référence retenue

Use case: stylized-concept. Asset type: eight successive animation keyframes of ONE reading action, for a very simple flat pixel-art desktop companion.
Create a strict 4-column by 2-row sprite storyboard on a solid pure black background. Exactly EIGHT sprites, each is the SAME tiny white square robot with two cyan square eyes in a black rectangular face, ONE short antenna, stubby articulated hands and feet. 16x24-pixel simplicity, chunky perfectly square visible pixels. Palette pure black, off-white, slate, cyan, no realistic shading. Each frame represents the NEXT STEP OF THE SAME ANIMATION, not eight activities and not one unchanged robot holding a book. The character and book must visibly change pose in EVERY frame.
Reading order left-to-right top row then bottom row:
1 empty hands, reaching down to a closed cyan book at its side;
2 lifting the CLOSED book up with both hands;
3 actively opening the book covers into a wide V;
4 holding open book with right hand reaching for the top corner of a right-hand page;
5 right hand physically lifting a LARGE WHITE PAGE UPRIGHT in the middle, obvious vertical page sticking above book;
6 that white page now folded LEFT with hand stretched across the left side, head and eyes follow the page;
7 both hands actively closing the book covers together;
8 closed book being lowered back to the robot's side, free hand waves.
Book motion is essential; frames 3,4,5,6,7 must be unmistakably different, and the hands follow the book/page. Robot occupies less than half each cell. Strict fixed scale and baseline throughout. No text, no captions, no numbers, no grid borders, no other props, no computer. Absolutely no 3D, no realistic light, no smooth vector drawing. This is an animation breakdown in crisp low-resolution pixel art.

## Ordinateur — rejeté pour dérive du modèle

A functional sprite animation KEYFRAME SHEET, 4 columns by 2 rows. Exactly EIGHT successive steps of ONE action: the same tiny white robot uses a laptop and puts it away. Pure solid #000000 background everywhere. Flat hard-edged pixel art built like 24x32 pixel sprites. Tiny rectangular black face, two cyan pixel eyes, one antenna, simple articulated hands and feet. Offwhite, cyan, slate and black ONLY. ZERO glow, zero aura, zero bloom, zero gradients, zero lights, zero shadows around the sprites, zero 3D.
Each frame must be visibly DIFFERENT, fixed scale, fixed baseline, fixed character identity. Reading left to right:
1 robot carries a CLOSED thin laptop with both hands toward a small simple desk;
2 robot lays CLOSED laptop flat on the desk;
3 one hand lifts the laptop lid HALFWAY up, strong visible diagonal;
4 lid FULLY OPEN vertical, robot leans forward with LEFT hand pressing keyboard, RIGHT hand raised;
5 still open, robot's RIGHT hand presses keyboard, LEFT hand raised, several short cyan code lines now visible on screen;
6 robot presses a large enter key with one finger, screen displays a tiny check;
7 robot actively pushes screen lid HALFWAY DOWN, visible diagonal;
8 laptop CLOSED, robot picks it up and turns to put it away.
Do not show eight identical open laptops. The closed/open/half-open shapes and moving hands are the entire purpose. No giant laptop, no detailed room, no text/captions/grid, no realism. Occupy only half of each cell with the small robot and small prop; leave generous BLACK padding. This is a low-resolution pixel-game animation breakdown, not illustration.


