import { io } from "socket.io-client";

const socket = io(); // connects to same origin; in dev, proxy sends it to server

socket.on("connect", () => {
  console.log("connected:", socket.id);
  socket.emit("ping");
});

socket.on("pong", () => {
  console.log("got pong from server");
});



import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat"
import { Character } from "./game/character/character";
import { Player } from "./game/character/player";
import { InputHandler } from "./game/state/inputHandler";
import { AnimationLibrary } from "./game/animation/animation-library";

await RAPIER.init();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.01, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(new THREE.Color(0x000000));
document.body.appendChild(renderer.domElement);

const gravity = {x: 0, y: -9.81, z: 0};
const world = new RAPIER.World(gravity);

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444));
scene.add(new THREE.AmbientLight(new THREE.Color(1, 1, 1), 1));
scene.add(new THREE.DirectionalLight(0xffffff, 2));

const inputHandler = new InputHandler(document);

const animationLibrary = new AnimationLibrary();
await animationLibrary.loadAll();

const player = new Player();
await player.init();

scene.add(player.mesh);




function addMap() {
  const groundGeo = new THREE.BoxGeometry(100, 1, 100);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  scene.add(groundMesh);
  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(RAPIER.ColliderDesc.cuboid(50, 0.5, 50), groundBody);





  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2); // small cubes

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction); // forward direction

  let count = 10;
  for (let i = 0; i < count; i++) {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });

    const cube = new THREE.Mesh(geometry, material);

    // Base position = in front of camera
    const distance = 2 + Math.random() * 3; // 2–5 units ahead

    const basePos = new THREE.Vector3()
        .copy(camera.position)
        .add(direction.clone().multiplyScalar(distance));

    // Add small random spread
    basePos.x += (Math.random() - 0.5) * 2;
    basePos.y += (Math.random() - 0.5) * 2 + 1;
    basePos.z += (Math.random() - 0.5) * 2;

    cube.position.copy(basePos);

    scene.add(cube);
  }
}

addMap();









let accumulator = 0;
const fixedTimeStep = 1 / 165;

let lastTime = 0;
function renderGame() {
  requestAnimationFrame(renderGame);


  let currentTime = performance.now();
  const dt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  accumulator += dt;

  while (accumulator >= fixedTimeStep) {
    player.update(fixedTimeStep);
    world.step();
    accumulator -= fixedTimeStep;
  }

  renderer.render(scene, camera);
}

renderGame();


export { world, scene, camera, renderer, inputHandler, animationLibrary };