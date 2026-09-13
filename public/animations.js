/* Shared by the wallpaper and the animation workshop. Each action has timed phases. */
(function (root) {
  const actions = [
    ['arrive', 'Arrivée', 3.6, ['Le sas s’ouvre', 'Le robot sort', 'Il salue'], 'Une nouvelle session entre dans la station.'],
    ['idle', 'Veille', 4.8, ['Il regarde autour', 'Clignement', 'Il ajuste son antenne'], 'En attente d’un premier message.'],
    ['walk', 'Marche', 2.4, ['Pas gauche', 'Passage', 'Pas droit', 'Passage'], 'Déplacement sur les petites plateformes.'],
    ['think', 'Réflexion', 5.6, ['Il se gratte la tête', 'Il fait les cent pas', 'Une idée apparaît'], 'Animation d’activité après un message, pas une lecture des pensées.'],
    ['read', 'Lecture', 6.4, ['Il sort un livre', 'Il l’ouvre', 'Il tourne les pages', 'Il le referme et le range'], 'Lecture d’un fichier ou d’une ressource.'],
    ['search', 'Recherche', 5.2, ['Il sort sa loupe', 'Il inspecte le sol', 'Il trouve un indice', 'Il range sa loupe'], 'Recherche de texte, fichiers ou ressources.'],
    ['type', 'Écriture', 5.2, ['Il approche du clavier', 'Il tape des deux mains', 'Il relit', 'Il valide'], 'Modification ou création de fichiers.'],
    ['tool', 'Exécution', 5.2, ['Il prend une clé', 'Il tourne un boulon', 'La machine démarre', 'Il range son outil'], 'Commande shell ou outil générique.'],
    ['test', 'Vérification', 5.6, ['Il pose des éprouvettes', 'Il mélange', 'Les bulles montent', 'Il observe le résultat'], 'Une commande reconnue comme test ; le résultat vient de l’événement suivant.'],
    ['send', 'Envoi', 4.4, ['Il plie une lettre', 'Il ferme la capsule', 'Il charge le tube', 'La capsule part'], 'Message observé ou données envoyées à un outil.'],
    ['receive', 'Réception', 4.4, ['Une capsule arrive', 'Il l’attrape', 'Il l’ouvre', 'Il consulte le message'], 'Retour d’outil ou message adressé à un agent identifié.'],
    ['spawn', 'Délégation', 4.8, ['Il appuie sur un bouton', 'Le sas charge', 'Un assistant sort', 'Il lui indique le chemin'], 'Un sous-agent démarre ; il reçoit sa propre place.'],
    ['wait', 'Besoin de toi', 4.8, ['Il lève un drapeau', 'Il l’agite', 'Il te regarde', 'Il garde son drapeau'], 'Demande d’autorisation ou de précision.'],
    ['error', 'Incident', 4.8, ['La machine tousse', 'Il sursaute', 'Il éteint la fumée', 'Il montre un point d’exclamation'], 'Un échec réellement signalé.'],
    ['celebrate', 'Tour terminé', 4.8, ['Il s’accroupit', 'Il saute', 'Quelques confettis', 'Il salue'], 'La réponse est terminée, sans présumer que tous les tests passent.'],
    ['compact', 'Rangement mémoire', 5.6, ['Il empile des papiers', 'Il les comprime', 'Il ferme la boîte', 'Il la range'], 'Compaction du contexte.'],
    ['pause', 'Interruption', 4, ['Il freine', 'Il pose son outil', 'Il s’assoit', 'Il attend'], 'Tour interrompu, distinct d’une fin normale.'],
    ['sleep', 'Sieste', 6, ['Il baille', 'Il s’assoit', 'Il s’allonge', 'Il respire doucement'], 'Repos après une fin de tour et un délai d’inactivité.'],
    ['wake', 'Réveil', 4, ['Il ouvre un œil', 'Il se redresse', 'Il s’étire', 'Il est prêt'], 'Un nouveau message arrive après la sieste.'],
    ['archive', 'Au casier', 5.6, ['Il marche vers le casier', 'Il ouvre le couvercle', 'Il descend dedans', 'Le couvercle se ferme'], 'Retrait visuel ; aucune conversation n’est supprimée.'],
    ['clean', 'Petit ménage', 5.6, ['Il prend un balai', 'Il balaie les pixels', 'Il les pousse à la corbeille', 'Il range le balai'], 'Interlude décoratif après rangement.'],
    ['offline', 'Signal perdu', 4.8, ['Il inspecte sa prise', 'Il la rebranche', 'Il attend le signal', 'Il garde sa lampe'], 'Le pont local est déconnecté ; l’état réel est alors inconnu.']
  ];
  const ACTIONS = Object.fromEntries(actions.map(([id, name, duration, phases, description]) => [id, { id, name, duration, phases, description }]));
  const details={
    arrive:['Porte fermée','Ouverture du sas','Premier pas','Sortie du sas','Arrêt','Main levée','Petit salut','Prêt'],
    idle:['Regard à gauche','Retour au centre','Regard à droite','Clignement','Petit hochement','Main vers l’antenne','Antenne ajustée','Main baissée'],
    walk:['Appui gauche','Pied droit levé','Pas droit','Appui droit','Pied gauche levé','Pas gauche','Bras alternés','Retour à l’appui'],
    think:['Main à la tête','Il se gratte','Départ des petits pas','Aller','Demi-tour','Retour','L’idée apparaît','Il se redresse'],
    read:['Livre au côté','Prise du livre','Livre levé','Couvertures ouvertes','Prise de la page','Page vers la gauche','Fermeture du livre','Livre rangé'],
    search:['Main vers la loupe','Loupe sortie','Il se penche','Balayage à droite','Balayage à gauche','Inspection de l’indice','Petit signal','Loupe rangée'],
    type:['Portable fermé','Pose sur la table','Ouverture de l’écran','Main gauche au clavier','Main droite au clavier','Texte et validation','Fermeture de l’écran','Portable repris'],
    tool:['Prise de la clé','Outil levé','Approche du boulon','Premier tour','Second tour','La machine répond','Outil retiré','Outil rangé'],
    test:['Prise de l’éprouvette','Éprouvette levée','Inclinaison','Versement','Mélange','Bulles','Observation','Rangement'],
    send:['Papier déplié','Pliage','Capsule ouverte','Capsule fermée','Vers le tube','Chargement','Expédition','Petit salut'],
    receive:['Capsule en approche','Mains prêtes','Réception','Amortir le colis','Ouvrir la capsule','Sortir le message','Consulter','Ranger'],
    spawn:['Vers le bouton','Appuyer','Sas activé','Chargement','Apparition','Sortie du petit assistant','Indiquer le chemin','Accompagner du regard'],
    wait:['Prise du drapeau','Drapeau levé','Agiter à gauche','Agiter à droite','Regard vers toi','Nouvelle agitation','Maintenir le signal','Main baissée'],
    error:['La machine tousse','Surprise','Petit saut','Prise de l’extincteur','Premier jet','Second jet','Vérification','Signaler l’incident'],
    celebrate:['Préparation','Fléchir','Décollage','Bras levés','Confettis','Atterrissage','Salut','Retour au calme'],
    compact:['Première feuille','Empiler','Mains en place','Presser','Compresser','Relâcher','Fermer la boîte','Ranger'],
    pause:['Dernier pas','Freinage','Poser les mains','Se baisser','S’asseoir','Souffler','Attendre','Repos'],
    sleep:['Paupières lourdes','Bâillement','Se baisser','S’installer','Tête posée','Sommeil','Petite respiration','Un z s’envole'],
    wake:['Sommeil','Un œil ouvert','Se redresser','Se lever','Bras levés','Grand étirement','Sourire','Prêt'],
    archive:['Vers le casier','Quelques pas','Arrivée au casier','Ouvrir le couvercle','S’installer','Descendre','Dernier regard','Couvercle fermé'],
    clean:['Prise du balai','Mise en place','Balayer à gauche','Balayer à droite','Avancer','Pousser les pixels','Vers la corbeille','Rangement'],
    offline:['Prise inspectée','Débrancher','Regarder la fiche','Rebrancher','Attendre','Réessayer','Contrôler le signal','État inconnu']
  };
  for(const [id,steps] of Object.entries(details))ACTIONS[id].steps=steps;
  ACTIONS.read.duration=8;ACTIONS.type.duration=8;ACTIONS.send.duration=6;ACTIONS.receive.duration=6;ACTIONS.spawn.duration=6;
  const phase = (id, time) => {
    const a = ACTIONS[id] || ACTIONS.idle;
    const progress = ((time % a.duration) + a.duration) % a.duration / a.duration;
    return { progress, index: Math.min(a.phases.length - 1, Math.floor(progress * a.phases.length)), label: a.phases[Math.min(a.phases.length - 1, Math.floor(progress * a.phases.length))] };
  };
  root.TransitAnimations = { ACTIONS, phase };
})(globalThis);
