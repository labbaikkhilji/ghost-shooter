// Renderer
const canvas = document.getElementById("gameCanvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 5;

// Light
const light = new THREE.PointLight(0xffffff, 2);
light.position.set(0, 4, 4);
scene.add(light);

// Gun
const gunGeo = new THREE.BoxGeometry(0.3, 0.2, 1);
const gunMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const gun = new THREE.Mesh(gunGeo, gunMat);
gun.position.set(0, -1.5, 2);
scene.add(gun);

// Ghosts
let ghosts = [];

// Lives
let lives = 3;
const livesText = document.getElementById("lives");

// Game Over
const gameOverScreen = document.getElementById("game-over");

// Update lives
function updateLives() {
    livesText.textContent = "Lives: " + lives;
    if (lives <= 0) {
        gameOverScreen.style.display = "flex";
    }
}

// Spawn Ghost anywhere
function spawnGhost() {
    const geo = new THREE.SphereGeometry(0.6, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });

    const ghost = new THREE.Mesh(geo, mat);

    // random position around the player
    ghost.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        -Math.random() * 10 - 5
    );

    scene.add(ghost);
    ghosts.push(ghost);
}

// Auto-aim & fire when clicked/touched
function autoShoot(event) {
    if (lives <= 0) return;

    // Get click/touch coordinates
    let x, y;
    if (event.touches && event.touches.length > 0) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }

    // Convert to normalized device coordinates
    const mouse = new THREE.Vector2(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(ghosts);

    if (intersects.length > 0) {
        const target = intersects[0].object;

        // Auto aim gun toward target
        const targetPos = new THREE.Vector3();
        target.getWorldPosition(targetPos);

        // Direction vector
        const dir = targetPos.clone().sub(gun.position).normalize();

        // Rotate gun toward target
        gun.lookAt(targetPos);

        // Fire immediately
        const flash = new THREE.PointLight(0xffaa00, 4, 4);
        flash.position.copy(gun.position);
        scene.add(flash);
        setTimeout(() => scene.remove(flash), 80);

        // Remove ghost
        scene.remove(target);
        ghosts = ghosts.filter(g => g !== target);
    }
}

// Animate ghosts toward player
function animate() {
    requestAnimationFrame(animate);

    ghosts.forEach(g => {
        g.position.z += 0.03;
        if (g.position.z >= 4) {
            scene.remove(g);
            ghosts = ghosts.filter(x => x !== g);
            lives--;
            updateLives();
        }
    });

    renderer.render(scene, camera);
}
animate();

// Events
window.addEventListener("click", autoShoot);
window.addEventListener("touchstart", autoShoot);

// Start game
document.getElementById("start-btn").addEventListener("click", () => {
    document.getElementById("start-screen").style.display = "none";
    setInterval(spawnGhost, 1400);
});

// Restart (works properly)
document.getElementById("restart-btn").addEventListener("click", () => {
    // Reset scene manually instead of reload
    ghosts.forEach(g => scene.remove(g));
    ghosts = [];
    lives = 3;
    updateLives();
    gameOverScreen.style.display = "none";
});
