// Import necessary components from Three.js
import { Lensflare, LensflareElement } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/objects/Lensflare.js';
import { CameraManager } from './CameraManager.js';

// NOTE: We no longer import Tween.js here. It's loaded via the <script> tag in index.html,
// which makes the `TWEEN` object globally available.

// Scene, Camera, and Renderer
let scene, renderer, cameraManager;

// Celestial Bodies
const celestialBodies = [];
let sun;
let comets = [];
let asteroidBelt;

// Movement
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Texture URLs from SolarSystemScope
const textureBaseUrl = '';

const planetData = [
    { name: 'Mercury', texture: 'assets/2k_mercury.jpg', size: 0.38, distance: 58, speed: 0.04, moons: [] },
    { name: 'Venus', texture: 'assets/2k_venus_surface.jpg', size: 0.95, distance: 108, speed: 0.035, moons: [] },
    { name: 'Earth', texture: 'assets/2k_earth_daymap.jpg', size: 1, distance: 150, speed: 0.03, moons: [
        { name: 'Moon', texture: 'assets/2k_moon.jpg', size: 0.27, distance: 5, speed: 0.1 }
    ]},
    { name: 'Mars', texture: 'assets/2k_mars.jpg', size: 0.53, distance: 228, speed: 0.024, moons: [
        { name: 'Phobos', texture: 'https://www.solarsystemscope.com/textures/download/phobos.jpg', size: 0.01, distance: 2, speed: 0.2 },
        { name: 'Deimos', texture: 'https://www.solarsystemscope.com/textures/download/deimos.jpg', size: 0.006, distance: 3, speed: 0.15 }
    ]},
    { name: 'Jupiter', texture: 'assets/2k_jupiter.jpg', size: 11.2, distance: 778, speed: 0.013, moons: [
        { name: 'Io', texture: 'https://www.solarsystemscope.com/textures/download/io.jpg', size: 0.3, distance: 15, speed: 0.1 },
        { name: 'Europa', texture: 'https://www.solarsystemscope.com/textures/download/europa.jpg', size: 0.25, distance: 20, speed: 0.08 },
        { name: 'Ganymede', texture: 'https://www.solarsystemscope.com/textures/download/ganymede.jpg', size: 0.4, distance: 25, speed: 0.06 },
        { name: 'Callisto', texture: 'https://www.solarsystemscope.com/textures/download/callisto.jpg', size: 0.38, distance: 30, speed: 0.05 }
    ]},
    { name: 'Saturn', texture: 'assets/2k_saturn.jpg', size: 9.45, distance: 1427, speed: 0.009, moons: [], hasRing: true },
    { name: 'Uranus', texture: 'assets/2k_uranus.jpg', size: 4, distance: 2871, speed: 0.006, moons: [] },
    { name: 'Neptune', texture: 'assets/2k_neptune.jpg', size: 3.88, distance: 4497, speed: 0.005, moons: [] },
    { name: 'Pluto', texture: 'https://www.solarsystemscope.com/textures/download/pluto.jpg', size: 0.18, distance: 5913, speed: 0.004, moons: [] }
];

init();
animate();

function init() {
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;

    cameraManager = new CameraManager(scene, renderer);
    
    const onKey = (event, isDown) => {
        switch (event.code) {
            case 'KeyW': moveForward = isDown; break;
            case 'KeyA': moveLeft = isDown; break;
            case 'KeyS': moveBackward = isDown; break;
            case 'KeyD': moveRight = isDown; break;
        }
    };
    document.addEventListener('keydown', (e) => onKey(e, true));
    document.addEventListener('keyup', (e) => onKey(e, false));
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const textureLoader = new THREE.TextureLoader();

    // Load the high-resolution equirectangular texture
    const backgroundTexture = textureLoader.load('assets/8k_stars_milky_way.jpg',
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
            console.log("Skybox texture loaded and applied.");
        },
        undefined,
        () => {
            console.log("Skybox texture failed to load. Using black background.");
            scene.background = new THREE.Color(0x000000);
        }
    );

    const sunTexture = textureLoader.load('assets/2k_sun.jpg');
    const sunGeometry = new THREE.SphereGeometry(20, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = { name: 'Sun', isPlanet: true, size: 20 };
    scene.add(sun);
    celestialBodies.push(sun);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 20000);
    sun.add(pointLight);

    const textureFlare0 = textureLoader.load('https://cdn.rawgit.com/jeromeetienne/threex.planets/master/images/lensflare/lensflare0.png');
    const textureFlare3 = textureLoader.load('https://cdn.rawgit.com/jeromeetienne/threex.planets/master/images/lensflare/lensflare3.png');
    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(textureFlare0, 700, 0, pointLight.color));
    lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
    lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
    pointLight.add(lensflare);

    createPlanets();
    createAsteroidBelt();
    createComets();
    setupUI();
    window.addEventListener('resize', onWindowResize, false);
}

function createPlanets() {
    const textureLoader = new THREE.TextureLoader();
    planetData.forEach(data => {
        const planet = createCelestialBody(data);
        const orbit = new THREE.Object3D();
        orbit.add(planet);
        scene.add(orbit);
        planet.position.x = data.distance;
        planet.userData = { ...data, isPlanet: true, orbit };
        celestialBodies.push(planet);

        const orbitRingGeometry = new THREE.RingGeometry(data.distance - 0.2, data.distance + 0.2, 256);
        const orbitRingMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.1 });
        const orbitRing = new THREE.Mesh(orbitRingGeometry, orbitRingMaterial);
        orbitRing.rotation.x = Math.PI / 2;
        scene.add(orbitRing);

        if (data.hasRing) {
            const ringTexture = textureLoader.load('assets/2k_saturn_ring_alpha.png');
            const ringGeometry = new THREE.RingGeometry(data.size * 1.2, data.size * 2, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({ map: ringTexture, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
        }

        if (data.moons) {
            data.moons.forEach(moonData => {
                const moon = createCelestialBody(moonData);
                const moonOrbit = new THREE.Object3D();
                moonOrbit.add(moon);
                planet.add(moonOrbit);
                moon.position.x = moonData.distance;
                moon.userData = { ...moonData, isMoon: true, orbit: moonOrbit };
                celestialBodies.push(moon);
            });
        }
    });
}

function createCelestialBody(data) {
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    let material;
    let body;

    if (data.name === 'Earth') {
        material = new THREE.MeshPhongMaterial({
            map: textureLoader.load(data.texture),
            normalMap: textureLoader.load('assets/2k_earth_normal_map.tif'),
            specularMap: textureLoader.load('assets/2k_earth_specular_map.tif'),
            emissiveMap: textureLoader.load('assets/2k_earth_nightmap.jpg'),
            emissive: 0xffffff,
            emissiveIntensity: 1,
            shininess: 30
        });

        const cloudsGeometry = new THREE.SphereGeometry(data.size * 1.01, 32, 32);
        const cloudsMaterial = new THREE.MeshPhongMaterial({
            map: textureLoader.load('assets/2k_earth_clouds.jpg'),
            transparent: true,
            opacity: 0.5
        });
        const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        clouds.userData.isClouds = true;

        body = new THREE.Mesh(geometry, material);
        body.add(clouds);

    } else if (data.name === 'Venus') {
        material = new THREE.MeshStandardMaterial({ map: textureLoader.load(data.texture) });
        body = new THREE.Mesh(geometry, material);

        const atmosphereGeometry = new THREE.SphereGeometry(data.size * 1.01, 32, 32);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            map: textureLoader.load('assets/2k_venus_atmosphere.jpg'),
            transparent: true,
            opacity: 0.5
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.userData.isClouds = true; // Re-use the same flag for animation

        body.add(atmosphere);

    } else {
        const texture = textureLoader.load(textureBaseUrl + data.texture);
        material = new THREE.MeshStandardMaterial({ map: texture });
        body = new THREE.Mesh(geometry, material);
    }
    
    const wireframeGeom = new THREE.WireframeGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 });
    body.add(new THREE.LineSegments(wireframeGeom, wireframeMat));
    return body;
}

function createAsteroidBelt() {
    asteroidBelt = new THREE.Group();
    const asteroidCount = 5000;
    const beltInnerRadius = 300;
    const beltOuterRadius = 500;
    const beltHeight = 10; 

    for (let i = 0; i < asteroidCount; i++) {
        const size = Math.random() * 0.5 + 0.1;
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0x888888, flatShading: true });
        const asteroid = new THREE.Mesh(geometry, material);

        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (beltOuterRadius - beltInnerRadius) + beltInnerRadius;
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * beltHeight;

        asteroid.position.set(x, y, z);
        asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        
        asteroidBelt.add(asteroid);
    }
    scene.add(asteroidBelt);
}

function createComets() {
    const cometCount = 5;
    for (let i = 0; i < cometCount; i++) {
        const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const headMaterial = new THREE.MeshBasicMaterial({ color: 0xaaddff });
        const head = new THREE.Mesh(headGeometry, headMaterial);

        const tailGeometry = new THREE.BufferGeometry();
        const tailMaterial = new THREE.PointsMaterial({
            color: 0xaaddff,
            size: 0.2,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        const tailVertices = [];
        for (let j = 0; j < 100; j++) {
            tailVertices.push(0, 0, 0);
        }
        tailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tailVertices, 3));
        const tail = new THREE.Points(tailGeometry, tailMaterial);
        
        const comet = new THREE.Group();
        comet.add(head);
        comet.add(tail);

        const xRadius = Math.random() * 3000 + 1000;
        const zRadius = Math.random() * 3000 + 1000;
        const speed = (Math.random() * 0.0005 + 0.0001);
        const offset = Math.random() * Math.PI * 2;
        const inclination = (Math.random() - 0.5) * Math.PI * 0.5;

        comet.userData = { xRadius, zRadius, speed, offset, inclination, angle: 0, head, tail };
        
        scene.add(comet);
        comets.push(comet);
    }
}

function setupUI() {
    const planetList = document.getElementById('planet-list');
    celestialBodies.filter(b => b.userData.name === 'Sun').forEach(body => addBodyToList(body, planetList));
    celestialBodies.filter(b => b.userData.name !== 'Sun' && b.userData.isPlanet).forEach(body => addBodyToList(body, planetList));

    document.getElementById('toggle-nav').addEventListener('click', () => {
        cameraManager.switchToFreeRoam();
    });
}

function addBodyToList(body, listElement) {
    const li = document.createElement('li');
    li.textContent = body.userData.name;
    li.onclick = () => {
        cameraManager.setFocus(body);
    };
    listElement.appendChild(li);
}

function onWindowResize() {
    cameraManager.onWindowResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    TWEEN.update(time);

    const delta = 0.05;

    celestialBodies.forEach(body => {
        if (body.userData.orbit) {
            body.userData.orbit.rotation.y += body.userData.speed * 0.01;
        }
        body.rotation.y += 0.005;

        // Animate clouds
        if (body.children.length > 0) {
            body.children.forEach(child => {
                if (child.userData.isClouds) {
                    child.rotation.y += 0.001;
                }
            });
        }
    });

    comets.forEach(comet => {
        const data = comet.userData;
        data.angle += data.speed;
        
        const x = Math.cos(data.angle + data.offset) * data.xRadius;
        const z = Math.sin(data.angle + data.offset) * data.zRadius;
        comet.position.set(x, 0, z);
        comet.rotation.y = data.inclination;

        const tailPositions = data.tail.geometry.attributes.position.array;
        const headPosition = data.head.position;
        const sunDirection = comet.position.clone().normalize().multiplyScalar(-1);

        for (let i = 0; i < tailPositions.length; i += 3) {
            const particlePos = new THREE.Vector3(headPosition.x, headPosition.y, headPosition.z)
                .add(sunDirection.clone().multiplyScalar(i * 0.1));
            tailPositions[i] = particlePos.x;
            tailPositions[i+1] = particlePos.y;
            tailPositions[i+2] = particlePos.z;
        }
        data.tail.geometry.attributes.position.needsUpdate = true;
    });

    if (cameraManager.isFreeRoam) {
        if (cameraManager.pointerLockControls.isLocked) {
            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;
            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();

            if (moveForward || moveBackward) velocity.z -= direction.z * 40.0 * delta;
            if (moveLeft || moveRight) velocity.x -= direction.x * 40.0 * delta;

            const cameraDirection = new THREE.Vector3();
            cameraManager.camera.getWorldDirection(cameraDirection);
            const raycaster = new THREE.Raycaster(cameraManager.camera.position, cameraDirection);
            const intersections = raycaster.intersectObjects(celestialBodies, true);

            if (!intersections.length || intersections[0].distance > 5) {
                cameraManager.pointerLockControls.moveRight(-velocity.x * delta);
                cameraManager.pointerLockControls.moveForward(-velocity.z * delta);
            }
        }
    }

    cameraManager.update();
    // Spin the asteroid belt
    if (asteroidBelt) {
        asteroidBelt.rotation.y += 0.001; // Adjust this value for speed
    }
    renderer.render(scene, cameraManager.camera);
}
