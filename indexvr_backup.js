//http-server -c-1
//http-server -c-1 -S -C cert.pem -K key.pem
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
});
const scene = new BABYLON.Scene(engine);

// XR Setup - Simple and stable configuration (PRESERVE VR SYSTEM)
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

    // Toggle panel with X button (Quest 3) and handle trigger interactions
    xrHelper.input.onControllerAddedObservable.add(ctrl => {
        ctrl.onMotionControllerInitObservable.add(motionController => {
            if (motionController.handness === 'left') {
                // Debug: log all available components for this controller
                console.log("Left controller components:", Object.keys(motionController.components));
                const xButtonComponent = motionController.getComponent("x-button");
                if (xButtonComponent) {
                    xButtonComponent.onButtonStateChangedObservable.add(() => {
                        if (xButtonComponent.pressed) {
                            searchPanel.isVisible = !searchPanel.isVisible;
                            if (searchPanel.isVisible) {
                                inputText.text = "";
                                searchResultText.text = "";
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