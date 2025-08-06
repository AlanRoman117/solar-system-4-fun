3D Solar System Navigator
An interactive and educational 3D solar system simulation built with modern web technologies. Explore our solar system with cinematic camera transitions, realistic celestial bodies, and dynamic elements like a detailed asteroid belt and flying comets.

✨ Features
Interactive 3D Solar System: A fully rendered 3D model of our solar system, including the Sun, all major planets, and their primary moons.

Dual Navigation Modes:

Free Roam: Manually fly through space using WASD for movement and the mouse to look around. Includes basic collision detection to prevent clipping through celestial bodies.

Cinematic List-Driven Navigation: Select a planet or the Sun from the list to trigger a smooth, seamless camera flight. The camera arcs gracefully through space, avoiding collisions and providing a continuous, single-camera experience.

Realistic Celestial Bodies & Orbits:

Planets and moons orbit their parent bodies at different speeds.

High-resolution textures from SolarSystemScope for a detailed and realistic appearance.

Saturn's rings are rendered with transparency.

Dynamic Elements:

Asteroid Belt: A dense field of thousands of individual, rotating asteroids orbits the Sun between Mars and Jupiter.

Flying Comets: Multiple comets travel along their own long, elliptical orbits, each with a glowing head and a wispy tail that always points away from the Sun.

Stunning Visuals:

Breathtaking Skybox: A high-resolution panoramic texture of the Milky Way galaxy serves as the background, creating an immersive experience.

Sun Effects: The Sun emits light, glows, and features a dynamic lens flare effect.

Visible Orbit Rings: Each planet has a semi-transparent ring to clearly visualize its orbital path.

🛠️ Tech Stack
Core: HTML5, CSS3, JavaScript (ES6 Modules)

3D Graphics & Animation:

Three.js: A powerful JavaScript library for creating and displaying 3D graphics in a web browser using WebGL. It handles all aspects of the 3D scene, from object creation and texturing to lighting and rendering.

Tween.js: A simple animation library used to create the smooth, cinematic camera transitions between celestial bodies.

Assets:

Textures: SolarSystemScope.com

Fonts: Google Fonts ("Inter")

🚀 How to Run Locally
No complex setup is required. Simply open the index.html file in any modern web browser that supports WebGL.

Clone the repository:

git clone https://github.com/your-username/solar-system-navigator.git

Navigate to the project directory:

cd solar-system-navigator

Open index.html in your browser. For best performance, it's recommended to serve the file through a local web server to avoid potential issues with browser security policies.

🎮 How to Use
Toggle Navigation: Use the "Toggle Free Roam" button to switch between modes.

List-Driven Mode:

Click on any celestial body in the list on the left to initiate a cinematic flight to it.

Free Roam Mode:

W, A, S, D: Move the camera forward, left, backward, and right.

Mouse: Look around the 3D space.

Click: Lock the mouse pointer for camera control. Press Esc to unlock it.

🙏 Credits & Acknowledgements
Textures: All celestial body and background textures are courtesy of SolarSystemScope and are used under their specified license.

Libraries: This project would not be possible without the incredible work of the developers behind Three.js and Tween.js.
