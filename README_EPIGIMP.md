# 🎨 EpiGimp

Un éditeur d'images web moderne inspiré de GIMP, construit avec React, TypeScript et TailwindCSS.

![EpiGimp Banner](https://img.shields.io/badge/React-19.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.0-blue) ![Vite](https://img.shields.io/badge/Vite-7.2.4-purple)

## ✨ Fonctionnalités

### ✅ Tâche #1 : Base du projet et édition simple
- ✅ Import d'images (PNG, JPEG, GIF, WebP)
- ✅ Affichage sur canvas HTML5
- ✅ Interface utilisateur moderne avec TailwindCSS

### ✅ Tâche #2 : Outil Pinceau
- ✅ Pinceau personnalisable avec taille réglable (1-50px)
- ✅ Sélecteur de couleur avec aperçu hexadécimal
- ✅ Dessin fluide en temps réel sur le canvas

### ✅ Tâche #3 : Système de Calques
- ✅ Gestion multi-calques
- ✅ Ajout/Suppression de calques
- ✅ Visibilité des calques (afficher/masquer)
- ✅ Contrôle de l'opacité par calque
- ✅ Miniatures des calques
- ✅ Sélection du calque actif

### ✅ Tâche #4 : Outils Additionnels
- ✅ **Gomme** : Efface le contenu avec taille réglable
- ✅ **Pipette** : Capture la couleur sous le curseur

### ✅ Tâche #5 : Filtres et Export
- ✅ **7 Filtres disponibles** :
  - Niveaux de gris
  - Sépia
  - Inverser les couleurs
  - Luminosité (réglable)
  - Contraste (réglable)
  - Saturation (réglable)
  - Flou (réglable)
- ✅ **Export** : PNG et JPEG

## 🚀 Installation et Lancement

### Prérequis
- Node.js 22.12+ (ou 20.19+)
- npm ou yarn

### Installation des dépendances
```bash
npm install
```

### Lancement du serveur de développement
```bash
npm run dev
```

Le projet sera accessible sur [http://localhost:5173](http://localhost:5173)

### Build de production
```bash
npm run build
```

### Prévisualisation du build
```bash
npm run preview
```

## 🛠️ Technologies Utilisées

- **React 19.2.0** : Framework UI
- **TypeScript 5.9.3** : Typage statique
- **Vite 7.2.4** : Build tool et dev server
- **TailwindCSS 3.3.0** : Framework CSS utility-first
- **HTML5 Canvas API** : Manipulation d'images et dessin

## 📁 Structure du Projet

```
EpiGimp/
├── src/
│   ├── components/
│   │   ├── ImageUploader.tsx      # Import d'images
│   │   ├── Toolbar.tsx            # Barre d'outils (pinceau, gomme, pipette)
│   │   ├── CanvasEditor.tsx       # Zone de dessin principale
│   │   ├── LayersPanel.tsx        # Gestion des calques
│   │   └── FiltersPanel.tsx       # Filtres et export
│   ├── hooks/
│   │   └── useCanvas.ts           # Hooks personnalisés pour canvas
│   ├── types/
│   │   └── index.ts               # Types TypeScript
│   ├── utils/
│   │   └── filters.ts             # Logique des filtres
│   ├── App.tsx                    # Composant principal
│   ├── main.tsx                   # Point d'entrée
│   └── index.css                  # Styles globaux
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🎮 Guide d'Utilisation

### 1. Importer une image
- Cliquez sur "Importer une image"
- Sélectionnez un fichier image de votre ordinateur

### 2. Dessiner avec le pinceau
- Sélectionnez l'outil **Pinceau** 🖌️
- Ajustez la taille et la couleur
- Cliquez et glissez sur le canvas pour dessiner

### 3. Utiliser la gomme
- Sélectionnez l'outil **Gomme** 🧹
- Ajustez la taille
- Cliquez et glissez pour effacer

### 4. Capturer une couleur
- Sélectionnez l'outil **Pipette** 💧
- Cliquez sur n'importe quelle couleur du canvas
- La couleur sera automatiquement appliquée au pinceau

### 5. Gérer les calques
- Cliquez sur **+ Nouveau** pour ajouter un calque
- Cliquez sur un calque pour le sélectionner
- Utilisez 👁️ pour afficher/masquer
- Utilisez 🗑️ pour supprimer
- Ajustez l'opacité avec le curseur

### 6. Appliquer des filtres
- Sélectionnez un filtre dans la liste
- Ajustez l'intensité si disponible
- Cliquez sur **Appliquer le filtre**

### 7. Exporter votre création
- Cliquez sur **PNG** ou **JPEG**
- L'image sera téléchargée automatiquement

## 🧪 Tests

```bash
npm run lint
```

## 📝 Fonctionnalités Supplémentaires Possibles

- [ ] Historique d'annulation (Undo/Redo)
- [ ] Sélection rectangulaire et déplacement
- [ ] Outil de remplissage (bucket fill)
- [ ] Outil texte
- [ ] Plus de filtres (netteté, vignettage, etc.)
- [ ] Raccourcis clavier
- [ ] Sauvegarde de projets (.epigimp)
- [ ] Redimensionnement d'image
- [ ] Rotation et retournement

## 👥 Contributeur

- Shundays06

## 📄 Licence

MIT

## 🐛 Problèmes Connus

- Le flou peut être lent sur de grandes images
- Node.js 22.1.0 affiche un warning (fonctionne quand même)

## 🎉 Remerciements

Projet développé dans le cadre d'un exercice pédagogique Epitech.
