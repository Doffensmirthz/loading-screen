import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

let scene, renderer, camera;
let objetos = [];

// BARRA
let barra;
let percentMesh = null;
const barraZ = 0;
const barraY = -9;
const barraHeight = 0.8;
const barraDepth = 0.5;
let fullWidthWorld = 0;

init();
animationLoop();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const numSpheres = 8;
  const radius = 4;
  const sphereSize = 0.5;

  for (let i = 0; i < numSpheres; i++) {
    const angle = (i / numSpheres) * 2 * Math.PI;
    const sphere = Esfera(
      radius * Math.cos(angle),
      radius * Math.sin(angle),
      0,
      sphereSize
    );

    const objData = { angle };
    const tween1 = new TWEEN.Tween(objData)
      .to({ angle: angle + 2 * Math.PI }, 4000)
      .onUpdate(() => {
        sphere.position.x = radius * Math.cos(objData.angle);
        sphere.position.y = radius * Math.sin(objData.angle);
        sphere.scale.set(
          1 + 0.3 * Math.cos(objData.angle * 1),
          1 + 8.3 * Math.sin(objData.angle * 1),
          15 * Math.sin(objData.angle * 1)
        );

        sphere.position.z = 8 * Math.sin(objData.angle * 3);

        sphere.material.color.setHSL(
          ((objData.angle / (2 * Math.PI)) * 3.14) % 1,
          1,
          0.5
        );
      })
      .repeat(Infinity)
      .start();
  }

  fullWidthWorld = getWorldWidthAtZ(barraZ);
  barra = Barra(
    -fullWidthWorld / 2,
    barraY,
    barraZ,
    0.001,
    barraHeight,
    barraDepth,
    0x00cc66
  );
  barra.scale.x = 0.0001;

  // Para evitar usar HTML (perezoso)
  const fontLoader = new FontLoader();
  fontLoader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    (font) => {
      createPercentTextMesh(font, "0%");
    }
  );

  const obj = { pct: 0 };
  const tween2 = new TWEEN.Tween(obj)
    .to({ pct: 100 }, 4000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => {
      const width = (obj.pct / 100) * fullWidthWorld;
      barra.scale.x = Math.max(0, width);
      const centerX = -fullWidthWorld / 2 + width / 2;
      if (percentMesh) {
        percentMesh.position.x = centerX;
      }
    })
    .repeat(Infinity)
    .start();

  window.addEventListener("resize", onWindowResize);
}

function Esfera(px, py, pz, size) {
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  objetos.push(mesh);
  return mesh;
}

function Barra(px, py, pz, width, height, depth, color = 0xff0000) {
  const geometry = new THREE.BoxGeometry(1, height, depth);
  geometry.translate(0.5, 0, 0); // pivot a la izquierda
  const material = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  return mesh;
}

function createPercentTextMesh(font, text) {
  if (percentMesh) {
    percentMesh.geometry.dispose();
    percentMesh.material.dispose();
    scene.remove(percentMesh);
    percentMesh = null;
  }

  const size = 1.0;
  const textGeo = new TextGeometry(text, {
    font: font,
    size: size,
    height: 0.05,
    curveSegments: 8,
    bevelEnabled: false,
  });
  textGeo.computeBoundingBox();
  const bb = textGeo.boundingBox;
  textGeo.translate(-(bb.max.x - bb.min.x) / 2, 0, 0);

  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  percentMesh = new THREE.Mesh(textGeo, mat);
  percentMesh.position.set(
    -fullWidthWorld / 2 + 0.001,
    barraY + barraHeight / 2 + 0.6,
    barraZ + 0.1
  );
  scene.add(percentMesh);

  // actualizar texto
  let lastRounded = NaN;
  const updateText = () => {
    const pct = Math.round(
      (barra.scale.x / Math.max(fullWidthWorld, 1e-6)) * 100
    );
    if (pct !== lastRounded) {
      lastRounded = pct;
      percentMesh.geometry.dispose();
      const newGeo = new TextGeometry(pct + "%", {
        font: font,
        size: size,
        height: 0.05,
        curveSegments: 8,
        bevelEnabled: false,
      });
      newGeo.computeBoundingBox();
      newGeo.translate(
        -(newGeo.boundingBox.max.x - newGeo.boundingBox.min.x) / 2,
        0,
        0
      );
      percentMesh.geometry = newGeo;
    }
    requestAnimationFrame(updateText);
  };
  requestAnimationFrame(updateText);
}

function getWorldWidthAtZ(z) {
  const dist = Math.abs(camera.position.z - z);
  const fovInRad = (camera.fov * Math.PI) / 180;
  const height = 2 * dist * Math.tan(fovInRad / 2);
  return height * camera.aspect;
}

function onWindowResize() {
  const currentWidth = barra.scale.x;
  const pct = fullWidthWorld > 0 ? currentWidth / fullWidthWorld : 0;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  fullWidthWorld = getWorldWidthAtZ(barraZ);
  barra.position.x = -fullWidthWorld / 2;
  barra.scale.x = pct * fullWidthWorld;

  if (percentMesh) {
    const centerX = -fullWidthWorld / 2 + barra.scale.x / 2;
    percentMesh.position.x = centerX;
  }
}

function animationLoop() {
  requestAnimationFrame(animationLoop);
  TWEEN.update();
  renderer.render(scene, camera);
}
