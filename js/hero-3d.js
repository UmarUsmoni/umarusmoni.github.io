/**
 * hero-3d.js — Interactive 3D Cyber Sentinel Drone & WebGL Controller
 *
 * Sourced from Scenario Labs 3D Collection, rendered with local Three.js.
 * Features:
 * - GLTF binary model loader with fallback procedural cyber-core
 * - Smooth hover/drag rotation and levitation physics
 * - Interactive HUD controls (Wireframe mode, Scan Pulse, Camera Reset)
 * - Battery & GPU friendly (pauses render loop when scrolled offscreen)
 * - Strict CSP compliant (100% local, zero CDN requests)
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hero-3d-container');
  const canvas = document.getElementById('hero-3d-canvas');
  const loaderEl = document.getElementById('drone-loader');
  const btnWireframe = document.getElementById('hud-btn-wireframe');
  const btnScan = document.getElementById('hud-btn-scan');
  const btnReset = document.getElementById('hud-btn-reset');
  const hudStatus = document.getElementById('hud-status-text');

  if (!container || !canvas || typeof THREE === 'undefined') {
    if (loaderEl) loaderEl.style.display = 'none';
    return;
  }

  // 1. Scene, Camera, Renderer Setup
  const scene = new THREE.Scene();

  const width = container.clientWidth || 450;
  const height = container.clientHeight || 450;

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 0.4, 4.2);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    console.warn('WebGL init failed, aborting 3D hero:', e);
    if (loaderEl) loaderEl.style.display = 'none';
    return;
  }

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (renderer.outputEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  // 2. Cyber Lights
  const ambientLight = new THREE.AmbientLight(0xdfffe8, 0.85);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(2, 4, 3);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x00ff88, 3.2, 10);
  rimLight.position.set(-2.5, -1, 2);
  scene.add(rimLight);

  const cyanLight = new THREE.PointLight(0x00e5ff, 3.0, 10);
  cyanLight.position.set(2.5, 1.5, -1.5);
  scene.add(cyanLight);

  const purpleUnderlight = new THREE.PointLight(0xa855f7, 2.0, 8);
  purpleUnderlight.position.set(0, -2.5, 0);
  scene.add(purpleUnderlight);

  // 3. Scan Hologram Ring (Floor plane grid)
  const ringGeo = new THREE.RingGeometry(1.2, 1.25, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = -1.1;
  scene.add(ringMesh);

  // 4. Model & Material Storage
  let dronePivot = new THREE.Group();
  scene.add(dronePivot);

  let droneModel = null;
  const originalMaterials = new Map();
  let isWireframe = false;
  let isScanning = false;
  let scanProgress = 0;

  // Wireframe material for Cyber-Holo mode
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    wireframe: true,
    transparent: true,
    opacity: 0.85
  });

  // 5. Load 3D GLTF Drone Model
  const gltfLoader = new THREE.GLTFLoader();
  const MODEL_URL = 'assets/3d/drone.glb';

  function createFallbackProceduralCore() {
    const group = new THREE.Group();

    // Outer icosahedron cage
    const outerGeo = new THREE.IcosahedronGeometry(1.0, 1);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    // Inner glowing sphere core
    const innerGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.9
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    // Orbital cryptographic rings
    const ring1Geo = new THREE.TorusGeometry(1.35, 0.02, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    group.add(ring1);

    dronePivot.add(group);
    droneModel = group;

    if (loaderEl) loaderEl.style.display = 'none';
    if (hudStatus) hudStatus.textContent = 'ONLINE [HOLO-CORE]';
  }

  gltfLoader.load(
    MODEL_URL,
    (gltf) => {
      droneModel = gltf.scene;

      // Center bounding box and scale to ~2.2 units
      const box = new THREE.Box3().setFromObject(droneModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.4 / maxDim;

      droneModel.position.x = -center.x * scale;
      droneModel.position.y = -center.y * scale;
      droneModel.position.z = -center.z * scale;
      droneModel.scale.setScalar(scale);

      // Save original materials & enable shadows
      droneModel.traverse((child) => {
        if (child.isMesh && child.material) {
          originalMaterials.set(child, child.material);
          if (child.material.isMeshStandardMaterial) {
            child.material.envMapIntensity = 1.0;
            child.material.roughness = Math.min(child.material.roughness, 0.6);
          }
        }
      });

      dronePivot.add(droneModel);

      // Slight natural initial tilt towards viewer
      dronePivot.rotation.x = 0.15;
      dronePivot.rotation.y = -0.4;

      if (loaderEl) loaderEl.style.display = 'none';
      if (hudStatus) hudStatus.textContent = 'ONLINE [SENTINEL DRONE]';
    },
    undefined,
    (error) => {
      console.warn('Could not load drone.glb, activating procedural core:', error);
      createFallbackProceduralCore();
    }
  );

  // 6. Interaction & Mouse Physics
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let targetRotX = 0.15;
  let targetRotY = -0.4;
  let targetZoom = 4.2;

  const clock = new THREE.Clock();

  function onPointerDown(e) {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  }

  function onPointerMove(e) {
    if (isDragging) {
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      targetRotY += deltaX * 0.008;
      targetRotX += deltaY * 0.008;
      targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    } else {
      // Gentle parallax tracking when hovering
      const rect = container.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = -0.4 + normX * 0.7;
      targetRotX = 0.15 + normY * 0.4;
    }
  }

  function onPointerUp() {
    isDragging = false;
  }

  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);

  // 7. Interactive HUD Controls
  if (btnWireframe) {
    btnWireframe.addEventListener('click', () => {
      if (typeof window.playClickSound === 'function') window.playClickSound(1.3);
      isWireframe = !isWireframe;

      if (droneModel) {
        droneModel.traverse((child) => {
          if (child.isMesh) {
            if (isWireframe) {
              child.material = wireframeMaterial;
            } else {
              const orig = originalMaterials.get(child);
              if (orig) child.material = orig;
            }
          }
        });
      }

      btnWireframe.classList.toggle('active', isWireframe);
      const span = btnWireframe.querySelector('span');
      if (span) span.textContent = isWireframe ? 'PBR Solid' : 'Wireframe';
      if (hudStatus) hudStatus.textContent = isWireframe ? 'MODE [HOLO-WIRE]' : 'MODE [PBR-SOLID]';
    });
  }

  if (btnScan) {
    btnScan.addEventListener('click', () => {
      if (typeof window.playClickSound === 'function') window.playClickSound(0.8);
      isScanning = true;
      scanProgress = 0;
      btnScan.disabled = true;
      btnScan.style.opacity = '0.5';

      rimLight.intensity = 6.0;
      cyanLight.intensity = 6.0;

      if (hudStatus) hudStatus.textContent = 'SCANNING FREQUENCIES...';

      setTimeout(() => {
        isScanning = false;
        rimLight.intensity = 3.2;
        cyanLight.intensity = 3.0;
        btnScan.disabled = false;
        btnScan.style.opacity = '1';
        if (hudStatus) hudStatus.textContent = 'SCAN COMPLETE [CALIBRATED]';
        if (typeof window.playClickSound === 'function') window.playClickSound(1.4);
      }, 1800);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (typeof window.playClickSound === 'function') window.playClickSound(1.1);
      targetRotX = 0.15;
      targetRotY = -0.4;
      camera.position.set(0, 0.4, 4.2);
      if (hudStatus) hudStatus.textContent = 'CAMERA RESET [ORIGIN]';
    });
  }

  // 8. Viewport Visibility & Resize Observer
  let isVisible = true;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
      });
    },
    { threshold: 0.1 }
  );
  observer.observe(container);

  function onResize() {
    if (!container || !renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', onResize, { passive: true });

  // 9. Main Render Loop
  function animate() {
    requestAnimationFrame(animate);

    if (!isVisible) return; // Skip rendering when Hero is scrolled out of view

    const elapsed = clock.getElapsedTime();

    // Smooth rotational lerping
    dronePivot.rotation.x += (targetRotX - dronePivot.rotation.x) * 0.08;
    dronePivot.rotation.y += (targetRotY - dronePivot.rotation.y) * 0.08;

    // Levitation bobbing physics
    dronePivot.position.y = Math.sin(elapsed * 1.8) * 0.08;

    // Ring subtle pulse
    if (ringMesh) {
      ringMesh.rotation.z = elapsed * 0.3;
      ringMat.opacity = 0.25 + Math.sin(elapsed * 2.5) * 0.15;
    }

    // Active scan wave animation
    if (isScanning) {
      scanProgress += 0.04;
      ringMesh.scale.setScalar(1 + Math.sin(scanProgress * 4) * 0.3);
    } else {
      ringMesh.scale.setScalar(1);
    }

    renderer.render(scene, camera);
  }

  animate();
});
