# Identité visuelle figée — modèle 01

Référence retenue par l’utilisateur : le petit robot carré de la planche de lecture, pas le robot plus détaillé et différent de la planche d’ordinateur.

Un seul modèle est défini dans `public/rig.js`. Toutes les séquences, les planches et les sprites utilisent ce modèle. Tête 18 × 14, corps 8 × 9, écran noir, yeux rectangulaires, petites mains en moufles. Les gestes déplacent les articulations ; ils ne remplacent pas la tête et ne changent pas les proportions.

Codex : coque blanc cassé, yeux cyan, une antenne. Claude : coque ardoise sombre, yeux ambrés, deux antennes. Le sous-agent conserve la famille de son parent, à une taille réduite. Un animal décoratif est visuellement distinct et ne compte pas comme agent.

Décor : noir majoritaire, équipements clairs et miniatures, lignes fines, composition procédurale dans un espace libre. Aucun poste assigné, aucun laboratoire réaliste, aucune perspective 3D. Les positions, destinations et rencontres se calculent à partir de la population et des dimensions courantes, pour toute proportion d’écran. Quelques appareils discrets restent en bordure ; les conduits apparaissent pendant les transferts. Le projet évoque la simplicité ludique de The Lab sans reprendre ses assets.

Les nouvelles images opérationnelles doivent être exportées depuis ce modèle commun. Si une nouvelle référence générée est nécessaire, fournir explicitement `public/assets/reading-reference-v2.png` comme référence d’identité et vérifier les invariants avant de la retenir. Ne pas générer chaque activité indépendamment sans référence.

Évolution jardin / maison : le modèle des personnages reste inchangé, affiché beaucoup plus petit. Les props de décor sont des PNG générés indépendants : herbe, fleurs, pierres et maison. Une maison commune avec porte animée organise les entrées et le repos. Elle reste en haut à gauche avec une marge ; les déplacements occupent la largeur disponible en dessous. Leur profondeur dépend de la population et de la hauteur disponible. Les props sont répartis sur toute la surface de l’écran en petits groupes espacés, avec beaucoup de noir entre eux : ils ne dessinent pas seulement les bordures du jardin. Leur densité dépend de la surface, et non du nombre d’agents. La porte, le chemin et les équipements gardent un dégagement. Le réseau passe le long du chemin et reste discret. Ne jamais accepter un faux damier opaque comme transparence.
