# Jardin simplifié

Images générées avec l'outil Image Gen intégré :

- public/assets/props/garden-v2.png : douze sols, atlas 4 × 3.
- public/assets/props/trees-v2.png : quatre arbres, atlas 4 × 1, sprites 24 × 32.
- public/assets/props/hoop-v2.png : support et panneau de basket, sprite 24 × 48.

Les sols remplacent terrain-v1 dans le rendu. Ils sont affichés à 20 % en
composition Screen pour conserver le fond sombre. Une disposition utilise
autant de variantes que l'espace le permet ; les douze ne sont pas toutes
forcées dans un petit écran. La surface de chaque plaque a été réduite.

Les arbres ont une vraie transparence autour de leur silhouette et sont
triés selon la position du pied, avec les robots et les accessoires. Opacité
normale 72 %, réduite à 34 % lorsqu'un robot ou le chien se trouve derrière.
Les arbres décoratifs ne bloquent pas les clics ni les déplacements.

Le panneau de basket utilise une image générée, importée à faible résolution
et palette limitée. Le filet conserve son animation. Le support roule pendant
1,1 seconde après le délai de célébration ; les collisions et les nouveaux tirs
d'agents sont suspendus pendant ce déplacement. Un contact d'anneau déclenche
une vibration et deux éclats ; un panier marqué déclenche le filet et une gerbe
de pixels distincte. Tout suit le temps du fond d'écran, donc sa pause.

## Prompts de génération

### Sols
Use case: stylized-concept. Production pixel art game ground sprite atlas, EXACTLY 4 columns by 3 rows, TWELVE distinct separate small garden ground patches. Each cell equal size, centered sprite occupies 75% cell width and 65% cell height, all black margins. Pure uniform BLACK #000000 background, no grid or labels. Top-down low flat garden patches, no tall cliffs or floating islands. Authentic simple chunky pixel art, roughly 48x32 logical pixels per patch, hard square edges, flat limited palette, NO gradients or realism. Friendly peaceful little garden, muted moss and sage greens, warm olive soil, subtle tiny cream pink lavender and pale yellow flower accents. DARK midtones, restrained saturation, not fluorescent. Each patch mostly grassy ground, sparse decorations and generous calm space. Row1: 1 clover lawn with three tiny cream daisies; 2 curved moss patch with scattered yellow buttercups; 3 oval lush short grass with two small pink blooms; 4 asymmetric fern-green turf with tiny lavender flowers. Row2: 5 low grass hummock with a narrow worn earth path; 6 kidney-shaped clover patch with a tiny flat stepping stone; 7 soft moss patch with two miniature red mushroom caps; 8 curved grass shelf with a few cream flower specks. Row3: 9 gently terraced lawn with tiny pink flowers along one edge; 10 patch of sage grass surrounding a tiny dark blue dew puddle; 11 irregular meadow with sparse yellow flowers and small leaves; 12 rounded moss garden with a few tiny lavender buds. All twelve different silhouettes and arrangement. Cheerful through organic greenery and tiny accents, not through brightness. No cracks, craters, wasteland, rocks dominating, buildings, characters, trees, fences, text, glow or shadows on the background. Full atlas fits canvas, no cropping.

### Simplification des sols
Edit this sprite atlas into much simpler authentic low resolution pixel art. Keep exactly 12 garden patches in 4 columns 3 rows, same positions on PURE BLACK background. Remove the winding brown path entirely from row2 column1: replace it with plain short grass and two small daisies. Remove smooth painterly texture, dithering, gradients and excessive individual grass blades from EVERY patch. Use large flat connected color clusters and only 3 shades of muted sage green for grass. Tiny sparse flowers, mushrooms and small pond allowed. Simplify silhouettes to chunky 4-pixel steps. Each patch should look hand-pixeled at only 32x24 logical pixels, not AI illustration. Calm flat walkable lawn surfaces; sparse modest garden details. No paths anywhere, no glow, black margins remain perfectly black. Twelve distinctly shaped minimalist lawn tiles, genuinely crisp edges, cute restrained retro game style.

### Arbres
Production sprite atlas. Four tiny stylized pixel art garden trees, exactly 2 columns x 2 rows equally spaced. PURE SOLID BLACK #000000 background, no shadows on background, no gradients or glow. Full tree in each cell with trunk base aligned and generous margins. Top-left round apple-green deciduous tree. Top-right compact triangular pine with three foliage tiers. Bottom-left round sage tree with a few tiny pink blossom pixels. Bottom-right small slender birch with soft green crown. Style: minimalist hand-pixeled 16-bit game, each tree only 24x32 logical pixels enlarged with nearest-neighbor hard squares. Muted green leaf clusters, brown-grey short trunks. Only THREE flat shades per crown, two per trunk, no detailed individual leaves, no dithering, no realistic textures, no smooth curves. Each tree a readable simple iconic silhouette, gently happy, small garden objects to accompany tiny pixel robots. Front 3/4 view from slightly above, visible short trunk below foliage. No terrain base, grass, text, frame, grid, labels, other props or characters. Pure black in every empty pixel surrounding trees. Exactly four different trees.

Édition finale : réduire les arbres à des silhouettes de 16 × 24 pixels logiques,
deux aplats de vert par feuillage, deux couleurs de tronc, quelques pixels de
pommes ou fleurs, sans gradients ni textures, sur fond noir.

### Panier
A single production game sprite on PURE SOLID BLACK background: small portable basketball hoop SUPPORT AND BACKBOARD ONLY, no rim and no net (they are animated separately in code). Minimalist chunky 16-bit pixel art, 24x40 logical pixels enlarged nearest-neighbor. Full upright support centered, bottom base visible, generous black margin. View from slightly above and 3/4 from left, the hoop would face LEFT of the post. Short rectangular dark grey weighted base at bottom, narrow muted grey metal upright, small off-white rectangular backboard at top offset slightly left of post, dark slate border and a small burnt-orange shooting target square on panel. Board must be clearly visible as a small rectangle, not an edge line. Clean friendly garden game prop, simple angular geometry, five flat colors only, no gradients, no textures, no glow, no realistic reflections. No basketball, no rim, no net, no characters, no ground, no text. All empty background exactly black. Match sparse pixel-art garden with tiny grey robots.

Les atlases d'arbres et de panier sont préparés par scripts/import-garden-props.mjs :
détourage du fond noir, recadrage, réduction à la taille de jeu, palette limitée.
