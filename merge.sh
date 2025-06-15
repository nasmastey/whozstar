#!/bin/bash

# Chemin vers tes deux dossiers source :
REPO1="/Users/cyril.nlet/Downloads/MergeRepo/RepVal"
REPO2="/Users/cyril.nlet/Downloads/MergeRepo/Xefie88.github.io-main"
DEST="."    # ou un autre dossier si tu veux

# 1- Copie tout REPO1 dans DEST (= point de départ)
cp -a "$REPO1"/. "$DEST"

# 2- Pour chaque fichier (hors répertoires) dans REPO2 :
cd "$REPO2"
find . -type f | while read -r file; do
  src2="$REPO2/$file"
  destf="$DEST/$file"
  # Si le fichier existe déjà dans le dossier de destination
  if [ -f "$destf" ]; then
    # Fusionne (concatène de façon simple : 1er + 2e) et indique la fusion
    echo "Fusion de $file..."
    cat "$destf" > "$destf.fusion_temp"
    echo -e "\n\n##### Fichier fusionné #####\n\n" >> "$destf.fusion_temp"
    cat "$src2" >> "$destf.fusion_temp"
    mv "$destf.fusion_temp" "$destf"
  else
    # Sinon, copie normalement
    mkdir -p "$(dirname "$destf")"
    cp "$src2" "$destf"
  fi
done