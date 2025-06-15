// index.js - Version fusionnée pour WhozStar

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
camera.attachControl(canvas, true);
camera.speed = 0.9;
camera.angularSensibility = 1000;
camera.inertia = 0.5;
camera.angularSpeed = 0.05;
const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

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

// Fonction principale pour traiter et afficher les données
async function main(currentData, ratio) {
    // Charger la configuration des images personnalisées
    const imageConfiguration = loadImageConfiguration();
    
    // Prepare data with scaled positions and color
    let data = currentData.map(d => ({
        ...d,
        x: d.x * ratio,
        y: d.y * ratio,
        z: d.z * ratio,
        color: getColor(d.subType),
        metadata: { 
            subType: d.subType,
            level: d.level
        },
        // Utiliser l'image personnalisée si disponible, sinon utiliser l'image par défaut
        imageFile: imageConfiguration[d.level] || d.imageFile || getDefaultImageForLevel(d.level)
    }));
    
    // Adjust positions to ensure minimum distance of 8 between sprites
    data = await adjustPositionsForMinimumDistance(data, 8);

    // Group data by level to create separate sprite managers for each PNG
    const dataByLevel = {};
    data.forEach(d => {
        const level = d.level || 5; // Default to level 5 if no level specified
        const imageFile = d.imageFile; // Image déjà déterminée ci-dessus
        if (!dataByLevel[level]) {
            dataByLevel[level] = {
                imageFile: imageFile,
                elements: []
            };
        }
        dataByLevel[level].elements.push(d);
    });
    
    clearScene();
    
    // Pour chaque niveau, créer un sprite manager avec l'image appropriée
    Object.entries(dataByLevel).forEach(([level, { imageFile, elements }]) => {
        createSpritesForLevel(level, imageFile, elements);
    });
    
    // Update de la liste des particules pour la recherche
    updateParticlesList();
    
    // Création de la légende
    createLegend();
    
    // Group particles by subType for demo mode
    demoGroups = groupParticlesBySubType(data);
    
    // Start animation loop
    scene.registerBeforeRender(function() {
        animateSprites();
    });
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

// Fonction pour animer les sprites
function animateSprites() {
    time += 0.01;
    frameCounter++;
    
    // Only update position every few frames for performance
    if (frameCounter > frameThreshold) {
        frameCounter = 0;
        
        originalPositions.forEach(item => {
            const offset = item.amplitude * Math.sin(time * item.frequency + item.phase);
            item.sprite.position.y = item.position.y + offset;
        });
    }
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

// Fonction pour déplacer la caméra vers un sprite par son nom
function moveCameraToSprite(name) {
    const sprites = getAllSprites();
    const sprite = sprites.find(s => s.name === name);
    
    if (sprite) {
        centerOnSprite(sprite);
        showNearestParticles(sprite);
    } else {
        console.log("Sprite not found: " + name);
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

// Fonction pour créer la légende
function createLegend() {
    const legendDiv = document.getElementById('legend');
    if (!legendDiv) return;
    
    legendDiv.innerHTML = '<h3 style="margin-top: 0; margin-bottom: 10px;">Legend</h3>';
    
    const subTypes = {};
    
    // Collect all subTypes
    getAllSprites().forEach(sprite => {
        if (sprite.metadata && sprite.metadata.subType) {
            subTypes[sprite.metadata.subType] = true;
        }
    });
    
    // Create legend items
    Object.keys(subTypes).sort().forEach(subType => {
        const color = getColorHexForSubType(subType);
        
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${color};"></div>
            <div>${subType}</div>
        `;
        
        // Add click event to filter by subType
        legendItem.addEventListener('click', () => {
            filterSpritesBySubType(subType);
        });
        
        legendDiv.appendChild(legendItem);
    });
    
    // Add a "Show All" option
    const showAllItem = document.createElement('div');
    showAllItem.className = 'legend-item';
    showAllItem.innerHTML = `
        <div class="legend-color" style="background-color: #fff; border: 1px solid #ccc;"></div>
        <div><strong>Show All</strong></div>
    `;
    
    showAllItem.addEventListener('click', () => {
        getAllSprites().forEach(sprite => {
            sprite.isVisible = true;
        });
    });
    
    legendDiv.appendChild(showAllItem);
}

// Fonction pour filtrer les sprites par sous-type
function filterSpritesBySubType(subType) {
    getAllSprites().forEach(sprite => {
        sprite.isVisible = sprite.metadata && sprite.metadata.subType === subType;
    });
}

// Fonction pour obtenir la couleur en fonction du sous-type
function getColor(subType) {
    const colors = {
        "Default": { r: 1, g: 1, b: 1 },
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
    
    return colors[subType] || colors["Default"];
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

// Écouteurs d'événements DOM
document.addEventListener("DOMContentLoaded", function() {
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function(event) {
            event.preventDefault();
            const spriteName = document.getElementById('searchInput').value;
            moveCameraToSprite(spriteName);
        });
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const spriteName = document.getElementById('searchInput').value;
                searchInput.blur();
                moveCameraToSprite(spriteName);
            }
        });
        
        searchInput.addEventListener('focus', function(event) {
            searchInput.value = '';
        });
        
        searchInput.addEventListener('change', function(event) {
            const spriteName = document.getElementById('searchInput').value;
            moveCameraToSprite(spriteName);
        });
    }
    
    const demoModeButton = document.getElementById('demoModeButton');
    if (demoModeButton) {
        demoModeButton.addEventListener('click', function() {
            toggleDemoMode();
        });
    }
});

// Écouteur pour le chargement de fichiers
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
                        main(data, 20);
                        document.getElementById('fileInputContainer').style.display = 'none';
                    } catch (parseError) {
                        // If not valid JSON, try as encrypted
                        try {
                            const encryptedData = event.target.result;
                            const password = await showPasswordModal();
                            const data = decryptData(encryptedData, password);
                            
                            if (data) {
                                main(data, 20);
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
                    main(data, 20);
                    document.getElementById('fileInputContainer').style.display = 'none';
                }
            } catch (error) {
                console.error("Failed to load JSON:", error);
            }
        }
    });
}

// Redimensionnement de la fenêtre
window.addEventListener('resize', function() {
    engine.resize();
});

// Boucle de rendu
engine.runRenderLoop(function() {
    scene.render();
});