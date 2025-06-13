# Projet de Merge - Visualisation 3D

Ce repository a été créé pour merger deux projets de visualisation de données.

## Projet Principal
- **Application de visualisation 3D** utilisant Babylon.js
- Visualisation de données spatiales avec des sprites interactifs
- Interface utilisateur avec recherche, légende et navigation

## Fonctionnalités
- Visualisation 3D interactive avec Babylon.js
- Système de sprites avec différents niveaux (1-13)
- Recherche et navigation par particules
- Système de filtrage par type
- Animation orbitale des éléments
- Support de fichiers JSON chiffrés
- Interface de sélection d'images personnalisées

## Structure du Projet
- `index.html` - Interface principale
- `index.js` - Logique de visualisation 3D
- `indexvr.html` / `indexvr.js` - Version VR (si applicable)
- `image_selector.html` - Sélecteur d'images personnalisées
- Images PNG pour les différents niveaux (1blackhole.png à 13asteroid.png)
- Fichiers de données JSON

## Installation et Utilisation
1. Cloner le repository
2. Ouvrir `index.html` dans un navigateur web
3. Charger un fichier JSON de données ou utiliser les données par défaut
4. Naviguer dans la visualisation 3D

## Merge de Projets
Ce repository est configuré pour faciliter le merge de deux projets similaires :
- Utilisation de branches séparées pour chaque projet
- Structure modulaire pour faciliter l'intégration
- Documentation des conflits potentiels

## Branches
- `main` - Branche principale avec le projet actuel
- `project-a` - Premier projet à merger
- `project-b` - Deuxième projet à merger
- `merge-branch` - Branche de travail pour le merge

## Instructions de Merge
1. Créer des branches séparées pour chaque projet
2. Identifier les fichiers communs et les différences
3. Résoudre les conflits de merge
4. Tester l'intégration finale