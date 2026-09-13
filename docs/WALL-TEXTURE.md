# Muret du jardin — texture générée

Source : imagegen, exec-239adece-e9b9-40f3-bb58-33bd2d7ddcd2.png.

Tuile livrée : public/assets/props/wall-v1.png, 192 × 20 pixels. scripts/import-wall.mjs retire les marges, réduit sans lissage et double la bande en miroir pour garantir un raccord horizontal exact. Le renderer répète à taille native et rogne seulement la dernière tuile ; aucune déformation selon le ratio d’écran. Opacité 38 % la nuit à 78 % le jour. Muret derrière la maison et les acteurs, uniquement en fond cycle.

Prompt exact :

Use case: stylized-concept
Asset type: horizontally seamless repeatable game texture, a very low garden stone wall for a tiny pixel art wallpaper.
Generate one wide 3:1 image entirely filled edge-to-edge by the wall texture. Front orthographic view. A straight thin coping row along the very top, then exactly TWO rows of simple staggered rectangular blue-grey stones. Small sparse muted moss green pixels in a few joints. Very simple restrained hand-placed 16-bit pixel art, hard square pixels, flat limited palette of 5 blue-grey shades and 2 muted moss greens, no smooth shading, no photographic detail, no 3D, no perspective, no scenery, no sky, no labels, no outlines around the entire image. The wall must seamlessly TILE horizontally: identical row heights at left/right edges, stones continuing naturally through the edges. Flat consistent illumination, no edge vignettes. This will be reduced to 96x24 game pixels and repeated across any screen width. Keep large readable blocky stones and very few details, quietly charming, not ruined, not elaborate.
