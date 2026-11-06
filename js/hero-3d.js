/**
 * hero-3d.js — Interactive 3D WebGL Studio Controller
 *
 * Renders the local Scenario Labs GLB exploration model with Three.js:
 * - Centered optical framing with procedural fallback mesh
 * - Pointer orbit drag and subtle hover parallax
 * - Theme-reactive studio lighting (dark acid-lime / light botanical-olive)
 * - Accessible studio controls (Wireframe, Key-light sweep, Reset view)
 * - Pauses rendering offscreen and respects prefers-reduced-motion
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
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lightMediaQuery = window.matchMedia('(prefers-color-scheme: light)');

  if (!container || !canvas || typeof THREE === 'undefined') {
    if (loaderEl) loaderEl.style.display = 'none';
    return;
  }

  const DEFAULT_ROT_X = 0.08;
  const DEFAULT_ROT_Y = -0.52;

  const scene = new THREE.Scene();
  const initialWidth = container.clientWidth || 460;
  const initialHeight = container.clientHeight || 345;

  const camera = new THREE.PerspectiveCamera(38, initialWidth / initialHeight, 0.1, 100);
  camera.position.set(0, 0.72, 3.85);
  camera.lookAt(0, -0.05, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch {
    if (loaderEl) loaderEl.style.display = 'none';
    if (hudStatus) hudStatus.textContent = '3D PREVIEW UNAVAILABLE';
    return;
  }

  renderer.setSize(initialWidth, initialHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (renderer.outputEncoding !== undefined) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  // Studio Three-Point + Bounce Lighting
  const ambientLight = new THREE.AmbientLight(0xf4f1ea, 0.95);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xf6f3ea, 1.5);
  keyLight.position.set(2.4, 4.2, 3.2);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xc7f36b, 2.6, 11);
  rimLight.position.set(-2.6, 0.8, 2.2);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x77c9ad, 2.2, 11);
  fillLight.position.set(2.6, 1.4, -1.8);
  scene.add(fillLight);

  const bounceLight = new THREE.PointLight(0x26382b, 1.4, 8);
  bounceLight.position.set(0, -2.2, 0.5);
  scene.add(bounceLight);

  // Architectural Studio Turntable Pedestal
  const pedestalGroup = new THREE.Group();
  pedestalGroup.position.y = -0.82;
  scene.add(pedestalGroup);

  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0xc7f36b,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.34,
  });
  const outerRing = new THREE.Mesh(new THREE.RingGeometry(1.18, 1.21, 72), outerRingMat);
  outerRing.rotation.x = Math.PI / 2;
  pedestalGroup.add(outerRing);

  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0x77c9ad,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.2,
  });
  const innerRing = new THREE.Mesh(new THREE.RingGeometry(0.82, 0.835, 64), innerRingMat);
  innerRing.rotation.x = Math.PI / 2;
  pedestalGroup.add(innerRing);

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xc7f36b,
    wireframe: true,
    transparent: true,
    opacity: 0.88,
  });

  const isLightTheme = () => {
    const explicit = document.documentElement.dataset.theme;
    if (explicit === 'light') return true;
    if (explicit === 'dark') return false;
    return lightMediaQuery.matches;
  };

  let baseRimIntensity = 2.6;
  let baseFillIntensity = 2.2;

  const renderOnce = () => {
    renderer.render(scene, camera);
  };

  const applyThemePalette = () => {
    const light = isLightTheme();
    if (light) {
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 1.15;
      keyLight.color.setHex(0xffffff);
      keyLight.intensity = 1.65;
      rimLight.color.setHex(0x3b6412);
      fillLight.color.setHex(0x146b57);
      bounceLight.color.setHex(0xdfe7d6);
      baseRimIntensity = 2.1;
      baseFillIntensity = 1.8;
      outerRingMat.color.setHex(0x3b6412);
      innerRingMat.color.setHex(0x146b57);
      wireframeMaterial.color.setHex(0x2c4d0b);
    } else {
      ambientLight.color.setHex(0xf4f1ea);
      ambientLight.intensity = 0.95;
      keyLight.color.setHex(0xf6f3ea);
      keyLight.intensity = 1.5;
      rimLight.color.setHex(0xc7f36b);
      fillLight.color.setHex(0x77c9ad);
      bounceLight.color.setHex(0x26382b);
      baseRimIntensity = 2.6;
      baseFillIntensity = 2.2;
      outerRingMat.color.setHex(0xc7f36b);
      innerRingMat.color.setHex(0x77c9ad);
      wireframeMaterial.color.setHex(0xc7f36b);
    }
    rimLight.intensity = baseRimIntensity;
    fillLight.intensity = baseFillIntensity;
    renderOnce();
  };

  applyThemePalette();
  window.addEventListener('portfolio:themechange', applyThemePalette);
  lightMediaQuery.addEventListener('change', applyThemePalette);

  // Model Group & Loader
  const dronePivot = new THREE.Group();
  dronePivot.rotation.x = DEFAULT_ROT_X;
  dronePivot.rotation.y = DEFAULT_ROT_Y;
  scene.add(dronePivot);

  let droneModel = null;
  const originalMaterials = new Map();
  let isWireframe = false;
  let isSweepingLight = false;
  let sweepProgress = 0;

  const createProceduralStudioMesh = () => {
    const group = new THREE.Group();
    const outerMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.92, 1),
      new THREE.MeshStandardMaterial({
        color: 0xc7f36b,
        wireframe: true,
        roughness: 0.25,
        metalness: 0.75,
      })
    );
    const innerMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.54, 2),
      new THREE.MeshStandardMaterial({
        color: 0x77c9ad,
        roughness: 0.3,
        metalness: 0.82,
      })
    );
    originalMaterials.set(outerMesh, outerMesh.material);
    originalMaterials.set(innerMesh, innerMesh.material);
    group.add(outerMesh, innerMesh);
    dronePivot.add(group);
    droneModel = group;
    if (loaderEl) loaderEl.style.display = 'none';
    if (hudStatus) hudStatus.textContent = 'STUDIO · PROCEDURAL MESH';
    renderOnce();
  };

  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.load(
    'assets/3d/drone.glb',
    (gltf) => {
      droneModel = gltf.scene;

      const box = new THREE.Box3().setFromObject(droneModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.15 / maxDim;

      droneModel.position.set(-center.x * scale, -center.y * scale + 0.05, -center.z * scale);
      droneModel.scale.setScalar(scale);

      droneModel.traverse((child) => {
        if (child.isMesh && child.material) {
          originalMaterials.set(child, child.material);
          if (child.material.isMeshStandardMaterial) {
            child.material.envMapIntensity = 1.05;
            child.material.roughness = Math.min(child.material.roughness, 0.58);
          }
        }
      });

      dronePivot.add(droneModel);
      if (loaderEl) loaderEl.style.display = 'none';
      if (hudStatus) hudStatus.textContent = 'STUDIO · 3D READY';
      renderOnce();
    },
    undefined,
    () => {
      createProceduralStudioMesh();
    }
  );

  // Pointer Orbit & Subtle Hover Parallax
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let targetRotX = DEFAULT_ROT_X;
  let targetRotY = DEFAULT_ROT_Y;

  container.addEventListener('pointerdown', (event) => {
    isDragging = true;
    prevMouseX = event.clientX;
    prevMouseY = event.clientY;
  });

  window.addEventListener(
    'pointermove',
    (event) => {
      if (isDragging) {
        const deltaX = event.clientX - prevMouseX;
        const deltaY = event.clientY - prevMouseY;
        targetRotY += deltaX * 0.0085;
        targetRotX = Math.max(-0.48, Math.min(0.52, targetRotX + deltaY * 0.0085));
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
        if (reducedMotionQuery.matches) {
          dronePivot.rotation.x = targetRotX;
          dronePivot.rotation.y = targetRotY;
          renderOnce();
        }
      } else if (!reducedMotionQuery.matches) {
        const rect = container.getBoundingClientRect();
        if (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        ) {
          const normX = (event.clientX - rect.left) / rect.width - 0.5;
          const normY = (event.clientY - rect.top) / rect.height - 0.5;
          targetRotY = DEFAULT_ROT_Y + normX * 0.65;
          targetRotX = DEFAULT_ROT_X + normY * 0.32;
        }
      }
    },
    { passive: true }
  );

  window.addEventListener('pointerup', () => {
    isDragging = false;
  });

  // Studio Controls
  btnWireframe?.addEventListener('click', () => {
    isWireframe = !isWireframe;
    if (droneModel) {
      droneModel.traverse((child) => {
        if (!child.isMesh) return;
        if (isWireframe) {
          child.material = wireframeMaterial;
        } else {
          const orig = originalMaterials.get(child);
          if (orig) child.material = orig;
        }
      });
    }
    btnWireframe.classList.toggle('active', isWireframe);
    btnWireframe.setAttribute('aria-pressed', String(isWireframe));
    const label = btnWireframe.querySelector('span');
    if (label) label.textContent = isWireframe ? 'Solid PBR' : 'Wireframe';
    if (hudStatus) hudStatus.textContent = isWireframe ? 'VIEW · WIREFRAME' : 'VIEW · SOLID PBR';
    renderOnce();
  });

  btnScan?.addEventListener('click', () => {
    if (isSweepingLight) return;
    isSweepingLight = true;
    sweepProgress = 0;
    btnScan.disabled = true;
    btnScan.classList.add('active');
    rimLight.intensity = baseRimIntensity * 2.1;
    fillLight.intensity = baseFillIntensity * 2.0;
    if (hudStatus) hudStatus.textContent = 'LIGHTING · STUDIO SWEEP';
    renderOnce();

    window.setTimeout(() => {
      isSweepingLight = false;
      rimLight.intensity = baseRimIntensity;
      fillLight.intensity = baseFillIntensity;
      keyLight.position.set(2.4, 4.2, 3.2);
      btnScan.disabled = false;
      btnScan.classList.remove('active');
      if (hudStatus) hudStatus.textContent = 'STUDIO · 3D READY';
      renderOnce();
    }, 1400);
  });

  btnReset?.addEventListener('click', () => {
    targetRotX = DEFAULT_ROT_X;
    targetRotY = DEFAULT_ROT_Y;
    if (reducedMotionQuery.matches) {
      dronePivot.rotation.x = DEFAULT_ROT_X;
      dronePivot.rotation.y = DEFAULT_ROT_Y;
    }
    camera.position.set(0, 0.72, 3.85);
    camera.lookAt(0, -0.05, 0);
    if (hudStatus) hudStatus.textContent = 'VIEW · ORIGIN RESET';
    renderOnce();
  });

  // Visibility & Responsive Sizing
  let isVisible = true;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);
  }

  const onResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderOnce();
  };

  if ('ResizeObserver' in window) {
    new ResizeObserver(onResize).observe(container);
  } else {
    window.addEventListener('resize', onResize, { passive: true });
  }

  const clock = new THREE.Clock();

  const animate = () => {
    window.requestAnimationFrame(animate);
    if (!isVisible) return;
    if (reducedMotionQuery.matches && !isSweepingLight) return;

    const elapsed = clock.getElapsedTime();

    dronePivot.rotation.x += (targetRotX - dronePivot.rotation.x) * 0.085;
    dronePivot.rotation.y += (targetRotY - dronePivot.rotation.y) * 0.085;

    if (!reducedMotionQuery.matches) {
      dronePivot.position.y = Math.sin(elapsed * 1.6) * 0.045;
      outerRing.rotation.z = elapsed * 0.22;
      outerRingMat.opacity = 0.28 + Math.sin(elapsed * 2.0) * 0.08;
    }

    if (isSweepingLight) {
      sweepProgress += 0.06;
      keyLight.position.x = Math.cos(sweepProgress * 2.6) * 3.4;
      keyLight.position.z = Math.sin(sweepProgress * 2.6) * 3.4;
      outerRing.scale.setScalar(1 + Math.sin(sweepProgress * 3) * 0.08);
    } else {
      outerRing.scale.setScalar(1);
    }

    renderer.render(scene, camera);
  };

  animate();
});
