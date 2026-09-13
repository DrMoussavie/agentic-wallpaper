# Terrains générés

Générateur : outil de génération d'images intégré, sans API externe configurée.
Asset utilisé directement : public/assets/props/terrain-v1.png.
Quatre cellules, disposition 2 × 2. Le renderer recadre les cellules et les
répartit selon la taille de l'écran. Le fond noir s'efface par composition
Screen ; l'intensité est réduite à 52 %. La carte composée est mise en cache.
Les anciens contours de terrain dessinés par le code sont remplacés par cet atlas.

## Prompt exact

Use case: stylized-concept. Production sprite atlas for a minimalist pixel-art desktop garden. Four separate terrain sprites arranged in EXACT 2 columns by 2 rows, equal square cells. Pure solid BLACK #000000 background throughout, including all empty space between sprites. Each cell contains one low irregular patch of ground seen nearly top-down, only a subtle 2-pixel-thick lower ledge, flat walkable surface. Upper left: irregular dark grey-green grassy soil shelf. Upper right: dark slate-grey rocky shelf with one shallow hollow. Lower left: low mossy earth terrace with sparse tiny grey chips. Lower right: muted grey-green patch with a shallow winding crack. These are GROUND surfaces, not boulders, not floating islands, no thick cliffs. Extremely restrained authentic pixel art with large crisp square pixels; logical resolution approximately 64x48 pixels per sprite enlarged nearest-neighbor. ONLY 5 flat dark colors plus black: #0c1411 #121c18 #1a2620 #26312b #344037. No gradients, no lighting glow, no photorealism, no detailed grass texture, no cute objects, no trees, no flowers, no buildings, no text or labels, no outlines around cells. Sparse tiny texture marks, mostly calm flat surfaces. All four shapes visibly different, asymmetric natural stair-step contours, maximum width 75% and height 60% of each cell, ample black margins, centered. Low contrast, dark background decoration behind tiny robots, tasteful and simple. Black background must be perfectly uniform, not noisy.
