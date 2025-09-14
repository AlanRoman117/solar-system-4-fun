import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/PointerLockControls.js';

// TWEEN is loaded globally from index.html
const TWEEN = window.TWEEN;

function isTouchDevice() {
    return (('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0));
}

class CameraManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.domElement = renderer.domElement;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
        this.camera.position.z = 200;

        // Controls
        this.pointerLockControls = new PointerLockControls(this.camera, this.domElement);
        this.orbitControls = new OrbitControls(this.camera, this.domElement);

        this.scene.add(this.pointerLockControls.getObject());

        // State
        this.isTransitioning = false;
        this.focusedPlanet = null;
        this.isFreeRoam = true;

        // Touch controls state
        this.isDragging = false;
        this.previousTouch = { x: 0, y: 0 };
        this.touchSensitivity = 0.005;

        this.initEventListeners();
        this.enableFreeRoamControls(); // Start in free roam
    }

    initEventListeners() {
        if (isTouchDevice()) {
            this.domElement.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
            this.domElement.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
            this.domElement.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
        } else {
            this.domElement.addEventListener('click', () => {
                if (this.isFreeRoam && !this.pointerLockControls.isLocked) {
                    this.pointerLockControls.lock();
                }
            });
        }
    }

    handleTouchStart(event) {
        if (!this.isFreeRoam || event.touches.length !== 1) return;
        this.isDragging = true;
        this.previousTouch.x = event.touches[0].clientX;
        this.previousTouch.y = event.touches[0].clientY;
    }

    handleTouchMove(event) {
        if (!this.isFreeRoam || !this.isDragging || event.touches.length !== 1) return;

        const touch = event.touches[0];
        const deltaX = touch.clientX - this.previousTouch.x;
        const deltaY = touch.clientY - this.previousTouch.y;

        this.pointerLockControls.getObject().rotation.y -= deltaX * this.touchSensitivity;
        this.pointerLockControls.getObject().rotation.x -= deltaY * this.touchSensitivity;

        // Clamp vertical rotation to avoid flipping
        this.pointerLockControls.getObject().rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pointerLockControls.getObject().rotation.x));

        this.previousTouch.x = touch.clientX;
        this.previousTouch.y = touch.clientY;
    }

    handleTouchEnd(event) {
        this.isDragging = false;
    }

    enableFreeRoamControls() {
        this.isFreeRoam = true;
        this.focusedPlanet = null;
        this.isTransitioning = false;

        if (!isTouchDevice()) {
            this.pointerLockControls.unlock();
            document.getElementById('controls-info').style.display = 'block';
        }

        this.orbitControls.enabled = false;
    }

    enableOrbitControls(planet) {
        this.isFreeRoam = false;
        this.focusedPlanet = planet;

        this.pointerLockControls.unlock();
        this.orbitControls.enabled = true;

        const targetPosition = new THREE.Vector3();
        planet.getWorldPosition(targetPosition);
        this.orbitControls.target.copy(targetPosition);

        this.orbitControls.maxDistance = planet.userData.size * 10;
        this.orbitControls.minDistance = planet.userData.size * 1.5;
        this.orbitControls.enablePan = false;

        document.getElementById('controls-info').style.display = 'none';
    }

    setFocus(planet) {
        if (this.isTransitioning || (planet === this.focusedPlanet && !this.isFreeRoam)) return;

        TWEEN.removeAll();
        this.isTransitioning = true;
        this.focusedPlanet = planet;
        this.isFreeRoam = false;

        this.pointerLockControls.unlock();
        this.orbitControls.enabled = false;
        document.getElementById('controls-info').style.display = 'none';

        this.transitionToPlanet(planet);
    }

    transitionToPlanet(planet) {
        const targetLookAt = new THREE.Vector3();
        planet.getWorldPosition(targetLookAt);

        // 1. Turn to look at the planet
        const startQuaternion = this.camera.quaternion.clone();
        const tempCamera = this.camera.clone();
        tempCamera.lookAt(targetLookAt);
        const endQuaternion = tempCamera.quaternion;

        new TWEEN.Tween({ t: 0 })
            .to({ t: 1 }, 1000)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate(({ t }) => {
                THREE.Quaternion.slerp(startQuaternion, endQuaternion, this.camera.quaternion, t);
            })
            .onComplete(() => {
                // 2. Move towards the planet
                this.moveCameraToPlanet(planet);
            })
            .start();
    }

    moveCameraToPlanet(planet) {
        const startPosition = this.camera.position.clone();

        const targetLookAt = new THREE.Vector3();
        planet.getWorldPosition(targetLookAt);

        const distance = planet.userData.size * 2.5;
        const direction = new THREE.Vector3().subVectors(this.camera.position, targetLookAt).normalize();
        const endPosition = new THREE.Vector3().addVectors(targetLookAt, direction.multiplyScalar(distance));

        const initialTargetLookAt = targetLookAt.clone();

        new TWEEN.Tween({ t: 0 })
            .to({ t: 1 }, 2000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(({ t }) => {
                // Move camera along the path
                this.camera.position.copy(startPosition).lerp(endPosition, t);

                // Keep looking at the (potentially moving) planet
                const currentTargetLookAt = new THREE.Vector3();
                planet.getWorldPosition(currentTargetLookAt);

                // Adjust end position based on planet's movement
                const delta = new THREE.Vector3().subVectors(currentTargetLookAt, initialTargetLookAt);
                const adjustedEndPosition = new THREE.Vector3().addVectors(endPosition, delta);
                this.camera.position.copy(startPosition).lerp(adjustedEndPosition, t);

                this.camera.lookAt(currentTargetLookAt);
            })
            .onComplete(() => {
                this.isTransitioning = false;
                this.enableOrbitControls(planet);
            })
            .start();
    }

    switchToFreeRoam() {
        if (this.isTransitioning) {
            TWEEN.removeAll();
        }
        this.enableFreeRoamControls();
    }

    update() {
        if (this.isFreeRoam) {
            // Free roam movement logic will be updated in main.js
        } else if (this.focusedPlanet && !this.isTransitioning) {
            const targetPosition = new THREE.Vector3();
            this.focusedPlanet.getWorldPosition(targetPosition);

            // Before OrbitControls updates the camera based on user input,
            // we calculate the camera's current offset from the target.
            const offset = new THREE.Vector3().subVectors(this.camera.position, this.orbitControls.target);

            // Then, we update the target to the planet's new position.
            this.orbitControls.target.copy(targetPosition);

            // And finally, we re-apply the offset to the new target position.
            // This effectively moves the camera with the planet.
            this.camera.position.copy(this.orbitControls.target).add(offset);

            this.orbitControls.update();
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}

export { CameraManager };
