// Import necessary components from Three.js
import { Lensflare, LensflareElement } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/objects/Lensflare.js';
import { CameraManager } from './CameraManager.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/postprocessing/SMAAPass.js';
import { BufferGeometryUtils } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/utils/BufferGeometryUtils.js';


// NOTE: We no longer import Tween.js here. It's loaded via the <script> tag in index.html,
// which makes the `TWEEN` object globally available.

// Scene, Camera, and Renderer
let scene, renderer, cameraManager, composer;

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

const planetFacts = {
    sun: `<ul><li><strong>A Puzzling Past:</strong> Standard science suggests the Sun was 30% dimmer billions of years ago. This "Faint Young Sun Paradox" poses a problem: Earth should have been frozen, but geological records show liquid water was present. From a creationist view, this paradox disappears if the Sun and Earth are only thousands of years old.</li><li><strong>The Angular Momentum Problem:</strong> If the solar system formed from a spinning cloud, the Sun should have most of the rotational momentum. Instead, the planets have 98% of it. This observation challenges the standard nebular hypothesis.</li><li><strong>Created on Day Four:</strong> The biblical account in Genesis states that the Earth was created on Day One, while the Sun, the "greater light," was created on Day Four. This is interpreted as a theological statement to show that God, not the Sun, is the ultimate source of light and life.</li></ul>`,
    mercury: `<ul><li><strong>Impossibly Dense:</strong> Mercury has a massive iron core that makes up about 85% of its radius. Standard formation models struggle to explain this, leading to theories of a giant impact stripping away its outer layers.</li><li><strong>A "Living" Magnetic Field:</strong> Scientists were surprised to find Mercury has a global magnetic field. According to old-universe models, its small core should have frozen solid eons ago, shutting off any magnetic dynamo.</li><li><strong>A Successful Prediction:</strong> In 1984, creationist physicist Dr. Russell Humphreys predicted that Mercury's magnetic field would be decaying rapidly. In 2011, the MESSENGER probe confirmed a significant drop in strength, matching the prediction based on a young-age model.</li></ul>`,
    venus: `<ul><li><strong>The Backward Planet:</strong> Venus rotates backward (retrograde) compared to every other planet except Uranus. This directly challenges the nebular hypothesis, which predicts all planets should spin in the same direction.</li><li><strong>A "Young" Surface:</strong> Venus has a surprisingly low number of impact craters, suggesting the entire planet was catastrophically resurfaced by lava in the relatively recent past, which aligns better with a young-universe timeline.</li><li><strong>A Divine Contrast to Earth:</strong> Venus is a hellish world, seen as a deliberate design choice to highlight Earth's unique, fine-tuned habitability.</li></ul>`,
    earth: `<ul><li><strong>The Receding Moon:</strong> The Moon is slowly moving away from Earth. Extrapolating this back, the Moon would have been touching the Earth just 1.5 billion years ago, a major problem for the 4.5-billion-year age model.</li><li><strong>A Decaying Shield:</strong> Earth's magnetic field has been measurably decaying, challenging theories of a multi-billion-year-old planet.</li><li><strong>Flood Geology:</strong> The global flood described in Genesis is considered the primary geological event that shaped our planet, depositing most sedimentary rock layers and fossils in a short, catastrophic period.</li></ul>`,
    mars: `<ul><li><strong>Monuments to a Flood:</strong> The colossal volcanoes of the Tharsis region, including Olympus Mons, are interpreted as the engines of a past global flood on Mars, releasing immense quantities of water vapor.</li><li><strong>A Global Scar:</strong> Valles Marineris is viewed as evidence of a rapid, catastrophic event, not slow erosion over billions of years.</li><li><strong>Earth's Uniqueness:</strong> Mars's sterile, hostile environment highlights the unique and intentional design of Earth as the sole cradle of life in the solar system.</li></ul>`,
    jupiter: `<ul><li><strong>The Planet That Shouldn't Exist:</strong> A forming Jupiter should have spiraled into the sun in less than a million years according to standard models. Its existence challenges these theories.</li><li><strong>Too Hot for Its Age:</strong> Jupiter radiates nearly twice as much heat as it receives from the Sun, consistent with a young planet still radiating the energy of its recent creation.</li><li><strong>Active Moons as "Clocks":</strong> Io's extreme volcanism and Ganymede's "impossible" magnetic field suggest these moons are thousands, not billions, of years old.</li></ul>`,
    saturn: `<ul><li><strong>Impossibly Young Rings:</strong> Saturn's rings are 99.8% pure water ice and are actively disintegrating. Their purity and transient nature are a stunning confirmation of a young solar system.</li><li><strong>A Magnetic Mystery:</strong> Saturn's magnetic field is almost perfectly aligned with its spin axis, contradicting standard dynamo theory which requires a tilt to be sustained for billions of years.</li><li><strong>Enceladus's Geysers:</strong> This small, icy moon erupts massive geysers from a subsurface ocean. This intense, ongoing activity is impossible to sustain for billions of years.</li></ul>`,
    uranus: `<ul><li><strong>The Sideways Planet:</strong> Uranus is tilted on its side by 98 degrees. The proposed "giant impact" solution is contradicted by its circular orbit and orderly moons.</li><li><strong>A Confirmed Creationist Prediction:</strong> In 1984, creationist physicist Dr. Russell Humphreys successfully predicted the strength of Uranus's magnetic field before the Voyager 2 probe's measurement in 1986.</li><li><strong>The Cold Twin:</strong> Unlike its "twin" Neptune, Uranus radiates very little internal heat, challenging the idea that they formed through the same uniform process.</li></ul>`,
    neptune: `<ul><li><strong>The Planet That Shouldn't Exist:</strong> At its distance, there wasn't enough material for a planet of Neptune's mass to form in 4.5 billion years according to standard models.</li><li><strong>A Powerful Internal Engine:</strong> Neptune radiates 2.6 times more energy than it receives from the sun, direct evidence that the planet is young and still hot.</li><li><strong>Fragile Ring Arcs:</strong> Neptune's clumpy ring arcs should spread out and disappear in a very short time. Their existence points to a young system.</li></ul>`,
    pluto: `<ul><li><strong>A Failed Prediction:</strong> Old-age models predicted Pluto would be a dead, cratered world. New Horizons revealed it to be stunningly active, a failure for the old-age paradigm.</li><li><strong>A Youthful Surface:</strong> The vast, crater-free glacier on Pluto (Sputnik Planitia) is powerful evidence that the entire world is young.</li><li><strong>Chaotic Moons:</strong> Pluto's smaller moons tumble erratically. This indicates the system is not gravitationally settled and therefore cannot be billions of years old.</li></ul>`
};

const planetData = [
    { name: 'Mercury', texture: 'assets/2k_mercury.jpg', size: 0.38, distance: 58, speed: 0.04, moons: [], lightIntensity: 0.9 },
    { name: 'Venus', texture: 'assets/2k_venus_surface.jpg', size: 0.95, distance: 108, speed: 0.035, moons: [], lightIntensity: 0.9 },
    { name: 'Earth', texture: 'assets/2k_earth_daymap.jpg', size: 1, distance: 150, speed: 0.03, moons: [
        { name: 'Moon', texture: 'assets/2k_moon.jpg', size: 0.27, distance: 5, speed: 0.1 }
    ], lightIntensity: 1.2 },
    { name: 'Mars', texture: 'assets/2k_mars.jpg', size: 0.53, distance: 228, speed: 0.024, moons: [
        { name: 'Phobos', texture: 'https://www.solarsystemscope.com/textures/download/phobos.jpg', size: 0.01, distance: 2, speed: 0.2 },
        { name: 'Deimos', texture: 'https://www.solarsystemscope.com/textures/download/deimos.jpg', size: 0.006, distance: 3, speed: 0.15 }
    ], lightIntensity: 0.9 },
    { name: 'Jupiter', texture: 'assets/2k_jupiter.jpg', size: 11.2, distance: 778, speed: 0.013, moons: [
        { name: 'Io', texture: 'https://www.solarsystemscope.com/textures/download/io.jpg', size: 0.3, distance: 15, speed: 0.1 },
        { name: 'Europa', texture: 'https://www.solarsystemscope.com/textures/download/europa.jpg', size: 0.25, distance: 20, speed: 0.08 },
        { name: 'Ganymede', texture: 'https://www.solarsystemscope.com/textures/download/ganymede.jpg', size: 0.4, distance: 25, speed: 0.06 },
        { name: 'Callisto', texture: 'https://www.solarsystemscope.com/textures/download/callisto.jpg', size: 0.38, distance: 30, speed: 0.05 }
    ], hasRing: true, ringColor: 0xffa500, ringOpacity: 0.2, lightIntensity: 1.2 },
    { name: 'Saturn', texture: 'assets/2k_saturn.jpg', size: 9.45, distance: 1427, speed: 0.009, moons: [], hasRing: true, ringColor: 0xffffff, ringOpacity: 0.8, lightIntensity: 1.2 },
    { name: 'Uranus', texture: 'assets/2k_uranus.jpg', size: 4, distance: 2871, speed: 0.006, moons: [], hasRing: true, ringColor: 0xadd8e6, ringOpacity: 0.4, lightIntensity: 1.5 },
    { name: 'Neptune', texture: 'assets/2k_neptune.jpg', size: 3.88, distance: 4497, speed: 0.005, moons: [], hasRing: true, ringColor: 0xadd8e6, ringOpacity: 0.3, lightIntensity: 2.0 },
    { name: 'Pluto', texture: 'assets/2k_pluto.jpg', size: 0.18, distance: 5913, speed: 0.004, moons: [], lightIntensity: 1.5 }
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
    renderer.toneMappingExposure = 0.4;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    cameraManager = new CameraManager(scene, renderer);
    cameraManager.camera.layers.enableAll(); // Ensure camera sees all layers, including Pluto's special light layer
    
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05); // Very subtle ambient light
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
    const sunMaterial = new THREE.MeshStandardMaterial({
        map: sunTexture,
        emissiveMap: sunTexture,
        emissive: 0xffffee,
        emissiveIntensity: 3.5
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = { name: 'Sun', isPlanet: true, size: 20 };
    scene.add(sun);
    celestialBodies.push(sun);



    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, cameraManager.camera));

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.5, 0.8);
    composer.addPass(bloomPass);

    const smaaPass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
    composer.addPass(smaaPass);

    createPlanets();
    createAsteroidBelt();
    createComets();
    setupUI();
    window.addEventListener('resize', onWindowResize, false);
}

function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
}

function createParticleRing(particleCount, innerRadius, outerRadius, thickness) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (outerRadius - innerRadius) + innerRadius;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * thickness;
        positions.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
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

        // Create a dedicated light for each planet
        if (data.lightIntensity) {
            const light = new THREE.DirectionalLight(0xffffff, data.lightIntensity);
            light.visible = false; // Start with the light off
            planet.userData.light = light; // Store light in userData
            scene.add(light); // Add to scene so it can be controlled
            scene.add(light.target); // Target also needs to be in the scene
        }

        celestialBodies.push(planet);

        const orbitRingGeometry = new THREE.RingGeometry(data.distance - 0.2, data.distance + 0.2, 256);
        const orbitRingMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.1 });
        const orbitRing = new THREE.Mesh(orbitRingGeometry, orbitRingMaterial);
        orbitRing.rotation.x = Math.PI / 2;
        scene.add(orbitRing);

        if (data.hasRing) {
            const particleCount = 10000;
            const ringGeometry = createParticleRing(particleCount, data.size * 1.2, data.size * 2, 0.1);
            const ringMaterial = new THREE.PointsMaterial({
                size: 0.1,
                map: createParticleTexture(),
                transparent: true,
                opacity: data.ringOpacity,
                color: data.ringColor,
                blending: THREE.AdditiveBlending
            });
            const ring = new THREE.Points(ringGeometry, ringMaterial);
            planet.add(ring);
            ring.userData.isRing = true;
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
        material = new THREE.MeshStandardMaterial({
            map: textureLoader.load(data.texture),
            normalMap: textureLoader.load('assets/2k_earth_normal.jpg'),
            roughnessMap: textureLoader.load('assets/2k_earth_specular.jpg'),
            emissiveMap: textureLoader.load('assets/2k_earth_nightmap.jpg'),
            emissive: 0xffffff,
            emissiveIntensity: 1,
            metalness: 0.1
        });

        const cloudsGeometry = new THREE.SphereGeometry(data.size * 1.01, 32, 32);
        const cloudsMaterial = new THREE.MeshStandardMaterial({
            map: textureLoader.load('assets/2k_earth_clouds.jpg'),
            transparent: true,
            opacity: 0.5,
            metalness: 0.1,
            roughness: 0.8
        });
        const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
        clouds.userData.isClouds = true;
        clouds.receiveShadow = true;

        body = new THREE.Mesh(geometry, material);
        body.add(clouds);

    } else if (data.name === 'Venus') {
        material = new THREE.MeshStandardMaterial({ map: textureLoader.load(data.texture) });
        body = new THREE.Mesh(geometry, material);

        const atmosphereGeometry = new THREE.SphereGeometry(data.size * 1.01, 32, 32);
        const atmosphereMaterial = new THREE.MeshStandardMaterial({
            map: textureLoader.load('assets/2k_venus_atmosphere.jpg'),
            transparent: true,
            opacity: 0.5,
            metalness: 0.1,
            roughness: 0.8
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.userData.isClouds = true; // Re-use the same flag for animation
        atmosphere.receiveShadow = true;

        body.add(atmosphere);

    } else {
        const texture = textureLoader.load(textureBaseUrl + data.texture);
        material = new THREE.MeshStandardMaterial({ map: texture });
        body = new THREE.Mesh(geometry, material);
    }
    
    const wireframeGeom = new THREE.WireframeGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 });
    body.add(new THREE.LineSegments(wireframeGeom, wireframeMat));

    body.castShadow = true;
    body.receiveShadow = true;

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
    const learnMoreButton = document.getElementById('learn-more-button');
    const planetInfoPanel = document.getElementById('planet-info-panel');
    const planetInfoTitle = document.getElementById('planet-info-title');
    const planetInfoContent = document.getElementById('planet-info-content');
    const planetInfoClose = document.getElementById('planet-info-close');

    celestialBodies.filter(b => b.userData.name === 'Sun').forEach(body => addBodyToList(body, planetList));
    celestialBodies.filter(b => b.userData.name !== 'Sun' && b.userData.isPlanet).forEach(body => addBodyToList(body, planetList));

    document.getElementById('toggle-nav').addEventListener('click', () => {
        cameraManager.switchToFreeRoam();
        learnMoreButton.style.display = 'none';
        planetInfoPanel.style.display = 'none';
    });

    planetInfoClose.addEventListener('click', () => {
        planetInfoPanel.style.display = 'none';
    });
}

function addBodyToList(body, listElement) {
    const li = document.createElement('li');
    li.textContent = body.userData.name;
    li.onclick = () => {
        cameraManager.setFocus(body);
        const planetName = body.userData.name;
        const learnMoreButton = document.getElementById('learn-more-button');
        learnMoreButton.textContent = `Learn more about ${planetName}`;
        learnMoreButton.style.display = 'block';

        learnMoreButton.onclick = () => {
            const planetInfoPanel = document.getElementById('planet-info-panel');
            const planetInfoTitle = document.getElementById('planet-info-title');
            const planetInfoContent = document.getElementById('planet-info-content');

            planetInfoTitle.textContent = planetName;
            planetInfoContent.innerHTML = planetFacts[planetName.toLowerCase()];
            planetInfoPanel.style.display = 'block';
        };
    };
    listElement.appendChild(li);
}

function onWindowResize() {
    cameraManager.onWindowResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    TWEEN.update(time);

    const delta = 0.05;

    celestialBodies.forEach(body => {
        if (body.userData.orbit) {
            body.userData.orbit.rotation.y += body.userData.speed * 0.01;
        }
        // Retrograde rotation for Venus, prograde for others
        if (body.userData.name === 'Venus') {
            body.rotation.y -= 0.005;
        } else {
            body.rotation.y += 0.005;
        }

        // Animate clouds, atmospheres, and rings
        if (body.children.length > 0) {
            body.children.forEach(child => {
                if (child.userData.isClouds) {
                    // Venus's atmosphere also has retrograde rotation
                    if (body.userData.name === 'Venus') {
                        child.rotation.y -= 0.001;
                    } else {
                        child.rotation.y += 0.001;
                    }
                }
                if (child.userData.isRing) {
                    child.rotation.y += 0.002;
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

    // --- Light Management ---
    const sunPosition = new THREE.Vector3();
    sun.getWorldPosition(sunPosition);

    // Disable all planetary lights by default
    celestialBodies.forEach(body => {
        if (body.userData.light) {
            body.userData.light.visible = false;
            body.userData.light.castShadow = false;
        }
    });

    // Enable and position the light for the currently focused planet
    const focusedPlanet = cameraManager.focusedPlanet;
    if (focusedPlanet && focusedPlanet.userData.light) {
        const activeLight = focusedPlanet.userData.light;
        activeLight.visible = true;
        activeLight.position.copy(sunPosition);
        activeLight.target = focusedPlanet;

        // Configure and enable shadows for the active light
        activeLight.castShadow = true;
        activeLight.shadow.mapSize.width = 2048;
        activeLight.shadow.mapSize.height = 2048;
    }

    cameraManager.update();
    // Spin the asteroid belt
    if (asteroidBelt) {
        asteroidBelt.rotation.y += 0.001; // Adjust this value for speed
    }
    composer.render();
}
