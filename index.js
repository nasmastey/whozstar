//http-server -c-1
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false, // Assurer l'utilisation de WebGL 2.0 si disponible
});

const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

var camera = new BABYLON.UniversalCamera("MyCamera", new BABYLON.Vector3(0, 1, 0), scene);
camera.minZ = 0.0001;
camera.attachControl(canvas, true);
camera.speed = 0.9;
camera.angularSpeed = 0.05;
camera.angle = Math.PI / 2;
camera.direction = new BABYLON.Vector3(Math.cos(camera.angle), 0, Math.sin(camera.angle));

// Global click handler for sprite selection
scene.onPointerObservable.add((pointerInfo) => {
  switch (pointerInfo.type) {
    case BABYLON.PointerEventTypes.POINTERPICK:
      if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedSprite) {
        // Select the picked sprite (particle)
        const pickedName = pointerInfo.pickInfo.pickedSprite.name;
        console.log('Sprite clicked:', pickedName);
        
        // Update search input if it exists
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.value = pickedName;
        }
        
        // Move camera to the clicked sprite
        moveCameraToSprite(pickedName);
      }
      break;
	 }
});

//const cameraDirection = camera.getForwardRay().direction.normalize();
//const fov = camera.fov; // Champs de vision de la caméra
//const cameraPosition = camera.position;
//const cameraGetTarget = camera.getTarget();

const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 1;

let time = 0;
let blinkCount = 0;

// Initialise le compteur et le seuil
let frameCounter = 0;
const frameThreshold = 20; // Ajustez ce nombre pour changer la fréquence

// Visual effects variables
let starField = null;

//var font = "Calibri 20px monospace";

const scatter = new BABYLON.PointsCloudSystem("scatter", 0, scene);

const labelSprites = [];
const originalPositions = [];

// Create background starfield
function createStarField() {
    const starCount = 1000;
    const starSystem = new BABYLON.PointsCloudSystem("starField", starCount, scene);
    
    starSystem.addPoints(starCount, function(particle) {
        // Random position in a large sphere around the scene
        const radius = 500;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        particle.position = new BABYLON.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
        
        // Random color between white and light blue
        const intensity = 0.3 + Math.random() * 0.7;
        particle.color = new BABYLON.Color4(intensity, intensity, intensity + 0.2, 1);
    });
    
    starSystem.buildMeshAsync().then(mesh => {
        mesh.material = new BABYLON.StandardMaterial('starMaterial', scene);
        mesh.material.pointSize = 2;
        mesh.material.usePointSizing = true;
        mesh.material.disableLighting = true;
        mesh.material.emissiveColor = new BABYLON.Color3(0.8, 0.8, 1);
        starField = mesh;
    });
}


// Global function to get all sprites from all managers
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

// Create scatter mesh and label sprites
//const imageUrl = 'bubble12.png';
//const imageSize = 5000;

// Default values - will be overridden by individual sprite images
const defaultImageSize = 640;
const spriteRatio = 2;



// Function to ensure minimum distance between sprites
function adjustPositionsForMinimumDistance(data, minDistance = 8) {
    const adjustedData = [...data];
    const maxIterations = 50; // Reduced from 100 to prevent freezes
    let iteration = 0;
    let progressThreshold = 0.01; // Minimum progress required to continue
    let lastCollisionCount = Infinity;
    
    while (iteration < maxIterations) {
        let hasCollisions = false;
        let collisionCount = 0;
        
        // Process in smaller batches to prevent UI freezing
        const batchSize = Math.min(50, adjustedData.length);
        for (let batch = 0; batch < adjustedData.length; batch += batchSize) {
            const endBatch = Math.min(batch + batchSize, adjustedData.length);
            
            for (let i = batch; i < endBatch; i++) {
                for (let j = i + 1; j < adjustedData.length; j++) {
                    const sprite1 = adjustedData[i];
                    const sprite2 = adjustedData[j];
                    
                    const distance = Math.sqrt(
                        Math.pow(sprite1.x - sprite2.x, 2) +
                        Math.pow(sprite1.y - sprite2.y, 2) +
                        Math.pow(sprite1.z - sprite2.z, 2)
                    );
                    
                    if (distance < minDistance && distance > 0.001) { // Avoid division by zero
                        hasCollisions = true;
                        collisionCount++;
                        
                        // Calculate direction vector from sprite2 to sprite1
                        const dx = sprite1.x - sprite2.x;
                        const dy = sprite1.y - sprite2.y;
                        const dz = sprite1.z - sprite2.z;
                        
                        // Normalize the direction vector
                        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                        const normalizedDx = length > 0.001 ? dx / length : (Math.random() - 0.5) * 2;
                        const normalizedDy = length > 0.001 ? dy / length : (Math.random() - 0.5) * 2;
                        const normalizedDz = length > 0.001 ? dz / length : (Math.random() - 0.5) * 2;
                        
                        // Calculate how much to move each sprite (reduced movement for stability)
                        const overlap = minDistance - distance;
                        const moveDistance = Math.min(overlap * 0.3, 2); // Limit movement to prevent overshooting
                        
                        // Move sprites apart
                        sprite1.x += normalizedDx * moveDistance;
                        sprite1.y += normalizedDy * moveDistance;
                        sprite1.z += normalizedDz * moveDistance;
                        
                        sprite2.x -= normalizedDx * moveDistance;
                        sprite2.y -= normalizedDy * moveDistance;
                        sprite2.z -= normalizedDz * moveDistance;
                    }
                }
            }
        }
        
        // Check for progress to avoid infinite loops
        const progress = (lastCollisionCount - collisionCount) / Math.max(lastCollisionCount, 1);
        if (!hasCollisions || (iteration > 10 && progress < progressThreshold)) {
            break;
        }
        
        lastCollisionCount = collisionCount;
        iteration++;
    }
    
    console.log(`Position adjustment completed after ${iteration} iterations (${lastCollisionCount} remaining collisions)`);
    return adjustedData;
}

function main(currentData, ratio) {
    // Prepare data with scaled positions and color
    let data = currentData.map(d => ({
        ...d,
        x: d.x * ratio,
        y: d.y * ratio,
        z: d.z * ratio,
        color: getColor(d.subType),
        metadata: { subType: d.subType }
    }));
    
    // Adjust positions to ensure minimum distance of 8 between sprites
    data = adjustPositionsForMinimumDistance(data, 8);

    // Group data by level to create separate sprite managers for each PNG
    const dataByLevel = {};
    data.forEach(d => {
        const level = d.level || 5; // Default to level 5 if no level specified
        const imageFile = d.imageFile || '5etoile.png'; // Default image
        if (!dataByLevel[level]) {
            dataByLevel[level] = {
                imageFile: imageFile,
                elements: []
            };
        }
        dataByLevel[level].elements.push(d);
    });

    // Create sprite managers for each level
    const spriteManagers = {};
    Object.keys(dataByLevel).forEach(level => {
        const levelData = dataByLevel[level];
        const spriteManager = new BABYLON.SpriteManager(
            `labelSpriteManager_level_${level}`,
            levelData.imageFile,
            levelData.elements.length,
            defaultImageSize,
            scene
        );
        spriteManager.isPickable = true;
        spriteManagers[level] = spriteManager;
    });



    // Helper function to create a sprite and attach actions
    function createLabelSprite(point, idx, spriteManager) {
        const position = new BABYLON.Vector3(point.x, point.y, point.z);
        originalPositions.push(position.clone());

        // Calculate size based on level: level 1 = 6, level 2 = 5.5, level 3 = 5, etc.
        const level = point.level || 5;
        const spriteSize = level === 1 ? 12 : Math.max(1, 6.5 - (level * 0.5)); // Level 1 = 12, others use original formula

        const sprite = new BABYLON.Sprite(point.prefLabel, spriteManager);
        Object.assign(sprite, {
            isPickable: true,
            position,
            originalPosition: originalPositions[idx],
            size: spriteSize,
            color: new BABYLON.Color4(point.color.r, point.color.g, point.color.b, 1),
            metadata: { subType: point.subType, level: point.level },
            isVisible: true
        });

        sprite.actionManager = new BABYLON.ActionManager(scene);

        // Mouse over: update nearest list and search input
        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            evt => {
                const spriteName = evt.source.name;
                const allSprites = getAllSprites();
                const targetSprite = allSprites.find(s => s.name === spriteName);
                if (targetSprite) {
                    const distances = allSprites.filter(s => s.isVisible).map(s => ({
                        name: s.name,
                        distance: BABYLON.Vector3.Distance(targetSprite.originalPosition, s.originalPosition)
                    })).sort((a, b) => a.distance - b.distance);
                    updateNearestList(distances, spriteName, targetSprite.metadata.subType);
                    
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        searchInput.value = spriteName;
                    }
                }
            }
        ));

        // Click: move camera to sprite (OnPickTrigger for better click detection)
        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            evt => {
                const spriteName = evt.source.name;
                console.log('Sprite clicked via ActionManager:', spriteName);
                
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = spriteName;
                }
                moveCameraToSprite(spriteName);
            }
        ));

        // Alternative click handler for better compatibility
        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickUpTrigger,
            evt => {
                const spriteName = evt.source.name;
                console.log('Sprite clicked via OnPickUpTrigger:', spriteName);
                
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = spriteName;
                }
                moveCameraToSprite(spriteName);
            }
        ));

        labelSprites.push(sprite);
    }


    scatter.addPoints(data.length, function(particle) {
        const point = data[particle.idx];
        const level = point.level || 5; // Default to level 5 if no level specified
        const spriteManager = spriteManagers[level];
        
        particle.position = new BABYLON.Vector3(point.x, point.y, point.z);
        createLabelSprite(point, particle.idx, spriteManager);
    });

	
scene.onBeforeRenderObservable.add(() => {
	
	updateSpritePositions();
	
	frameCounter++;
    if (frameCounter > frameThreshold) {
        frameCounter = 0;  // Réinitialise le compteur
		
    var names = [];
	
		const cameraDirection = camera.getForwardRay().direction.normalize();
		const fov = camera.fov; // Champs de vision de la caméra
		const cameraPosition = camera.position;
	
    getAllSprites().map(s => {
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
            // Get sprite level for size calculation
            const spriteLevel = s.metadata && s.metadata.level ? s.metadata.level : 5;
            const spriteSize = spriteLevel === 1 ? 12 : Math.max(1, 6.5 - (spriteLevel * 0.5));
            
            names.push({
                "name": s.name + '_layer',
                "meshName": s.name + '_mesh',
                "matName": s.name + '_mat',
                "textureName": s.name,
    "color": s.color,
                "position": s.position,
                "level": spriteLevel,
                "spriteSize": spriteSize
            });
        }
    });

    // Dispose of unused meshes
    scene.meshes.filter(mesh => mesh.name !== 'BACKGROUND').forEach(mesh => {
        if (!names.some(n => n.meshName === mesh.name)) {
            if (mesh.material) {
                if (mesh.material.emissiveTexture) {
                    mesh.material.emissiveTexture.dispose(); // Dispose the emissive texture
                }
                mesh.material.dispose(); // Dispose the material
            }
            scene.removeMesh(mesh);
            mesh.dispose(); // Dispose the mesh
        }
    });

    // Dispose of unused materials
    scene.materials.filter(material => material.name !== 'BACKGROUND').forEach(material => {
        if (!names.some(n => n.matName === material.name)) {
            if (material.emissiveTexture) {
                material.emissiveTexture.dispose(); // Dispose the emissive texture
            }
            scene.removeMaterial(material);
            material.dispose(); // Dispose the material
        }
    });

    names.forEach(n => {
        if (!scene.meshes.some(l => l.name === n.meshName)) {
            const font_size = 12;
            // Scale the parentheses radius based on sprite size (tripled)
            const baseRadius = 90; // Tripled from 30 to 90
            const scaledRadius = baseRadius * (n.spriteSize / 4); // Scale relative to default size 4
            
            const planeTexture = new BABYLON.DynamicTexture("dynamic texture", font_size*100, scene, true, BABYLON.DynamicTexture.TRILINEAR_SAMPLINGMODE);
   
   var textureContext = planeTexture.getContext();
   
   //Draw on canvas - scaled parentheses with cyan color and black border
   // Draw black border first (thicker)
   textureContext.lineWidth = 3; // Thicker for border effect
   textureContext.strokeStyle = "black";
   textureContext.beginPath();
   textureContext.arc(font_size*50, font_size*50, scaledRadius, -Math.PI/5, Math.PI/5);
   textureContext.stroke();
   
   textureContext.beginPath();
   textureContext.arc(font_size*50, font_size*50, scaledRadius, -Math.PI/5 + Math.PI, Math.PI/5 + Math.PI);
   textureContext.stroke();
   
   // Draw cyan parentheses on top
   textureContext.lineWidth = 2; // Original thickness for cyan
   textureContext.strokeStyle = "cyan";
   textureContext.beginPath();
   textureContext.arc(font_size*50, font_size*50, scaledRadius, -Math.PI/5, Math.PI/5);
   textureContext.stroke();
   
   textureContext.beginPath();
   textureContext.arc(font_size*50, font_size*50, scaledRadius, -Math.PI/5 + Math.PI, Math.PI/5 + Math.PI);
   textureContext.stroke();
   
   planeTexture.update();
   
   
            // Draw text with stroke (border) first, then fill
            const textY = font_size * 65; // Position text below the parentheses
            const fontSize = font_size;
            const fontFamily = "FreeMono, monospace";
            const textToDisplay = n.textureName.toUpperCase(); // Convert to uppercase
            
            // Set font for measurements
            textureContext.font = fontSize + "px " + fontFamily;
            
            // Draw sprite name with black stroke (border) first
            textureContext.strokeStyle = "black";
            textureContext.lineWidth = 1;
            textureContext.strokeText(textToDisplay, null, textY);
            
            // Draw cyan fill text on top for sprite name
            planeTexture.drawText(textToDisplay, null, textY, fontSize + "px " + fontFamily, "cyan", "transparent", true, true);
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

scatter.buildMeshAsync().then(mesh => {
    mesh.material = new BABYLON.StandardMaterial('scatterMaterial', scene);
    mesh.material.pointSize = 10;
    mesh.material.usePointSizing = true;
    mesh.material.disableLighting = true;
    mesh.material.pointColor = new BABYLON.Color3(1, 1, 1);
});

engine.runRenderLoop(renderLoop);

// Resize the engine on window resize
    window.addEventListener('resize', function () {
        engine.resize();
    });


    createLegend(data);
	updateParticleList();
	
}	

const showPasswordModal = () => {
    return new Promise((resolve) => {
        const passwordModal = document.getElementById('passwordModal');
        const passwordInput = document.getElementById('passwordInput');
        const submitPasswordButton = document.getElementById('submitPasswordButton');

        passwordModal.style.display = 'block'; 
        passwordInput.value = ''; 
        passwordInput.focus(); 

        const submitHandler = () => {
            const password = passwordInput.value;
            passwordModal.style.display = 'none';
            submitPasswordButton.removeEventListener('click', submitHandler);
            resolve(password);
        };

        submitPasswordButton.addEventListener('click', submitHandler);
    });
};

const loadFileButton = document.getElementById('loadFileButton');

document.addEventListener("DOMContentLoaded", function() {

    //createLegend(data);
	//updateParticleList();

    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function(event) {
            event.preventDefault();
			 const spriteName = document.getElementById('searchInput').value;
            moveCameraToSprite(spriteName);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // This prevents any default form submitting
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

});

loadFileButton.addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
        try {
            const reader = new FileReader();
            reader.onload = async function(event) {
                const newdata = JSON.parse(event.target.result);
                main(newdata, 20);
                document.getElementById('fileInputContainer').style.display = 'none';
            };
            reader.readAsText(file);
        } catch (error) {
            alert('An error occurred while parsing the file.');
            console.error(error);
        }
    } else {
        try {
            const response = await fetch('./test_data_with_levels.json');
            const data = await response.json();
            main(data, 20);
            document.getElementById('fileInputContainer').style.display = 'none';
        } catch (error) {
            console.error("Failed to load JSON:", error);
        }
    }
});

function getColor(type) {
    const colors = {
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
}
    };

    return colors[type] || colors.DEFAULT;
}

// Update sprite positions to add small movements and orbital mechanics
function updateSpritePositions() {
    time += 0.004;
	
	const cameraDirection = camera.getForwardRay().direction.normalize();
	const fov = camera.fov; // Champs de vision de la caméra
	const cameraPosition = camera.position;
	const cameraGetTarget = camera.getTarget();

	labelSprites.forEach((sprite, idx) => {
		const distance = BABYLON.Vector3.Distance(cameraPosition, sprite.position);
		
		if (distance < 150) {
			const spriteDirection = sprite.position.subtract(cameraPosition).normalize();
			const angle = Math.acos(BABYLON.Vector3.Dot(cameraDirection, spriteDirection));
			if( angle < fov) {
				const originalPosition = originalPositions[idx];
				const spriteLevel = sprite.metadata && sprite.metadata.level ? sprite.metadata.level : 5;
				
				// Find nearby higher level sprites to orbit around
				let orbitCenter = null;
				let bestLevel = Infinity; // Track the highest level (lowest number)
				let minDistance = Infinity;
				
				labelSprites.forEach((otherSprite, otherIdx) => {
					if (otherSprite !== sprite && otherSprite.metadata && otherSprite.metadata.level) {
						const otherLevel = otherSprite.metadata.level;
						// Only orbit around sprites with higher level (lower number = higher level)
						if (otherLevel < spriteLevel) {
							const distanceToOther = BABYLON.Vector3.Distance(originalPosition, originalPositions[otherIdx]);
							// Only consider sprites within orbital range (adjust this value as needed)
							if (distanceToOther < 15) {
								// Prioritize higher level (lower number) first, then closer distance
								if (otherLevel < bestLevel || (otherLevel === bestLevel && distanceToOther < minDistance)) {
									bestLevel = otherLevel;
									minDistance = distanceToOther;
									orbitCenter = originalPositions[otherIdx];
								}
							}
						}
					}
				});
				
				if (orbitCenter) {
					// Orbital motion around higher level sprite
					const orbitRadius = spriteLevel === 1 ? Math.min(minDistance * 5.6, 64) : Math.min(minDistance * 0.7, 8); // Level 1 has octuple orbit radius
					const orbitSpeed = 0.5 + (13 - spriteLevel) * 0.1; // Lower levels orbit faster
					const orbitAngle = time * orbitSpeed + idx * 0.5; // Offset each sprite's orbit
					
					sprite.position.x = orbitCenter.x + orbitRadius * Math.cos(orbitAngle);
					sprite.position.y = orbitCenter.y + orbitRadius * Math.sin(orbitAngle) * 0.5; // Flatten Y orbit
					sprite.position.z = orbitCenter.z + orbitRadius * Math.sin(orbitAngle);
				} else {
					// Default floating motion for sprites without orbital targets
					sprite.position.x = originalPosition.x + 0.8 * Math.sin(time + idx);
					sprite.position.y = originalPosition.y + 0.8 * Math.cos(time + idx);
					sprite.position.z = originalPosition.z + 0.8 * Math.sin(time + idx);
				}
				
				sprite.angle = 0.01*idx;
			}
		}
    });
}

// Start rendering the scene on each animation frame
function renderLoop() {
    scene.render();
}

function blinkSprite(sprite) {
    // Clear any existing blink interval to prevent memory leaks
    if (sprite.blinkInterval) {
        clearInterval(sprite.blinkInterval);
    }
    
    let isDefaultColor = true; // État du sprite, vrai si la couleur par défaut est affichée
    const defaultColor = sprite.color
    const highlightColor = new BABYLON.Color4(1, 1, 1, 1);
	const mediumMediumlightColor = new BABYLON.Color4((sprite.color.r+1)/2, (sprite.color.g+1)/2, (sprite.color.b+1)/2, (sprite.color.a+1)/2);
	const mediumLowlightColor = new BABYLON.Color4((3*sprite.color.r+1)/4, (3*sprite.color.g+1)/4, (3*sprite.color.b+1)/4, (3*sprite.color.a+1)/4);
	const mediumHighlightColor = new BABYLON.Color4((sprite.color.r+3)/4, (sprite.color.g+3)/4, (sprite.color.b+3)/4, (sprite.color.a+3)/4);

    let localBlinkCount = 0;
    const maxBlinks = 16; // Limit blink duration to prevent infinite blinking

    // Configure l'intervalle de clignotement
    sprite.blinkInterval = setInterval(() => {
		localBlinkCount++;
		
		var moduloBlink = localBlinkCount % 8;
		
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
        
        // Stop blinking after maxBlinks and restore default color
        if (localBlinkCount >= maxBlinks) {
            sprite.color = defaultColor;
            clearInterval(sprite.blinkInterval);
            sprite.blinkInterval = null;
        }
    }, 200); // Durée du clignotement en millisecondes
}

function moveCameraToSprite(spriteName) {
	console.log('Moving camera to sprite:', spriteName);
    
    // Get all sprites from all managers
    const sprites = getAllSprites();
    let targetSprite = sprites.find(s => s.name === spriteName);

    if (targetSprite) {
        console.log('Target sprite found:', targetSprite.name, 'at position:', targetSprite.position);
        
        const targetPosition = new BABYLON.Vector3(targetSprite.position.x, targetSprite.position.y, targetSprite.position.z);
        const cameraStartPosition = camera.position.clone();
        const cameraStartTarget = camera.getTarget().clone();

        const bufferDistance = 9; // Distance from sprite
        const directionVector = targetPosition.subtract(camera.position).normalize();
        const adjustedTargetPosition = targetPosition.subtract(directionVector.scale(bufferDistance));

        const moveDistance = BABYLON.Vector3.Distance(cameraStartPosition, adjustedTargetPosition);
        const numberOfFrames = Math.min(85, Math.max(10, Math.round(moveDistance)));
        
        console.log('Animation frames:', numberOfFrames, 'Distance:', moveDistance);
        
        // Stop any existing animations
        scene.stopAnimation(camera);
        
        // Create animation for camera position
        const animCamPosition = new BABYLON.Animation("animCamPosition", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCamPosition.setKeys([
            {frame: 0, value: cameraStartPosition},
            {frame: numberOfFrames, value: adjustedTargetPosition}
        ]);

        // Create animation for camera target
        const animCamTarget = new BABYLON.Animation("animCamTarget", "target", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCamTarget.setKeys([
            {frame: 0, value: cameraStartTarget},
            {frame: numberOfFrames, value: targetPosition}
        ]);

        // Start the animation
        const animationGroup = scene.beginDirectAnimation(camera, [animCamPosition, animCamTarget], 0, numberOfFrames, false);
        
        // Add completion callback
        animationGroup.onAnimationEndObservable.add(() => {
            console.log('Camera animation completed');
        });

        // Make the sprite blink to indicate selection
        blinkSprite(targetSprite);

        // Find and update nearest particles list
        let distances = sprites.filter(s => s.isVisible).map(sprite => {
            return {
                name: sprite.name,
                distance: BABYLON.Vector3.Distance(targetSprite.originalPosition, sprite.originalPosition)
            };
        });
        distances.sort((a, b) => a.distance - b.distance);
        
        updateNearestList(distances, spriteName, targetSprite.metadata.subType);
        
    } else {
        console.error("Sprite not found:", spriteName);
        console.log("Available sprites:", sprites.map(s => s.name));
    }
}

function updateNearestList(distances, spriteName, subType) {
		// Get top 100 nearest particles
        let nearestParticles = distances.slice(1, 101);

        // Update the nearest list
		const nearestList = document.getElementById('nearestList');
			nearestList.innerHTML = '';
			let i=0
			
			
		let listItem = document.createElement('li');
			listItem.className = 'nearest-item first-item';
			listItem.textContent = `${spriteName} (${subType})`;
		
		nearestList.appendChild(listItem);
		
		nearestParticles.forEach(particle => {
			i=i+1;
			let listItem = document.createElement('li');
				listItem.className = 'nearest-item';
				listItem.textContent = `${i} : ${particle.name} (${particle.distance.toFixed(2)})`;

				// Ajouter un écouteur d'événements click à chaque élément de la liste
				listItem.addEventListener('click', function() {
					searchInput.value = particle.name;
					moveCameraToSprite(particle.name);
				});

			nearestList.appendChild(listItem);
		});
}

function createLegend(data) {
    const uniqueTypes = [...new Set(data.map(item => item.subType))];
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '';

	//const totalLinesElement = document.createElement('div');
	//totalLinesElement.className = 'legend-total';
    //totalLinesElement.textContent = `Count: ${data.length}`;
    //legendContainer.appendChild(totalLinesElement);
	
	console.log('count:', data.length);
	
    uniqueTypes.sort().forEach(type => {
        const color = `rgb(${getColor(type).r * 255}, ${getColor(type).g * 255}, ${getColor(type).b * 255})`;
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.dataset.type = type;
        legendItem.dataset.active = 'true'; // By default, all items are active

        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = color;

        const label = document.createElement('span');
        label.textContent = type;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContainer.appendChild(legendItem);

        // Add event listener for click
        legendItem.addEventListener('click', function() {
            filterByType(type);
            toggleLegendItemColor(legendItem);
        });
    });
}

// Function to filter sprites by type
function filterByType(type) {
    getAllSprites().forEach(sprite => {
		if (sprite.metadata && sprite.metadata.subType === type) {
            sprite.isVisible = !sprite.isVisible;
        }
    });
	
	updateParticleList();
}

// Function to toggle the legend item color
function toggleLegendItemColor(legendItem) {
    const isActive = legendItem.dataset.active === 'true';
    if (isActive) {
        legendItem.style.opacity = 0.5; // Make the color lighter
    } else {
        legendItem.style.opacity = 1.0; // Restore the original color
    }
    legendItem.dataset.active = (!isActive).toString();
}

// Function to update the datalist options based on particle visibility
function updateParticleList() {
	
    const dataList = document.getElementById('particlesList');
    dataList.innerHTML = ''; // Clear existing items

    const particleNames = getAllSprites()
        .filter(sprite => sprite.isVisible)
        .map(sprite => sprite.name);
    
    particleNames.forEach(name => {
        let option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

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

//scene.debugLayer.show()
