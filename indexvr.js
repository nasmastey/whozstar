//http-server -c-1
//http-server -c-1 -S -C cert.pem -K key.pem
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
});
const scene = new BABYLON.Scene(engine);

// XR Setup - Simple and stable configuration
scene.createDefaultXRExperienceAsync({
    floorMeshes: [],
    disableTeleportation: true,
    inputOptions: {
        doNotLoadControllerMeshes: false  // Enable controller meshes
    }
}).then(xrHelper => {
    console.log("WebXR initialized.");
    window.xrHelper = xrHelper; // Global reference
    window.leftThumbstick = null;

    // Simple controller setup
    xrHelper.input.onControllerAddedObservable.add((controller) => {
        console.log("Controller added:", controller.inputSource.handedness);
        
        controller.onMotionControllerInitObservable.add((motionController) => {
            console.log("Motion controller initialized for:", motionController.handness);
            
            // Ensure controller mesh is visible with enhanced materials
            if (motionController.rootMesh) {
                motionController.rootMesh.setEnabled(true);
                motionController.rootMesh.isVisible = true;
                
                // Make controller meshes glow
                motionController.rootMesh.getChildMeshes().forEach(mesh => {
                    mesh.setEnabled(true);
                    mesh.isVisible = true;
                    if (mesh.material) {
                        mesh.material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                        mesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                    }
                });
            }
        });
    });

    // Enhanced controller setup with better pointer visibility
    xrHelper.input.onControllerAddedObservable.add((controller) => {
        console.log("Controller added:", controller.inputSource.handedness);
        
        controller.onMotionControllerInitObservable.add((motionController) => {
            console.log("Motion controller initialized for:", motionController.handness);
            
            // Ensure controller mesh is visible with enhanced materials
            if (motionController.rootMesh) {
                motionController.rootMesh.setEnabled(true);
                motionController.rootMesh.isVisible = true;
                
                // Make controller meshes glow with different colors for left/right
                const isLeft = motionController.handness === 'left';
                const emissiveColor = isLeft ? new BABYLON.Color3(0, 0.8, 0) : new BABYLON.Color3(0.8, 0, 0);
                
                motionController.rootMesh.getChildMeshes().forEach(mesh => {
                    mesh.setEnabled(true);
                    mesh.isVisible = true;
                    if (mesh.material) {
                        mesh.material.emissiveColor = emissiveColor;
                        mesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                    }
                });
            }
            
            // Force pointer ray creation for this controller
            setTimeout(() => {
                createControllerPointer(controller, motionController);
            }, 100);
        });
    });

    // Function to create/enhance controller pointers
    function createControllerPointer(controller, motionController) {
        console.log("Creating pointer for controller:", motionController.handness);
        
        // Create a custom pointer ray if none exists
        if (!controller.pointer || !controller.pointer.isVisible) {
            const isLeft = motionController.handness === 'left';
            const rayColor = isLeft ? new BABYLON.Color3(0, 0.3, 0) : new BABYLON.Color3(0.3, 0, 0);
            
            // Create ray mesh - invisible but functional
            const ray = BABYLON.MeshBuilder.CreateCylinder("controllerRay_" + motionController.handness, {
                height: 10,
                diameterTop: 0.002,
                diameterBottom: 0.008,
                tessellation: 6
            }, scene);
            
            // Create transparent material
            const rayMaterial = new BABYLON.StandardMaterial("rayMat_" + motionController.handness, scene);
            rayMaterial.emissiveColor = rayColor;
            rayMaterial.disableLighting = true;
            rayMaterial.alpha = 0.0; // Completely transparent
            ray.material = rayMaterial;
            
            // Position ray relative to controller
            if (motionController.rootMesh) {
                ray.parent = motionController.rootMesh;
                ray.position = new BABYLON.Vector3(0, 0, 5);
                ray.rotation.x = Math.PI / 2;
                
                console.log("Custom pointer ray created for", motionController.handness, "controller");
            }
        }
    }

    // XR legend panel setup (hidden by default)

    // XR scale panel 3D setup (hidden by default)
    scene.vrScalePanel3D = null; // Sera initialisé plus tard
    scene.vrTargetIndicator = null; // Sera initialisé plus tard
    scene.currentScaleValue = 1.0; // Valeur de scale actuelle
    
    // XR: Toggle scale panel with right A button
    xrHelper.input.onControllerAddedObservable.add(ctrl => {
        ctrl.onMotionControllerInitObservable.add(motionController => {
            if (motionController.handness === 'right') {
                const aButton = motionController.getComponent("a-button");
                if (aButton) {
                    aButton.onButtonStateChangedObservable.add(() => {
                        if (aButton.pressed) {
                            if (scene.vrScalePanel3D) {
                                scene.vrScalePanel3D.toggle();
                            }
                        }
                    });
                }
            }
        });
    });
    if (typeof BABYLON.GUI !== "undefined") {
        if (scene.xrLegendPanel) {
            scene.xrLegendPanel.dispose();
        }
        const xrLegendPanel = new BABYLON.GUI.StackPanel();
        xrLegendPanel.width = "400px";
        xrLegendPanel.height = "600px";
        xrLegendPanel.background = "rgba(0,0,0,0.7)";
        xrLegendPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        xrLegendPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        xrLegendPanel.isVisible = false; // Hidden by default
        xrLegendPanel.paddingTop = "20px";
        xrLegendPanel.paddingLeft = "20px";
        xrLegendPanel.zIndex = 1000;
        scene.xrLegendPanel = xrLegendPanel;

        // Attach to fullscreen UI
        if (!scene.xrLegendTexture) {
            scene.xrLegendTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("XRLegendUI");
        }
        scene.xrLegendTexture.addControl(xrLegendPanel);

        // Toggle legend with right B button - USE NEW GUI 3D LEGEND
        xrHelper.input.onControllerAddedObservable.add(ctrl => {
            ctrl.onMotionControllerInitObservable.add(motionController => {
                if (motionController.handness === 'right') {
                    const bButton = motionController.getComponent("b-button");
                    if (bButton) {
                        bButton.onButtonStateChangedObservable.add(() => {
                            if (bButton.pressed) {
                                // Toggle new GUI 3D legend panel
                                if (scene.vrLegendPanel3D) {
                                    scene.vrLegendPanel3D.toggle();
                                } else {
                                    // Fallback to old 2D panel if 3D not available
                                    xrLegendPanel.isVisible = !xrLegendPanel.isVisible;
                                }
                            }
                        });
                    }
                }
            });
        });
    }

    // Enable only MOVEMENT feature
    xrHelper.baseExperience.featuresManager.enableFeature(
        BABYLON.WebXRFeatureName.MOVEMENT, 'latest', {
            xrInput: xrHelper.input,
            movementSpeed: 0.4,
            rotationSpeed: 0.1,
            movementOrientationFollowsViewerPose: true
    });

    // UI Setup
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("SearchUI");
    const searchPanel = new BABYLON.GUI.StackPanel();
    Object.assign(searchPanel, {
        width: "400px",
        paddingTop: "20px",
        background: "rgba(255,255,255,0.7)",
        isVisible: false
    });
    advancedTexture.addControl(searchPanel);

    // Header
    const header = new BABYLON.GUI.TextBlock();
    Object.assign(header, {
        text: "Recherche de particule",
        height: "40px",
        color: "black",
        fontSize: 20
    });
    searchPanel.addControl(header);

    // Input
    const inputText = new BABYLON.GUI.InputText();
    Object.assign(inputText, {
        width: 0.8,
        maxWidth: 0.8,
        height: "40px",
        color: "black",
        background: "white",
        placeholderText: "Nom de particule..."
    });
    searchPanel.addControl(inputText);

    // Search Button
    const searchBtn = BABYLON.GUI.Button.CreateSimpleButton("searchBtn", "Rechercher");
    Object.assign(searchBtn, {
        width: 0.5,
        height: "40px",
        color: "white",
        background: "#007bff",
        cornerRadius: 5,
        thickness: 0,
        paddingTop: "10px"
    });
    searchPanel.addControl(searchBtn);

    // Search Result
    const searchResultText = new BABYLON.GUI.TextBlock();
    Object.assign(searchResultText, {
        height: "30px",
        color: "black",
        text: ""
    });
    searchPanel.addControl(searchResultText);

    // Keep panel facing camera
    scene.onBeforeRenderObservable.add(() => {
        if (searchPanel.isVisible) {
            const cam = scene.activeCamera;
            advancedTexture.layer.layerMask = cam.layerMask;
            searchPanel.linkWithMesh(null);
            searchPanel.isVertical = true;
        }
    });

    // Search action
    searchBtn.onPointerUpObservable.add(() => {
        const query = inputText.text.trim();
        if (query) {
            moveCameraToSprite(query);
            searchResultText.text = "Recherche : " + query;
        } else {
            searchResultText.text = "Entrer un nom valide.";
        }
    });

    // Toggle panel with X button (Quest 3) - NOW TOGGLES VR 3D SEARCH PANEL
    xrHelper.input.onControllerAddedObservable.add(ctrl => {
        ctrl.onMotionControllerInitObservable.add(motionController => {
            if (motionController.handness === 'left') {
                // Debug: log all available components for this controller
                console.log("Left controller components:", Object.keys(motionController.components));
                const xButtonComponent = motionController.getComponent("x-button");
                if (xButtonComponent) {
                    xButtonComponent.onButtonStateChangedObservable.add(() => {
                        if (xButtonComponent.pressed) {
                            // Toggle new VR 3D search panel instead of 2D
                            if (scene.vrSearchPanel3D) {
                                scene.vrSearchPanel3D.toggle();
                            } else {
                                // Fallback to old 2D panel if 3D not available
                                searchPanel.isVisible = !searchPanel.isVisible;
                                if (searchPanel.isVisible) {
                                    inputText.text = "";
                                    searchResultText.text = "";
                                }
                            }
                        }
                    });
                }
                
                // Mode démo avec bouton Y (contrôleur gauche)
                const yButtonComponent = motionController.getComponent("y-button");
                if (yButtonComponent) {
                    yButtonComponent.onButtonStateChangedObservable.add(() => {
                        if (yButtonComponent.pressed) {
                            toggleDemoModeVR();
                        }
                    });
                    console.log("Y button configured for demo mode on left controller");
                }
                
                // Trigger interaction pour navigation vers les étoiles (contrôleur gauche)
                const leftTrigger = motionController.getComponent("xr-standard-trigger");
                if (leftTrigger) {
                    leftTrigger.onButtonStateChangedObservable.add(() => {
                        if (leftTrigger.pressed) {
                            handleVRTriggerInteractionNew(ctrl, 'left', true); // true = pressed
                        } else {
                            handleVRTriggerInteractionNew(ctrl, 'left', false); // false = released
                        }
                    });
                    console.log("Left trigger configured for star navigation and scale interaction");
                }
            }
            
            // Contrôleur droit
            if (motionController.handness === 'right') {
                // Trigger interaction pour navigation vers les étoiles (contrôleur droit)
                const rightTrigger = motionController.getComponent("xr-standard-trigger");
                if (rightTrigger) {
                    rightTrigger.onButtonStateChangedObservable.add(() => {
                        if (rightTrigger.pressed) {
                            handleVRTriggerInteractionNew(ctrl, 'right', true); // true = pressed
                        } else {
                            handleVRTriggerInteractionNew(ctrl, 'right', false); // false = released
                        }
                    });
                    console.log("Right trigger configured for star navigation and scale interaction");
                }
                
                // Joystick droit pour contrôle du scale
                const rightThumbstick = motionController.getComponent("xr-standard-thumbstick");
                if (rightThumbstick) {
                    window.rightThumbstick = rightThumbstick;
                    console.log("Right thumbstick configured for scale control");
                }
            }
            
            // Add left joystick up/down to z translation
            const thumbstick = motionController.getComponent("xr-standard-thumbstick");
            if (thumbstick) {
                window.leftThumbstick = thumbstick;
            }
        });
    });

    // Enable POINTER_SELECTION for controller pointer ray selection
    try {
        const pointerFeature = xrHelper.baseExperience.featuresManager.enableFeature(
            BABYLON.WebXRFeatureName.POINTER_SELECTION, 'latest', {
                xrInput: xrHelper.input,
                enablePointerSelectionOnAllControllers: true
            }
        );
        
        console.log("Pointer selection feature enabled");
        
        // Store reference to the pointer feature for accessing selection data
        window.vrPointerFeature = pointerFeature;
        
        // Enhance existing pointer rays when they become available
        setTimeout(() => {
            xrHelper.input.controllers.forEach(controller => {
                if (controller.pointer) {
                    console.log("Enhancing pointer for controller:", controller.inputSource.handedness);
                    
                    // Make pointer ray more visible
                    if (controller.pointer.material) {
                        const isLeft = controller.inputSource.handedness === 'left';
                        controller.pointer.material.emissiveColor = isLeft ?
                            new BABYLON.Color3(0, 0.8, 0) : new BABYLON.Color3(0.8, 0, 0);
                        controller.pointer.material.alpha = 0.8; // Semi-transparent
                        controller.pointer.material.disableLighting = true;
                    }
                    
                    // Ensure pointer is visible
                    controller.pointer.setEnabled(true);
                    controller.pointer.isVisible = true;
                }
            });
        }, 2000);
        
    } catch (error) {
        console.log("Pointer selection feature not available:", error);
    }
});


scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

// Enhanced movement: left joystick controls Y (up/down) - SIMPLIFIED VERSION
let debugLogCount = 0;
const MAX_DEBUG_LOGS = 10; // Limit debug logs to avoid console spam

// Variable globale pour stocker la particule actuellement visée
let currentTargetedSprite = null;

// Variables pour la gestion du trigger maintenu sur le slider
let triggerHeldControllers = new Map(); // Stocke l'état des triggers maintenus par contrôleur
let sliderInteractionActive = false;

// Fonction ultra-simple pour scale les particules - SYSTÈME MULTI-MANAGERS CORRIGÉ
function applyScaleToParticles(scaleValue) {
    try {
        const sprites = getAllSprites(); // Utiliser le nouveau système multi-managers
        
        if (sprites && sprites.length > 0) {
            // Facteur d'espacement inverse : scale élevé = particules serrées
            const factor = 1.0 / scaleValue;
            
            console.log(`Applying scale ${scaleValue.toFixed(2)} with factor ${factor.toFixed(3)} to ${sprites.length} sprites (multi-manager)`);
            
            // Appliquer directement aux sprites avec leurs originalPosition
            sprites.forEach(sprite => {
                if (sprite && sprite.originalPosition) {
                    sprite.position.x = sprite.originalPosition.x * factor;
                    sprite.position.y = sprite.originalPosition.y * factor;
                    sprite.position.z = sprite.originalPosition.z * factor;
                }
            });
            
            console.log(`✅ Scale applied successfully to ALL sprite managers`);
        } else {
            console.log(`❌ No sprites available from getAllSprites() (${sprites ? sprites.length : 'undefined'})`);
            
            // Debug pour diagnostiquer
            console.log(`🔍 Debug info:`);
            console.log(`  - labelSprites array: ${labelSprites ? labelSprites.length : 'undefined'}`);
            console.log(`  - window.spriteManagersByLevel: ${window.spriteManagersByLevel ? Object.keys(window.spriteManagersByLevel).length + ' managers' : 'undefined'}`);
            console.log(`  - scene.spriteManagers: ${scene.spriteManagers ? scene.spriteManagers.length + ' managers' : 'undefined'}`);
        }
    } catch (error) {
        console.error(`❌ Error applying scale (multi-manager):`, error);
    }
}

// Rendre la fonction accessible globalement
window.applyScaleToParticles = applyScaleToParticles;

scene.onBeforeRenderObservable.add(() => {
    // Détecter la particule visée en continu (fonction définie plus bas)
    if (typeof detectTargetedSprite === 'function') {
        detectTargetedSprite();
    }
    
    // Check if we're in VR mode and have controllers
    if (window.xrHelper && window.xrHelper.input && window.xrHelper.input.controllers.length > 0) {
        
        debugLogCount++;
        if (debugLogCount <= MAX_DEBUG_LOGS) {
            console.log("XR Controllers found:", window.xrHelper.input.controllers.length);
        }
        
        // Find left controller
        const leftController = window.xrHelper.input.controllers.find(c =>
            c.inputSource && c.inputSource.handedness === "left"
        );
        
        if (leftController) {
            if (debugLogCount <= MAX_DEBUG_LOGS) {
                console.log("Left controller found, checking for motion controller...");
            }
            
            // Method 1: Try motion controller components - APPROCHE SIMPLIFIÉE
            if (leftController.motionController) {
                const componentNames = ["xr-standard-thumbstick", "thumbstick", "trackpad"];
                
                for (const name of componentNames) {
                    const component = leftController.motionController.getComponent(name);
                    if (component && component.axes && component.axes.length >= 2) {
                        const xAxis = component.axes[0]; // X axis (left/right rotation)
                        const yAxis = component.axes[1]; // Y axis (up/down)
                        
                        // Zones mortes INDÉPENDANTES pour chaque axe
                        const xDeadzone = 0.3; // Zone morte plus large pour X (rotation)
                        const yDeadzone = 0.1; // Zone morte plus petite pour Y (vertical)
                        
                        // Mouvement vertical - PRIORITÉ avec zone morte petite
                        if (Math.abs(yAxis) > yDeadzone) {
                            const movementSpeed = 0.08;
                            const yDelta = -yAxis * movementSpeed;
                            scene.activeCamera.position.y += yDelta;
                            
                            console.log(`VR VERTICAL - Component: ${name}, Y-axis: ${yAxis.toFixed(2)}, Camera Y: ${scene.activeCamera.position.y.toFixed(2)}`);
                        }
                        
                        // Rotation horizontale - seulement si mouvement X significatif
                        if (Math.abs(xAxis) > xDeadzone) {
                            const rotationSpeed = 0.08;
                            scene.activeCamera.rotation.y += xAxis * rotationSpeed;
                            
                            console.log(`VR HORIZONTAL - Component: ${name}, X-axis: ${xAxis.toFixed(2)}, Camera rotation Y: ${scene.activeCamera.rotation.y.toFixed(2)}`);
                        }
                        
                        break; // Found working component, stop searching
                    }
                }
                
                // Debug: Log available components (limited times)
                if (debugLogCount <= 3) {
                    const components = Object.keys(leftController.motionController.components);
                    console.log("Available motion controller components:", components);
                }
            }
            
            // Method 2: Direct gamepad access - APPROCHE SIMPLIFIÉE
            if (leftController.inputSource.gamepad) {
                const gamepad = leftController.inputSource.gamepad;
                if (gamepad.axes && gamepad.axes.length >= 4) {
                    const leftStickX = gamepad.axes[2]; // Standard left stick X (rotation)
                    const leftStickY = gamepad.axes[3]; // Standard left stick Y (mouvement vertical)
                    
                    // Zones mortes INDÉPENDANTES pour chaque axe
                    const xDeadzone = 0.3; // Zone morte plus large pour X (rotation)
                    const yDeadzone = 0.1; // Zone morte plus petite pour Y (vertical)
                    
                    // Mouvement vertical - PRIORITÉ avec zone morte petite
                    if (Math.abs(leftStickY) > yDeadzone) {
                        const movementSpeed = 0.08;
                        const yDelta = -leftStickY * movementSpeed;
                        scene.activeCamera.position.y += yDelta;
                        
                        console.log(`VR VERTICAL - Gamepad Y: ${leftStickY.toFixed(2)}, Camera Y: ${scene.activeCamera.position.y.toFixed(2)}`);
                    }
                    
                    // Rotation horizontale - seulement si mouvement X significatif
                    if (Math.abs(leftStickX) > xDeadzone) {
                        const rotationSpeed = 0.08;
                        scene.activeCamera.rotation.y += leftStickX * rotationSpeed;
                        
                        console.log(`VR HORIZONTAL - Gamepad X: ${leftStickX.toFixed(2)}, Camera rotation Y: ${scene.activeCamera.rotation.y.toFixed(2)}`);
                    }
                }
                
                // Debug: Log gamepad info (limited times)
                if (debugLogCount <= 3) {
                    console.log("Gamepad axes count:", gamepad.axes ? gamepad.axes.length : 0);
                    console.log("Gamepad buttons count:", gamepad.buttons ? gamepad.buttons.length : 0);
                }
            }
        } else if (debugLogCount <= MAX_DEBUG_LOGS) {
            console.log("No left controller found");
        }
        
        // Find right controller pour contrôle du scale
        const rightController = window.xrHelper.input.controllers.find(c =>
            c.inputSource && c.inputSource.handedness === "right"
        );
        
        if (rightController && scene.vrScalePanel3D && scene.vrScalePanel3D.plane.isVisible) {
            // Gérer le joystick droit pour le contrôle du scale
            if (rightController.motionController) {
                const componentNames = ["xr-standard-thumbstick", "thumbstick", "trackpad"];
                
                for (const name of componentNames) {
                    const component = rightController.motionController.getComponent(name);
                    if (component && component.axes && component.axes.length >= 2) {
                        const xAxis = component.axes[0]; // X axis pour contrôle du scale
                        
                        if (Math.abs(xAxis) > 0.05) { // Zone morte simple
                            const scaleSpeed = 0.02; // Vitesse normale
                            const currentValue = scene.vrScalePanel3D.currentSliderValue || 0;
                            const newValue = Math.max(-1, Math.min(1, currentValue + xAxis * scaleSpeed));
                            
                            scene.vrScalePanel3D.updateScale(newValue);
                            scene.vrScalePanel3D.currentSliderValue = newValue;
                            
                            console.log(`VR SCALE JOYSTICK - X-axis: ${xAxis.toFixed(2)}, Scale: ${scene.currentScaleValue.toFixed(2)}x`);
                        }
                        break;
                    }
                }
            }
            
            // Method 2: Direct gamepad access pour le joystick droit
            if (rightController.inputSource.gamepad) {
                const gamepad = rightController.inputSource.gamepad;
                if (gamepad.axes && gamepad.axes.length >= 4) {
                    const rightStickX = gamepad.axes[0]; // Standard right stick X
                    
                    if (Math.abs(rightStickX) > 0.05) {
                        const scaleSpeed = 0.02;
                        const currentValue = scene.vrScalePanel3D.currentSliderValue || 0;
                        const newValue = Math.max(-1, Math.min(1, currentValue + rightStickX * scaleSpeed));
                        
                        scene.vrScalePanel3D.updateScale(newValue);
                        scene.vrScalePanel3D.currentSliderValue = newValue;
                        
                        console.log(`VR SCALE GAMEPAD - X: ${rightStickX.toFixed(2)}, Scale: ${scene.currentScaleValue.toFixed(2)}x`);
                    }
                }
            }
        }
        
        // Gérer l'interaction continue avec le slider - VERSION SIMPLIFIÉE
        if (sliderInteractionActive && triggerHeldControllers.size > 0) {
            for (const [handness, heldController] of triggerHeldControllers) {
                if (scene.vrScalePanel3D && scene.vrScalePanel3D.plane.isVisible && heldController.pointer) {
                    const rayOrigin = heldController.pointer.absolutePosition || heldController.pointer.position;
                    const rayDirection = heldController.pointer.getDirection ?
                        heldController.pointer.getDirection(BABYLON.Vector3.Forward()) :
                        new BABYLON.Vector3(0, 0, 1);
                    
                    // Créer un ray pour tester l'intersection continue avec le panneau de scale
                    const ray = new BABYLON.Ray(rayOrigin, rayDirection);
                    const hit = ray.intersectsMesh(scene.vrScalePanel3D.plane);
                    
                    if (hit.hit) {
                        // Calculer la position relative sur le slider - COHÉRENT AVEC LA CORRECTION
                        const worldHitPoint = hit.pickedPoint;
                        const panelPosition = scene.vrScalePanel3D.plane.absolutePosition || scene.vrScalePanel3D.plane.position;
                        const localHitPoint = worldHitPoint.subtract(panelPosition);
                        
                        // Même logique corrigée que pour le clic initial
                        const panelWidth = 1.2;
                        let sliderValue = localHitPoint.x / (panelWidth * 0.35); // Facteur de correction empirique
                        sliderValue = Math.max(-1, Math.min(1, sliderValue)); // Forcer les limites
                        
                        // Mettre à jour directement
                        scene.vrScalePanel3D.updateScale(sliderValue);
                        scene.vrScalePanel3D.currentSliderValue = sliderValue;
                        
                        // Log pour debug
                        if (debugLogCount % 60 === 0) {
                            console.log(`🔄 VR Scale Drag: ${handness} - Local X: ${localHitPoint.x.toFixed(3)}, Slider: ${sliderValue.toFixed(3)}, Scale: ${scene.currentScaleValue.toFixed(2)}x`);
                        }
                    }
                }
            }
        }
    } else {
        // Not in VR mode - show this message only a few times
        if (debugLogCount <= 3) {
            console.log("Not in VR mode or no controllers available");
        }
        debugLogCount++;
    }
    
    // Alternative: Keyboard controls for testing on desktop
    if (!window.xrHelper || window.xrHelper.input.controllers.length === 0) {
        // Add keyboard controls for testing vertical movement
        if (scene.actionManager) {
            // This will be handled by keyboard events if we add them
        }
    }
});

// Add keyboard controls for testing vertical movement on desktop
document.addEventListener('keydown', (event) => {
    if (!window.xrHelper || window.xrHelper.input.controllers.length === 0) {
        const movementSpeed = 0.1;
        
        switch(event.key.toLowerCase()) {
            case 'q': // Q key for up
                scene.activeCamera.position.y += movementSpeed;
                console.log("KEYBOARD UP - Camera Y:", scene.activeCamera.position.y.toFixed(2));
                break;
            case 'e': // E key for down
                scene.activeCamera.position.y -= movementSpeed;
                console.log("KEYBOARD DOWN - Camera Y:", scene.activeCamera.position.y.toFixed(2));
                break;
        }
    }
});

var camera = new BABYLON.UniversalCamera("MyCamera", new BABYLON.Vector3(0, 1, 0), scene);
camera.minZ = 0.0001;
camera.attachControl(canvas, true);
camera.speed = 0.9;
camera.angularSpeed = 0.05;
camera.angle = Math.PI / 2;
camera.direction = new BABYLON.Vector3(Math.cos(camera.angle), 0, Math.sin(camera.angle));

// Create simulated VR controllers for desktop viewing
function createSimulatedControllers() {
    console.log("Creating simulated VR controllers for desktop viewing");
    
    try {
        // Left controller - green sphere
        const leftController = BABYLON.MeshBuilder.CreateSphere("leftController", {diameter: 0.2}, scene);
        leftController.position = new BABYLON.Vector3(-1.5, 1.2, 2);
        
        const leftMat = new BABYLON.StandardMaterial("leftControllerMat", scene);
        leftMat.diffuseColor = new BABYLON.Color3(0, 0.8, 0); // Green
        leftMat.emissiveColor = new BABYLON.Color3(0, 0.5, 0); // Bright glow
        leftMat.alpha = 0.0; // Completely transparent
        leftController.material = leftMat;
        
        // Right controller - red sphere
        const rightController = BABYLON.MeshBuilder.CreateSphere("rightController", {diameter: 0.2}, scene);
        rightController.position = new BABYLON.Vector3(1.5, 1.2, 2);
        
        const rightMat = new BABYLON.StandardMaterial("rightControllerMat", scene);
        rightMat.diffuseColor = new BABYLON.Color3(0.8, 0, 0); // Red
        rightMat.emissiveColor = new BABYLON.Color3(0.5, 0, 0); // Bright glow
        rightMat.alpha = 0.0; // Completely transparent
        rightController.material = rightMat;
        
        // Create static pointer rays using boxes (more stable than lines)
        const leftRay = BABYLON.MeshBuilder.CreateBox("leftRay", {
            width: 0.02,
            height: 0.02,
            depth: 8
        }, scene);
        leftRay.position = leftController.position.add(new BABYLON.Vector3(0, 0, 4));
        
        const leftRayMat = new BABYLON.StandardMaterial("leftRayMat", scene);
        leftRayMat.emissiveColor = new BABYLON.Color3(0, 0.3, 0); // Dimmed green
        leftRayMat.disableLighting = true;
        leftRayMat.alpha = 0.0; // Completely transparent
        leftRay.material = leftRayMat;
        
        const rightRay = BABYLON.MeshBuilder.CreateBox("rightRay", {
            width: 0.02,
            height: 0.02,
            depth: 8
        }, scene);
        rightRay.position = rightController.position.add(new BABYLON.Vector3(0, 0, 4));
        
        const rightRayMat = new BABYLON.StandardMaterial("rightRayMat", scene);
        rightRayMat.emissiveColor = new BABYLON.Color3(0.3, 0, 0); // Dimmed red
        rightRayMat.disableLighting = true;
        rightRayMat.alpha = 0.0; // Completely transparent
        rightRay.material = rightRayMat;
        
        // Parent rays to controllers for synchronized movement
        leftRay.parent = leftController;
        leftRay.position = new BABYLON.Vector3(0, 0, 4);
        
        rightRay.parent = rightController;
        rightRay.position = new BABYLON.Vector3(0, 0, 4);
        
        // Store references
        window.simulatedControllers = {
            left: leftController,
            right: rightController,
            leftRay: leftRay,
            rightRay: rightRay
        };
        
        // Simple floating animation - only move controllers, rays follow automatically
        let animTime = 0;
        const leftBasePos = leftController.position.clone();
        const rightBasePos = rightController.position.clone();
        
        scene.onBeforeRenderObservable.add(() => {
            if (window.simulatedControllers) {
                animTime += 0.02;
                
                // Gentle floating motion
                leftController.position.y = leftBasePos.y + Math.sin(animTime) * 0.15;
                rightController.position.y = rightBasePos.y + Math.sin(animTime + Math.PI) * 0.15;
                
                // Gentle rotation for visibility
                leftController.rotation.y = Math.sin(animTime * 0.5) * 0.3;
                rightController.rotation.y = Math.sin(animTime * 0.5 + Math.PI) * 0.3;
                
                // Keep transparent - no pulsing effect
                leftRayMat.alpha = 0.0;
                rightRayMat.alpha = 0.0;
            }
        });
        
        console.log("Simulated controllers created successfully with stable rays");
    } catch (error) {
        console.error("Error creating simulated controllers:", error);
    }
}

// Create simulated controllers for desktop viewing
createSimulatedControllers();


scene.onPointerObservable.add((pointerInfo) => {
  switch (pointerInfo.type) {
    case BABYLON.PointerEventTypes.POINTERPICK:
      if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedSprite) {
        // Select the picked sprite (particle)
        const pickedName = pointerInfo.pickInfo.pickedSprite.name;
        searchInput.value = pickedName;
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

// Variables pour le mode démo VR
let demoModeActive = false;
let demoInterval = null;
let currentDemoGroupIndex = 0;
let demoGroups = [];
const demoPauseDuration = 3000; // 3 secondes de pause à chaque groupe

//var font = "Calibri 20px monospace";

const scatter = new BABYLON.PointsCloudSystem("scatter", 0, scene);

const labelSprites = [];
const originalPositions = [];

// Create scatter mesh and label sprites
//const imageUrl = 'bubble12.png';
//const imageSize = 5000;

const imageUrl = 'etoile2.png';
const imageSize = 640;
const spriteRatio = 1;

// Function to ensure minimum distance between sprites
async function adjustPositionsForMinimumDistance(data, minDistance = 8) {
    // Skip adjustment for large datasets to prevent freezes
    if (data.length > 1000) {
        console.log("Skipping position adjustment for large dataset to prevent freeze");
        return data;
    }
    
    const adjustedData = [...data];
    const maxIterations = Math.min(20, Math.floor(data.length / 10)); // Adaptive max iterations
    let iteration = 0;
    let progressThreshold = 0.05; // Increased threshold for faster exit
    let lastCollisionCount = Infinity;
    
    while (iteration < maxIterations) {
        let hasCollisions = false;
        let collisionCount = 0;
        
        // Process in smaller batches with yield to prevent UI freezing
        const batchSize = Math.min(25, adjustedData.length); // Smaller batch size
        
        for (let batch = 0; batch < adjustedData.length; batch += batchSize) {
            const endBatch = Math.min(batch + batchSize, adjustedData.length);
            
            // Yield control to prevent UI freeze
            if (batch > 0 && batch % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
            
            for (let i = batch; i < endBatch; i++) {
                // Limit inner loop for performance
                const maxJ = Math.min(i + 50, adjustedData.length);
                for (let j = i + 1; j < maxJ; j++) {
                    const sprite1 = adjustedData[i];
                    const sprite2 = adjustedData[j];
                    
                    const dx = sprite1.x - sprite2.x;
                    const dy = sprite1.y - sprite2.y;
                    const dz = sprite1.z - sprite2.z;
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    
                    if (distance < minDistance && distance > 0.001) {
                        hasCollisions = true;
                        collisionCount++;
                        
                        // Simplified movement calculation
                        const length = distance || 0.001;
                        const overlap = minDistance - distance;
                        const moveDistance = Math.min(overlap * 0.2, 1); // Reduced movement
                        
                        const factor = moveDistance / length;
                        sprite1.x += dx * factor;
                        sprite1.y += dy * factor;
                        sprite1.z += dz * factor;
                        
                        sprite2.x -= dx * factor;
                        sprite2.y -= dy * factor;
                        sprite2.z -= dz * factor;
                    }
                }
            }
        }
        
        // Early exit conditions
        const progress = (lastCollisionCount - collisionCount) / Math.max(lastCollisionCount, 1);
        if (!hasCollisions || (iteration > 5 && progress < progressThreshold)) {
            break;
        }
        
        lastCollisionCount = collisionCount;
        iteration++;
    }
    
    console.log(`Position adjustment completed after ${iteration} iterations (${lastCollisionCount} remaining collisions)`);
    return adjustedData;
}


async function main(currentData, ratio) {
    // Prepare data with scaled positions and color
    let data = currentData.map(d => ({
        ...d,
        x: d.x * ratio,
        y: d.y * ratio,
        z: d.z * ratio,
        color: getColor(d.subType),
        metadata: { subType: d.subType },
        // Utiliser l'image personnalisée si disponible, sinon utiliser l'image par défaut
        imageFile: currentImageConfiguration[d.level] || d.imageFile || getImageForLevel(d.level)
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

    // Create sprite managers for each level with custom image support
    const spriteManagers = {};
    
    Object.keys(dataByLevel).forEach(level => {
        const levelData = dataByLevel[level];
        const imageFile = levelData.imageFile;
        
        // Vérifier si c'est une image personnalisée (data URL)
        if (imageFile && imageFile.startsWith('data:')) {
            console.log(`🎨 Creating sprite manager for level ${level} with custom image (data URL)`);
            
            try {
                // Créer directement le sprite manager avec le data URL
                // Babylon.js peut gérer les data URLs directement
                const spriteManager = new BABYLON.SpriteManager(
                    `labelSpriteManager_level_${level}`,
                    imageFile, // Utiliser directement le data URL
                    levelData.elements.length,
                    imageSize,
                    scene
                );
                spriteManager.isPickable = true;
                spriteManagers[level] = spriteManager;
                console.log(`✅ Custom sprite manager created for level ${level} with data URL`);
                
            } catch (error) {
                console.error(`❌ Error creating sprite manager with data URL for level ${level}:`, error);
                
                // Fallback 1: Essayer avec une texture créée
                try {
                    const texture = createTextureFromDataUrl(imageFile, `custom_texture_level_${level}`, scene);
                    if (texture) {
                        const spriteManager = new BABYLON.SpriteManager(
                            `labelSpriteManager_level_${level}`,
                            texture,
                            levelData.elements.length,
                            imageSize,
                            scene
                        );
                        spriteManager.isPickable = true;
                        spriteManagers[level] = spriteManager;
                        console.log(`✅ Custom sprite manager created for level ${level} with texture fallback`);
                    } else {
                        throw new Error('Texture creation failed');
                    }
                } catch (textureError) {
                    console.error(`❌ Texture fallback failed for level ${level}:`, textureError);
                    
                    // Fallback 2: Utiliser l'image par défaut
                    const fallbackImage = defaultImageConfiguration[level] || 'etoile2.png';
                    const spriteManager = new BABYLON.SpriteManager(
                        `labelSpriteManager_level_${level}`,
                        fallbackImage,
                        levelData.elements.length,
                        imageSize,
                        scene
                    );
                    spriteManager.isPickable = true;
                    spriteManagers[level] = spriteManager;
                    console.log(`🔄 Final fallback sprite manager created for level ${level} with: ${fallbackImage}`);
                }
            }
        } else {
            // Image prédéfinie standard
            console.log(`📁 Creating sprite manager for level ${level} with standard image: ${imageFile}`);
            const spriteManager = new BABYLON.SpriteManager(
                `labelSpriteManager_level_${level}`,
                imageFile,
                levelData.elements.length,
                imageSize,
                scene
            );
            spriteManager.isPickable = true;
            spriteManagers[level] = spriteManager;
        }
    });
    
    // Sprite manager - SYSTÈME SIMPLE TEMPORAIRE POUR CORRIGER LES BUGS
    //const labelSpriteManager = new BABYLON.SpriteManager('labelSpriteManager', imageUrl, data.length, imageSize, scene);
    //labelSpriteManager.isPickable = true;
    
    // Stocker toutes les références pour compatibilité
    window.spriteManagersByLevel = spriteManagers;
    window.labelSpriteManager = Object.values(spriteManagers)[0];

    // Helper to create a sprite and attach actions - SYSTÈME REPVAL COMPLET
    function createLabelSprite(point, idx, spriteManager) {
        const position = new BABYLON.Vector3(point.x, point.y, point.z);
        originalPositions.push(position.clone());

        // Assigner un niveau RepVal basé sur les données ou aléatoirement
        let level = 7; // Niveau par défaut
        
        // Essayer d'extraire le niveau depuis les données existantes si disponible
        if (point.level && typeof point.level === 'number') {
            level = Math.max(1, Math.min(13, Math.round(point.level)));
        } else {
            // Sinon, assignation pondérée intelligente basée sur subType
            const subType = point.subType || 'default';
            if (subType.toLowerCase().includes('black') || subType.toLowerCase().includes('hole')) {
                level = 1; // Trous noirs
            } else if (subType.toLowerCase().includes('nebula') || subType.toLowerCase().includes('galaxy')) {
                level = 2; // Nébuleuses/Galaxies
            } else if (subType.toLowerCase().includes('star') || subType.toLowerCase().includes('sun')) {
                level = 3; // Étoiles
            } else if (subType.toLowerCase().includes('planet')) {
                level = 4; // Planètes
            } else if (subType.toLowerCase().includes('moon') || subType.toLowerCase().includes('satellite')) {
                level = 5; // Lunes
            } else {
                // Distribution aléatoire pour les autres types
                const rand = Math.random();
                if (rand < 0.15) level = 6;      // Comètes
                else if (rand < 0.35) level = 7; // Astéroïdes
                else if (rand < 0.55) level = 8; // Satellites
                else if (rand < 0.70) level = 9; // Débris
                else if (rand < 0.80) level = 10; // Particules
                else if (rand < 0.88) level = 11; // Poussière
                else if (rand < 0.95) level = 12; // Gaz
                else level = 13;                  // Énergie
            }
        }
        
        // Stocker le niveau pour ce sprite
        spriteLevel[point.prefLabel] = level;
        
        // Calculer la taille selon le niveau
        const spriteSize = getSizeForLevel(level);
        
        // Couleur enrichie basée sur le niveau + type existant
        const baseColor = point.color;
        const levelColor = getLevelColor(level, baseColor);

        // SYSTÈME SIMPLE - Utiliser le sprite manager passé en paramètre
        const sprite = new BABYLON.Sprite(point.prefLabel, spriteManager);
        
        Object.assign(sprite, {
            isPickable: true,
            position,
            originalPosition: position.clone(), // Use the current position as original
            size: spriteSize, // Taille selon le niveau
            color: new BABYLON.Color4(levelColor.r, levelColor.g, levelColor.b, 1),
            metadata: {
                subType: point.subType,
                level: level // Stocker le niveau dans les métadonnées
            },
            isVisible: true
        });

        sprite.actionManager = new BABYLON.ActionManager(scene);

        // Mouse over: update nearest list and search input
        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            evt => {
                const spriteName = evt.source.name;
                const sprites = getAllSprites();
                const targetSprite = sprites.find(s => s.name === spriteName);
                const distances = sprites.filter(s => s.isVisible && s.originalPosition && targetSprite && targetSprite.originalPosition).map(s => ({
                    name: s.name,
                    distance: BABYLON.Vector3.Distance(targetSprite.originalPosition, s.originalPosition)
                })).sort((a, b) => a.distance - b.distance);
                updateNearestList(distances, spriteName, targetSprite && targetSprite.metadata ? targetSprite.metadata.subType : 'unknown');
                searchInput.value = spriteName;
            }
        ));

        // Click: move camera to sprite
        sprite.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickUpTrigger,
            evt => {
                searchInput.value = evt.source.name;
                moveCameraToSprite(evt.source.name);
            }
        ));

        labelSprites.push(sprite);
    }

    scatter.addPoints(data.length, (particle) => {
        const point = data[particle.idx];
        const level = point.level || 5; // Default to level 5 if no level specified
        const spriteManager = spriteManagers[level];
        
        createLabelSprite(point, particle.idx, spriteManager);
        particle.position = originalPositions[particle.idx];
    });

    // Pas besoin de mise à jour ici
    // updateLegacySpriteReferences();

scene.onBeforeRenderObservable.add(() => {
	
	updateSpritePositions();
	
	frameCounter++;
    if (frameCounter > frameThreshold) {
        frameCounter = 0;  // Réinitialise le compteur
		
    var names = [];

    // CETTE ligne-ci est critique :
    const camera = scene.activeCamera; 
	
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
            names.push({
                "name": s.name + '_layer',
                "meshName": s.name + '_whoz_mesh',
                "matName": s.name + '_whoz_mat',
                "textureName": s.name,
				"color": s.color,
                "position": s.position
            });
        }
    });

    // Dispose of unused meshes
    scene.meshes
        .filter(mesh => mesh.name.endsWith('_whoz_mesh') && !names.some(n => n.meshName === mesh.name))
        .forEach(mesh => {
            if (mesh.material) {
                if (mesh.material.emissiveTexture) {
                    mesh.material.emissiveTexture.dispose(); // Dispose the emissive texture
                }
                mesh.material.dispose(); // Dispose the material
            }
            scene.removeMesh(mesh);
            mesh.dispose(); // Dispose the mesh
        });

    // Dispose of unused materials
    scene.materials
        .filter(material => material.name.endsWith('_whoz_mat') && !names.some(n => n.matName === material.name))
        .forEach(material => {
            if (material.emissiveTexture) {
                material.emissiveTexture.dispose(); // Dispose the emissive texture
            }
            scene.removeMaterial(material);
            material.dispose(); // Dispose the material
        });

    names.forEach(n => {
        if (!scene.meshes.some(l => l.name === n.meshName)) {
            const font_size = 12
            const planeTexture = new BABYLON.DynamicTexture("dynamic texture", font_size*100, scene, true, BABYLON.DynamicTexture.TRILINEAR_SAMPLINGMODE);
			
			var textureContext = planeTexture.getContext();
			
			//Draw on canvas
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
            var material = new BABYLON.StandardMaterial(n.textureName + '_whoz_mat', scene);
            material.emissiveTexture = planeTexture;
            material.opacityTexture = planeTexture;
            material.backFaceCulling = true;
            material.disableLighting = true;
            material.freeze();

			var outputplane = BABYLON.Mesh.CreatePlane(n.textureName + '_whoz_mesh', font_size, scene, false);
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
    
    // === INITIALISATION DU SYSTÈME REPVAL ===
    console.log('🔄 Initialisation du système RepVal...');
    
    // Charger la configuration d'images
    loadImageConfiguration();
    
    // La mise à jour sera faite après la création des sprites
    // updateLegacySpriteReferences();
    
    // Assigner des niveaux aléatoires aux sprites (utilise maintenant getAllSprites())
    assignRandomLevels();
    
    // Catégoriser les sprites (temporairement désactivé pour stabilité)
    // categorizeSprites();
    
    // Appliquer la configuration d'images sauvegardée après le chargement
    setTimeout(() => {
        const savedConfig = localStorage.getItem('spriteImageConfig');
        if (savedConfig) {
            console.log('🎨 Application de la configuration d\'images sauvegardée...');
            reloadWithNewImageConfiguration();
        }
    }, 1000); // Délai pour s'assurer que tout est initialisé
    
    console.log('✅ Système RepVal initialisé avec succès');
    console.log(`📊 Statistiques: ${centralSprites.length} sprites centraux, ${orbitingSprites.length} sprites orbitants`);
    
    // Créer l'indicateur VR 3D après le chargement des données
    if (!scene.vrTargetIndicator) {
      scene.vrTargetIndicator = createVRTargetIndicator(scene);
    }
    
    // Créer le panneau de scale VR 3D
    if (!scene.vrScalePanel3D) {
      scene.vrScalePanel3D = createVRScalePanel3D(scene);
    }
    
    // Créer le panneau de recherche VR 3D avec VRAI GUI 3D
    if (!scene.vrSearchPanel3D) {
      scene.vrSearchPanel3D = createVRSearchPanel3D(scene, data);
      if (scene.vrSearchPanel3D) {
        console.log("✅ VR Search Panel 3D with REAL GUI 3D created successfully");
      } else {
        console.error("❌ VR Search Panel 3D creation failed");
      }
    }
    
    // Créer le panneau de légende VR 3D avec délai pour s'assurer que tout est prêt
    setTimeout(() => {
      try {
        if (!scene.vrLegendPanel3D) {
          console.log("🕒 Creating VR Legend Panel 3D after delay...");
          scene.vrLegendPanel3D = createVRLegendPanel3D(scene, data);
          if (scene.vrLegendPanel3D) {
            console.log("✅ VR Legend Panel 3D created successfully with delay");
          } else {
            console.error("❌ VR Legend Panel 3D creation failed");
          }
        }
      } catch (error) {
        console.error("❌ Error creating VR Legend Panel 3D with delay:", error);
      }
    }, 500); // Délai de 500ms pour s'assurer que le GUI 3D Manager est prêt
 
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

    const searchInput = document.getElementById('searchInput');
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

// Fonction pour mettre à jour le message de statut
function updateStatusMessage(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        const colors = {
            'info': '#e3f2fd',
            'success': '#e8f5e8',
            'error': '#ffebee',
            'warning': '#fff3e0'
        };
        statusElement.style.backgroundColor = colors[type] || colors.info;
        statusElement.innerHTML = message;
        console.log('Status:', message);
    }
}

// Gestionnaire pour charger un fichier depuis le PC
loadFileButton.addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    
    updateStatusMessage('🔄 Vérification du fichier sélectionné...', 'info');
    
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        console.log('🔍 USER SELECTED FILE:', file.name, 'Size:', file.size, 'Type:', file.type);
        updateStatusMessage(`📂 Chargement de "${file.name}" (${Math.round(file.size/1024)}KB)...`, 'info');
        
        try {
            const fileContent = await file.text();
            console.log('✅ File content loaded, length:', fileContent.length);
            
            // Check if it's an encrypted file
            if (file.name.toLowerCase().includes('encrypted') ||
                file.name.toLowerCase().includes('crypto') ||
                fileContent.startsWith('U2FsdGVk') ||
                fileContent.includes('Salted__')) {
                
                console.log('🔐 Detected encrypted file, asking for password');
                updateStatusMessage('🔐 Fichier crypté détecté - Saisie du mot de passe...', 'warning');
                const password = await showPasswordModal();
                const decryptedData = decryptData(fileContent, password);
                
                if (decryptedData) {
                    console.log('✅ File decrypted successfully, particles:', decryptedData.length);
                    updateStatusMessage(`✅ Fichier "${file.name}" chargé avec succès (${decryptedData.length} particules)`, 'success');
                    main(decryptedData, 20);
                    document.getElementById('fileInputContainer').style.display = 'none';
                } else {
                    updateStatusMessage('❌ Échec du décryptage - Mot de passe incorrect', 'error');
                    alert('❌ Impossible de décrypter le fichier. Vérifiez le mot de passe.');
                }
            } else {
                // Try to parse as JSON
                try {
                    const data = JSON.parse(fileContent);
                    console.log('✅ JSON parsed successfully, particles:', data.length);
                    updateStatusMessage(`✅ Fichier "${file.name}" chargé avec succès (${data.length} particules)`, 'success');
                    main(data, 20);
                    document.getElementById('fileInputContainer').style.display = 'none';
                } catch (parseError) {
                    console.error('❌ JSON parse error:', parseError);
                    updateStatusMessage('❌ Erreur: Fichier JSON invalide', 'error');
                    alert('❌ Le fichier sélectionné n\'est pas un fichier JSON valide.\n\nErreur: ' + parseError.message);
                }
            }
        } catch (error) {
            console.error('❌ File reading error:', error);
            updateStatusMessage('❌ Erreur lors de la lecture du fichier', 'error');
            alert('❌ Erreur lors de la lecture du fichier: ' + error.message);
        }
    } else {
        updateStatusMessage('⚠️ Aucun fichier sélectionné', 'warning');
        alert('⚠️ Veuillez sélectionner un fichier avant de cliquer sur "Charger fichier"');
    }
});

// Gestionnaire pour charger un fichier prédéfini
const loadPresetButton = document.getElementById('loadPresetButton');
if (loadPresetButton) {
    loadPresetButton.addEventListener('click', async () => {
        const fileSelect = document.getElementById('fileSelect');
        const selectedFile = fileSelect.value;
        
        if (selectedFile) {
            console.log('Loading predefined file:', selectedFile);
            
            try {
                if (selectedFile === 'encrypted_PSO_0.json') {
                    const password = await showPasswordModal();
                    const response = await fetch('./' + selectedFile);
                    const encryptedData = await response.text();
                    const decryptedData = decryptData(encryptedData, password);
                    
                    if (decryptedData) {
                        main(decryptedData, 20);
                        document.getElementById('fileInputContainer').style.display = 'none';
                    } else {
                        alert('❌ Mot de passe incorrect ou fichier corrompu.');
                    }
                } else {
                    const response = await fetch('./' + selectedFile);
                    const data = await response.json();
                    main(data, 20);
                    document.getElementById('fileInputContainer').style.display = 'none';
                }
            } catch (error) {
                alert('❌ Erreur lors du chargement du fichier prédéfini: ' + error.message);
                console.error(error);
            }
        } else {
            alert('⚠️ Veuillez sélectionner un fichier prédéfini dans la liste déroulante');
        }
    });
}

// Debug: Traquer tous les appels à la fonction main()
const originalMain = main;
window.main = function(data, ratio) {
    console.log('🚨 MAIN() CALLED with', data?.length || 'unknown', 'particles, ratio:', ratio);
    console.trace('Call stack trace:');
    updateStatusMessage(`🔄 Chargement en cours (${data?.length || 'unknown'} particules)...`, 'info');
    return originalMain(data, ratio);
};

// Debug: Vérifier si d'autres scripts sont chargés
console.log('🔍 Scripts loaded:', document.scripts.length);
for(let i = 0; i < document.scripts.length; i++) {
    console.log(`  Script ${i}:`, document.scripts[i].src || 'inline');
}

// Debug: Vérifier les event listeners sur loadFileButton
console.log('🔍 Checking loadFileButton listeners...');
const button = document.getElementById('loadFileButton');
if (button) {
    console.log('✅ loadFileButton found');
} else {
    console.log('❌ loadFileButton NOT found');
}

console.log('✅ IndexVR.js loaded - NO automatic file loading. Waiting for user selection.');
updateStatusMessage('🔄 Application prête - Aucun fichier chargé automatiquement. Sélectionnez votre fichier.', 'info');

const generatedColors = {};
function getColor(type) {
    // No hardcoded colors, all subTypes get random colors

    if (generatedColors[type]) {
        return generatedColors[type];
    }
    // Generate and store a random color for this subType
    const randColor = {
        r: Math.random(),
        g: Math.random(),
        b: Math.random()
    };
    generatedColors[type] = randColor;
    return randColor;
}

// Update sprite positions to add small movements - RETOUR À L'ORIGINAL POUR STABILITÉ
function updateSpritePositions() {
    time += 0.004;
	const camera = scene.activeCamera;
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
				// RETOUR À LA LOGIQUE ORIGINALE STABLE
				const originalPosition = originalPositions[idx];
				const currentScale = scene.currentScaleValue || 1.0;
				const scaleFactor = 1.0 / currentScale; // Même logique que updateScale
				
				// Base scalée + petite animation (comme l'original)
				sprite.position.x = (originalPosition.x * scaleFactor) + 0.8 * Math.sin(time + idx);
				sprite.position.y = (originalPosition.y * scaleFactor) + 0.8 * Math.cos(time + idx);
				sprite.position.z = (originalPosition.z * scaleFactor) + 0.8 * Math.sin(time + idx);
				sprite.angle = 0.01*idx;
				
				// Appliquer la taille selon le niveau RepVal (optionnel et sécurisé)
				try {
					const spriteName = sprite.name;
					const level = spriteLevel[spriteName];
					if (level && typeof getSizeForLevel === 'function') {
						const newSize = getSizeForLevel(level);
						if (sprite.size !== newSize) {
							sprite.size = newSize;
						}
					}
				} catch (error) {
					// Ignorer les erreurs - garder les tailles par défaut
				}
			}
		}
    });
}

// Start rendering the scene on each animation frame
function renderLoop() {
    scene.render();
}

function blinkSprite(sprite) {
    let isDefaultColor = true; // État du sprite, vrai si la couleur par défaut est affichée
    const defaultColor = sprite.color
    const highlightColor = new BABYLON.Color4(1, 1, 1, 1);
	const mediumMediumlightColor = new BABYLON.Color4((sprite.color.r+1)/2, (sprite.color.g+1)/2, (sprite.color.b+1)/2, (sprite.color.a+1)/2);
	const mediumLowlightColor = new BABYLON.Color4((3*sprite.color.r+1)/4, (3*sprite.color.g+1)/4, (3*sprite.color.b+1)/4, (3*sprite.color.a+1)/4);
	const mediumHighlightColor = new BABYLON.Color4((sprite.color.r+3)/4, (sprite.color.g+3)/4, (sprite.color.b+3)/4, (sprite.color.a+3)/4);

    // Configure l'intervalle de clignotement
    setInterval(() => {
		blinkCount+=1
		
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

function moveCameraToSprite(spriteName) {
	console.log('🎯 MOVE TO SPRITE:', spriteName);

    const camera = scene.activeCamera;

    if (!scene.spriteManagers || !scene.spriteManagers[0] || !scene.spriteManagers[0].sprites) {
        console.error('❌ No sprite managers or sprites available');
        return;
    }

    const sprites = getAllSprites(); // Get all sprites from all managers
    let targetSprite = sprites.find(s => s.name === spriteName);

    if (targetSprite) {
        console.log(`✅ Target sprite found: ${spriteName}, position:`, targetSprite.position);
        
        const targetPosition = new BABYLON.Vector3(targetSprite.position.x, targetSprite.position.y, targetSprite.position.z);
        const cameraStartPosition = camera.position.clone();
        const cameraStartTarget = camera.getTarget().clone();

        const bufferDistance = 9; // Adjust the distance from sprite
        const directionVector = targetPosition.subtract(camera.position).normalize();
        const adjustedTargetPosition = targetPosition.subtract(directionVector.scale(bufferDistance));

        console.log(`🎬 Starting camera animation from ${cameraStartPosition.toString()} to ${adjustedTargetPosition.toString()}`);

	const moveDistance = BABYLON.Vector3.Distance(cameraStartPosition, adjustedTargetPosition);
	const numberOfFrames = Math.min(300,Math.max(60,Math.round(moveDistance * 4)));
	
	console.log(`📽️ Animation details: distance=${moveDistance.toFixed(2)}, frames=${numberOfFrames}`);
	
	// Create animation for camera position (ralenti pour VR)
	      const animCamPosition = new BABYLON.Animation("animCamPosition", "position", 15, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
	      animCamPosition.setKeys([{frame: 0, value: cameraStartPosition},{frame: numberOfFrames, value: adjustedTargetPosition}]);

	      // Create animation for camera target (ralenti pour VR)
	      const animCamTarget = new BABYLON.Animation("animCamTarget", "target", 15, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
	      animCamTarget.setKeys([{frame: 0, value: cameraStartTarget},{  frame: numberOfFrames, value: targetPosition}]);

	      // Démarrer l'animation et attendre qu'elle se termine avant la pause
	      console.log(`🚀 Starting camera animation to ${spriteName}`);
	      const animationGroup = scene.beginDirectAnimation(camera, [animCamPosition, animCamTarget], 0, numberOfFrames, false);

	      blinkSprite(targetSprite);
	      
	      // Retourner la promesse d'animation pour pouvoir attendre sa fin
	      return new Promise((resolve) => {
	          animationGroup.onAnimationEndObservable.addOnce(() => {
	              console.log(`✅ Camera animation completed for ${spriteName}`);
	              resolve();
	          });
	      });

        // Find the nearest particles
        let distances = sprites.filter(s => s.isVisible && s.originalPosition && targetSprite && targetSprite.originalPosition).map(sprite => {
            return {
                name: sprite.name,
                distance: BABYLON.Vector3.Distance(targetSprite.originalPosition, sprite.originalPosition)
            };
        });
        distances.sort((a, b) => a.distance - b.distance);
	
	updateNearestList(distances, spriteName, targetSprite && targetSprite.metadata ? targetSprite.metadata.subType : 'unknown')
	
    } else {
        console.error("❌ Sprite not found:", spriteName);
        console.log("Available sprites:", sprites.length, "sprites total");
        console.log("First few sprite names:", sprites.slice(0, 5).map(s => s.name));
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

    // Fill XR legend panel if it exists
    if (scene.xrLegendPanel) {
        scene.xrLegendPanel.clearControls();
        uniqueTypes.sort().forEach(type => {
            const color = getColor(type);
            const legendItem = new BABYLON.GUI.StackPanel();
            legendItem.isVertical = false;
            legendItem.height = "30px";
            legendItem.paddingBottom = "5px";

            const colorBox = new BABYLON.GUI.Rectangle();
            colorBox.width = "30px";
            colorBox.height = "30px";
            colorBox.color = "white";
            colorBox.thickness = 1;
            // Set initial opacity based on state
            if (!window.xrLegendActiveTypes) window.xrLegendActiveTypes = {};
            const isActive = window.xrLegendActiveTypes[type] !== false;
            colorBox.background = `rgba(${Math.round(color.r*255)},${Math.round(color.g*255)},${Math.round(color.b*255)},${isActive ? 1 : 0.3})`;

            const label = new BABYLON.GUI.TextBlock();
            label.text = type;
            label.color = "white";
            label.height = "30px";
            label.width = "320px";
            label.paddingLeft = "20px";
            label.fontSize = 22;
            label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            label.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            label.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

            legendItem.addControl(colorBox);
            legendItem.addControl(label);
            scene.xrLegendPanel.addControl(legendItem);

            // XR: Click to filter by subType using existing function
            legendItem.onPointerClickObservable.add(() => {
                filterByType(type);
                // Toggle state and update colorBox opacity
                window.xrLegendActiveTypes[type] = !window.xrLegendActiveTypes[type];
                const active = window.xrLegendActiveTypes[type] !== false;
                colorBox.background = `rgba(${Math.round(color.r*255)},${Math.round(color.g*255)},${Math.round(color.b*255)},${active ? 0.3 : 1})`;
            });
        });
    }

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

// Fonctions pour le mode démo VR
function toggleDemoModeVR() {
    if (demoModeActive) {
        stopDemoModeVR();
    } else {
        startDemoModeVR();
    }
}

function startDemoModeVR() {
    const allSprites = getAllSprites();
    if (!allSprites || allSprites.length === 0) {
        console.log('Aucune étoile disponible pour le mode démo VR');
        return;
    }

    demoModeActive = true;
    console.log('Mode démo VR démarré - Contrôle: Bouton Y pour arrêter');

    createDemoGroupsVR();
    currentDemoGroupIndex = 0;
    nextDemoGroupVR();
}

function stopDemoModeVR() {
    demoModeActive = false;
    console.log('Mode démo VR arrêté');

    if (demoInterval) {
        clearTimeout(demoInterval);
        demoInterval = null;
    }
    
    currentDemoGroupIndex = 0;
}

function createDemoGroupsVR() {
    // Créer des groupes d'étoiles basés sur les types (subType)
    const sprites = getAllSprites().filter(s => s.isVisible);
    const groupsByType = {};
    
    sprites.forEach(sprite => {
        const subType = sprite.metadata ? sprite.metadata.subType : 'DEFAULT';
        if (!groupsByType[subType]) {
            groupsByType[subType] = [];
        }
        groupsByType[subType].push(sprite);
    });

    // Convertir en tableau de groupes et prendre quelques étoiles représentatives de chaque type
    demoGroups = [];
    Object.keys(groupsByType).forEach(subType => {
        const spritesOfType = groupsByType[subType];
        // Prendre jusqu'à 3 étoiles par type pour éviter trop de longueur
        const selectedSprites = spritesOfType.slice(0, Math.min(3, spritesOfType.length));
        
        selectedSprites.forEach(sprite => {
            demoGroups.push({
                sprite: sprite,
                groupName: subType
            });
        });
    });

    console.log(`Mode démo VR créé avec ${demoGroups.length} étoiles dans ${Object.keys(groupsByType).length} groupes`);
}

async function nextDemoGroupVR() {
    if (!demoModeActive || currentDemoGroupIndex >= demoGroups.length) {
        stopDemoModeVR();
        return;
    }

    const currentGroup = demoGroups[currentDemoGroupIndex];
    const spriteName = currentGroup.sprite.name;
    const groupName = currentGroup.groupName;
    
    console.log(`Mode démo VR: Navigation vers ${spriteName} (groupe: ${groupName}) - ${currentDemoGroupIndex + 1}/${demoGroups.length}`);
    
    // Déplacer la caméra vers l'étoile et attendre que l'animation soit terminée
    await moveCameraToSprite(spriteName);
    
    currentDemoGroupIndex++;
    
    // Attendre la pause de 3 secondes APRÈS que l'animation soit terminée
    demoInterval = setTimeout(() => {
        if (demoModeActive) {
            nextDemoGroupVR();
        }
    }, demoPauseDuration);
}

// Fonction pour gérer l'interaction trigger en VR (équivalent du clic souris)
function handleVRTriggerInteraction(controller, handness) {
    console.log(`VR Trigger pressed on ${handness} controller`);
    
    try {
        // Méthode 1: Utiliser le système de pointer selection de Babylon.js
        if (controller.pointer && controller.pointer.isVisible) {
            // Obtenir la direction du pointer ray
            const rayOrigin = controller.pointer.absolutePosition || controller.pointer.position;
            const rayDirection = controller.pointer.getDirection(BABYLON.Vector3.Forward());
            
            console.log(`VR Debug: Ray origin: ${rayOrigin.toString()}, direction: ${rayDirection.toString()}`);
            
            // Créer un ray précis depuis le pointer
            const ray = new BABYLON.Ray(rayOrigin, rayDirection, 1000);
            
            // Variables pour trouver la particule la plus proche
            let closestSprite = null;
            let closestDistance = Infinity;
            
            // Vérifier toutes les particules visibles
            const allSprites = getAllSprites();
            if (allSprites && allSprites.length > 0) {
                allSprites.forEach(sprite => {
                    if (sprite.isVisible) {
                        // Utiliser la méthode intersectsMesh pour la détection précise
                        const spritePosition = sprite.position;
                        
                        // Calculer la distance minimale entre le ray et la position de l'étoile
                        const rayToSprite = spritePosition.subtract(rayOrigin);
                        const projectionLength = BABYLON.Vector3.Dot(rayToSprite, rayDirection);
                        
                        if (projectionLength > 0) { // L'étoile est devant le ray
                            const closestPointOnRay = rayOrigin.add(rayDirection.scale(projectionLength));
                            const distanceToRay = BABYLON.Vector3.Distance(spritePosition, closestPointOnRay);
                            
                            // Seuil de sélection plus serré pour plus de précision
                            const selectionRadius = 1.5;
                            
                            if (distanceToRay < selectionRadius && projectionLength < closestDistance) {
                                closestSprite = sprite;
                                closestDistance = projectionLength;
                                console.log(`VR Debug: Candidat trouvé: ${sprite.name}, distance: ${distanceToRay.toFixed(2)}, projection: ${projectionLength.toFixed(2)}`);
                            }
                        }
                    }
                });
            }
            
            // Si une particule a été trouvée, naviguer vers elle
            if (closestSprite) {
                console.log(`VR: ✅ Particule précise trouvée: ${closestSprite.name}`);
                moveCameraToSprite(closestSprite.name);
                return;
            }
        }
        
        // Méthode 2: Fallback - utiliser la position du contrôleur directement
        let controllerPosition, controllerForward;
        
        // Essayer d'obtenir la position du contrôleur par différentes méthodes
        if (controller.grip && controller.grip.position) {
            controllerPosition = controller.grip.position;
            controllerForward = controller.grip.getDirection ?
                controller.grip.getDirection(BABYLON.Vector3.Forward()) :
                new BABYLON.Vector3(0, 0, 1);
        } else if (controller.motionController && controller.motionController.rootMesh) {
            controllerPosition = controller.motionController.rootMesh.position;
            controllerForward = controller.motionController.rootMesh.getDirection ?
                controller.motionController.rootMesh.getDirection(BABYLON.Vector3.Forward()) :
                new BABYLON.Vector3(0, 0, 1);
        } else {
            console.log("VR: Impossible d'obtenir la position du contrôleur");
            return;
        }
        
        console.log(`VR Debug Fallback: Position: ${controllerPosition.toString()}, Direction: ${controllerForward.toString()}`);
        
        // Variables pour la sélection
        let closestSprite = null;
        let closestScreenDistance = Infinity;
        
        // Méthode alternative: trouver l'étoile la plus proche visuellement
        const allSprites = getAllSprites();
        if (allSprites && allSprites.length > 0) {
            const camera = scene.activeCamera;
            allSprites.forEach(sprite => {
                if (sprite.isVisible) {
                    // Calculer la distance 3D au contrôleur
                    const distance3D = BABYLON.Vector3.Distance(controllerPosition, sprite.position);
                    
                    // Vérifier si l'étoile est dans une zone raisonnable
                    if (distance3D < 50) { // Dans un rayon de 50 unités
                        // Calculer l'angle entre la direction du contrôleur et l'étoile
                        const toSprite = sprite.position.subtract(controllerPosition).normalize();
                        const angle = Math.acos(BABYLON.Vector3.Dot(controllerForward, toSprite));
                        
                        // Seuil d'angle (plus petit = plus précis)
                        const maxAngle = Math.PI / 12; // 15 degrés
                        
                        if (angle < maxAngle && distance3D < closestScreenDistance) {
                            closestSprite = sprite;
                            closestScreenDistance = distance3D;
                            console.log(`VR Debug Fallback: Candidat ${sprite.name}, angle: ${(angle * 180 / Math.PI).toFixed(1)}°, distance: ${distance3D.toFixed(2)}`);
                        }
                    }
                }
            });
        }
        
        // Naviguer vers la particule trouvée
        if (closestSprite) {
            console.log(`VR: ✅ Particule trouvée (fallback): ${closestSprite.name}`);
            moveCameraToSprite(closestSprite.name);
        } else {
            console.log(`VR: ❌ Aucune particule trouvée dans la direction du ${handness} contrôleur`);
        }
        
    } catch (error) {
        console.error("Erreur dans handleVRTriggerInteraction:", error);
    }
}

// Cette fonction a été supprimée car dupliquée - voir la version corrigée plus bas

// Fonction optimisée pour détecter la particule visée en continu (indicateur visuel)
let detectionFrameCount = 0;
const DETECTION_SKIP_FRAMES = 3; // Ne faire la détection qu'une fois toutes les 3 frames

function detectTargetedSprite() {
    try {
        // Optimisation: Réduire la fréquence de détection pour de meilleures performances
        detectionFrameCount++;
        if (detectionFrameCount < DETECTION_SKIP_FRAMES) {
            return;
        }
        detectionFrameCount = 0;
        
        // Reset previous target
        if (currentTargetedSprite) {
            if (currentTargetedSprite.originalColor) {
                currentTargetedSprite.color = currentTargetedSprite.originalColor;
            }
            currentTargetedSprite = null;
        }
        
        let targetedSprite = null;
        
        // Méthode optimisée pour VR avec cache
        if (window.xrHelper && window.xrHelper.input && window.xrHelper.input.controllers.length > 0) {
            for (const controller of window.xrHelper.input.controllers) {
                if (controller.pointer) {
                    const rayOrigin = controller.pointer.absolutePosition || controller.pointer.position;
                    const rayDirection = controller.pointer.getDirection ?
                        controller.pointer.getDirection(BABYLON.Vector3.Forward()) :
                        new BABYLON.Vector3(0, 0, 1);
                    
                    // Utiliser le cache optimisé pour la détection continue ULTRA-PRÉCISE
                    const cachedParticles = updateVRParticleCache();
                    
                    let closestSprite = null;
                    let bestPrecision = 0;
                    let testedCount = 0;
                    
                    // DÉTECTION CONTINUE ULTRA-PRÉCISE (version allégée du trigger)
                    for (const cachedParticle of cachedParticles) {
                        const spritePosition = cachedParticle.position;
                        const rayToSprite = spritePosition.subtract(rayOrigin);
                        const projectionLength = BABYLON.Vector3.Dot(rayToSprite, rayDirection);
                        
                        if (projectionLength > 0.1) { // Distance quasi-infinie aussi pour l'indicateur
                            const closestPointOnRay = rayOrigin.add(rayDirection.scale(projectionLength));
                            const distanceToRay = BABYLON.Vector3.Distance(spritePosition, closestPointOnRay);
                            
                            // Même algorithme de précision que le trigger (mais plus tolérant pour l'indicateur)
                            const angleFromRay = Math.atan2(distanceToRay, projectionLength);
                            const precision = 1.0 / (1.0 + angleFromRay * 500); // Plus tolérant que le trigger (500 vs 1000)
                            
                            // Seuil MAXIMUM pour l'indicateur visuel (distance quasi-infinie)
                            const maxAngleIndicator = 0.175; // ~10 degrés pour particules très lointaines
                            
                            if (angleFromRay < maxAngleIndicator && precision > bestPrecision) {
                                closestSprite = cachedParticle.sprite;
                                bestPrecision = precision;
                            }
                        }
                        
                        testedCount++;
                        // Limite maximale pour particules à l'infini
                        if (testedCount > 1000) {
                            break;
                        }
                    }
                    
                    if (closestSprite) {
                        targetedSprite = closestSprite;
                        break;
                    }
                }
            }
        }
        
        // Fallback optimisé pour desktop - seulement si pas en VR
        if (!targetedSprite && (!window.xrHelper || window.xrHelper.input.controllers.length === 0) && scene.activeCamera) {
            const camera = scene.activeCamera;
            const width = engine.getRenderWidth();
            const height = engine.getRenderHeight();
            const centerX = width / 2;
            const centerY = height / 2;
            
            let closestSprite = null;
            let smallestDistance = Infinity;
            let testedCount = 0;
            
            // Utiliser aussi le cache pour desktop, mais avec recherche au centre
            const cachedParticles = updateVRParticleCache();
            
            for (const cachedParticle of cachedParticles) {
                const sprite = cachedParticle.sprite;
                const identityMatrix = BABYLON.Matrix.Identity();
                const transformMatrix = scene.getTransformMatrix();
                const viewport = camera.viewport.toGlobal(width, height);
                
                const projectedPosition = BABYLON.Vector3.Project(
                    sprite.position,
                    identityMatrix,
                    transformMatrix,
                    viewport
                );
                
                const screenDistance = Math.sqrt(
                    Math.pow(projectedPosition.x - centerX, 2) +
                    Math.pow(projectedPosition.y - centerY, 2)
                );
                
                if (projectedPosition.x >= 0 && projectedPosition.x <= width &&
                    projectedPosition.y >= 0 && projectedPosition.y <= height &&
                    projectedPosition.z > 0 && projectedPosition.z < 1 &&
                    screenDistance < 80) { // Seuil réduit pour plus de précision
                    
                    if (screenDistance < smallestDistance) {
                        closestSprite = sprite;
                        smallestDistance = screenDistance;
                    }
                }
                
                testedCount++;
                if (testedCount > 30) { // Limite pour desktop aussi
                    break;
                }
            }
            
            targetedSprite = closestSprite;
        }
        
        // Mettre à jour l'affichage seulement si nouvelle cible
        if (targetedSprite && targetedSprite !== currentTargetedSprite) {
            // Sauvegarder la couleur originale
            if (!targetedSprite.originalColor) {
                targetedSprite.originalColor = targetedSprite.color.clone();
            }
            
            // Indicateur visuel plus subtil
            targetedSprite.color = new BABYLON.Color4(1, 1, 0.3, 1); // Jaune plus doux
            
            currentTargetedSprite = targetedSprite;
            
            // Mettre à jour l'indicateur VR
            if (scene.vrTargetIndicator && scene.vrTargetIndicator.show) {
                scene.vrTargetIndicator.show(targetedSprite.name);
            }
        } else if (!targetedSprite) {
            // Aucune cible
            currentTargetedSprite = null;
            if (scene.vrTargetIndicator && scene.vrTargetIndicator.hide) {
                scene.vrTargetIndicator.hide();
            }
        }
        
    } catch (error) {
        // Erreur silencieuse pour éviter le spam
    }
}

// Cache pour optimiser les performances avec de gros datasets
let vrParticleCache = null;
let vrCacheLastUpdate = 0;
const VR_CACHE_DURATION = 100; // Mise à jour du cache toutes les 100ms

// Cache simple mais efficace pour les particules
function updateVRParticleCache() {
    const now = Date.now();
    if (vrParticleCache && (now - vrCacheLastUpdate) < VR_CACHE_DURATION) {
        return vrParticleCache;
    }
    
    const camera = scene.activeCamera;
    const allSprites = getAllSprites();
    if (!camera || !allSprites || allSprites.length === 0) {
        return [];
    }
    
    const cameraPosition = camera.position;
    const cameraDirection = camera.getForwardRay().direction.normalize();
    const fov = camera.fov;
    
    // Cache simple avec distance étendue
    vrParticleCache = [];
    allSprites.forEach(sprite => {
        if (sprite.isVisible) {
            const spritePosition = sprite.position;
            const distance = BABYLON.Vector3.Distance(cameraPosition, spritePosition);
            
            // Distance QUASI-INFINIE - Aucune limite supérieure !
            if (distance > 0.05) { // Pas de limite supérieure du tout !
                const spriteDirection = spritePosition.subtract(cameraPosition).normalize();
                const angle = Math.acos(Math.max(-1, Math.min(1, BABYLON.Vector3.Dot(cameraDirection, spriteDirection))));
                
                // FOV MAXIMUM pour détecter particules à l'infini
                if (angle < fov * 5.0) {
                    vrParticleCache.push({
                        sprite: sprite,
                        position: spritePosition,
                        distance: distance,
                        angle: angle
                    });
                }
            }
        }
    });
    
    // Tri par distance pour optimiser
    vrParticleCache.sort((a, b) => a.distance - b.distance);
    vrCacheLastUpdate = now;
    
    console.log(`🔄 VR Cache: ${vrParticleCache.length} particles within INFINITE range`);
    return vrParticleCache;
}

// Version améliorée avec contrôleurs indépendants et précision accrue
function handleVRTriggerInteractionNew(controller, handness, isPressed = true) {
    const action = isPressed ? "pressed" : "released";
    console.log(`🎯 VR Trigger PRECISE ${action} on ${handness} controller`);
    
    try {
        // Gérer l'état du trigger maintenu par contrôleur spécifique
        const controllerKey = `${handness}_${controller.id || Math.random()}`;
        if (isPressed) {
            triggerHeldControllers.set(controllerKey, controller);
        } else {
            triggerHeldControllers.delete(controllerKey);
            sliderInteractionActive = false;
        }
        
        // Si trigger relâché, arrêter ici
        if (!isPressed) {
            return;
        }
        
        // Obtenir le ray de façon précise pour ce contrôleur spécifique
        let rayOrigin, rayDirection;
        
        if (controller.pointer) {
            rayOrigin = controller.pointer.absolutePosition || controller.pointer.position;
            rayDirection = controller.pointer.getDirection ?
                controller.pointer.getDirection(BABYLON.Vector3.Forward()) :
                new BABYLON.Vector3(0, 0, 1);
        } else if (controller.motionController && controller.motionController.rootMesh) {
            rayOrigin = controller.motionController.rootMesh.absolutePosition || controller.motionController.rootMesh.position;
            rayDirection = controller.motionController.rootMesh.getDirection ?
                controller.motionController.rootMesh.getDirection(BABYLON.Vector3.Forward()) :
                new BABYLON.Vector3(0, 0, 1);
        } else {
            console.log(`❌ VR ${handness}: No valid pointer found`);
            return;
        }
        
        // Vérifications UI d'abord (scale panel, legend, search)
        if (scene.vrScalePanel3D && scene.vrScalePanel3D.plane.isVisible) {
            const ray = new BABYLON.Ray(rayOrigin, rayDirection);
            const hit = ray.intersectsMesh(scene.vrScalePanel3D.plane);
            
            if (hit.hit) {
                console.log(`🎯 VR ${handness}: SCALE PANEL HIT`);
                sliderInteractionActive = true;
                
                const worldHitPoint = hit.pickedPoint;
                const panelPosition = scene.vrScalePanel3D.plane.absolutePosition || scene.vrScalePanel3D.plane.position;
                const localHitPoint = worldHitPoint.subtract(panelPosition);
                
                const panelWidth = 1.2;
                let sliderValue = localHitPoint.x / (panelWidth * 0.35);
                sliderValue = Math.max(-1, Math.min(1, sliderValue));
                
                scene.vrScalePanel3D.updateScale(sliderValue);
                scene.vrScalePanel3D.currentSliderValue = sliderValue;
                return;
            }
        }
        
        if (scene.vrSearchPanel3D && scene.vrSearchPanel3D.plane.isVisible) {
            const ray = new BABYLON.Ray(rayOrigin, rayDirection);
            const hit = ray.intersectsMesh(scene.vrSearchPanel3D.plane);
            
            if (hit.hit) {
                console.log(`🎯 VR ${handness}: SEARCH PANEL HIT`);
                
                const worldHitPoint = hit.pickedPoint;
                const planePosition = scene.vrSearchPanel3D.plane.absolutePosition || scene.vrSearchPanel3D.plane.position;
                const localHitPoint = worldHitPoint.subtract(planePosition);
                
                const planeWidth = 3;
                const planeHeight = 2;
                
                const clicked = scene.vrSearchPanel3D.handleClick(localHitPoint.x, localHitPoint.y, planeWidth, planeHeight);
                
                if (clicked) {
                    console.log(`🎯 VR ${handness}: SEARCH PANEL INTERACTION`);
                    return;
                }
            }
        }
        
        if (scene.vrLegendPanel3D && scene.vrLegendPanel3D.plane.isVisible) {
            const ray = new BABYLON.Ray(rayOrigin, rayDirection);
            const hit = ray.intersectsMesh(scene.vrLegendPanel3D.plane);
            
            if (hit.hit) {
                console.log(`🎯 VR ${handness}: LEGEND HIT`);
                
                const worldHitPoint = hit.pickedPoint;
                const planePosition = scene.vrLegendPanel3D.plane.absolutePosition || scene.vrLegendPanel3D.plane.position;
                const localHitPoint = worldHitPoint.subtract(planePosition);
                
                const planeWidth = 2.0;
                const planeHeight = Math.max(2.0, scene.vrLegendPanel3D.clickableAreas.length * 0.15 + 0.5);
                
                const clickedType = scene.vrLegendPanel3D.getClickedType(localHitPoint.x, localHitPoint.y, planeWidth, planeHeight);
                
                if (clickedType) {
                    console.log(`🎯 VR ${handness}: LEGEND TYPE - ${clickedType}`);
                    window.xrLegendActiveTypes[clickedType] = !window.xrLegendActiveTypes[clickedType];
                    const active = window.xrLegendActiveTypes[clickedType] !== false;
                    
                    if (scene.vrLegendPanel3D.updateDisplay) {
                        scene.vrLegendPanel3D.updateDisplay();
                    }
                    filterByType(clickedType);
                    return;
                }
            }
        }
        
        // === DÉTECTION DE PARTICULES ULTRA-PRÉCISE POUR CE CONTRÔLEUR ===
        console.log(`🔍 VR ${handness}: Starting PRECISE particle search...`);
        const searchStart = performance.now();
        
        let targetedSprite = null;
        let bestPrecision = 0;
        let bestDistance = Infinity;
        
        // Obtenir toutes les particules visibles
        const allSprites = getAllSprites();
        if (!allSprites || allSprites.length === 0) {
            console.log(`❌ VR ${handness}: No sprites available`);
            return;
        }
        
        console.log(`🔍 VR ${handness}: Testing ${allSprites.length} sprites for precise hit...`);
        
        // Algorithm de précision amélioré - un seul test par particule
        for (let i = 0; i < allSprites.length; i++) {
            const sprite = allSprites[i];
            if (!sprite.isVisible) continue;
            
            const spritePosition = sprite.position;
            const rayToSprite = spritePosition.subtract(rayOrigin);
            const projectionLength = BABYLON.Vector3.Dot(rayToSprite, rayDirection);
            
            // La particule doit être devant le ray
            if (projectionLength > 0.1) {
                const closestPointOnRay = rayOrigin.add(rayDirection.scale(projectionLength));
                const distanceToRay = BABYLON.Vector3.Distance(spritePosition, closestPointOnRay);
                
                // Calcul de précision : plus la particule est proche du centre du ray, plus le score est élevé
                const precision = 1.0 / (1.0 + distanceToRay);
                
                // Seuil de précision ajustable selon la distance
                let precisionThreshold;
                if (projectionLength < 50) {
                    precisionThreshold = 0.2; // Très précis pour courte distance
                } else if (projectionLength < 200) {
                    precisionThreshold = 0.1; // Précis pour moyenne distance
                } else {
                    precisionThreshold = 0.05; // Moins précis pour longue distance
                }
                
                // Sélectionner la particule la plus précise ET la plus proche
                if (precision > precisionThreshold &&
                    (precision > bestPrecision ||
                     (precision === bestPrecision && projectionLength < bestDistance))) {
                    targetedSprite = sprite;
                    bestPrecision = precision;
                    bestDistance = projectionLength;
                    
                    console.log(`🎯 VR ${handness}: Better target: ${sprite.name}, precision: ${precision.toFixed(3)}, distance: ${projectionLength.toFixed(1)}`);
                }
            }
        }
        
        const searchTime = performance.now() - searchStart;
        console.log(`🔍 VR ${handness}: Search completed in ${searchTime.toFixed(2)}ms`);
        
        // NAVIGATION VERS LA PARTICULE TROUVÉE
        if (targetedSprite) {
            console.log(`✅ VR ${handness}: PRECISE hit on ${targetedSprite.name} (precision: ${bestPrecision.toFixed(3)}) - NAVIGATING NOW`);
            
            const spriteName = targetedSprite.name;
            moveCameraToSprite(spriteName);
            
            console.log(`✅ VR ${handness}: Navigation started for ${spriteName}`);
            
        } else {
            console.log(`❌ VR ${handness}: No precise target found`);
            
            // Indication visuelle d'échec
            if (scene.vrTargetIndicator && scene.vrTargetIndicator.show) {
                scene.vrTargetIndicator.show(`❌ Aucune cible précise (${handness})`);
                setTimeout(() => {
                    if (scene.vrTargetIndicator && scene.vrTargetIndicator.hide) {
                        scene.vrTargetIndicator.hide();
                    }
                }, 1500);
            }
        }
        
    } catch (error) {
        console.error(`❌ VR trigger error ${handness}:`, error);
    }
}

// Fonction pour créer un indicateur textuel accroché à la caméra VR
function createVRTargetIndicator(scene) {
    const indicatorSystem = {};
    
    // Créer un panneau 3D pour afficher l'indicateur de particule visée
    const targetInfoPlane = BABYLON.MeshBuilder.CreatePlane("vrTargetInfoPlane", {width: 0.83, height: 0.4}, scene);
    
    // Position relative à la caméra (HUD style) - plus bas
    targetInfoPlane.position = new BABYLON.Vector3(0, -1.0, 3); // Plus bas dans le champ de vision
    targetInfoPlane.isVisible = false;
    
    // Créer une texture dynamique pour le texte
    let infoTexture = new BABYLON.DynamicTexture("vrTargetInfoTexture", {width: 600, height: 300}, scene);
    const infoMaterial = new BABYLON.StandardMaterial("vrTargetInfoMat", scene);
    infoMaterial.diffuseTexture = infoTexture;
    infoMaterial.emissiveTexture = infoTexture;
    infoMaterial.disableLighting = true;
    infoMaterial.hasAlpha = true;
    targetInfoPlane.material = infoMaterial;
    
    // Fonction pour dessiner l'affichage sur la texture
    function updateInfoTexture(particleName) {
        infoTexture.clear();
        const context = infoTexture.getContext();
        
        // Fond complètement transparent - pas de fond
        // context.fillStyle = "rgba(0, 0, 0, 0.3)";
        // context.fillRect(0, 0, 600, 300);
        
        // Pas de bordure pour un fond transparent
        // context.strokeStyle = "white";
        // context.lineWidth = 2;
        // context.strokeRect(30, 30, 540, 240);
        
        // Titre "Particule visée" - texte plus grand
        context.font = "bold 38px Arial";
        context.fillStyle = "yellow";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("Particule visée", 300, 100);
        
        // Pas de ligne de séparation avec fond transparent
        // context.strokeStyle = "yellow";
        // context.lineWidth = 2;
        // context.beginPath();
        // context.moveTo(80, 140);
        // context.lineTo(520, 140);
        // context.stroke();
        
        // Nom de la particule - texte plus grand
        context.font = "bold 44px Arial";
        context.fillStyle = "white";
        context.strokeStyle = "black";
        context.lineWidth = 2;
        
        // Contour du nom
        context.strokeText(particleName, 300, 200);
        // Texte principal du nom
        context.fillText(particleName, 300, 200);
        
        infoTexture.update();
    }
    
    // Fonction pour attacher le panneau à la caméra
    function attachToCamera() {
        const camera = scene.activeCamera;
        if (camera) {
            // Attacher le panneau à la caméra comme enfant
            targetInfoPlane.parent = camera;
            console.log("VR: Panneau attaché à la caméra");
        }
    }
    
    // Fonction pour mettre à jour la position du panneau relativement à la caméra
    function updatePanelPosition() {
        const camera = scene.activeCamera;
        if (camera && targetInfoPlane.isVisible) {
            // Si pas encore attaché, l'attacher
            if (!targetInfoPlane.parent) {
                attachToCamera();
            }
        }
    }
    
    // Ajouter l'observateur pour maintenir la position
    scene.onBeforeRenderObservable.add(() => {
        if (targetInfoPlane.isVisible) {
            updatePanelPosition();
        }
    });
    
    // Stocker les références
    indicatorSystem.infoPane = targetInfoPlane;
    indicatorSystem.infoTexture = infoTexture;
    indicatorSystem.infoMaterial = infoMaterial;
    
    // Fonctions
    indicatorSystem.show = function(particleName) {
        console.log("VR: Showing particle target info for", particleName);
        targetInfoPlane.isVisible = true;
        updateInfoTexture(particleName);
        attachToCamera(); // S'assurer que c'est attaché
    };
    
    indicatorSystem.hide = function() {
        console.log("VR: Hiding particle target info");
        targetInfoPlane.isVisible = false;
    };
    
    indicatorSystem.dispose = function() {
        if (infoTexture) infoTexture.dispose();
        if (infoMaterial) infoMaterial.dispose();
        if (targetInfoPlane) targetInfoPlane.dispose();
    };
    
    console.log("Camera-attached VR text indicator created");
    return indicatorSystem;
}

// Fonction pour créer un panneau de scale 3D flottant
function createVRScalePanel3D(scene) {
    const scalePanelSystem = {};
    
    // Créer un panneau 3D pour le contrôle de scale
    const scaleInfoPlane = BABYLON.MeshBuilder.CreatePlane("vrScalePanelPlane", {width: 1.2, height: 0.8}, scene);
    
    // Position relative à la caméra (côté droit)
    scaleInfoPlane.position = new BABYLON.Vector3(1.5, 0, 3);
    scaleInfoPlane.isVisible = false;
    
    // Créer une texture dynamique pour l'interface de scale
    let scaleTexture = new BABYLON.DynamicTexture("vrScalePanelTexture", {width: 800, height: 500}, scene);
    const scaleMaterial = new BABYLON.StandardMaterial("vrScalePanelMat", scene);
    scaleMaterial.diffuseTexture = scaleTexture;
    scaleMaterial.emissiveTexture = scaleTexture;
    scaleMaterial.disableLighting = true;
    scaleMaterial.hasAlpha = true;
    scaleInfoPlane.material = scaleMaterial;
    
    // Variables de scale
    let currentSliderValue = 0; // -1 à 1
    let currentScale = 1.0;
    const scaleRange = 10; // Facteur de scale max
    
    // Fonction pour dessiner l'interface de scale
    function updateScaleTexture() {
        scaleTexture.clear();
        const context = scaleTexture.getContext();
        
        // Fond semi-transparent
        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fillRect(0, 0, 800, 500);
        
        // Bordure
        context.strokeStyle = "white";
        context.lineWidth = 3;
        context.strokeRect(20, 20, 760, 460);
        
        // Titre "Scale Control"
        context.font = "bold 36px Arial";
        context.fillStyle = "yellow";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("Scale Control", 400, 80);
        
        // Valeur actuelle
        context.font = "bold 42px Arial";
        context.fillStyle = "white";
        context.fillText(`Scale: ${currentScale.toFixed(2)}x`, 400, 150);
        
        // Barre de slider
        const sliderX = 100;
        const sliderY = 250;
        const sliderWidth = 600;
        const sliderHeight = 20;
        
        // Fond du slider
        context.fillStyle = "#333";
        context.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);
        
        // Bordure du slider
        context.strokeStyle = "#00ff00";
        context.lineWidth = 2;
        context.strokeRect(sliderX, sliderY, sliderWidth, sliderHeight);
        
        // Position du curseur - DIRECTEMENT basée sur currentSliderValue (-1 à +1)
        // C'est la valeur RAW du slider, pas le scale calculé !
        const cursorPos = sliderX + (currentSliderValue + 1) * sliderWidth / 2;
        
        // Debug DÉTAILLÉ pour comprendre le décalage
        console.log(`🎯 CURSOR DEBUG DÉTAILLÉ:`);
        console.log(`  → currentSliderValue: ${currentSliderValue.toFixed(3)}`);
        console.log(`  → sliderX (début): ${sliderX}`);
        console.log(`  → sliderWidth: ${sliderWidth}`);
        console.log(`  → (currentSliderValue + 1): ${(currentSliderValue + 1).toFixed(3)}`);
        console.log(`  → (currentSliderValue + 1) * sliderWidth / 2: ${((currentSliderValue + 1) * sliderWidth / 2).toFixed(1)}`);
        console.log(`  → cursorPos final: ${cursorPos.toFixed(1)}`);
        console.log(`  → Expected: -1=${sliderX}, 0=${sliderX + sliderWidth/2}, +1=${sliderX + sliderWidth}`);
        
        // Curseur
        context.fillStyle = "#00ff00";
        context.fillRect(cursorPos - 10, sliderY - 10, 20, sliderHeight + 20);
        
        // Indicateurs de valeurs - POSITIONNÉS EXACTEMENT selon la logique VR
        context.font = "20px Arial";
        context.fillStyle = "white";
        
        // 0.1x est à la position relative -1 (tout à gauche)
        const pos01x = sliderX + (-1 + 1) * sliderWidth / 2; // = sliderX + 0 = début du slider
        context.textAlign = "center";
        context.fillText("0.1x", pos01x, sliderY + 50);
        
        // 1.0x est à la position relative 0 (centre)
        const pos10x = sliderX + (0 + 1) * sliderWidth / 2; // = sliderX + sliderWidth/2 = centre
        context.fillText("1.0x", pos10x, sliderY + 50);
        
        // 10x est à la position relative +1 (tout à droite)
        const pos10xMax = sliderX + (1 + 1) * sliderWidth / 2; // = sliderX + sliderWidth = fin du slider
        context.fillText("10x", pos10xMax, sliderY + 50);
        
        // Debug: Afficher les positions des indicateurs
        console.log(`📍 Indicators: 0.1x@${pos01x.toFixed(1)}, 1.0x@${pos10x.toFixed(1)}, 10x@${pos10xMax.toFixed(1)}`);
        
        // Instructions
        context.font = "24px Arial";
        context.fillStyle = "cyan";
        context.textAlign = "center";
        context.fillText("Joystick droit: Ajuster scale", 400, 350);
        context.fillText("Bouton A: Fermer", 400, 390);
        
        scaleTexture.update();
    }
    
    // Fonction pour attacher le panneau à la caméra
    function attachToCamera() {
        const camera = scene.activeCamera;
        if (camera) {
            scaleInfoPlane.parent = camera;
            console.log("VR: Panneau de scale attaché à la caméra");
        }
    }
    
    // Fonction pour mettre à jour la valeur de scale - VERSION CORRIGÉE
    function updateScale(sliderValue) {
        // Assurer que sliderValue est un nombre valide
        if (typeof sliderValue !== 'number' || isNaN(sliderValue)) {
            console.warn(`Invalid sliderValue: ${sliderValue}, using 0 as default`);
            sliderValue = 0;
        }
        
        currentSliderValue = Math.max(-1, Math.min(1, sliderValue));
        
        // Mapping linéaire simple du slider (-1 à 1) vers scale (0.1x à 10x)
        // -1 = 0.1x, 0 = 1.0x, +1 = 10.0x
        if (currentSliderValue < 0) {
            // De -1 à 0: de 0.1x à 1.0x
            // Formule: 0.1 + (sliderValue + 1) * 0.9
            currentScale = 0.1 + (currentSliderValue + 1) * 0.9;
        } else if (currentSliderValue > 0) {
            // De 0 à +1: de 1.0x à 10.0x
            // Formule: 1.0 + sliderValue * 9.0
            currentScale = 1.0 + currentSliderValue * 9.0;
        } else {
            // Exactement 0 = 1.0x
            currentScale = 1.0;
        }
        
        // Validation finale du scale
        currentScale = Math.max(0.1, Math.min(10.0, currentScale));
        scene.currentScaleValue = currentScale;
        
        console.log(`🎯 Scale Update: SliderValue=${currentSliderValue.toFixed(3)}, Scale=${currentScale.toFixed(2)}x`);
        
        // Appliquer directement aux particules avec espacement inverse simple - SYSTÈME MULTI-MANAGERS
        try {
            const sprites = getAllSprites(); // Utiliser la nouvelle fonction pour tous les managers
            
            if (sprites && sprites.length > 0) {
                // Facteur d'espacement simple : plus le scale est élevé, plus les particules sont serrées
                const spacingFactor = 1.0 / currentScale;
                
                console.log(`Applying scale ${currentScale.toFixed(2)}x with spacing factor ${spacingFactor.toFixed(3)} to ${sprites.length} sprites (multi-manager)`);
                
                sprites.forEach(sprite => {
                    if (sprite.originalPosition) {
                        sprite.position.x = sprite.originalPosition.x * spacingFactor;
                        sprite.position.y = sprite.originalPosition.y * spacingFactor;
                        sprite.position.z = sprite.originalPosition.z * spacingFactor;
                    }
                });
                
                console.log(`✅ Scale applied successfully to ALL managers - Spacing: ${spacingFactor.toFixed(3)}x`);
            } else {
                console.log(`❌ No sprites available from getAllSprites() - length: ${sprites ? sprites.length : 'undefined'}`);
                
                // Debug: Vérifier les managers disponibles
                if (window.spriteManagersByLevel) {
                    console.log(`🔍 Available sprite managers by level:`, Object.keys(window.spriteManagersByLevel));
                    Object.entries(window.spriteManagersByLevel).forEach(([level, manager]) => {
                        console.log(`  Level ${level}: ${manager.sprites ? manager.sprites.length : 0} sprites`);
                    });
                }
            }
        } catch (error) {
            console.error(`❌ Error applying scale (multi-manager):`, error);
        }
        
        updateScaleTexture();
    }
    
    
    // Stocker les références
    scalePanelSystem.plane = scaleInfoPlane;
    scalePanelSystem.texture = scaleTexture;
    scalePanelSystem.material = scaleMaterial;
    
    // Fonctions
    scalePanelSystem.show = function() {
        console.log("VR: Showing scale panel");
        scaleInfoPlane.isVisible = true;
        updateScaleTexture();
        attachToCamera();
    };
    
    scalePanelSystem.hide = function() {
        console.log("VR: Hiding scale panel");
        scaleInfoPlane.isVisible = false;
    };
    
    scalePanelSystem.toggle = function() {
        if (scaleInfoPlane.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    };
    
    scalePanelSystem.updateScale = updateScale;
    
    scalePanelSystem.dispose = function() {
        if (scaleTexture) scaleTexture.dispose();
        if (scaleMaterial) scaleMaterial.dispose();
        if (scaleInfoPlane) scaleInfoPlane.dispose();
    };
    
    // Initialiser avec la valeur par défaut
    updateScale(0);
    
    console.log("Camera-attached VR scale panel 3D created");
    return scalePanelSystem;
}

// Fonction pour créer un panneau de légende 3D avec plan et texture dynamique (comme scale panel)
function createVRLegendPanel3D(scene, data) {
    const legendPanelSystem = {};
    
    console.log("🏗️ Creating VR Legend Panel 3D (plane + dynamic texture)...");
    
    try {
        // Obtenir les types uniques (TOUS les types comme dans la version 2D)
        const uniqueTypes = [...new Set(data.map(item => item.subType))].sort();
        console.log(`📋 Found ${uniqueTypes.length} unique types:`, uniqueTypes);
        
        // Créer un plan 3D pour la légende (comme le scale panel)
        const legendPlane = BABYLON.MeshBuilder.CreatePlane("vrLegendPlane", {
            width: 2.0,
            height: Math.max(2.0, uniqueTypes.length * 0.15 + 0.5) // Hauteur dynamique selon le nombre de types
        }, scene);
        
        // Position plus en haut à gauche
        legendPlane.position = new BABYLON.Vector3(-1.5, 1, 3);
        legendPlane.isVisible = false;
        
        // Créer une texture dynamique pour dessiner la légende
        const textureHeight = Math.max(400, uniqueTypes.length * 40 + 100);
        let legendTexture = new BABYLON.DynamicTexture("vrLegendTexture", {width: 600, height: textureHeight}, scene);
        const legendMaterial = new BABYLON.StandardMaterial("vrLegendMat", scene);
        legendMaterial.diffuseTexture = legendTexture;
        legendMaterial.emissiveTexture = legendTexture;
        legendMaterial.disableLighting = true;
        legendMaterial.hasAlpha = true;
        legendPlane.material = legendMaterial;
        
        // État des types (comme dans la légende 2D) - Réinitialiser pour éviter les conflits
        window.xrLegendActiveTypes = {};
        
        // Initialiser TOUS les types à true (particules visibles par défaut)
        uniqueTypes.forEach(type => {
            window.xrLegendActiveTypes[type] = true;
        });
        
        // Stocker les zones cliquables pour la détection de trigger
        const clickableAreas = [];
        
        // Fonction pour dessiner la légende sur la texture (même design que l'original)
        function updateLegendTexture() {
            legendTexture.clear();
            const context = legendTexture.getContext();
            
            // Fond semi-transparent comme la légende 2D originale
            context.fillStyle = "rgba(0, 0, 0, 0.7)";
            context.fillRect(0, 0, 600, textureHeight);
            
            // Bordure blanche
            context.strokeStyle = "white";
            context.lineWidth = 2;
            context.strokeRect(10, 10, 580, textureHeight - 20);
            
            // Réinitialiser les zones cliquables
            clickableAreas.length = 0;
            
            // Dessiner chaque élément de légende
            uniqueTypes.forEach((type, index) => {
                const y = 50 + index * 40; // Position Y de chaque ligne
                const isActive = window.xrLegendActiveTypes[type] !== false;
                const color = getColor(type);
                
                // Boîte colorée (comme dans la légende 2D originale)
                const colorBoxX = 30;
                const colorBoxY = y - 15;
                const colorBoxSize = 30;
                
                context.fillStyle = `rgba(${Math.round(color.r*255)}, ${Math.round(color.g*255)}, ${Math.round(color.b*255)}, ${isActive ? 1.0 : 0.3})`;
                context.fillRect(colorBoxX, colorBoxY, colorBoxSize, colorBoxSize);
                
                // Bordure de la boîte colorée
                context.strokeStyle = "white";
                context.lineWidth = 1;
                context.strokeRect(colorBoxX, colorBoxY, colorBoxSize, colorBoxSize);
                
                // Label de texte (comme dans la légende 2D originale)
                context.font = "20px Arial";
                context.fillStyle = isActive ? "white" : "rgba(255, 255, 255, 0.5)";
                context.textAlign = "left";
                context.textBaseline = "middle";
                context.fillText(type, colorBoxX + colorBoxSize + 15, y);
                
                // Stocker la zone cliquable (toute la ligne)
                clickableAreas.push({
                    type: type,
                    x1: colorBoxX,
                    y1: colorBoxY,
                    x2: 580,
                    y2: colorBoxY + colorBoxSize,
                    color: color,
                    isActive: isActive
                });
                
                console.log(`🎨 Drew legend item: ${type} at Y=${y}, active=${isActive}`);
            });
            
            legendTexture.update();
            console.log(`✅ Legend texture updated with ${uniqueTypes.length} items, ${clickableAreas.length} clickable areas`);
        }
        
        // Fonction pour attacher le panneau à la caméra (comme scale panel)
        function attachToCamera() {
            const camera = scene.activeCamera;
            if (camera) {
                legendPlane.parent = camera;
                console.log("📷 VR Legend Panel 3D attached to camera");
            }
        }
        
        // Fonction pour tester si un point 2D est dans une zone cliquable
        function getClickedType(localX, localY, planeWidth, planeHeight) {
            // Les coordonnées locales du plan vont de -planeWidth/2 à +planeWidth/2 et -planeHeight/2 à +planeHeight/2
            // Normaliser d'abord entre 0 et 1
            const normalizedX = (localX + planeWidth/2) / planeWidth;
            const normalizedY = (localY + planeHeight/2) / planeHeight;
            
            // Puis convertir en coordonnées texture (0-600, 0-textureHeight)
            const textureX = normalizedX * 600;
            const textureY = (1.0 - normalizedY) * textureHeight; // Inverser Y car les textures ont Y=0 en haut
            
            console.log(`🔍 Click test: local(${localX.toFixed(3)}, ${localY.toFixed(3)}) → normalized(${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)}) → texture(${textureX.toFixed(1)}, ${textureY.toFixed(1)})`);
            
            // Tester chaque zone cliquable
            for (const area of clickableAreas) {
                if (textureX >= area.x1 && textureX <= area.x2 &&
                    textureY >= area.y1 && textureY <= area.y2) {
                    console.log(`🎯 Hit detected on type: ${area.type} (area: ${area.x1}-${area.x2}, ${area.y1}-${area.y2})`);
                    return area.type;
                }
            }
            
            console.log(`❌ No hit detected in clickable areas. Tested ${clickableAreas.length} areas`);
            clickableAreas.forEach((area, i) => {
                console.log(`  Area ${i}: ${area.type} (${area.x1}-${area.x2}, ${area.y1}-${area.y2})`);
            });
            return null;
        }
        
        // Stocker les références
        legendPanelSystem.plane = legendPlane;
        legendPanelSystem.texture = legendTexture;
        legendPanelSystem.material = legendMaterial;
        legendPanelSystem.clickableAreas = clickableAreas;
        legendPanelSystem.getClickedType = getClickedType;
        
        // Fonctions
        legendPanelSystem.show = function() {
            console.log("👁️ VR: Showing legend panel 3D (plane + texture)");
            legendPlane.isVisible = true;
            updateLegendTexture();
            attachToCamera();
        };
        
        legendPanelSystem.hide = function() {
            console.log("🙈 VR: Hiding legend panel 3D (plane + texture)");
            legendPlane.isVisible = false;
        };
        
        legendPanelSystem.toggle = function() {
            if (legendPlane.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        };
        
        legendPanelSystem.updateDisplay = function() {
            updateLegendTexture();
        };
        
        legendPanelSystem.dispose = function() {
            if (legendTexture) legendTexture.dispose();
            if (legendMaterial) legendMaterial.dispose();
            if (legendPlane) legendPlane.dispose();
        };
        
        // Initialiser la texture
        updateLegendTexture();
        
        console.log("✅ VR Legend Panel 3D (plane + texture) created successfully");
        return legendPanelSystem;
        
    } catch (error) {
        console.error("❌ Error creating VR Legend Panel 3D:", error);
        console.error("Error details:", error.message);
        console.error("Stack trace:", error.stack);
        return null;
    }
}
// Fonction pour créer un système de recherche VR hybride : input invisible + panneau 3D visible
function createVRSearchPanel3D(scene, data) {
    const searchPanelSystem = {};
    
    console.log("🔍 Creating hybrid VR Search (invisible input + 3D panel)...");
    
    try {
        // Générer la liste d'autocomplétion à partir des données
        const particleNames = data ? data.map(item => item.prefLabel || item.name || "").filter(name => name.length > 0) : [];
        const uniqueNames = [...new Set(particleNames)].sort();
        
        console.log(`📋 Autocomplete database: ${uniqueNames.length} unique particle names`);
        
        // Debug: Afficher quelques exemples de noms
        if (uniqueNames.length > 0) {
            console.log(`📝 Example names:`, uniqueNames.slice(0, 10));
        } else {
            console.warn(`⚠️ No particle names found in data. Data structure:`, data ? data.slice(0, 3) : 'no data');
        }
        
        // Variables d'état
        let currentSearchText = "";
        let keyboardVisible = false;
        let autocompleteList = [];
        let autocompleteDiv = null;
        
        // Créer le panneau 3D visible dans le casque VR
        const searchPlane = BABYLON.MeshBuilder.CreatePlane("vrSearchPlane", {
            width: 2.5,
            height: 1.5
        }, scene);
        
        searchPlane.position = new BABYLON.Vector3(0, 0, 3);
        searchPlane.isVisible = false;
        
        // Créer une texture dynamique pour l'affichage 3D
        const textureHeight = 400;
        let searchTexture = new BABYLON.DynamicTexture("vrSearchTexture", {width: 600, height: textureHeight}, scene);
        const searchMaterial = new BABYLON.StandardMaterial("vrSearchMat", scene);
        searchMaterial.diffuseTexture = searchTexture;
        searchMaterial.emissiveTexture = searchTexture;
        searchMaterial.disableLighting = true;
        searchMaterial.hasAlpha = true;
        searchPlane.material = searchMaterial;
        
        // Zones cliquables pour les suggestions
        const clickableAreas = [];
        
        // Fonction pour filtrer les suggestions d'autocomplétion
        function getAutocompleteSuggestions(query) {
            console.log(`🔍 AUTOCOMPLETE: query="${query}", length=${query ? query.length : 0}`);
            
            if (!query || query.length < 3) {
                console.log(`❌ Query too short or empty`);
                return [];
            }
            
            // Vérifier que la base de données existe
            if (!uniqueNames || uniqueNames.length === 0) {
                console.warn(`⚠️ uniqueNames is empty or undefined:`, uniqueNames);
                // Fallback: essayer d'obtenir les noms depuis les sprites existants
                const sprites = getAllSprites();
                if (sprites && sprites.length > 0) {
                    const fallbackNames = sprites.map(s => s.name).filter(name => name && name.length > 0);
                    console.log(`🔄 Using fallback names from sprites: ${fallbackNames.length} names`);
                    const suggestions = fallbackNames.filter(name =>
                        name.toLowerCase().includes(query.toLowerCase())
                    ).slice(0, 6);
                    console.log(`✅ Fallback suggestions:`, suggestions);
                    return suggestions;
                }
                return [];
            }
            
            const suggestions = uniqueNames.filter(name =>
                name.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 6);
            
            console.log(`✅ AUTOCOMPLETE found ${suggestions.length} suggestions:`, suggestions);
            return suggestions;
        }
        
        // Fonction pour dessiner l'affichage 3D VR - MÊME DESIGN QUE L'INTERFACE 2D
        function updateVRDisplay() {
            console.log(`🖼️ UPDATE VR DISPLAY: currentSearchText="${currentSearchText}", keyboardVisible=${keyboardVisible}`);
            
            searchTexture.clear();
            const context = searchTexture.getContext();
            clickableAreas.length = 0;
            
            // Fond blanc semi-transparent comme l'interface 2D originale
            context.fillStyle = "rgba(255, 255, 255, 0.7)";
            context.fillRect(0, 0, 600, textureHeight);
            
            // Bordure simple
            context.strokeStyle = "rgba(0, 0, 0, 0.3)";
            context.lineWidth = 1;
            context.strokeRect(10, 10, 580, textureHeight - 20);
            
            // Titre "Recherche de particule" (même texte que l'interface 2D)
            context.font = "20px Arial";
            context.fillStyle = "black";
            context.textAlign = "center";
            context.fillText("Recherche de particule", 300, 50);
            
            // Champ de saisie blanc comme l'interface 2D
            const inputY = 80;
            const inputHeight = 40;
            
            // Fond blanc du champ de saisie
            context.fillStyle = "white";
            context.fillRect(60, inputY, 480, inputHeight);
            
            // Bordure noire du champ (verte si clavier actif)
            context.strokeStyle = keyboardVisible ? "#00ff00" : "black";
            context.lineWidth = keyboardVisible ? 2 : 1;
            context.strokeRect(60, inputY, 480, inputHeight);
            
            // Texte dans le champ (noir comme l'interface 2D)
            context.font = "16px Arial";
            context.fillStyle = "black";
            context.textAlign = "left";
            const displayText = currentSearchText || "Nom de particule...";
            const textColor = currentSearchText ? "black" : "#999";
            context.fillStyle = textColor;
            context.fillText(displayText, 70, inputY + 25);
            
            console.log(`📝 Displaying text: "${displayText}", color: ${textColor}`);
            
            // Curseur clignotant noir
            if (keyboardVisible && currentSearchText && Date.now() % 1000 < 500) {
                const textWidth = context.measureText(currentSearchText).width;
                context.fillStyle = "black";
                context.fillRect(70 + textWidth + 2, inputY + 10, 1, 20);
            }
            
            // Zone cliquable du champ
            clickableAreas.push({
                type: "searchInput",
                x1: 60,
                y1: inputY,
                x2: 540,
                y2: inputY + inputHeight
            });
            
            // Bouton "Rechercher" bleu comme l'interface 2D
            const buttonY = 140;
            const buttonHeight = 40;
            const buttonWidth = 120;
            const buttonX = (600 - buttonWidth) / 2;
            
            // Fond bleu du bouton (#007bff comme l'interface 2D)
            context.fillStyle = "#007bff";
            context.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            // Texte blanc du bouton
            context.font = "16px Arial";
            context.fillStyle = "white";
            context.textAlign = "center";
            context.fillText("Rechercher", buttonX + buttonWidth/2, buttonY + 25);
            
            // Zone cliquable du bouton
            clickableAreas.push({
                type: "searchButton",
                x1: buttonX,
                y1: buttonY,
                x2: buttonX + buttonWidth,
                y2: buttonY + buttonHeight
            });
            
            // Autocomplétion avec style plus sobre
            if (currentSearchText && currentSearchText.length >= 3) {
                console.log(`🔍 Checking autocomplete for: "${currentSearchText}"`);
                autocompleteList = getAutocompleteSuggestions(currentSearchText);
                console.log(`📝 Got ${autocompleteList.length} suggestions:`, autocompleteList);
                
                if (autocompleteList.length > 0) {
                    let currentY = 200;
                    
                    autocompleteList.forEach((suggestion, index) => {
                        const itemY = currentY + index * 30;
                        
                        // Fond blanc pour les suggestions
                        context.fillStyle = "white";
                        context.fillRect(60, itemY - 2, 480, 26);
                        
                        // Bordure fine
                        context.strokeStyle = "#ddd";
                        context.lineWidth = 1;
                        context.strokeRect(60, itemY - 2, 480, 26);
                        
                        // Texte noir des suggestions
                        context.font = "14px Arial";
                        context.fillStyle = "black";
                        context.textAlign = "left";
                        context.fillText(suggestion, 70, itemY + 15);
                        
                        // Zone cliquable
                        clickableAreas.push({
                            type: "autocomplete",
                            text: suggestion,
                            x1: 60,
                            y1: itemY - 2,
                            x2: 540,
                            y2: itemY + 24
                        });
                    });
                }
            }
            
            // Instructions discrètes en bas
            context.font = "12px Arial";
            context.fillStyle = "#666";
            context.textAlign = "center";
            if (keyboardVisible) {
                context.fillText("Clavier actif - Tapez votre recherche", 300, textureHeight - 20);
            } else {
                context.fillText("Cliquez dans le champ pour rechercher", 300, textureHeight - 20);
            }
            
            searchTexture.update();
        }
        
        // Input HTML invisible pour le clavier Meta Quest seulement
        let vrInput = null;
        
        function createHiddenInput() {
            if (!vrInput) {
                vrInput = document.createElement('input');
                vrInput.type = 'text';
                vrInput.style.position = 'fixed';
                vrInput.style.top = '-100px';
                vrInput.style.left = '50%';
                vrInput.style.width = '300px';
                vrInput.style.height = '40px';
                vrInput.style.opacity = '0.01'; // Presque invisible mais pas complètement
                vrInput.style.zIndex = '9999';
                vrInput.style.border = 'none';
                vrInput.style.background = 'transparent';
                vrInput.setAttribute('autocomplete', 'off');
                vrInput.setAttribute('autocorrect', 'off');
                vrInput.setAttribute('autocapitalize', 'off');
                vrInput.setAttribute('spellcheck', 'false');
                document.body.appendChild(vrInput);
                
                console.log(`✅ VR Input created and positioned for Meta Quest`);
                
                // Événement principal - input
                vrInput.addEventListener('input', (e) => {
                    const newValue = e.target.value || "";
                    console.log(`⌨️ INPUT: "${currentSearchText}" → "${newValue}"`);
                    currentSearchText = newValue;
                    updateVRDisplay();
                });
                
                // Événements clavier
                vrInput.addEventListener('keydown', (e) => {
                    console.log(`⌨️ KEYDOWN: ${e.key}, value: "${e.target.value}"`);
                });
                
                vrInput.addEventListener('keyup', (e) => {
                    const newValue = e.target.value || "";
                    console.log(`⌨️ KEYUP: ${e.key}, value: "${newValue}"`);
                    if (newValue !== currentSearchText) {
                        currentSearchText = newValue;
                        updateVRDisplay();
                    }
                });
                
                // Événement de changement
                vrInput.addEventListener('change', (e) => {
                    const newValue = e.target.value || "";
                    console.log(`⌨️ CHANGE: "${newValue}"`);
                    currentSearchText = newValue;
                    updateVRDisplay();
                });
                
                // Focus/Blur
                vrInput.addEventListener('focus', () => {
                    console.log(`🎯 INPUT FOCUSED`);
                    keyboardVisible = true;
                    updateVRDisplay();
                });
                
                vrInput.addEventListener('blur', () => {
                    console.log(`🔽 INPUT BLUR`);
                    setTimeout(() => {
                        if (document.activeElement !== vrInput) {
                            keyboardVisible = false;
                            updateVRDisplay();
                        }
                    }, 500);
                });
            }
        }
        
        // Version simplifiée sans polling - Les événements doivent suffire
        
        function showKeyboard() {
            console.log(`⌨️ SHOW KEYBOARD`);
            createHiddenInput();
            
            keyboardVisible = true;
            vrInput.value = currentSearchText || "";
            vrInput.focus();
            updateVRDisplay();
            
            console.log(`📝 Keyboard visible, input value: "${vrInput.value}"`);
        }

        function hideKeyboard() {
            console.log(`🔽 HIDE KEYBOARD`);
            keyboardVisible = false;
            if (vrInput) {
                vrInput.blur();
            }
            updateVRDisplay();
        }
        
        // Fonction pour gérer les clics VR
        function handleClick(localX, localY, planeWidth, planeHeight) {
            const normalizedX = (localX + planeWidth/2) / planeWidth;
            const normalizedY = (localY + planeHeight/2) / planeHeight;
            const textureX = normalizedX * 600;
            const textureY = (1.0 - normalizedY) * textureHeight;
            
            for (const area of clickableAreas) {
                if (textureX >= area.x1 && textureX <= area.x2 &&
                    textureY >= area.y1 && textureY <= area.y2) {
                    
                    switch (area.type) {
                        case "searchInput":
                            showKeyboard();
                            break;
                            
                        case "searchButton":
                            if (currentSearchText && currentSearchText.trim().length > 0) {
                                hideKeyboard();
                                performSearch(currentSearchText.trim());
                            }
                            break;
                            
                        case "autocomplete":
                            hideKeyboard();
                            performSearch(area.text);
                            break;
                    }
                    return true;
                }
            }
            return false;
        }
        
        // Fonction pour effectuer la recherche
        function performSearch(query) {
            console.log(`🔍 Performing search for: "${query}"`);
            
            try {
                moveCameraToSprite(query);
                setTimeout(() => {
                    searchPanelSystem.hide();
                }, 500);
            } catch (error) {
                console.error(`❌ Search error for "${query}":`, error);
            }
        }
        
        // Fonction pour attacher à la caméra
        function attachToCamera() {
            const camera = scene.activeCamera;
            if (camera) {
                searchPlane.parent = camera;
                console.log("📷 VR Search Panel 3D attached to camera");
            }
        }
        
        // Stocker les références
        searchPanelSystem.plane = searchPlane;
        searchPanelSystem.handleClick = handleClick;
        
        // Fonctions publiques
        searchPanelSystem.show = function() {
            console.log("👁️ VR: Showing hybrid search panel");
            searchPlane.isVisible = true;
            currentSearchText = "";
            keyboardVisible = false;
            updateVRDisplay();
            attachToCamera();
        };
        
        searchPanelSystem.hide = function() {
            console.log("🙈 VR: Hiding hybrid search panel");
            searchPlane.isVisible = false;
            hideKeyboard();
        };
        
        searchPanelSystem.toggle = function() {
            if (searchPlane.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        };
        
        searchPanelSystem.dispose = function() {
            if (searchTexture) searchTexture.dispose();
            if (searchMaterial) searchMaterial.dispose();
            if (searchPlane) searchPlane.dispose();
            if (vrInput) {
                document.body.removeChild(vrInput);
                vrInput = null;
            }
        };
        
        // Initialiser l'affichage
        updateVRDisplay();
        
        console.log("✅ VR Hybrid Search (invisible input + 3D panel) created successfully");
        return searchPanelSystem;
        
    } catch (error) {
        console.error("❌ Error creating VR Hybrid Search:", error);
        return null;
    }
}

//scene.debugLayer.show()

// === NOUVELLES FONCTIONNALITÉS REPVAL INTÉGRÉES ===

// Configuration des images par niveau (1-13)
const defaultImageConfiguration = {
    1: '1blackhole.png',
    2: '2blackhole.png',
    3: '3whitehole.png',
    4: '4nebuleuse.png',
    5: '5etoile.png',
    6: '6etoile.png',
    7: '7neutronstar.png',
    8: '8planet.png',
    9: '9planet.png',
    10: '10protoplanet.png',
    11: '11moon.png',
    12: '12asteroid.png',
    13: '13asteroid.png'
};

// Variables globales pour le système RepVal
let currentImageConfiguration = {...defaultImageConfiguration};
let spriteLevel = {}; // Stocker le niveau de chaque sprite par son nom
let orbitingSprites = []; // Sprites en orbite
let centralSprites = []; // Sprites centraux (niveau élevé)

// Fonction pour charger la configuration d'images depuis localStorage avec nettoyage
function loadImageConfiguration() {
    try {
        const saved = localStorage.getItem('spriteImageConfig'); // Même clé que le sélecteur
        if (saved) {
            const parsed = JSON.parse(saved);
            let needsCleaning = false;
            const cleanedConfig = {...defaultImageConfiguration};
            
            // Nettoyer la configuration : supprimer les références aux noms de fichiers d'images personnalisées
            for (let level = 1; level <= 13; level++) {
                const configValue = parsed[level];
                
                if (configValue && configValue.startsWith('custom_') && !configValue.startsWith('data:')) {
                    // C'est un ancien nom de fichier d'image personnalisée, le supprimer
                    console.warn(`🧹 Nettoyage: suppression de l'ancienne référence ${configValue} pour le niveau ${level}`);
                    cleanedConfig[level] = defaultImageConfiguration[level];
                    needsCleaning = true;
                } else if (configValue && (configValue.startsWith('data:') || !configValue.startsWith('custom_'))) {
                    // C'est soit un data URL (image personnalisée valide) soit une image prédéfinie
                    cleanedConfig[level] = configValue;
                } else {
                    // Utiliser l'image par défaut
                    cleanedConfig[level] = defaultImageConfiguration[level];
                }
            }
            
            currentImageConfiguration = cleanedConfig;
            
            // Sauvegarder la configuration nettoyée
            if (needsCleaning) {
                localStorage.setItem('spriteImageConfig', JSON.stringify(cleanedConfig));
                console.log('✅ Configuration nettoyée et sauvegardée');
            }
            
            console.log('🖼️ Configuration d\'images chargée depuis localStorage:', currentImageConfiguration);
        } else {
            console.log('🖼️ Aucune configuration sauvegardée, utilisation des valeurs par défaut');
        }
    } catch (error) {
        console.warn('❌ Erreur lors du chargement de la configuration d\'images:', error);
        currentImageConfiguration = {...defaultImageConfiguration};
    }
}

// Fonction pour charger les images personnalisées depuis localStorage
function loadCustomImages() {
    try {
        const saved = localStorage.getItem('customImages');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des images personnalisées:', error);
    }
    return [];
}

// Fonction pour obtenir l'URL d'une image (prédéfinie ou personnalisée)
function getImageUrl(imageName) {
    // Vérifier si c'est déjà un data URL
    if (imageName && imageName.startsWith('data:')) {
        console.log(`🎯 Image déjà en data URL: ${imageName.substring(0, 50)}...`);
        return imageName;
    }
    
    // Vérifier si c'est une image personnalisée par son nom
    const customImages = loadCustomImages();
    const customImage = customImages.find(img => img.name === imageName);
    
    if (customImage) {
        console.log(`🎨 Image personnalisée trouvée: ${imageName} -> data URL`);
        return customImage.dataUrl;
    }
    
    // Sinon, c'est une image prédéfinie
    console.log(`📁 Image prédéfinie: ${imageName}`);
    return imageName;
}

// Cache pour les textures créées à partir de data URLs
const textureCache = new Map();

// Fonction pour créer une texture Babylon.js à partir d'un data URL
function createTextureFromDataUrl(dataUrl, name, scene) {
    // Vérifier le cache d'abord
    if (textureCache.has(dataUrl)) {
        console.log(`🎯 Texture trouvée dans le cache pour ${name}`);
        return textureCache.get(dataUrl);
    }
    
    try {
        console.log(`🎨 Création d'une texture directement depuis data URL pour ${name}`);
        
        // Babylon.js peut utiliser directement les data URLs comme source de texture
        const texture = new BABYLON.Texture(dataUrl, scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        
        // Configuration de la texture
        texture.name = name;
        texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        
        // Mettre en cache
        textureCache.set(dataUrl, texture);
        
        console.log(`✅ Texture créée avec succès pour ${name} directement depuis data URL`);
        return texture;
        
    } catch (error) {
        console.error(`❌ Erreur lors de la création de texture directe pour ${name}:`, error);
        
        // Fallback : créer une texture dynamique avec canvas
        try {
            console.log(`🔄 Fallback: création avec canvas pour ${name}`);
            
            // Créer une texture dynamique
            const dynamicTexture = new BABYLON.DynamicTexture(name, {width: 640, height: 640}, scene);
            
            // Créer un canvas temporaire
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            canvas.width = 640;
            canvas.height = 640;
            
            img.onload = function() {
                // Dessiner l'image sur le canvas
                ctx.drawImage(img, 0, 0, 640, 640);
                
                // Copier vers la texture dynamique
                const imageData = ctx.getImageData(0, 0, 640, 640);
                dynamicTexture.getContext().putImageData(imageData, 0, 0);
                dynamicTexture.update();
                
                console.log(`✅ Texture fallback créée pour ${name}`);
            };
            
            img.onerror = function() {
                console.error(`❌ Erreur fallback pour ${name}`);
            };
            
            img.src = dataUrl;
            
            // Mettre en cache
            textureCache.set(dataUrl, dynamicTexture);
            return dynamicTexture;
            
        } catch (fallbackError) {
            console.error(`❌ Erreur fallback pour ${name}:`, fallbackError);
            return null;
        }
    }
}

// Fonction pour créer un blob URL temporaire à partir d'un data URL (alternative)
function createTemporaryBlobUrl(dataUrl, name) {
    try {
        // Convertir le data URL en blob
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], {type: mimeString});
        const blobUrl = URL.createObjectURL(blob);
        
        console.log(`🔗 Blob URL temporaire créé pour ${name}: ${blobUrl.substring(0, 50)}...`);
        return blobUrl;
        
    } catch (error) {
        console.error(`❌ Erreur création blob URL pour ${name}:`, error);
        return null;
    }
}

// Fonction pour recharger avec la nouvelle configuration d'images - VERSION CORRIGÉE
function reloadWithNewImageConfiguration() {
    console.log('🔄🔄🔄 DEBUT RECHARGEMENT CONFIGURATION IMAGES 🔄🔄🔄');
    
    try {
        // Recharger la configuration
        console.log('Étape 1: Chargement configuration...');
        loadImageConfiguration();
        console.log('✅ Configuration chargée:', currentImageConfiguration);
        
        // Vérifier si des données sont chargées
        const sprites = getAllSprites();
        console.log('✅ getAllSprites() retourne:', sprites.length, 'sprites');
        
        if (sprites && sprites.length > 0) {
            console.log(`🔄 Mise à jour de ${sprites.length} sprites avec nouvelle configuration...`);
            
            let updateCount = 0;
            // Mettre à jour les tailles et couleurs selon les nouveaux niveaux
            sprites.forEach((sprite, index) => {
                try {
                    const spriteName = sprite.name;
                    const level = spriteLevel[spriteName] || 7;
                    
                    // Appliquer la nouvelle taille avec sécurité
                    if (typeof getSizeForLevel === 'function') {
                        const newSize = getSizeForLevel(level);
                        sprite.size = newSize;
                    }
                    
                    // Appliquer la nouvelle couleur de niveau avec sécurité
                    if (typeof getLevelColor === 'function' && typeof getColor === 'function') {
                        const baseColor = getColor(sprite.metadata?.subType || 'default');
                        const levelColor = getLevelColor(level, baseColor);
                        sprite.color = new BABYLON.Color4(levelColor.r, levelColor.g, levelColor.b, 1);
                    }
                    
                    updateCount++;
                } catch (spriteError) {
                    console.warn(`❌ Erreur mise à jour sprite ${sprite.name}:`, spriteError);
                }
            });
            
            console.log(`✅ ${updateCount}/${sprites.length} sprites mis à jour avec succès`);
            
            // Afficher notification dans le DOM
            const statusMsg = document.getElementById('statusMessage');
            if (statusMsg) {
                statusMsg.innerHTML = `🎨 Configuration appliquée ! ${updateCount} sprites mis à jour.`;
                statusMsg.style.backgroundColor = '#e8f5e8';
                setTimeout(() => {
                    statusMsg.style.backgroundColor = '#e3f2fd';
                }, 3000);
            }
            
        } else {
            // NOUVELLE GESTION : Aucune donnée chargée
            console.warn('⚠️ Aucune donnée chargée - Configuration sauvegardée pour la prochaine fois');
            
            // Afficher notification expliquant le problème
            const statusMsg = document.getElementById('statusMessage');
            if (statusMsg) {
                statusMsg.innerHTML = '⚠️ Veuillez d\'abord charger un fichier de données, puis utiliser le sélecteur d\'images.';
                statusMsg.style.backgroundColor = '#fff3e0';
                setTimeout(() => {
                    statusMsg.style.backgroundColor = '#e3f2fd';
                }, 5000);
            }
            
            // La configuration est quand même sauvegardée pour quand les données seront chargées
            console.log('ℹ️ Configuration sauvegardée - sera appliquée au prochain chargement de données');
        }
        
    } catch (error) {
        console.error('❌ ERREUR CRITIQUE lors du rechargement de la configuration:', error);
    }
    
    console.log('🔄🔄🔄 FIN RECHARGEMENT CONFIGURATION IMAGES 🔄🔄🔄');
}

// Exposer la fonction globalement pour le sélecteur d'images - VÉRIFICATION
window.reloadWithNewImageConfiguration = reloadWithNewImageConfiguration;
console.log('✅ Fonction reloadWithNewImageConfiguration exposée globalement:', typeof window.reloadWithNewImageConfiguration);

// Écouter les changements de configuration via localStorage
window.addEventListener('storage', function(event) {
    if (event.key === 'spriteImageConfigUpdate') {
        console.log('🔔 Changement de configuration détecté via localStorage');
        setTimeout(() => {
            reloadWithNewImageConfiguration();
        }, 100); // Petit délai pour s'assurer que la config est sauvegardée
    }
});

// Écouter aussi les changements directs de la configuration
setInterval(() => {
    const saved = localStorage.getItem('spriteImageConfig');
    if (saved) {
        try {
            const newConfig = JSON.parse(saved);
            const currentConfigStr = JSON.stringify(currentImageConfiguration);
            const newConfigStr = JSON.stringify(newConfig);
            
            if (currentConfigStr !== newConfigStr) {
                console.log('🔄 Configuration d\'images modifiée détectée');
                reloadWithNewImageConfiguration();
            }
        } catch (error) {
            // Ignorer les erreurs de parsing
        }
    }
}, 2000); // Vérifier toutes les 2 secondes

// Fonction pour sauvegarder la configuration d'images
function saveImageConfiguration() {
    try {
        localStorage.setItem('spriteImageConfig', JSON.stringify(currentImageConfiguration));
        console.log('Configuration d\'images sauvegardée');
    } catch (error) {
        console.warn('Erreur lors de la sauvegarde:', error);
    }
}

// Fonction pour obtenir l'image par niveau
function getImageForLevel(level) {
    const clampedLevel = Math.max(1, Math.min(13, Math.round(level)));
    const imageName = currentImageConfiguration[clampedLevel] || defaultImageConfiguration[clampedLevel] || 'etoile2.png';
    return getImageUrl(imageName); // Résoudre l'URL correcte (prédéfinie ou personnalisée)
}

// Fonction pour calculer la taille par niveau
function getSizeForLevel(level) {
    const clampedLevel = Math.max(1, Math.min(13, Math.round(level)));
    if (clampedLevel === 1) {
        return 12; // Taille spéciale pour niveau 1 (trou noir)
    } else {
        return Math.max(1, 6.5 - (clampedLevel * 0.5));
    }
}

// Fonction pour calculer la distance d'orbite selon le niveau
function getOrbitDistance(level) {
    const clampedLevel = Math.max(1, Math.min(13, Math.round(level)));
    return 15 + (clampedLevel * 3); // Distance de base + facteur par niveau
}

// Fonction pour obtenir une couleur enrichie selon le niveau
function getLevelColor(level, baseColor) {
    const clampedLevel = Math.max(1, Math.min(13, Math.round(level)));
    
    // Couleurs par niveau avec influence sur la couleur de base
    const levelColorModifiers = {
        1: { r: 0.1, g: 0.0, b: 0.0, intensity: 0.9 }, // Trou noir - très sombre
        2: { r: 0.8, g: 0.2, b: 0.9, intensity: 0.8 }, // Nébuleuse - violet
        3: { r: 1.0, g: 0.9, b: 0.2, intensity: 0.9 }, // Étoile - jaune/blanc
        4: { r: 0.3, g: 0.5, b: 0.8, intensity: 0.7 }, // Planète - bleu
        5: { r: 0.7, g: 0.7, b: 0.7, intensity: 0.6 }, // Lune - gris
        6: { r: 0.9, g: 0.7, b: 0.3, intensity: 0.6 }, // Comète - orange
        7: { r: 0.5, g: 0.4, b: 0.3, intensity: 0.5 }, // Astéroïde - brun
        8: { r: 0.6, g: 0.6, b: 0.6, intensity: 0.5 }, // Satellite - métallique
        9: { r: 0.4, g: 0.3, b: 0.2, intensity: 0.4 }, // Débris - sombre
        10: { r: 0.7, g: 0.5, b: 0.4, intensity: 0.4 }, // Particule - poussière
        11: { r: 0.6, g: 0.4, b: 0.3, intensity: 0.3 }, // Poussière - terre
        12: { r: 0.5, g: 0.7, b: 0.9, intensity: 0.3 }, // Gaz - bleu clair
        13: { r: 0.9, g: 0.9, b: 0.9, intensity: 0.2 }  // Énergie - blanc transparent
    };
    
    const modifier = levelColorModifiers[clampedLevel] || levelColorModifiers[7];
    const intensity = modifier.intensity;
    
    // Mélanger la couleur de base avec la couleur du niveau
    return {
        r: (baseColor.r * (1 - intensity)) + (modifier.r * intensity),
        g: (baseColor.g * (1 - intensity)) + (modifier.g * intensity),
        b: (baseColor.b * (1 - intensity)) + (modifier.b * intensity)
    };
}

// Fonction pour assigner un niveau aléatoire aux sprites existants
function assignRandomLevels() {
    const sprites = getAllSprites();
    if (!sprites || sprites.length === 0) {
        console.log('Aucun sprite disponible pour assigner des niveaux');
        return;
    }
    
    console.log(`Assignation de niveaux aléatoires à ${sprites.length} sprites`);
    
    sprites.forEach(sprite => {
        if (!spriteLevel[sprite.name]) {
            // Assignation pondérée : plus de sprites de niveau élevé (moins importantes)
            const rand = Math.random();
            let level;
            if (rand < 0.02) level = 1;      // 2% - Trous noirs (très rares)
            else if (rand < 0.05) level = 2; // 3% - Nébuleuses
            else if (rand < 0.10) level = 3; // 5% - Étoiles
            else if (rand < 0.20) level = 4; // 10% - Planètes
            else if (rand < 0.35) level = 5; // 15% - Lunes
            else if (rand < 0.50) level = 6; // 15% - Comètes
            else if (rand < 0.65) level = 7; // 15% - Astéroïdes
            else if (rand < 0.75) level = 8; // 10% - Satellites
            else if (rand < 0.85) level = 9; // 10% - Débris
            else if (rand < 0.92) level = 10; // 7% - Particules
            else if (rand < 0.96) level = 11; // 4% - Poussière
            else if (rand < 0.99) level = 12; // 3% - Gaz
            else level = 13;                  // 1% - Énergie
            
            spriteLevel[sprite.name] = level;
        }
    });
    
    console.log('Niveaux aléatoires assignés. Exemples:');
    const examples = sprites.slice(0, 5);
    examples.forEach(sprite => {
        console.log(`  ${sprite.name}: niveau ${spriteLevel[sprite.name]}`);
    });
}

// Fonction pour identifier les sprites centraux et orbitants
function categorizeSprites() {
    if (!scene.spriteManagers[0] || !scene.spriteManagers[0].sprites) {
        return;
    }
    
    const sprites = scene.spriteManagers[0].sprites;
    centralSprites = [];
    orbitingSprites = [];
    
    sprites.forEach(sprite => {
        const level = spriteLevel[sprite.name] || 7; // Niveau par défaut
        
        if (level <= 4) {
            // Niveaux 1-4 sont des objets centraux (trous noirs, nébuleuses, étoiles, planètes)
            centralSprites.push({
                sprite: sprite,
                level: level,
                orbiters: []
            });
        } else {
            // Niveaux 5-13 orbitent autour des objets centraux
            orbitingSprites.push({
                sprite: sprite,
                level: level,
                centralSprite: null,
                orbitAngle: Math.random() * Math.PI * 2,
                orbitSpeed: 0.001 + (Math.random() * 0.002), // Vitesse variable
                orbitDistance: getOrbitDistance(level)
            });
        }
    });
    
    // Assigner les sprites orbitants aux centraux les plus proches
    orbitingSprites.forEach(orbiter => {
        let closestCentral = null;
        let minDistance = Infinity;
        
        centralSprites.forEach(central => {
            const distance = BABYLON.Vector3.Distance(
                orbiter.sprite.originalPosition || orbiter.sprite.position,
                central.sprite.originalPosition || central.sprite.position
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestCentral = central;
            }
        });
        
        if (closestCentral) {
            orbiter.centralSprite = closestCentral.sprite;
            closestCentral.orbiters.push(orbiter);
        }
    });
    
    console.log(`Catégorisation terminée: ${centralSprites.length} centraux, ${orbitingSprites.length} orbitants`);
}

// Fonction pour mettre à jour les positions orbitales - TEMPORAIREMENT DÉSACTIVÉE POUR STABILITÉ
function updateOrbitalPositions() {
    // DÉSACTIVÉ TEMPORAIREMENT pour corriger les bugs de mouvement
    return;
    
    if (!orbitingSprites || orbitingSprites.length === 0) return;
    
    try {
        const time = performance.now() * 0.001; // Temps en secondes
        
        orbitingSprites.forEach(orbiter => {
            if (orbiter && orbiter.centralSprite && orbiter.sprite && orbiter.sprite.isVisible) {
                const central = orbiter.centralSprite;
                const currentScale = scene.currentScaleValue || 1.0;
                const scaleFactor = 1.0 / currentScale;
                
                // Position centrale avec scale appliqué
                const centralPos = central.originalPosition ?
                    central.originalPosition.clone().scale(scaleFactor) :
                    central.position.clone();
                
                // Calculer la position orbitale avec animation réduite
                orbiter.orbitAngle += orbiter.orbitSpeed * 0.1; // Vitesse réduite
                const orbitRadius = orbiter.orbitDistance * scaleFactor * 0.5; // Rayon réduit
                
                const orbitX = centralPos.x + Math.cos(orbiter.orbitAngle) * orbitRadius;
                const orbitY = centralPos.y + Math.sin(orbiter.orbitAngle * 0.7) * (orbitRadius * 0.3);
                const orbitZ = centralPos.z + Math.sin(orbiter.orbitAngle) * orbitRadius;
                
                // Animation réduite pour éviter les sauts
                const animOffset = 0.1;
                orbiter.sprite.position.x = orbitX + animOffset * Math.sin(time + orbiter.sprite.name.length);
                orbiter.sprite.position.y = orbitY + animOffset * Math.cos(time + orbiter.sprite.name.length);
                orbiter.sprite.position.z = orbitZ + animOffset * Math.sin(time + orbiter.sprite.name.length);
            }
        });
    } catch (error) {
        console.warn('Erreur dans updateOrbitalPositions:', error);
    }
}

// === FONCTIONS UTILITAIRES POUR COMPATIBILITÉ ===

// Fonction utilitaire pour récupérer tous les sprites - SYSTÈME MULTI-MANAGERS
function getAllSprites() {
    const allSprites = [];
    
    // Utiliser tous les sprite managers
    if (window.spriteManagersByLevel) {
        Object.values(window.spriteManagersByLevel).forEach(manager => {
            if (manager && manager.sprites) {
                allSprites.push(...manager.sprites);
            }
        });
        if (allSprites.length > 0) {
            return allSprites;
        }
    }
    
    // Fallback aux anciennes méthodes
    if (scene.spriteManagers && scene.spriteManagers.length > 0) {
        scene.spriteManagers.forEach(manager => {
            if (manager && manager.sprites) {
                allSprites.push(...manager.sprites);
            }
        });
        if (allSprites.length > 0) {
            return allSprites;
        }
    }
    
    if (window.labelSpriteManager && window.labelSpriteManager.sprites) {
        return window.labelSpriteManager.sprites;
    }
    
    if (labelSprites && labelSprites.length > 0) {
        return labelSprites;
    }
    
    return allSprites;
}

// Fonction utilitaire pour récupérer tous les sprite managers (compatibilité)
function getAllSpriteManagers() {
    if (window.spriteManagersByLevel) {
        // Nouveau système RepVal
        return Object.values(spriteManagersByLevel);
    } else if (scene.spriteManagers) {
        // Ancien système
        return scene.spriteManagers;
    }
    return [];
}

// Mise à jour globale pour compatibilité avec l'ancien code - SYSTÈME MULTI-MANAGERS
function updateLegacySpriteReferences() {
    // S'assurer que scene.spriteManagers existe
    if (!scene.spriteManagers) {
        scene.spriteManagers = [];
    }
    
    // Créer un sprite manager virtuel qui combine tous les sprites
    if (window.spriteManagersByLevel) {
        const allSprites = getAllSprites();
        
        // Créer un objet manager virtuel avec tous les sprites
        const virtualManager = {
            sprites: allSprites,
            isPickable: true
        };
        
        scene.spriteManagers[0] = virtualManager;
        console.log(`✅ Référence sprite manager mise à jour avec ${allSprites.length} sprites de ${Object.keys(window.spriteManagersByLevel).length} managers`);
    } else if (window.labelSpriteManager) {
        scene.spriteManagers[0] = window.labelSpriteManager;
        console.log(`✅ Référence sprite manager mise à jour (fallback)`);
    }
}

// Test de communication avec le sélecteur au démarrage
setTimeout(() => {
    console.log('🔍 Test de communication avec le sélecteur d\'images...');
    const testConfig = localStorage.getItem('spriteImageConfig');
    if (testConfig) {
        try {
            const config = JSON.parse(testConfig);
            console.log('✅ Configuration trouvée dans localStorage:', config);
        } catch (error) {
            console.log('⚠️ Configuration corrompue dans localStorage');
        }
    } else {
        console.log('ℹ️ Aucune configuration personnalisée trouvée - utilisation des valeurs par défaut');
    }
}, 2000);

// Amélioration de la vérification des changements de config
let lastConfigCheck = '';
setInterval(() => {
    try {
        const saved = localStorage.getItem('spriteImageConfig');
        if (saved && saved !== lastConfigCheck) {
            console.log('🔄 Nouvelle configuration détectée, rechargement...');
            lastConfigCheck = saved;
            reloadWithNewImageConfiguration();
        }
    } catch (error) {
        console.warn('Erreur vérification config:', error);
    }
}, 1000);

// Fonction de nettoyage du localStorage pour supprimer les anciennes configurations problématiques
function cleanupOldImageConfigurations() {
    try {
        console.log('🧹 Nettoyage des anciennes configurations d\'images...');
        
        const saved = localStorage.getItem('spriteImageConfig');
        if (saved) {
            const config = JSON.parse(saved);
            let hasOldReferences = false;
            
            // Vérifier s'il y a des anciennes références à des noms de fichiers
            for (let level = 1; level <= 13; level++) {
                const value = config[level];
                if (value && value.startsWith('custom_') && !value.startsWith('data:')) {
                    hasOldReferences = true;
                    console.log(`🗑️ Ancienne référence trouvée: ${value}`);
                }
            }
            
            if (hasOldReferences) {
                console.log('🔄 Suppression de la configuration corrompue...');
                localStorage.removeItem('spriteImageConfig');
                console.log('✅ Configuration corrompue supprimée, utilisation des valeurs par défaut');
                
                // Déclencher une notification
                setTimeout(() => {
                    const statusMsg = document.getElementById('statusMessage');
                    if (statusMsg) {
                        statusMsg.innerHTML = '🧹 Configuration d\'images nettoyée - Anciennes références supprimées';
                        statusMsg.style.backgroundColor = '#fff3e0';
                    }
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
    }
}

// Exécuter le nettoyage au démarrage
cleanupOldImageConfigurations();

console.log('✅ Nouvelles fonctionnalités RepVal intégrées - Système orbital, niveaux et images');