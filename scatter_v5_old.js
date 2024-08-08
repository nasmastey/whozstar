//http-server -c-1 to launch server
import data_0 from './PSO_0.json'
with {
    type: 'json'
};


// Function to toggle the visibility of an element
export function toggleElement(elementId) {
    const element = document.getElementById(elementId);
	
	console.log(element.style.display)
    if (element.style.display === "none") {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
}

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);

const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

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
        }
    };

    return colors[type] || colors.DEFAULT;
}

var camera = new BABYLON.UniversalCamera("MyCamera", new BABYLON.Vector3(0, 1, 0), scene);
camera.minZ = 0.0001;
camera.attachControl(canvas, true);
camera.speed = 0.9;
camera.angularSpeed = 0.05;
camera.angle = Math.PI / 2;
camera.direction = new BABYLON.Vector3(Math.cos(camera.angle), 0, Math.sin(camera.angle));
camera.inputs.addGamepad();

var cone = BABYLON.MeshBuilder.CreateCylinder("dummyCamera", {
    diameterTop: 0.01,
    diameterBottom: 0.2,
    height: 0.2
}, scene);
cone.parent = camera;
cone.rotation.x = Math.PI / 2;


const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.7;


const data = data_0.map(d => {
    d.x = d.x * 1;
    d.y = d.y * 1;
    d.z = d.z * 1;
    d.color = getColor(d.subType);
    d.metadata = { subType: d.subType };
    return d;
});

// Create scatter mesh and label sprites
const imageUrl = 'bubble.png';
//const imageUrl = 'star.png';

const labelSpriteManager = new BABYLON.SpriteManager('labelSpriteManager', imageUrl, data.length, 3000, scene);

var font = "bold 44px monospace";

const scatter = new BABYLON.PointsCloudSystem("scatter", 0, scene);

const labelSprites = [];
const originalPositions = [];

scatter.addPoints(data.length, function(particle) {
    const point = data[particle.idx];
    particle.position = new BABYLON.Vector3(point.x, point.y, point.z);
    originalPositions.push(particle.position.clone());

    const sprite = new BABYLON.Sprite(point.prefLabel, labelSpriteManager);
    sprite.position = particle.position;
    sprite.size = 0.7;
    sprite.color = new BABYLON.Color4(point.color.r, point.color.g, point.color.b, 1);
	sprite.metadata = { subType: point.subType };
    sprite.isVisible = true; // Ensure the sprite is initially visible

    labelSprites.push(sprite);
});

let time = 0;

// Update sprite positions to add small movements
function updateSpritePositions() {
    time += 0.02;
    labelSprites.forEach((sprite, idx) => {
        const originalPosition = originalPositions[idx];
        sprite.position.x = originalPosition.x + 0.2 * Math.sin(time + idx);
        sprite.position.y = originalPosition.y + 0.2 * Math.cos(time + idx);
        sprite.position.z = originalPosition.z + 0.2 * Math.sin(time + idx);
    });
}

// Use the onBeforeRenderObservable to update the positions before each frame is rendered
scene.onBeforeRenderObservable.add(() => {
    updateSpritePositions();
});

scene.onAfterRenderObservable.add(() => {
    var names = [];
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

        const distance = BABYLON.Vector3.Distance(camera.position, s.position);
		
        if (distance < 10 && s.isVisible) {
            names.push({
                "name": s.name + '_layer',
                "meshName": s.name + '_mesh',
                "matName": s.name + '_mat',
                "textureName": s.name,
                "position": s.position
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
            const font_size = 16
            const planeTexture = new BABYLON.DynamicTexture("dynamic texture", font_size * 100, scene, true, BABYLON.DynamicTexture.TRILINEAR_SAMPLINGMODE);
            planeTexture.drawText(n.textureName, null, null, "" + font_size + "px Times New Roman", "white", "transparent", true, true);
            var material = new BABYLON.StandardMaterial(n.textureName + '_mat', scene);
            material.emissiveTexture = planeTexture;
            material.opacityTexture = planeTexture;
            material.backFaceCulling = false;
            material.disableLighting = false;
            material.freeze();

            var outputplane = BABYLON.Mesh.CreatePlane(n.textureName + '_mesh', font_size, scene, false);
            outputplane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
            outputplane.isVisible = true;
            outputplane.position = n.position;
            outputplane.material = material;
        }
    });

});


scatter.buildMeshAsync().then(mesh => {
    mesh.material = new BABYLON.StandardMaterial('scatterMaterial', scene);
    mesh.material.pointSize = 10;
    mesh.material.usePointSizing = true;
    mesh.material.disableLighting = true;
    mesh.material.pointColor = new BABYLON.Color3(1, 1, 1);
});

// Start rendering the scene on each animation frame
function renderLoop() {
    scene.render();
}

engine.runRenderLoop(renderLoop);

function blinkSprite(sprite) {
    let isDefaultColor = true; // État du sprite, vrai si la couleur par défaut est affichée
    const defaultColor = sprite.color
    const highlightColor = new BABYLON.Color4(1, 0, 0, 1); // couleur du clignotement (rouge)

    // Configure l'intervalle de clignotement
    setInterval(() => {
        if (isDefaultColor) {
            sprite.color = highlightColor;
            isDefaultColor = false;
        } else {
            sprite.color = defaultColor;
            isDefaultColor = true;
        }
    }, 500); // Durée du clignotement en millisecondes
}

function moveCameraToSprite() {
    const spriteName = document.getElementById('searchInput').value;
    const sprites = scene.spriteManagers[0].sprites; // Assuming the first sprite manager
    let targetSprite = sprites.find(s => s.name === spriteName);

    if (targetSprite) {
        const targetPosition = new BABYLON.Vector3(targetSprite.position.x, targetSprite.position.y, targetSprite.position.z);
        const cameraStartPosition = camera.position.clone();
        const cameraStartTarget = camera.getTarget().clone();

        const bufferDistance = 5; // Adjust the distance from sprite
        const directionVector = targetPosition.subtract(camera.position).normalize();
        const adjustedTargetPosition = targetPosition.subtract(directionVector.scale(bufferDistance));

        // Create animation for camera position
        const animCamPosition = new BABYLON.Animation("animCamPosition", "position", 10, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCamPosition.setKeys([{
                frame: 0,
                value: cameraStartPosition
            },
            {
                frame: 100,
                value: adjustedTargetPosition
            }
        ]);

        // Create animation for camera target
        const animCamTarget = new BABYLON.Animation("animCamTarget", "target", 10, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCamTarget.setKeys([{
                frame: 0,
                value: cameraStartTarget
            },
            {
                frame: 100,
                value: targetPosition
            }
        ]);

        scene.beginDirectAnimation(camera, [animCamPosition, animCamTarget], 0, 100, false);

        blinkSprite(targetSprite);

        // Find the nearest particles
        let distances = sprites.filter(s => s.isVisible).map(sprite => {
            return {
                name: sprite.name,
                distance: BABYLON.Vector3.Distance(targetSprite.position, sprite.position)
            };
        });
        distances.sort((a, b) => a.distance - b.distance);

        // Get top 20 nearest particles
        let nearestParticles = distances.slice(1, 21);

        // Update the nearest list
        const nearestList = document.getElementById('nearestList');
        nearestList.innerHTML = '';
        nearestParticles.forEach(particle => {
            let listItem = document.createElement('li');
            listItem.className = 'nearest-item';
            listItem.textContent = `${particle.name} (${particle.distance.toFixed(2)})`;
            nearestList.appendChild(listItem);
        });

    } else {
        console.log("Sprite not found: " + spriteName);
    }
}

function createLegend(data) {
    const uniqueTypes = [...new Set(data.map(item => item.subType))];
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '';

    uniqueTypes.forEach(type => {
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
            console.log(`Filtering by type: ${type}`);
            filterByType(type);
            toggleLegendItemColor(legendItem);
        });
    });
}

// Function to filter sprites by type
function filterByType(type) {
    console.log(`Filter function called for type: ${type}`);
    scene.spriteManagers[0].sprites.forEach(sprite => {
		if (sprite.metadata && sprite.metadata.subType === type) {
            sprite.isVisible = !sprite.isVisible;
            //console.log(`Sprite ${sprite.name} is visible`);
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

    const particleNames = scene.spriteManagers[0].sprites
        .filter(sprite => sprite.isVisible)
        .map(sprite => sprite.name);
    
    particleNames.forEach(name => {
        let option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

document.addEventListener("DOMContentLoaded", function() {

    createLegend(data);
	updateParticleList();

    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function(event) {
            event.preventDefault(); // This prevents any default form submitting
            moveCameraToSprite();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // This prevents any default form submitting
                moveCameraToSprite();
            }
        });

        searchInput.addEventListener('change', function(event) {
            moveCameraToSprite();
        });
    }

    const toggleSearchButton = document.querySelector(".toggleButton[data-target='searchContainer']");
    if (toggleSearchButton) {
        toggleSearchButton.addEventListener('click', function() {
            toggleElement('searchContainer');
        });
    }

    const toggleLegendButton = document.querySelector(".toggleButton[data-target='legend']");
    if (toggleLegendButton) {
        toggleLegendButton.addEventListener('click', function() {
            toggleElement('legend');
        });
    }

    const toggleNearestButton = document.querySelector(".toggleButton[data-target='nearestContainer']");
    if (toggleNearestButton) {
        toggleNearestButton.addEventListener('click', function() {
            toggleElement('nearestContainer');
        });
    }
});




//scene.debugLayer.show()
