// index.js - Version fusionnée WhozStar avec fonctionnalités Xefie prioritaires

// Variables globales et constantes
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false
});
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

// Caméra et lumière
let camera = new BABYLON.UniversalCamera("MyCamera", new BABYLON.Vector3(0, 1, 0), scene);
camera.minZ = 0.0001;
camera.speed = 0.9;
camera.angularSensibility = 1000;
camera.inertia = 0.5;
camera.angularSpeed = 0.05;
camera.angle = Math.PI / 2;
camera.direction = new BABYLON.Vector3(Math.cos(camera.angle), 0, Math.sin(camera.angle));

// Attacher les contrôles de la caméra au canvas
camera.attachControl(canvas, true);

// S'assurer que le canvas peut recevoir le focus pour les contrôles clavier
canvas.tabIndex = 1;

const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 1;

// Variables pour la gestion des sprites et affichage
let time = 0;
let blinkCount = 0;
let frameCounter = 0;
const frameThreshold = 20;
const scatter = new BABYLON.PointsCloudSystem("scatter", 0, scene);
const labelSprites = [];
const originalPositions = [];
const defaultImageSize = 640;
const spriteRatio = 2;

// Interaction avec le pointer (fonctionnalité Xefie)
scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERPICK:
            const searchButton = document.getElementById('searchButton');
            if (searchButton) searchButton.click();
            break;
    }
});

// Mode démo
let demoModeActive = false;
let demoInterval = null;
let currentDemoGroupIndex = 0;
let demoGroups = [];
const demoPauseDuration = 3000;

// Fonction pour charger la configuration des images personnalisées
function loadImageConfiguration() {
    try {
        const saved = localStorage.getItem('imageConfiguration');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Erreur lors du chargement de la configuration des images:', e);
    }
    
    // Configuration par défaut si aucune sauvegarde
    return getDefaultImageConfiguration();
}

// Configuration par défaut des images
function getDefaultImageConfiguration() {
    return {
        1: "1blackhole.png",
        2: "2blackhole.png",
        3: "3whitehole.png",
        4: "4nebuleuse.png",
        5: "5etoile.png",
        6: "6etoile.png",
        7: "7neutronstar.png",
        8: "8planet.png",
        9: "9planet.png",
        10: "10protoplanet.png",
        11: "11moon.png",
        12: "12asteroid.png",
        13: "13asteroid.png"
    };
}

// Fonction pour obtenir l'image par défaut pour un niveau
function getDefaultImageForLevel(level) {
    const defaultConfig = getDefaultImageConfiguration();
    return defaultConfig[level] || '5etoile.png';
}

// Fonction pour réinitialiser les contrôles de la caméra
function resetCameraControls() {
    // Détacher puis réattacher les contrôles pour s'assurer qu'ils fonctionnent
    camera.detachControl(canvas);
    camera.attachControl(canvas, true);
    
    // S'assurer que le canvas peut recevoir le focus
    canvas.focus();
    
    console.log('Contrôles de caméra réinitialisés');
}

// Fonction pour assigner un niveau basé sur le subType
function assignLevelBySubType(subType) {
    const levelMap = {
        "TECHNICAL": 1,
        "PROTOCOL": 2,
        "OPERATING_SYSTEM": 3,
        "BUSINESS_SOFTWARE": 4,
        "TOOL": 5,
        "FUNCTIONAL": 6,
        "PROGRAMMING_LANGUAGE": 7,
        "METHOD": 8,
        "DATABASE": 9,
        "BEHAVIORAL": 10,
        "FRAMEWORK": 11,
        "TRANSVERSAL": 12,
        "PLATFORM": 13,
        "NORMS_AND_STANDARDS": 1,
        "LANGUAGE": 2,
        // Anciens types pour compatibilité
        "Art": 1,
        "Games": 2,
        "Video": 3,
        "Music": 4,
        "Food": 5,
        "Culture": 6,
        "News": 7,
        "Entertainment": 8,
        "Education": 9,
        "Web": 10,
        "Social": 11,
        "Utility": 12,
        "Search": 13,
        "Shopping": 1
    };
    
    return levelMap[subType] || 5; // Default to level 5
}

// Fonction principale pour traiter et afficher les données (Version Xefie prioritaire)
async function main(currentData, ratio) {
    // Préparer les données avec positions mises à l'échelle et couleurs
    const data = currentData.map(d => {
        const level = d.level || assignLevelBySubType(d.subType);
        return {
            ...d,
            x: d.x * ratio,
            y: d.y * ratio,
            z: d.z * ratio,
            color: getColor(d.subType),
            level: level,
            metadata: { subType: d.subType, level: level }
        };
    });

    clearScene();

    // Utiliser une seule image comme dans Xefie (mais permettre la personnalisation)
    const imageConfiguration = loadImageConfiguration();
    const defaultImage = 'etoile2.png'; // Image par défaut du Xefie
    const imageUrl = imageConfiguration[5] || defaultImage; // Utiliser l'image du niveau 5 ou par défaut
    
    // Créer un seul sprite manager comme dans Xefie
    const labelSpriteManager = new BABYLON.SpriteManager('labelSpriteManager', imageUrl, data.length, defaultImageSize, scene);
    labelSpriteManager.isPickable = true;

    // Ajouter les points au système de nuages de points
    scatter.addPoints(data.length, function(particle) {
        const point = data[particle.idx];
        particle.position = new BABYLON.Vector3(point.x, point.y, point.z);
        originalPositions.push(particle.position.clone());
        
        let sprite = new BABYLON.Sprite(point.prefLabel, labelSpriteManager);
        sprite.isPickable = true;
        sprite.position = particle.position;
        sprite.originalPosition = originalPositions[particle.idx];
        sprite.size = getSizeMultiplierForLevel(point.level) * spriteRatio;
        sprite.color = new BABYLON.Color4(point.color.r, point.color.g, point.color.b, 1);
        sprite.metadata = { subType: point.subType, level: point.level };
        sprite.isVisible = true;

        // Ajouter un ActionManager au sprite (fonctionnalité Xefie)
        sprite.actionManager = new BABYLON.ActionManager(scene);

        // Enregistrer les actions pour survol et clic
        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            function (evt) {
                const spriteName = evt.source.name;
                const sprites = scene.spriteManagers[0].sprites;
                
                let targetSprite = sprites.find(s => s.name === spriteName);
                
                // Trouver les particules les plus proches
                let distances = sprites.filter(s => s.isVisible).map(sprite => {
                    return {
                        name: sprite.name,
                        distance: BABYLON.Vector3.Distance(targetSprite.originalPosition, sprite.originalPosition)
                    };
                });
                distances.sort((a, b) => a.distance - b.distance);
                
                updateNearestList(distances, spriteName, targetSprite.metadata.subType);
                
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = spriteName;
            }
        ));

        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickUpTrigger,
            function (evt) {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = evt.source.name;
                moveCameraToSprite(evt.source.name);
            }
        ));

        labelSprites.push(sprite);
    });

    // Système de rendu avancé avec gestion des labels dynamiques (fonctionnalité Xefie)
    scene.onBeforeRenderObservable.add(() => {
        updateSpritePositions();
        
        frameCounter++;
        if (frameCounter > frameThreshold) {
            frameCounter = 0;
            
            var names = [];
            
            const cameraDirection = camera.getForwardRay().direction.normalize();
            const fov = camera.fov;
            const cameraPosition = camera.position;
            
            scene.spriteManagers[0].sprites.map(s => {
                var width = engine.getRenderWidth();
                var height = engine.getRenderHeight();
                var identityMatrix = BABYLON.Matrix.Identity();
                var getTransformMatrix = scene.getTransformMatrix();
                var toGlobal = camera.viewport.toGlobal(width, height);
                const projectedPosition = BABYLON.Vector3.Project(
                    s.position,
                    identityMatrix,
                    getTransformMatrix,
                    toGlobal
                );
                
                const spriteDirection = s.position.subtract(cameraPosition).normalize();
                const angle = Math.acos(BABYLON.Vector3.Dot(cameraDirection, spriteDirection));
                
                const distance = BABYLON.Vector3.Distance(camera.position, s.position);
                
                if (distance > 2 && distance < 12 && angle < fov && s.isVisible) {
                    names.push({
                        "name": s.name + '_layer',
                        "meshName": s.name + '_mesh',
                        "matName": s.name + '_mat',
                        "textureName": s.name,
                        "color": s.color,
                        "position": s.position
                    });
                }
            });

            // Supprimer les meshes inutilisés
            scene.meshes.filter(mesh => mesh.name !== 'BACKGROUND').forEach(mesh => {
                if (!names.some(n => n.meshName === mesh.name)) {
                    if (mesh.material) {
                        if (mesh.material.emissiveTexture) {
                            mesh.material.emissiveTexture.dispose();
                        }
                        mesh.material.dispose();
                    }
                    scene.removeMesh(mesh);
                    mesh.dispose();
                }
            });

            // Supprimer les matériaux inutilisés
            scene.materials.filter(material => material.name !== 'BACKGROUND').forEach(material => {
                if (!names.some(n => n.matName === material.name)) {
                    if (material.emissiveTexture) {
                        material.emissiveTexture.dispose();
                    }
                    scene.removeMaterial(material);
                    material.dispose();
                }
            });

            // Créer les labels dynamiques avec cercles (fonctionnalité signature du Xefie)
            names.forEach(n => {
                if (!scene.meshes.some(l => l.name === n.meshName)) {
                    const font_size = 12;
                    const planeTexture = new BABYLON.DynamicTexture("dynamic texture", font_size*100, scene, true, BABYLON.DynamicTexture.TRILINEAR_SAMPLINGMODE);
                    
                    var textureContext = planeTexture.getContext();
                    
                    // Dessiner les cercles (caractéristique du Xefie)
                    textureContext.lineWidth = 2;
                    textureContext.beginPath();
                    textureContext.arc(font_size*50, font_size*50, 30, -Math.PI/5, Math.PI/5);
                    textureContext.strokeStyle = "rgba("+255*n.color.r+", "+255*n.color.g+", "+255*n.color.b+", 0.7)";
                    textureContext.stroke();
                    
                    textureContext.beginPath();
                    textureContext.arc(font_size*50, font_size*50, 30, -Math.PI/5 + Math.PI, Math.PI/5 + Math.PI);
                    textureContext.stroke();
                    
                    planeTexture.update();
                    
                    planeTexture.drawText(n.textureName, null, (font_size*53), "" + font_size + "px system-ui", "white", "transparent", true, true);
                    var material = new BABYLON.StandardMaterial(n.textureName + '_mat', scene);
                    material.emissiveTexture = planeTexture;
                    material.opacityTexture = planeTexture;
                    material.backFaceCulling = true;
                    material.disableLighting = true;
                    material.freeze();

                    var outputplane = BABYLON.Mesh.CreatePlane(n.textureName + '_mesh', font_size, scene, false);
                    outputplane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
                    outputplane.isVisible = true;
                    outputplane.position = n.position;
                    outputplane.material = material;
                }
            });
        }
    });

    // Construire le système de nuages de points
    scatter.buildMeshAsync().then(mesh => {
        mesh.material = new BABYLON.StandardMaterial('scatterMaterial', scene);
        mesh.material.pointSize = 10;
        mesh.material.usePointSizing = true;
        mesh.material.disableLighting = true;
        mesh.material.pointColor = new BABYLON.Color3(1, 1, 1);
    });

    // Démarrer la boucle de rendu
    engine.runRenderLoop(renderLoop);

    // Redimensionner le moteur lors du redimensionnement de la fenêtre
    window.addEventListener('resize', function () {
        engine.resize();
    });

    // Créer la légende et mettre à jour la liste des particules
    createLegend(data);
    updateParticleList();
    
    // Grouper les particules par sous-type pour le mode démo
    demoGroups = groupParticlesBySubType(data);
}

// Fonction pour réinitialiser la scène
function clearScene() {
    // Supprimer tous les sprites
    if (scene.spriteManagers) {
        scene.spriteManagers.forEach(manager => {
            manager.dispose();
        });
    }
    
    // Vider les tableaux
    labelSprites.length = 0;
    originalPositions.length = 0;
    
    // Supprimer les meshes de texte
    scene.meshes.filter(mesh => mesh.name.endsWith('_whoz_mesh')).forEach(mesh => {
        if (mesh.material) {
            if (mesh.material.emissiveTexture) {
                mesh.material.emissiveTexture.dispose();
            }
            mesh.material.dispose();
        }
        scene.removeMesh(mesh);
        mesh.dispose();
    });
}

// Fonction pour créer les sprites pour un niveau donné
function createSpritesForLevel(level, imageFile, elements) {
    const manager = new BABYLON.SpriteManager(`manager_level_${level}`, imageFile, elements.length, { width: defaultImageSize, height: defaultImageSize }, scene);
    
    elements.forEach(element => {
        const sprite = new BABYLON.Sprite(element.prefLabel, manager);
        sprite.position = new BABYLON.Vector3(element.x, element.y, element.z);
        sprite.size = 20; // Default size
        sprite.isPickable = true;
        sprite.name = element.prefLabel;
        sprite.metadata = { 
            subType: element.subType,
            level: level 
        };
        sprite.color = element.color ? new BABYLON.Color4(
            element.color.r, 
            element.color.g, 
            element.color.b, 
            1
        ) : new BABYLON.Color4(1, 1, 1, 1);
        
        // Adjust size based on level
        const sizeMultiplier = getSizeMultiplierForLevel(level);
        sprite.size *= sizeMultiplier;
        
        // Store original position for animation
        originalPositions.push({
            sprite: sprite,
            position: new BABYLON.Vector3(element.x, element.y, element.z),
            amplitude: Math.random() * 0.02 + 0.01, // Random amplitude for oscillation
            frequency: Math.random() * 0.5 + 0.5, // Random frequency
            phase: Math.random() * Math.PI * 2 // Random phase
        });
        
        // Add hover event to show label
        sprite.actionManager = new BABYLON.ActionManager(scene);
        sprite.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOverTrigger,
                function() {
                    showSpriteLabel(sprite);
                }
            )
        );
        sprite.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOutTrigger,
                function() {
                    hideSpriteLabel();
                }
            )
        );
        sprite.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                function() {
                    centerOnSprite(sprite);
                    showNearestParticles(sprite);
                }
            )
        );
    });
}

// Fonction pour obtenir le facteur de taille en fonction du niveau
function getSizeMultiplierForLevel(level) {
    const sizeMap = {
        1: 2.5,   // Black holes - largest
        2: 2.2,   // Large black holes
        3: 2.0,   // White holes
        4: 1.8,   // Nebulae
        5: 1.5,   // Stars
        6: 1.3,   // Stars
        7: 1.2,   // Neutron stars
        8: 1.0,   // Planets
        9: 0.8,   // Planets
        10: 0.7,  // Proto planets
        11: 0.6,  // Moons
        12: 0.5,  // Asteroids
        13: 0.4   // Small asteroids - smallest
    };
    
    return sizeMap[level] || 1.0;
}

// Fonction pour mettre à jour les positions des sprites (Version Xefie)
function updateSpritePositions() {
    time += 0.004;
    
    const cameraDirection = camera.getForwardRay().direction.normalize();
    const fov = camera.fov;
    const cameraPosition = camera.position;

    labelSprites.forEach((sprite, idx) => {
        const distance = BABYLON.Vector3.Distance(cameraPosition, sprite.position);
        
        if (distance < 150) {
            const spriteDirection = sprite.position.subtract(cameraPosition).normalize();
            const angle = Math.acos(BABYLON.Vector3.Dot(cameraDirection, spriteDirection));
            if(angle < fov) {
                const originalPosition = originalPositions[idx];
                sprite.position.x = originalPosition.x + 0.8 * Math.sin(time + idx);
                sprite.position.y = originalPosition.y + 0.8 * Math.cos(time + idx);
                sprite.position.z = originalPosition.z + 0.8 * Math.sin(time + idx);
                sprite.angle = 0.01*idx;
            }
        }
    });
}

// Fonction de boucle de rendu (Version Xefie)
function renderLoop() {
    scene.render();
}

// Fonction pour faire clignoter un sprite (Fonctionnalité Xefie)
function blinkSprite(sprite) {
    let isDefaultColor = true;
    const defaultColor = sprite.color;
    const highlightColor = new BABYLON.Color4(1, 1, 1, 1);
    const mediumMediumlightColor = new BABYLON.Color4((sprite.color.r+1)/2, (sprite.color.g+1)/2, (sprite.color.b+1)/2, (sprite.color.a+1)/2);
    const mediumLowlightColor = new BABYLON.Color4((3*sprite.color.r+1)/4, (3*sprite.color.g+1)/4, (3*sprite.color.b+1)/4, (3*sprite.color.a+1)/4);
    const mediumHighlightColor = new BABYLON.Color4((sprite.color.r+3)/4, (sprite.color.g+3)/4, (sprite.color.b+3)/4, (sprite.color.a+3)/4);

    // Configurer l'intervalle de clignotement
    setInterval(() => {
        blinkCount += 1;
        
        var moduloBlink = blinkCount % 8;
        
        if (moduloBlink == 0) {
            sprite.color = defaultColor;
            isDefaultColor = true;
        } else if (moduloBlink == 1 || moduloBlink == 7) {
            sprite.color = mediumLowlightColor;
            isDefaultColor = false;
        } else if (moduloBlink == 2 || moduloBlink == 6) {
            sprite.color = mediumMediumlightColor;
            isDefaultColor = false;
        } else if (moduloBlink == 3 || moduloBlink == 5) {
            sprite.color = mediumHighlightColor;
            isDefaultColor = false;
        } else {
            sprite.color = highlightColor;
            isDefaultColor = false;
        }
    }, 200); // Durée du clignotement en millisecondes
}

// Fonction pour afficher une étiquette sur un sprite
function showSpriteLabel(sprite) {
    hideSpriteLabel(); // Hide any existing label
    
    // Create text mesh for label
    const text = sprite.name;
    const textColor = "white";
    const bgColor = sprite.metadata && sprite.metadata.subType ? 
                    getColorHexForSubType(sprite.metadata.subType) : "#444444";
    
    const textTexture = new BABYLON.DynamicTexture("textTexture", {width: 512, height: 128}, scene);
    const textContext = textTexture.getContext();
    
    // Setup background
    textContext.fillStyle = bgColor;
    textContext.fillRect(0, 0, 512, 128);
    
    // Setup text
    textContext.font = "bold 40px Arial";
    textContext.textAlign = "center";
    textContext.fillStyle = textColor;
    textContext.fillText(text, 256, 80);
    
    textTexture.update();
    
    // Create plane for label
    const plane = BABYLON.MeshBuilder.CreatePlane("label_plane_" + text + "_whoz_mesh", { width: 5, height: 1.25 }, scene);
    plane.position = new BABYLON.Vector3(sprite.position.x, sprite.position.y + 15, sprite.position.z);
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    
    // Create material
    const material = new BABYLON.StandardMaterial("label_material_" + text, scene);
    material.emissiveTexture = textTexture;
    material.disableLighting = true;
    material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    material.backFaceCulling = false;
    
    plane.material = material;
    
    // Save reference to label
    labelSprites.push(plane);
    
    // Always face camera
    plane.lookAt(camera.position);
}

// Fonction pour masquer toutes les étiquettes
function hideSpriteLabel() {
    labelSprites.forEach(mesh => {
        if (mesh.material && mesh.material.emissiveTexture) {
            mesh.material.emissiveTexture.dispose();
        }
        if (mesh.material) {
            mesh.material.dispose();
        }
        scene.removeMesh(mesh);
        mesh.dispose();
    });
    
    labelSprites.length = 0;
}

// Fonction pour centrer la caméra sur un sprite
function centerOnSprite(sprite) {
    const targetPosition = sprite.position.clone();
    const direction = targetPosition.subtract(camera.position).normalize();
    
    // Calculate new camera position, keeping some distance
    const distance = 50;
    const newPosition = targetPosition.subtract(direction.scale(distance));
    
    // Animate camera movement
    BABYLON.Animation.CreateAndStartAnimation(
        "cameraMove",
        camera,
        "position",
        30,
        60,
        camera.position,
        newPosition,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    // Set camera target
    camera.setTarget(targetPosition);
}

// Fonction pour déplacer la caméra vers un sprite par son nom (Version Xefie avancée)
function moveCameraToSprite(spriteName) {
    console.log('move to', spriteName);
    const sprites = scene.spriteManagers[0].sprites; // Utiliser le premier sprite manager
    let targetSprite = sprites.find(s => s.name === spriteName);

    if (targetSprite) {
        const targetPosition = new BABYLON.Vector3(targetSprite.position.x, targetSprite.position.y, targetSprite.position.z);
        const cameraStartPosition = camera.position.clone();
        const cameraStartTarget = camera.getTarget().clone();

        const bufferDistance = 9; // Ajuster la distance du sprite
        const directionVector = targetPosition.subtract(camera.position).normalize();
        const adjustedTargetPosition = targetPosition.subtract(directionVector.scale(bufferDistance));

        const moveDistance = BABYLON.Vector3.Distance(cameraStartPosition, adjustedTargetPosition);
        const numberOfFrames = Math.min(300, Math.max(60, Math.round(moveDistance * 4)));
        
        // Créer une animation pour la position de la caméra (ralenti avec 15 fps)
        const animCamPosition = new BABYLON.Animation("animCamPosition", "position", 15, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCamPosition.setKeys([{frame: 0, value: cameraStartPosition}, {frame: numberOfFrames, value: adjustedTargetPosition}]);

        // Créer une animation pour la cible de la caméra (ralenti avec 15 fps)
        const animCamTarget = new BABYLON.Animation("animCamTarget", "target", 15, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCamTarget.setKeys([{frame: 0, value: cameraStartTarget}, {frame: numberOfFrames, value: targetPosition}]);

        // Démarrer l'animation et attendre qu'elle se termine
        const animationGroup = scene.beginDirectAnimation(camera, [animCamPosition, animCamTarget], 0, numberOfFrames, false);
        
        blinkSprite(targetSprite);
        
        // Retourner la promesse d'animation pour pouvoir attendre sa fin
        const animationPromise = new Promise((resolve) => {
            animationGroup.onAnimationEndObservable.addOnce(() => {
                resolve();
            });
        });

        // Trouver les particules les plus proches
        let distances = sprites.filter(s => s.isVisible).map(sprite => {
            return {
                name: sprite.name,
                distance: BABYLON.Vector3.Distance(targetSprite.originalPosition, sprite.originalPosition)
            };
        });
        distances.sort((a, b) => a.distance - b.distance);
        
        updateNearestList(distances, spriteName, targetSprite.metadata.subType);
        
        return animationPromise;
    } else {
        console.log("Sprite not found: " + spriteName);
    }
}

// Fonction pour obtenir tous les sprites de tous les managers
function getAllSprites() {
    const allSprites = [];
    if (scene && scene.spriteManagers) {
        scene.spriteManagers.forEach(manager => {
            if (manager.sprites) {
                allSprites.push(...manager.sprites);
            }
        });
    }
    return allSprites;
}

// Fonction pour mettre à jour la liste des particules les plus proches (Version Xefie)
function updateNearestList(distances, spriteName, subType) {
    // Obtenir les 100 particules les plus proches
    let nearestParticles = distances.slice(1, 101);

    // Mettre à jour la liste des plus proches
    const nearestList = document.getElementById('nearestList');
    nearestList.innerHTML = '';
    let i = 0;
    
    let listItem = document.createElement('li');
    listItem.className = 'nearest-item first-item';
    listItem.textContent = `${spriteName} (${subType})`;
    
    nearestList.appendChild(listItem);
    
    nearestParticles.forEach(particle => {
        i = i + 1;
        let listItem = document.createElement('li');
        listItem.className = 'nearest-item';
        listItem.textContent = `${i} : ${particle.name} (${particle.distance.toFixed(2)})`;

        // Ajouter un écouteur d'événements click à chaque élément de la liste
        listItem.addEventListener('click', function() {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = particle.name;
            moveCameraToSprite(particle.name);
        });

        nearestList.appendChild(listItem);
    });
}

// Fonction pour mettre à jour la liste des particules pour la recherche
function updateParticlesList() {
    const dataList = document.getElementById('particlesList');
    dataList.innerHTML = '';
    
    const particleNames = getAllSprites()
        .filter(sprite => sprite.isVisible)
        .map(sprite => sprite.name);
    
    particleNames.forEach(name => {
        let option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

// Fonction équivalente pour la compatibilité avec Xefie
function updateParticleList() {
    updateParticlesList();
}

// Fonction pour créer la légende (Version Xefie)
function createLegend(data) {
    const uniqueTypes = [...new Set(data.map(item => item.subType))];
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '';

    console.log('count:', data.length);
    
    uniqueTypes.sort().forEach(type => {
        const color = `rgb(${getColor(type).r * 255}, ${getColor(type).g * 255}, ${getColor(type).b * 255})`;
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.dataset.type = type;
        legendItem.dataset.active = 'true'; // Par défaut, tous les éléments sont actifs

        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = color;

        const label = document.createElement('span');
        label.textContent = type;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);

        // Ajouter un écouteur d'événements pour le clic
        legendItem.addEventListener('click', function() {
            filterByType(type);
            toggleLegendItemColor(legendItem);
        });
    });
}

// Fonction pour filtrer les sprites par sous-type (Version Xefie)
function filterSpritesBySubType(subType) {
    getAllSprites().forEach(sprite => {
        sprite.isVisible = sprite.metadata && sprite.metadata.subType === subType;
    });
}

// Fonction pour filtrer par type (Version Xefie)
function filterByType(type) {
    scene.spriteManagers[0].sprites.forEach(sprite => {
        if (sprite.metadata && sprite.metadata.subType === type) {
            sprite.isVisible = !sprite.isVisible;
        }
    });
    
    updateParticleList();
}

// Fonction pour basculer la couleur d'un élément de légende
function toggleLegendItemColor(legendItem) {
    const isActive = legendItem.dataset.active === 'true';
    if (isActive) {
        legendItem.style.opacity = 0.5; // Rendre la couleur plus claire
    } else {
        legendItem.style.opacity = 1.0; // Restaurer la couleur d'origine
    }
    legendItem.dataset.active = (!isActive).toString();
}

// Fonction pour obtenir la couleur en fonction du sous-type (Version Xefie étendue)
function getColor(subType) {
    const colors = {
        // Types techniques du Xefie (convertis en valeurs 0-1)
        TECHNICAL: {
            r: 85 / 255,
            g: 113 / 255,
            b: 255 / 255
        },
        PROTOCOL: {
            r: 255 / 255,
            g: 121 / 255,
            b: 166 / 255
        },
        OPERATING_SYSTEM: {
            r: 215 / 255,
            g: 0 / 255,
            b: 248 / 255
        },
        BUSINESS_SOFTWARE: {
            r: 134 / 255,
            g: 0 / 255,
            b: 255 / 255
        },
        TOOL: {
            r: 121 / 255,
            g: 210 / 255,
            b: 255 / 255
        },
        FUNCTIONAL: {
            r: 164 / 255,
            g: 255 / 255,
            b: 182 / 255
        },
        PROGRAMMING_LANGUAGE: {
            r: 22 / 255,
            g: 233 / 255,
            b: 255 / 255
        },
        METHOD: {
            r: 204 / 255,
            g: 144 / 255,
            b: 255 / 255
        },
        DATABASE: {
            r: 11 / 255,
            g: 255 / 255,
            b: 227 / 255
        },
        BEHAVIORAL: {
            r: 255 / 255,
            g: 51 / 255,
            b: 51 / 255
        },
        FRAMEWORK: {
            r: 255 / 255,
            g: 230 / 255,
            b: 0 / 255
        },
        TRANSVERSAL: {
            r: 255 / 255,
            g: 131 / 255,
            b: 15 / 255
        },
        PLATFORM: {
            r: 213 / 255,
            g: 14 / 255,
            b: 98 / 255
        },
        NORMS_AND_STANDARDS: {
            r: 255 / 255,
            g: 152 / 255,
            b: 0 / 255
        },
        LANGUAGE: {
            r: 255 / 255,
            g: 193 / 255,
            b: 101 / 255
        },
        DEFAULT: {
            r: 96 / 255,
            g: 125 / 255,
            b: 139 / 255
        },
        // Couleurs des clusters du Xefie
        cluster_1: {
            r: 0 / 255,
            g: 153 / 255,
            b: 204 / 255
        },
        cluster_2: {
            r: 255 / 255,
            g: 102 / 255,
            b: 102 / 255
        },
        cluster_3: {
            r: 102 / 255,
            g: 204 / 255,
            b: 0 / 255
        },
        cluster_4: {
            r: 255 / 255,
            g: 153 / 255,
            b: 51 / 255
        },
        cluster_5: {
            r: 204 / 255,
            g: 51 / 255,
            b: 255 / 255
        },
        cluster_6: {
            r: 102 / 255,
            g: 255 / 255,
            b: 178 / 255
        },
        cluster_7: {
            r: 255 / 255,
            g: 255 / 255,
            b: 102 / 255
        },
        cluster_8: {
            r: 255 / 255,
            g: 51 / 255,
            b: 153 / 255
        },
        cluster_9: {
            r: 153 / 255,
            g: 153 / 255,
            b: 255 / 255
        },
        cluster_10: {
            r: 255 / 255,
            g: 204 / 255,
            b: 0 / 255
        },
        cluster_11: {
            r: 0 / 255,
            g: 204 / 255,
            b: 102 / 255
        },
        cluster_12: {
            r: 204 / 255,
            g: 0 / 255,
            b: 204 / 255
        },
        cluster_13: {
            r: 255 / 255,
            g: 229 / 255,
            b: 204 / 255
        },
        cluster_14: {
            r: 255 / 255,
            g: 102 / 255,
            b: 192 / 255
        },
        cluster_15: {
            r: 204 / 255,
            g: 102 / 255,
            b: 51 / 255
        },
        cluster_16: {
            r: 51 / 255,
            g: 204 / 255,
            b: 255 / 255
        },
        cluster_17: {
            r: 153 / 255,
            g: 255 / 255,
            b: 204 / 255
        },
        cluster_18: {
            r: 255 / 255,
            g: 179 / 255,
            b: 102 / 255
        },
        cluster_19: {
            r: 204 / 255,
            g: 51 / 255,
            b: 51 / 255
        },
        cluster_20: {
            r: 0 / 255,
            g: 153 / 255,
            b: 153 / 255
        },
        cluster_21: {
            r: 204 / 255,
            g: 204 / 255,
            b: 0 / 255
        },
        cluster_22: {
            r: 255 / 255,
            g: 102 / 255,
            b: 255 / 255
        },
        cluster_23: {
            r: 153 / 255,
            g: 51 / 255,
            b: 255 / 255
        },
        cluster_24: {
            r: 102 / 255,
            g: 51 / 255,
            b: 0 / 255
        },
        cluster_25: {
            r: 51 / 255,
            g: 255 / 255,
            b: 102 / 255
        },
        cluster_26: {
            r: 255 / 255,
            g: 102 / 255,
            b: 0 / 255
        },
        cluster_27: {
            r: 153 / 255,
            g: 0 / 255,
            b: 51 / 255
        },
        cluster_28: {
            r: 102 / 255,
            g: 153 / 255,
            b: 153 / 255
        },
        cluster_29: {
            r: 0 / 255,
            g: 204 / 255,
            b: 255 / 255
        },
        cluster_30: {
            r: 255 / 255,
            g: 153 / 255,
            b: 204 / 255
        },
        // Anciennes couleurs pour compatibilité
        "Art": { r: 1, g: 0, b: 0 },
        "Games": { r: 0, g: 1, b: 0 },
        "Video": { r: 0, g: 0, b: 1 },
        "Music": { r: 1, g: 1, b: 0 },
        "Food": { r: 1, g: 0, b: 1 },
        "Culture": { r: 0, g: 1, b: 1 },
        "News": { r: 0.5, g: 0.5, b: 1 },
        "Entertainment": { r: 1, g: 0.5, b: 0.5 },
        "Education": { r: 0.5, g: 1, b: 0.5 },
        "Web": { r: 0.7, g: 0.7, b: 0.7 },
        "Social": { r: 0.9, g: 0.7, b: 0.3 },
        "Utility": { r: 0.3, g: 0.9, b: 0.7 },
        "Search": { r: 0.7, g: 0.3, b: 0.9 },
        "Shopping": { r: 0.5, g: 0.2, b: 0.2 }
    };
    
    return colors[subType] || colors.DEFAULT;
}

// Fonction pour obtenir la couleur hexadécimale en fonction du sous-type
function getColorHexForSubType(subType) {
    const color = getColor(subType);
    return rgbToHex(Math.floor(color.r * 255), Math.floor(color.g * 255), Math.floor(color.b * 255));
}

// Fonction pour convertir RGB en hexadécimal
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Fonction pour grouper les particules par sous-type pour le mode démo
function groupParticlesBySubType(data) {
    const groups = {};
    
    data.forEach(item => {
        const subType = item.subType || "Default";
        if (!groups[subType]) {
            groups[subType] = [];
        }
        groups[subType].push(item);
    });
    
    return Object.values(groups);
}

// Fonction pour activer/désactiver le mode démo
function toggleDemoMode() {
    demoModeActive = !demoModeActive;
    
    const button = document.getElementById('demoModeButton');
    if (demoModeActive) {
        button.textContent = "Stop Demo";
        button.style.backgroundColor = "#dc3545";
        startDemoMode();
    } else {
        button.textContent = "Mode Démo";
        button.style.backgroundColor = "#28a745";
        stopDemoMode();
    }
}

// Fonction pour démarrer le mode démo
function startDemoMode() {
    if (demoGroups.length === 0) {
        console.log("No demo groups available");
        return;
    }
    
    currentDemoGroupIndex = 0;
    showDemoGroup(currentDemoGroupIndex);
    
    demoInterval = setInterval(() => {
        currentDemoGroupIndex = (currentDemoGroupIndex + 1) % demoGroups.length;
        showDemoGroup(currentDemoGroupIndex);
    }, demoPauseDuration);
}

// Fonction pour arrêter le mode démo
function stopDemoMode() {
    if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
    }
    
    // Reset visibility of all sprites
    getAllSprites().forEach(sprite => {
        sprite.isVisible = true;
    });
}

// Fonction pour afficher un groupe de démo
function showDemoGroup(groupIndex) {
    if (!demoGroups[groupIndex]) return;
    
    const group = demoGroups[groupIndex];
    const sprites = getAllSprites();
    
    // Hide all sprites first
    sprites.forEach(sprite => {
        sprite.isVisible = false;
    });
    
    // Show only sprites in the current group
    const groupSubTypes = new Set(group.map(item => item.subType));
    sprites.forEach(sprite => {
        if (sprite.metadata && groupSubTypes.has(sprite.metadata.subType)) {
            sprite.isVisible = true;
        }
    });
    
    // Focus on a random sprite in the group
    if (group.length > 0) {
        const randomIndex = Math.floor(Math.random() * group.length);
        const randomItem = group[randomIndex];
        const sprite = sprites.find(s => s.name === randomItem.prefLabel);
        
        if (sprite) {
            centerOnSprite(sprite);
        }
    }
}

// Fonction pour ajuster les positions pour assurer une distance minimale entre les sprites
async function adjustPositionsForMinimumDistance(data, minDistance) {
    const adjustedData = [...data];
    const minDistSquared = minDistance * minDistance;
    
    // Simple adjustment algorithm
    for (let i = 0; i < adjustedData.length; i++) {
        const current = adjustedData[i];
        
        for (let j = 0; j < i; j++) {
            const other = adjustedData[j];
            
            const dx = current.x - other.x;
            const dy = current.y - other.y;
            const dz = current.z - other.z;
            
            const distSquared = dx * dx + dy * dy + dz * dz;
            
            if (distSquared < minDistSquared) {
                const dist = Math.sqrt(distSquared);
                const moveRatio = (minDistance - dist) / (2 * dist);
                
                // Move both points away from each other
                const moveX = dx * moveRatio;
                const moveY = dy * moveRatio;
                const moveZ = dz * moveRatio;
                
                current.x += moveX;
                current.y += moveY;
                current.z += moveZ;
                
                other.x -= moveX;
                other.y -= moveY;
                other.z -= moveZ;
            }
        }
    }
    
    return adjustedData;
}

// Fonction pour montrer les particules les plus proches d'un sprite
function showNearestParticles(sprite) {
    const nearestList = document.getElementById('nearestList');
    if (!nearestList) return;
    
    nearestList.innerHTML = '';
    
    const allSprites = getAllSprites();
    const distances = [];
    
    // Calculate distances to all other sprites
    allSprites.forEach(other => {
        if (other !== sprite) {
            const dx = other.position.x - sprite.position.x;
            const dy = other.position.y - sprite.position.y;
            const dz = other.position.z - sprite.position.z;
            
            const distSquared = dx * dx + dy * dy + dz * dz;
            const dist = Math.sqrt(distSquared);
            
            distances.push({
                sprite: other,
                distance: dist
            });
        }
    });
    
    // Sort by distance
    distances.sort((a, b) => a.distance - b.distance);
    
    // Show current sprite as header
    const currentItem = document.createElement('li');
    currentItem.className = 'nearest-item first-item';
    currentItem.textContent = `${sprite.name}`;
    currentItem.style.color = getColorHexForSubType(sprite.metadata?.subType || "Default");
    nearestList.appendChild(currentItem);
    
    // Show top 10 nearest
    const topNearest = distances.slice(0, 10);
    topNearest.forEach(item => {
        const li = document.createElement('li');
        li.className = 'nearest-item';
        li.textContent = `${item.sprite.name} (${item.distance.toFixed(2)})`;
        li.style.color = getColorHexForSubType(item.sprite.metadata?.subType || "Default");
        
        li.addEventListener('click', () => {
            centerOnSprite(item.sprite);
            showNearestParticles(item.sprite);
        });
        
        nearestList.appendChild(li);
    });
}

// Fonction pour décrypter les données
function decryptData(encryptedData, password) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, password);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return decryptedData;
    } catch (e) {
        alert('Le mot de passe est incorrect ou les données sont invalides.');
        console.error(e);
        return null;
    }
}

// Fonction pour afficher la modal de mot de passe
function showPasswordModal() {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('passwordModal');
        const submitButton = document.getElementById('submitPasswordButton');
        const passwordInput = document.getElementById('passwordInput');
        
        modal.style.display = 'block';
        
        const handleSubmit = () => {
            const password = passwordInput.value;
            modal.style.display = 'none';
            passwordInput.value = '';
            resolve(password);
        };
        
        submitButton.addEventListener('click', handleSubmit, { once: true });
        
        passwordInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleSubmit();
            }
        }, { once: true });
    });
}

// Fonction pour recharger les données avec la nouvelle configuration d'images
async function reloadWithNewImageConfiguration() {
    // Récupérer les données actuelles
    const currentData = getAllSprites().map(sprite => ({
        prefLabel: sprite.name,
        subType: sprite.metadata?.subType,
        x: sprite.position.x / 20, // Diviser par le ratio utilisé
        y: sprite.position.y / 20,
        z: sprite.position.z / 20,
        level: sprite.metadata?.level
    }));
    
    if (currentData.length > 0) {
        // Nettoyer la scène actuelle
        clearScene();
        
        // Recharger avec la nouvelle configuration
        await main(currentData, 20);
        
        console.log('Données rechargées avec la nouvelle configuration d\'images');
    }
}

// Écouter les changements de configuration depuis le sélecteur d'images
window.addEventListener('storage', function(e) {
    if (e.key === 'imageConfiguration' || e.key === 'imageConfigurationUpdate') {
        console.log('Configuration d\'images mise à jour, rechargement...');
        setTimeout(async () => {
            await reloadWithNewImageConfiguration();
        }, 100);
    }
});

// Exposer la fonction de rechargement pour le sélecteur d'images
window.reloadWithNewImageConfiguration = reloadWithNewImageConfiguration;


// Fonction pour charger les données test par défaut
async function loadDefaultTestData() {
    try {
        const response = await fetch('./test_data.json');
        if (response.ok) {
            const data = await response.json();
            await main(data, 20);
            console.log('Données test chargées avec succès');
            // Masquer le container de chargement de fichier après chargement réussi
            const fileContainer = document.getElementById('fileInputContainer');
            if (fileContainer) {
                fileContainer.style.display = 'none';
            }
        } else {
            console.log('Fichier test_data.json non trouvé, utilisation manuelle requise');
        }
    } catch (error) {
        console.log('Erreur lors du chargement des données test:', error);
        console.log('Utilisez le bouton de chargement de fichier pour charger vos données');
    }
}

// Initialiser tous les gestionnaires d'événements
function initializeEventHandlers() {
    // Gestionnaire pour le bouton de recherche
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function(event) {
            event.preventDefault();
            const spriteName = document.getElementById('searchInput').value.trim();
            if (spriteName) {
                moveCameraToSprite(spriteName);
            }
        });
    }
    
    // Gestionnaire pour l'input de recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const spriteName = searchInput.value.trim();
                if (spriteName) {
                    searchInput.blur();
                    moveCameraToSprite(spriteName);
                }
            }
        });
        
        searchInput.addEventListener('focus', function() {
            searchInput.select();
        });
        
        searchInput.addEventListener('change', function() {
            const spriteName = searchInput.value.trim();
            if (spriteName) {
                moveCameraToSprite(spriteName);
            }
        });
    }
    
    // Gestionnaire pour le mode démo
    const demoModeButton = document.getElementById('demoModeButton');
    if (demoModeButton) {
        demoModeButton.addEventListener('click', function() {
            toggleDemoMode();
        });
    }
    
    // Gestionnaires pour les boutons toggle (déjà définis dans le HTML mais on s'assure qu'ils marchent)
    const toggleButtons = document.querySelectorAll('.toggleButton:not(#demoModeButton)');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const target = document.getElementById(targetId);
            if (target) {
                target.style.display = target.style.display === 'none' ? 'block' : 'none';
            }
        });
    });
    
    // Gestionnaire pour le sélecteur d'images
    const imageSelectorButton = document.getElementById('imageSelectorButton');
    if (imageSelectorButton) {
        imageSelectorButton.addEventListener('click', function() {
            window.open('image_selector.html', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        });
    }
    
    // Gestionnaire pour le chargement de fichiers
    const loadFileButton = document.getElementById('loadFileButton');
    if (loadFileButton) {
        loadFileButton.addEventListener('click', async () => {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];
            
            if (file) {
                try {
                    const reader = new FileReader();
                    reader.onload = async function(event) {
                        // Try to parse as JSON first
                        try {
                            const data = JSON.parse(event.target.result);
                            await main(data, 20);
                            document.getElementById('fileInputContainer').style.display = 'none';
                        } catch (parseError) {
                            // If not valid JSON, try as encrypted
                            try {
                                const encryptedData = event.target.result;
                                const password = await showPasswordModal();
                                const data = decryptData(encryptedData, password);
                                
                                if (data) {
                                    await main(data, 20);
                                    document.getElementById('fileInputContainer').style.display = 'none';
                                }
                            } catch (error) {
                                alert('Error processing the file');
                                console.error(error);
                            }
                        }
                    };
                    reader.readAsText(file);
                } catch (error) {
                    alert('An error occurred while parsing the file.');
                    console.error(error);
                }
            } else {
                try {
                    const response = await fetch('./encrypted_PSO_0.json');
                    const encryptedData = await response.text();
                    const password = await showPasswordModal();
                    const data = decryptData(encryptedData, password);
                    
                    if (data) {
                        await main(data, 20);
                        document.getElementById('fileInputContainer').style.display = 'none';
                    }
                } catch (error) {
                    console.error("Failed to load JSON:", error);
                }
            }
        });
    }
    
    // Gestionnaires pour maintenir le focus sur le canvas pour les contrôles caméra
    canvas.addEventListener('click', function() {
        canvas.focus();
        resetCameraControls();
    });
    
    canvas.addEventListener('mousedown', function() {
        canvas.focus();
    });
    
    // Éviter que les inputs prennent le focus de manière permanente
    const searchInputElement = document.getElementById('searchInput');
    if (searchInputElement) {
        searchInputElement.addEventListener('blur', function() {
            setTimeout(() => {
                canvas.focus();
            }, 100);
        });
    }
}

// Écouteurs d'événements DOM - Point d'entrée principal
document.addEventListener("DOMContentLoaded", function() {
    // Initialiser tous les gestionnaires d'événements
    initializeEventHandlers();
    
    // Attendre que la scène soit prête avant de charger les données
    setTimeout(() => {
        loadDefaultTestData();
    }, 1000);
});

// Redimensionnement de la fenêtre
window.addEventListener('resize', function() {
    engine.resize();
});

// Boucle de rendu
engine.runRenderLoop(function() {
    scene.render();
});