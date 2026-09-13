# Ciel et cycle local

Option Fond → Cycle réel — ciel bleu (valeur Wallpaper Engine : 3).
Le cycle suit l'horloge locale du PC ; il n'utilise pas la position géographique
ni des heures astronomiques de lever/coucher. Aube progressive de 6 à 8 h,
crépuscule de 19 à 21 h, nuit entre les deux. Le sol reste sombre.

Image générée avec Image Gen intégré, puis importée en sprites à fond transparent :
public/assets/props/sky-v1.png, six cellules de 48 × 32.
Soleil, deux nuages, lune, groupe d'étoiles et étoile filante.
Animations : trajectoire solaire selon l'heure, nuages lents, scintillement et
une courte étoile filante toutes les 85 secondes de fonctionnement nocturne.
Les animations suivent la pause du fond ; l'ambiance se resynchronise avec
l'heure du PC à la reprise. Le cycle de fond fonctionne même sans papillons.

L'option existe dans l'aperçu et l'export Wallpaper Engine. Les modes de fond
antérieurs gardent leurs valeurs. Comparaison visuelle : /sky-preview.html.

## Prompt de génération exact

Production pixel-art sky props sprite atlas, exactly THREE columns by TWO rows, six equally spaced isolated sprites. PURE SOLID BLACK #000000 background with generous black margins. Row1 column1 a small warm pale-yellow pixel sun, round square-stepped disk with 8 short block rays. Row1 column2 a small wide fluffy off-white cloud, only two flat colors cream and pale blue-grey. Row1 column3 a longer wispy cloud made of three blocky puffs, same two-color palette. Row2 column1 a pale ivory crescent moon tilted slightly right, simple crisp silhouette. Row2 column2 a cluster of exactly three small four-point pixel stars, pale cream and muted blue. Row2 column3 a tiny shooting star pointing down-left with a short stepped pale blue tail up-right. Authentic extremely simple hand-pixeled 8-bit / 16-bit style, only about 16 to 32 logical pixels per sprite enlarged nearest neighbor, big hard square pixels, flat fills, no gradients, no blur, no glow, no painterly shading, no realism, no faces, no text or labels, no grid. Clean modest cheerful props matching tiny pixel robots and a sparse garden. All sprites fully contained in their cells. Black must be perfectly flat and uniform in every empty area.
