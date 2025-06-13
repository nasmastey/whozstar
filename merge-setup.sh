#!/bin/bash

# Script de configuration pour merger deux projets
# Usage: ./merge-setup.sh

echo "🚀 Configuration du repository pour le merge de projets"
echo "=================================================="

# Vérifier si nous sommes dans un repository Git
if [ ! -d ".git" ]; then
    echo "❌ Erreur: Ce n'est pas un repository Git"
    exit 1
fi

# Afficher l'état actuel
echo "📊 État actuel du repository:"
git status --short

# Créer les branches pour le merge
echo ""
echo "🌿 Création des branches de travail..."

# Branche pour le projet A
if ! git show-ref --verify --quiet refs/heads/project-a; then
    git checkout -b project-a
    echo "✅ Branche 'project-a' créée"
    git checkout main
else
    echo "ℹ️  Branche 'project-a' existe déjà"
fi

# Branche pour le projet B
if ! git show-ref --verify --quiet refs/heads/project-b; then
    git checkout -b project-b
    echo "✅ Branche 'project-b' créée"
    git checkout main
else
    echo "ℹ️  Branche 'project-b' existe déjà"
fi

# Branche de travail pour le merge
if ! git show-ref --verify --quiet refs/heads/merge-branch; then
    git checkout -b merge-branch
    echo "✅ Branche 'merge-branch' créée"
    git checkout main
else
    echo "ℹ️  Branche 'merge-branch' existe déjà"
fi

echo ""
echo "📋 Branches disponibles:"
git branch -a

echo ""
echo "📝 Instructions pour le merge:"
echo "1. Placez le premier projet dans la branche 'project-a'"
echo "2. Placez le deuxième projet dans la branche 'project-b'"
echo "3. Utilisez 'merge-branch' pour travailler sur l'intégration"
echo ""
echo "Commandes utiles:"
echo "  git checkout project-a    # Basculer vers le projet A"
echo "  git checkout project-b    # Basculer vers le projet B"
echo "  git checkout merge-branch # Basculer vers la branche de merge"
echo "  git merge project-a       # Merger le projet A (depuis merge-branch)"
echo "  git merge project-b       # Merger le projet B (depuis merge-branch)"

echo ""
echo "✨ Configuration terminée!"