// indexvr.js - Version fusionnée pour WhozStar VR

// Variables globales et constantes
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false
});
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

// Caméra et lumière pour VR
let camera = new BABYLON.UniversalCamera("MyCamera", new BABYLON.Vector3(0, 1, 0), scene);
camera.minZ = 0.0001;
camera.attachControl(canvas, true);
camera.speed = 0.9;
camera.angularSensibility = 1000;
camera.inertia = 0.5;
camera.angularSpeed = 0.05;
const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

// Configuration du mode VR
const xrHelper = scene.createDefaultXRExperienceAsync({
    floorMeshes: []
}).then((xrExperience) => {
    const xr = xrExperience.baseExperience;
    
    // Configuration supplémentaire XR
    xr.onStateChangedObservable.add((state) => {
        if (state === BABYLON.WebXRState.IN_XR) {
            console.log("Entered VR mode");
            // Additional setup when entering VR
        } else if (state === BABYLON.WebXRState.NOT_IN_XR) {
            console.log("Exited VR mode");
            // Cleanup when exiting VR
        }
    });
    
    return xrExperience;
});

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
    
    // Add VR GUI elements if needed
    setupVRUserInterface();
}

// Configuration de l'interface utilisateur VR
function setupVRUserInterface() {
    // Create a manager for the VR GUI
    const guiManager = new BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
    // Setup VR specific UI elements
    // Add panels, buttons, etc. for VR
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
    
    // Supprimer les meshes de texte VR
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

// Fonction pour activer/désactiver le mode démo en VR
function toggleDemoModeVR() {
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

// Fonction pour initialiser et mettre à jour le clavier virtuel HTML
function setupVirtualKeyboard() {
    const keyboardContainer = document.getElementById('virtualKeyboardHTML');
    if (!keyboardContainer) return;
    
    keyboardContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:5px;">
            <div style="display:flex; gap:3px;">
                <button class="vk-key" data-key="1">1</button>
                <button class="vk-key" data-key="2">2</button>
                <button class="vk-key" data-key="3">3</button>
                <button class="vk-key" data-key="4">4</button>
                <button class="vk-key" data-key="5">5</button>
                <button class="vk-key" data-key="6">6</button>
                <button class="vk-key" data-key="7">7</button>
                <button class="vk-key" data-key="8">8</button>
                <button class="vk-key" data-key="9">9</button>
                <button class="vk-key" data-key="0">0</button>
            </div>
            <div style="display:flex; gap:3px;">
                <button class="vk-key" data-key="q">Q</button>
                <button class="vk-key" data-key="w">W</button>
                <button class="vk-key" data-key="e">E</button>
                <button class="vk-key" data-key="r">R</button>
                <button class="vk-key" data-key="t">T</button>
                <button class="vk-key" data-key="y">Y</button>
                <button class="vk-key" data-key="u">U</button>
                <button class="vk-key" data-key="i">I</button>
                <button class="vk-key" data-key="o">O</button>
                <button class="vk-key" data-key="p">P</button>
            </div>
            <div style="display:flex; gap:3px;">
                <button class="vk-key" data-key="a">A</button>
                <button class="vk-key" data-key="s">S</button>
                <button class="vk-key" data-key="d">D</button>
                <button class="vk-key" data-key="f">F</button>
                <button class="vk-key" data-key="g">G</button>
                <button class="vk-key" data-key="h">H</button>
                <button class="vk-key" data-key="j">J</button>
                <button class="vk-key" data-key="k">K</button>
                <button class="vk-key" data-key="l">L</button>
            </div>
            <div style="display:flex; gap:3px;">
                <button class="vk-key" data-key="z">Z</button>
                <button class="vk-key" data-key="x">X</button>
                <button class="vk-key" data-key="c">C</button>
                <button class="vk-key" data-key="v">V</button>
                <button class="vk-key" data-key="b">B</button>
                <button class="vk-key" data-key="n">N</button>
                <button class="vk-key" data-key="m">M</button>
                <button class="vk-key" data-key="backspace" style="width:60px;">⌫</button>
            </div>
            <div style="display:flex; gap:3px;">
                <button class="vk-key" data-key="space" style="width:150px;">Space</button>
                <button class="vk-key" data-key="enter" style="width:80px;">Enter</button>
                <button class="vk-key" data-key="close" style="width:80px;">Close</button>
            </div>
        </div>
    `;
    
    // Style the keyboard keys
    const keys = keyboardContainer.querySelectorAll('.vk-key');
    keys.forEach(key => {
        key.style.backgroundColor = '#444';
        key.style.color = 'white';
        key.style.border = 'none';
        key.style.borderRadius = '5px';
        key.style.padding = '10px';
        key.style.minWidth = '30px';
        key.style.cursor = 'pointer';
        key.style.fontSize = '16px';
        
        key.addEventListener('mouseenter', () => {
            key.style.backgroundColor = '#666';
        });
        
        key.addEventListener('mouseleave', () => {
            key.style.backgroundColor = '#444';
        });
        
        key.addEventListener('click', () => {
            const keyValue = key.getAttribute('data-key');
            handleVirtualKeyPress(keyValue);
        });
    });
}

// Handle virtual keyboard key presses
function handleVirtualKeyPress(key) {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.focus();
    
    if (key === 'enter') {
        // Trigger search
        const searchButton = document.getElementById('searchButton');
        if (searchButton) searchButton.click();
        hideHTMLKeyboard();
    } else if (key === 'backspace') {
        // Remove last character
        searchInput.value = searchInput.value.slice(0, -1);
    } else if (key === 'space') {
        // Add space
        searchInput.value += ' ';
    } else if (key === 'close') {
        // Close keyboard
        hideHTMLKeyboard();
    } else {
        // Add character
        searchInput.value += key;
    }
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
        console.log('Configuration d\'images VR mise à jour, rechargement...');
        setTimeout(async () => {
            await reloadWithNewImageConfiguration();
        }, 100);
    }
});

// Fonction pour mettre à jour le message de statut (pour VR)
function updateStatusMessage(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    
    // Reset classes
    statusElement.classList.remove('error', 'success', 'warning', 'info');
    
    // Add appropriate class
    switch (type) {
        case 'error':
            statusElement.style.backgroundColor = '#ffebee';
            statusElement.style.color = '#d32f2f';
            break;
        case 'success':
            statusElement.style.backgroundColor = '#e8f5e9';
            statusElement.style.color = '#388e3c';
            break;
        case 'warning':
            statusElement.style.backgroundColor = '#fff8e1';
            statusElement.style.color = '#f57c00';
            break;
        default:
            statusElement.style.backgroundColor = '#e3f2fd';
            statusElement.style.color = '#1976d2';
    }
}

// Exposer la fonction de rechargement pour le sélecteur d'images
window.reloadWithNewImageConfiguration = reloadWithNewImageConfiguration;

// Initialisation du clavier virtuel
setupVirtualKeyboard();

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
            // Show virtual keyboard in VR mode
            if (scene.activeCamera.inputSource?.xr) {
                showHTMLKeyboard();
            }
        });
        
        searchInput.addEventListener('blur', function(event) {
            // Hide virtual keyboard
            if (!event.relatedTarget || !event.relatedTarget.classList.contains('vk-key')) {
                hideHTMLKeyboard();
            }
        });
        
        searchInput.addEventListener('change', function(event) {
            const spriteName = document.getElementById('searchInput').value;
            moveCameraToSprite(spriteName);
        });
    }
    
    const demoModeButton = document.getElementById('demoModeButton');
    if (demoModeButton) {
        demoModeButton.addEventListener('click', function() {
            toggleDemoModeVR();
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
                updateStatusMessage('⏳ Chargement du fichier en cours...', 'info');
                
                const reader = new FileReader();
                reader.onload = async function(event) {
                    const fileContent = event.target.result;
                    
                    // Check if it might be encrypted
                    if (fileContent.startsWith('U2F') || fileContent.includes('"ct"') || fileContent.includes('"iv"')) {
                        try {
                            updateStatusMessage('🔑 Fichier chiffré détecté, saisie du mot de passe requise...', 'info');
                            const password = await showPasswordModal();
                            const decryptedData = decryptData(fileContent, password);
                            
                            if (decryptedData) {
                                updateStatusMessage(`✅ Fichier "${file.name}" chargé avec succès (${decryptedData.length} particules)`, 'success');
                                main(decryptedData, 20);
                                document.getElementById('fileInputContainer').style.display = 'none';
                            } else {
                                updateStatusMessage('❌ Échec du décryptage - Mot de passe incorrect', 'error');
                                alert('❌ Impossible de décrypter le fichier. Vérifiez le mot de passe.');
                            }
                        } catch (error) {
                            updateStatusMessage('❌ Erreur lors du traitement du fichier chiffré', 'error');
                            console.error(error);
                        }
                    } else {
                        // Try to parse as JSON
                        try {
                            const data = JSON.parse(fileContent);
                            updateStatusMessage(`✅ Fichier "${file.name}" chargé avec succès (${data.length} particules)`, 'success');
                            main(data, 20);
                            document.getElementById('fileInputContainer').style.display = 'none';
                        } catch (parseError) {
                            updateStatusMessage('❌ Erreur: Fichier JSON invalide', 'error');
                            alert('❌ Le fichier sélectionné n\'est pas un fichier JSON valide.\n\nErreur: ' + parseError.message);
                        }
                    }
                };
                
                reader.onerror = function() {
                    updateStatusMessage('❌ Erreur de lecture du fichier', 'error');
                };
                
                reader.readAsText(file);
            } catch (error) {
                updateStatusMessage('❌ Erreur lors du chargement du fichier', 'error');
                console.error(error);
            }
        } else {
            updateStatusMessage('⚠️ Aucun fichier sélectionné', 'warning');
            alert('Veuillez sélectionner un fichier.');
        }
    });
}

// Écouteur pour charger un fichier prédéfini
const loadPresetButton = document.getElementById('loadPresetButton');
if (loadPresetButton) {
    loadPresetButton.addEventListener('click', async () => {
        const fileSelect = document.getElementById('fileSelect');
        const selectedFile = fileSelect.value;
        
        if (selectedFile) {
            try {
                updateStatusMessage(`⏳ Chargement du fichier prédéfini "${selectedFile}"...`, 'info');
                
                const response = await fetch(`./${selectedFile}`);
                const fileContent = await response.text();
                
                // Check if it might be encrypted
                if (selectedFile.includes('encrypted') || fileContent.startsWith('U2F') || fileContent.includes('"ct"')) {
                    const password = await showPasswordModal();
                    const decryptedData = decryptData(fileContent, password);
                    
                    if (decryptedData) {
                        updateStatusMessage(`✅ Fichier prédéfini "${selectedFile}" chargé avec succès (${decryptedData.length} particules)`, 'success');
                        main(decryptedData, 20);
                        document.getElementById('fileInputContainer').style.display = 'none';
                    } else {
                        updateStatusMessage('❌ Échec du décryptage - Mot de passe incorrect', 'error');
                    }
                } else {
                    // Parse as JSON
                    const data = JSON.parse(fileContent);
                    updateStatusMessage(`✅ Fichier prédéfini "${selectedFile}" chargé avec succès (${data.length} particules)`, 'success');
                    main(data, 20);
                    document.getElementById('fileInputContainer').style.display = 'none';
                }
            } catch (error) {
                updateStatusMessage('❌ Erreur lors du chargement du fichier prédéfini', 'error');
                console.error(error);
            }
        } else {
            updateStatusMessage('⚠️ Aucun fichier prédéfini sélectionné', 'warning');
            alert('⚠️ Veuillez sélectionner un fichier prédéfini dans la liste déroulante');
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