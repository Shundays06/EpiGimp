# Changelog - EpiGimp

## Nouvelles fonctionnalités implémentées (4 décembre 2025)

### ✅ Issue #6 : Historique et Undo/Redo
- **Raccourcis clavier** : 
  - `Ctrl+Z` (ou `Cmd+Z` sur Mac) : Annuler
  - `Ctrl+Shift+Z` ou `Ctrl+Y` : Rétablir
- **Boutons UI** : Ajout de boutons "Annuler" et "Rétablir" dans l'en-tête
- **Hook personnalisé** : `useHistory` pour gérer l'historique des modifications
- **Sauvegarde automatique** : L'état du calque est sauvegardé avant chaque modification

### ✅ Issue #7 : Réglages d'image (Contraste, Luminosité, Saturation)
- **Filtres améliorés** :
  - Luminosité : -100 à +100
  - Contraste : -100 à +100
  - Saturation : 0 à 200 (50 = normal)
  - Flou : 0 à 10
- **Interface améliorée** : Sliders avec plages de valeurs intuitives
- **Aperçu en temps réel** : Les valeurs min/max sont affichées sous les sliders

### ✅ Issue #8 : Gestion avancée des formats d'import/export
- **Import supporté** : PNG, JPEG, GIF, WebP, BMP
- **Export amélioré** :
  - PNG (sans perte, avec transparence)
  - JPEG (compression avec perte)
  - WebP (meilleure compression)
- **Validation** : Vérification des types de fichiers lors de l'import
- **Nommage automatique** : Les exports incluent un timestamp

### ✅ Issue #9 : Outil Texte
- **Nouveau calque automatique** : Chaque texte est ajouté sur un calque dédié
- **Modal de saisie** : Interface intuitive pour entrer le texte
- **Paramètres de texte** :
  - Taille de police : 12px à 200px
  - Famille de police : 8 polices disponibles (Arial, Helvetica, Times New Roman, etc.)
  - Style : Gras et/ou Italique
  - Couleur : Sélecteur de couleur intégré
- **Support multi-lignes** : Possibilité d'ajouter des sauts de ligne
- **Raccourcis clavier** :
  - `Ctrl+Enter` : Ajouter le texte
  - `Esc` : Annuler

## Améliorations techniques

### Architecture
- Séparation des responsabilités entre composants
- Hook personnalisé pour l'historique
- Gestion d'état améliorée avec React hooks

### UX/UI
- Curseurs adaptés à chaque outil (crosshair, text, pointer, etc.)
- Messages d'aide contextuels
- Feedback visuel pour les actions disponibles
- Modal élégant pour la saisie de texte

### Performance
- Optimisation du rendu des calques
- Limitation de la taille de l'historique (50 états max)
- Thumbnails optimisés pour les calques

## Notes d'utilisation

### Outil Texte
1. Sélectionnez l'outil Texte (🔤) dans la barre latérale
2. Configurez la police, la taille et le style
3. Cliquez sur le canvas à l'endroit désiré
4. Entrez votre texte dans le modal
5. Validez avec `Ctrl+Enter` ou cliquez sur "Ajouter"
6. Un nouveau calque "Texte X" est automatiquement créé

### Undo/Redo
- Fonctionne pour les modifications de dessin (pinceau, gomme)
- Les nouveaux calques (texte) peuvent être supprimés via le panneau des calques
- Historique limité à 50 actions pour préserver la mémoire

### Export
- Utilisez PNG pour conserver la transparence
- Utilisez JPEG pour des fichiers plus légers (sans transparence)
- Utilisez WebP pour un bon compromis taille/qualité
