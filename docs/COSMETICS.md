# Jardin : chien et finitions

Le chien utilise `public/assets/pet/puppy-v2.png`, atlas de 6 colonnes × 4 lignes,
cellules de 48 × 40 pixels, silhouette d'environ 24 × 18 pixels, cinq couleurs.
Lignes : marche, repos, reniflement, jeu. Les oreilles et la queue changent entre
les poses. La course accélère la marche ; les caresses arrêtent la promenade
pour jouer, sauf si une alerte ou une balle à rapporter demande son attention.

Image créée avec le générateur intégré, puis préparée en atlas à palette limitée.
Le générateur a livré un fond opaque : le script de préparation détoure les
silhouettes fermées, aligne les pattes et impose une transparence binaire.
Le fond généré et le chien doré détaillé ont été écartés du rendu final.

Prompt final : « Extremely minimal authentic 16-bit pixel art. Exactly six columns
and four rows of the same tiny floppy-eared puppy facing right. Logical sprite
24 × 18 pixels. Flat warm grey body, light grey muzzle and paws, dark floppy ears,
black eye and nose, muted teal collar. No fur texture, gradients or dithering.
Row 1 walk, row 2 idle with ear movement and blink, row 3 sniff, row 4 happy play bow.
Same scale, baseline, identity. No scenery or text. Transparent background. »

Les dix finitions de chaque famille sont dans `TransitSprites.SKINS`. Le hash
de l'identifiant de session et du fournisseur attribue un skin stable. Classic
a un poids de 75 %, les sept couleurs de 23 % au total (Cherry et Bubblegum :
4 % chacune, les cinq autres : 3 % chacune), Lunar de 1 % et Stardust de 1 %.
Les couleurs sont modérées ; Stardust garde son jaune or vif.
Cela ne garantit pas un robot rare dans
un petit groupe. Les antennes, les yeux et toutes les articulations restent
ceux du modèle d'origine. Les mini-agents ont leur propre identité stable.

`/wardrobe.html` permet de comparer les vingt skins en mouvement et les quatre
animations du chien. Le panier, la niche et les petits décors gris sont dessinés
en pixels dans le renderer, sans textures supplémentaires.
