//http-server -c-1 to launch server
import data_0 from './PSO_0.json' with  {type: 'json'};

const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);

const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

function getColor(type) {
  const colors = {
    TECHNICAL: { r: 85 / 255, g: 113 / 255, b: 255 / 255 },
    PROTOCOL: { r: 255 / 255, g: 121 / 255, b: 166 / 255 },
    OPERATING_SYSTEM: { r: 215 / 255, g: 0 / 255, b: 248 / 255 },
    BUSINESS_SOFTWARE: { r: 134 / 255, g: 0 / 255, b: 255 / 255 },
    TOOL: { r: 121 / 255, g: 210 / 255, b: 255 / 255 },
    FUNCTIONAL: { r: 164 / 255, g: 255 / 255, b: 182 / 255 },
    PROGRAMMING_LANGUAGE: { r: 22 / 255, g: 233 / 255, b: 255 / 255 },
    METHOD: { r: 204 / 255, g: 144 / 255, b: 255 / 255 },
    DATABASE: { r: 11 / 255, g: 255 / 255, b: 227 / 255 },
    BEHAVIORAL: { r: 255 / 255, g: 51 / 255, b: 51 / 255 },
    FRAMEWORK: { r: 255 / 255, g: 230 / 255, b: 0 / 255 },
    TRANSVERSAL: { r: 255 / 255, g: 131 / 255, b: 15 / 255 },
    PLATFORM: { r: 213 / 255, g: 14 / 255, b: 98 / 255 },
    NORMS_AND_STANDARDS: { r: 255 / 255, g: 152 / 255, b: 0 / 255 },
    LANGUAGE: { r: 255 / 255, g: 193 / 255, b: 101 / 255 },
    DEFAULT: { r: 96 / 255, g: 125 / 255, b: 139 / 255 }
  };

  return colors[type] || colors.DEFAULT;
}

    var camera = new BABYLON.UniversalCamera("MyCamera", new BABYLON.Vector3(0, 1, 0), scene);
    camera.minZ = 0.0001;
    camera.attachControl(canvas, true);
    camera.speed = 0.9;
    camera.angularSpeed = 0.05;
    camera.angle = Math.PI/2;
    camera.direction = new BABYLON.Vector3(Math.cos(camera.angle), 0, Math.sin(camera.angle));
	camera.inputs.addGamepad();
    
    var cone = BABYLON.MeshBuilder.CreateCylinder("dummyCamera", {diameterTop:0.01, diameterBottom:0.2, height:0.2}, scene);
    cone.parent = camera;
    cone.rotation.x = Math.PI/2;


const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.7;


const data = data_0.map(d => 
{
	d.x = d.x * 1
	d.y = d.y * 1
	d.z = d.z * 1
	d.color = getColor(d.subType)
return d
}
);

// Create scatter mesh and label sprites
const imageUrl = 'bubble.png';
//const imageUrl = 'star.png';
        
const labelSpriteManager = new BABYLON.SpriteManager('labelSpriteManager', imageUrl, data.length, 3000, scene);

var font = "bold 44px monospace";


const scatter = new BABYLON.PointsCloudSystem("scatter", 0, scene);

const labelSprites = [];

scatter.addPoints(data.length, function (particle) {
    const point = data[particle.idx];
    particle.position = new BABYLON.Vector3(point.x, point.y, point.z);
	const sprite = new BABYLON.Sprite(point.prefLabel, labelSpriteManager);
    sprite.position = particle.position;
    sprite.size = 0.7
	sprite.color = new BABYLON.Color4(point.color.r, point.color.g, point.color.b, 1);	
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
        if (distance < 10) {
            names.push({ "name": s.name + '_layer', "meshName": s.name + '_mesh', "matName": s.name + '_mat', "textureName": s.name, "position": s.position });
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
		if(!scene.meshes.some(l => l.name === n.meshName)) {
				const font_size = 16
				const planeTexture = new BABYLON.DynamicTexture("dynamic texture", font_size*100, scene, true, BABYLON.DynamicTexture.TRILINEAR_SAMPLINGMODE);
				planeTexture.drawText(n.textureName, null, null, "" + font_size + "px Calibri", "white", "transparent", true,true);
				var material = new BABYLON.StandardMaterial(n.textureName+'_mat', scene);
				material.emissiveTexture = planeTexture;
				material.opacityTexture = planeTexture;
				material.backFaceCulling = false;
				material.disableLighting = false;
				material.freeze();	

				var outputplane = BABYLON.Mesh.CreatePlane(n.textureName+'_mesh', font_size, scene, false);
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

let particleNames = [];  // Array to store the names

scene.spriteManagers[0].sprites.forEach(sprite => {
    particleNames.push(sprite.name);
});

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
        animCamPosition.setKeys([
            { frame: 0, value: cameraStartPosition },
            { frame: 100, value: adjustedTargetPosition }
        ]);

        // Create animation for camera target
        const animCamTarget = new BABYLON.Animation("animCamTarget", "target", 10, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        animCamTarget.setKeys([
            { frame: 0, value: cameraStartTarget },
            { frame: 100, value: targetPosition }
        ]);

        scene.beginDirectAnimation(camera, [animCamPosition, animCamTarget], 0, 100, false);
		
		blinkSprite(targetSprite);
    } else {
        console.log("Sprite not found: " + spriteName);
    }
}

document.addEventListener("DOMContentLoaded", function() {
	
	
	// Assuming particleNames is filled as shown above
    const dataList = document.getElementById('particlesList');

    particleNames.forEach(name => {
        let option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
	
    const searchButton = document.getElementById('searchButton');
    if(searchButton) {
        searchButton.addEventListener('click', function(event) {
            event.preventDefault();  // This prevents any default form submitting
            moveCameraToSprite();
        });
    }
});





//scene.debugLayer.show()
