# Entrée, serveur et traces — v1.3.0

## Assets générés

- `public/assets/props/entrance-v1.png` : 96 × 40, parvis et quatre pas japonais. Source imagegen exec-9e8204c8-abe4-4130-9b6f-221a06e362d4.png.
- `public/assets/props/server-v1.png` : 24 × 36, serveur avec pictogramme courrier et bouche de tuyau. Source imagegen exec-049a7b05-89dc-4029-9268-a8364e149ffe.png.
- Import reproductible : `scripts/import-garden-detail.mjs input.png entrance-v1 96 40` ou `server-v1 24 36`. Retrait des marges, alpha et réduction sans lissage. La maison originale est inchangée.

## Comportement

Le parvis est ancré sur la porte, derrière la maison et les acteurs. Le muret reste derrière les fondations. Le serveur indique son activité quand des événements sont en transit ; son signal de connexion suit le relais. Les enveloppes PROMPT / REPLY et les petits paquets génériques utilisent sa bouche de tuyau. Les conduits vers les destinataires ne s’affichent que durant les transferts et restent désactivables via Conduits de données. Les petites traînées ne sont pas des prompts supplémentaires.

Les robots en marche laissent des petites semelles ; le chien des coussinets et trois doigts. Les traces sont purement décoratives, espacées selon la distance parcourue, alternent à gauche et à droite et disparaissent en 8 secondes. Maximum 128 traces, sans timer supplémentaire. Aucun dépôt immobile ou en pause ; un redimensionnement les efface, les téléportations n’en produisent pas.

## Prompt entrée

Use case: stylized-concept
Asset type: a single isolated pixel-art ground prop for a tiny 2D garden game, on TRUE TRANSPARENT background.
Subject: a very small home entrance patio. A shallow horizontal strip of blue-grey rectangular paving stones at the top, below it a short straight centered footpath of FOUR separated broad flat stepping stones pointing downwards. Two modest tiny tufts of muted moss at the outer corners of the patio. Footpath length similar to patio width. Compact T-shaped footprint. No house, no wall, no stairs, no doors, no sky, no other objects. Game front view with only very slight top-down view for flat ground tiles; NOT isometric.
Art style: extremely simple authentic hand-placed pixel art on a 64 by 40 logical pixel grid enlarged with nearest neighbor. Only SIX flat colors, dark slate grey, two muted lighter blue greys and two very muted moss greens. Big blocky rectangular pixel shapes. No tiny noisy details, no painted texture, no AI illustration look, no 3D shading, no photorealism, no smooth gradients, no anti-aliasing, no glow, no text, no border or ground-colored rectangle. Hard edges and genuine alpha around the irregular stone and moss shapes. Keep the upper patio only two rows of paving. Suitable to sit under a small white house with teal roof in an otherwise dark pixel garden. Generous transparent margins.

## Prompt serveur

Use case: stylized-concept
Asset type: one isolated tiny pixel-art mail server sprite for a 2D garden desktop game, TRUE TRANSPARENT background.
A friendly compact data server cabinet front view: rectangular blue-grey body, two small dark horizontal drive bays, tiny cyan and amber status indicator pixels, a small cream envelope pictogram on the upper dark display. At the bottom center a short dark round-square pneumatic tube outlet pointed downward, with a simple grey collar. Two squat feet. No face, no antenna, no vegetation. The cabinet is only 24 x 32 logical pixels enlarged nearest neighbor, looks carefully hand-pixeled. Exactly 7 flat colors including charcoal, slate blue-grey, pale grey, muted cyan, muted amber, cream. No text, no gradients, no lighting effects, no glow, no 3D, no noisy details, no shadows behind sprite, no background other than actual transparency. Every part large and readable at 24x32 pixels. Match a simple tiny pixel robot garden: understated, cute functional equipment, not a sci-fi illustration. Generous transparent margins.
