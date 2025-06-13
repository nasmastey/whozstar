# Guide de Merge de Projets

Ce guide vous accompagne dans le processus de merge de deux projets dans ce repository.

## 🎯 Objectif
Merger deux projets similaires en conservant les fonctionnalités de chacun et en résolvant les conflits potentiels.

## 📋 Prérequis
- Git installé et configuré
- Accès aux deux projets à merger
- Connaissance de base de Git et des résolutions de conflits

## 🚀 Étapes de Merge

### 1. Préparation
```bash
# Exécuter le script de configuration
./merge-setup.sh

# Vérifier les branches créées
git branch -a
```

### 2. Intégration du Premier Projet
```bash
# Basculer vers la branche project-a
git checkout project-a

# Copier les fichiers du premier projet ici
# Puis commiter les changements
git add .
git commit -m "Ajout du premier projet"
```

### 3. Intégration du Deuxième Projet
```bash
# Basculer vers la branche project-b
git checkout project-b

# Copier les fichiers du deuxième projet ici
# Puis commiter les changements
git add .
git commit -m "Ajout du deuxième projet"
```

### 4. Merge des Projets
```bash
# Basculer vers la branche de merge
git checkout merge-branch

# Merger le premier projet
git merge project-a

# Merger le deuxième projet (peut créer des conflits)
git merge project-b
```

### 5. Résolution des Conflits
Si des conflits apparaissent :

1. **Identifier les fichiers en conflit** :
   ```bash
   git status
   ```

2. **Éditer les fichiers en conflit** :
   - Rechercher les marqueurs `<<<<<<<`, `=======`, `>>>>>>>`
   - Choisir quelle version conserver ou combiner les deux
   - Supprimer les marqueurs de conflit

3. **Marquer les conflits comme résolus** :
   ```bash
   git add <fichier-résolu>
   ```

4. **Finaliser le merge** :
   ```bash
   git commit -m "Résolution des conflits de merge"
   ```

## 🔍 Conflits Potentiels Identifiés

### Fichiers susceptibles de créer des conflits :
- `index.html` - Structure HTML principale
- `index.js` - Logique JavaScript principale
- `package.json` - Dépendances (si présent)
- `README.md` - Documentation
- Fichiers CSS/styles
- Fichiers de configuration

### Types de conflits courants :
1. **Conflits de structure HTML** - Différentes balises ou organisation
2. **Conflits de fonctions JavaScript** - Noms de fonctions identiques
3. **Conflits de styles CSS** - Classes ou IDs identiques
4. **Conflits de dépendances** - Versions différentes de bibliothèques

## 🛠️ Stratégies de Résolution

### 1. Renommage Préventif
Avant le merge, renommer les éléments conflictuels :
- Fonctions : `function1_projectA()`, `function1_projectB()`
- Classes CSS : `.button-projectA`, `.button-projectB`
- IDs HTML : `#main-projectA`, `#main-projectB`

### 2. Modularisation
Séparer les fonctionnalités en modules :
```javascript
// projectA.js
const ProjectA = {
    init: function() { /* ... */ },
    render: function() { /* ... */ }
};

// projectB.js
const ProjectB = {
    init: function() { /* ... */ },
    render: function() { /* ... */ }
};
```

### 3. Configuration Unifiée
Créer un fichier de configuration commun :
```javascript
// config.js
const CONFIG = {
    projectA: { /* paramètres projet A */ },
    projectB: { /* paramètres projet B */ },
    common: { /* paramètres communs */ }
};
```

## 🧪 Tests Post-Merge

### 1. Tests Fonctionnels
- [ ] Le projet A fonctionne correctement
- [ ] Le projet B fonctionne correctement
- [ ] Les fonctionnalités communes ne sont pas cassées
- [ ] Pas d'erreurs JavaScript dans la console

### 2. Tests d'Intégration
- [ ] Les styles CSS ne se chevauchent pas
- [ ] Les événements JavaScript fonctionnent
- [ ] Les ressources (images, fichiers) se chargent correctement

### 3. Tests de Performance
- [ ] Temps de chargement acceptable
- [ ] Pas de fuites mémoire
- [ ] Responsive design maintenu

## 📚 Ressources Utiles

### Commandes Git Essentielles
```bash
# Voir l'historique des commits
git log --oneline --graph

# Annuler un merge (avant commit)
git merge --abort

# Voir les différences entre branches
git diff project-a project-b

# Créer un patch pour sauvegarder des changements
git format-patch -1 HEAD
```

### Outils de Merge Recommandés
- **VS Code** - Éditeur avec support intégré des conflits Git
- **GitKraken** - Interface graphique pour Git
- **Meld** - Outil de comparaison de fichiers
- **Beyond Compare** - Outil professionnel de merge

## 🆘 Dépannage

### Problème : "Cannot merge unrelated histories"
```bash
git merge project-a --allow-unrelated-histories
```

### Problème : Trop de conflits
1. Annuler le merge : `git merge --abort`
2. Faire un merge manuel fichier par fichier
3. Utiliser `git cherry-pick` pour des commits spécifiques

### Problème : Perte de fonctionnalités
1. Comparer avec les branches originales
2. Utiliser `git diff` pour identifier les différences
3. Réintégrer les fonctionnalités manquantes

## ✅ Checklist Finale

- [ ] Tous les conflits sont résolus
- [ ] Les tests passent
- [ ] La documentation est mise à jour
- [ ] Les fonctionnalités des deux projets sont préservées
- [ ] Le code est propre et commenté
- [ ] Les performances sont acceptables

## 🎉 Finalisation

Une fois le merge terminé et testé :

```bash
# Retourner sur la branche principale
git checkout main

# Merger la branche de travail
git merge merge-branch

# Pousser les changements
git push origin main

# Nettoyer les branches temporaires (optionnel)
git branch -d project-a project-b merge-branch
```

---

**Note** : Ce guide est adapté à votre projet de visualisation 3D. Adaptez les instructions selon les spécificités de vos projets à merger.