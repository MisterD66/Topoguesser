/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { AlpineLocation } from '../types/game';
import { getCalculatedPeaks, getCartographicElevation, CalculatedPeak } from '../utils/terrainElevation';
import { calculateSolarPosition, SolarPosition } from '../utils/solarCalculations';
import { loadDemElevationSampler, createDrapedAerialTexture } from '../utils/demTerrainLoader';
import { CompassTape } from './CompassTape';
import {
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Clock,
  Target,
} from 'lucide-react';

interface Horizon3DViewProps {
  location: AlpineLocation;
  headingDeg: number;
  onHeadingChange: (heading: number) => void;
  showCompassTape?: boolean;
  timeOfDayHour?: number;
  onTimeChange?: (hour: number) => void;
  isLiveTime?: boolean;
  onToggleLiveTime?: () => void;
  isCreatorMode?: boolean;
  hideCompassAndVisier?: boolean;
  className?: string;
}

export const Horizon3DView: React.FC<Horizon3DViewProps> = ({
  location,
  headingDeg,
  onHeadingChange,
  showCompassTape = true,
  timeOfDayHour = 14,
  onTimeChange,
  isLiveTime = false,
  onToggleLiveTime,
  isCreatorMode = false,
  hideCompassAndVisier = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Interaction & Camera parameters
  const [fovDeg, setFovDeg] = useState<number>(70);
  const [pitchDeg, setPitchDeg] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showTimeControls, setShowTimeControls] = useState<boolean>(false);
  const [showSightCrosshair, setShowSightCrosshair] = useState<boolean>(true);

  // Status for DEM elevation and HD Aerial orthophoto
  const [isDemLoading, setIsDemLoading] = useState<boolean>(false);
  const [isTextureLoading, setIsTextureLoading] = useState<boolean>(false);
  const [demActive, setDemActive] = useState<boolean>(false);

  // Drag tracking refs
  const dragStartRef = useRef<{ x: number; y: number; startHeading: number; startPitch: number } | null>(null);
  const headingRef = useRef<number>(headingDeg);
  const pitchRef = useRef<number>(pitchDeg);
  const fovRef = useRef<number>(fovDeg);

  headingRef.current = headingDeg;
  pitchRef.current = pitchDeg;
  fovRef.current = fovDeg;

  // Real geographic calculated peaks
  const calculatedPeaks = useMemo(() => {
    return getCalculatedPeaks(location);
  }, [location]);

  // Find peak currently in the crosshair (within 5.5° azimuth difference)
  const aimedPeak = useMemo(() => {
    for (const p of calculatedPeaks) {
      const azimDiff = Math.abs(((p.azimuthDeg - headingDeg + 180) % 360) - 180);
      if (azimDiff < 5.5) {
        return p;
      }
    }
    return null;
  }, [calculatedPeaks, headingDeg]);

  // Three.js instances ref
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    terrainMesh: THREE.Mesh | null;
    waterGroup: THREE.Group;
    peakMarkersGroup: THREE.Group;
    skyDomeMesh: THREE.Mesh | null;
    sunMesh: THREE.Mesh;
    starsMesh: THREE.Points;
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    animFrameId: number;
    currentTexture: THREE.CanvasTexture | null;
  } | null>(null);

  // Solar position
  const solar: SolarPosition = calculateSolarPosition(
    new Date(),
    timeOfDayHour,
    location.observerPos.lat,
    location.observerPos.lng
  );

  // 1. Initialize Three.js Scene
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // High performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Scene with atmospheric mountain haze/fog that seamlessly conceals the outer terrain boundary
    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(solar.fogColor);
    scene.background = fogColor;
    scene.fog = new THREE.Fog(fogColor, 6500, 21000);

    // Camera (near=0.3m, far=70,000m for distant Alpine horizons)
    const camera = new THREE.PerspectiveCamera(fovRef.current, width / height, 0.3, 70000);
    camera.position.set(0, Math.max(1.8, location.observerElevation + 2.2), 0);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x334155, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    dirLight.castShadow = false;
    scene.add(dirLight);

    // Groups for water & peaks
    const waterGroup = new THREE.Group();
    scene.add(waterGroup);

    const peakMarkersGroup = new THREE.Group();
    scene.add(peakMarkersGroup);

    // Sky Dome
    const skyGeom = new THREE.SphereGeometry(56000, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const skyColors = new Float32Array(skyGeom.attributes.position.count * 3);
    const skyPos = skyGeom.attributes.position;
    for (let i = 0; i < skyPos.count; i++) {
      skyColors[i * 3] = 0.4;
      skyColors[i * 3 + 1] = 0.6;
      skyColors[i * 3 + 2] = 0.9;
    }
    skyGeom.setAttribute('color', new THREE.BufferAttribute(skyColors, 3));
    const skyMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    const skyDomeMesh = new THREE.Mesh(skyGeom, skyMat);
    scene.add(skyDomeMesh);

    // Sun / Moon Mesh
    const sunGeom = new THREE.SphereGeometry(480, 24, 24);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      fog: false,
    });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    scene.add(sunMesh);

    // Night Stars
    const starCount = 1400;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 52000;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.max(900, r * Math.sin(phi) * Math.sin(theta));
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 150,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      fog: false,
    });
    const starsMesh = new THREE.Points(starGeom, starMat);
    scene.add(starsMesh);

    threeRef.current = {
      renderer,
      scene,
      camera,
      terrainMesh: null,
      waterGroup,
      peakMarkersGroup,
      skyDomeMesh,
      sunMesh,
      starsMesh,
      dirLight,
      hemiLight,
      animFrameId: 0,
      currentTexture: null,
    };

    // Render loop
    const animate = () => {
      if (!threeRef.current) return;
      const { renderer, scene, camera, skyDomeMesh } = threeRef.current;

      if (skyDomeMesh) {
        skyDomeMesh.position.copy(camera.position);
      }

      // Camera rotation: heading (yaw around Y) and pitch (around X)
      const yawRad = THREE.MathUtils.degToRad(-headingRef.current);
      const pitchRad = THREE.MathUtils.degToRad(pitchRef.current);

      const euler = new THREE.Euler(pitchRad, yawRad, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);

      renderer.render(scene, camera);
      threeRef.current.animFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!threeRef.current || !canvasContainerRef.current) return;
      const w = canvasContainerRef.current.clientWidth;
      const h = canvasContainerRef.current.clientHeight;
      if (w === 0 || h === 0) return;

      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.fov = fovRef.current;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animFrameId);
        if (threeRef.current.currentTexture) {
          threeRef.current.currentTexture.dispose();
        }
        threeRef.current.renderer.dispose();
      }
    };
  }, []);

  // Update FOV
  useEffect(() => {
    if (!threeRef.current) return;
    threeRef.current.camera.fov = fovDeg;
    threeRef.current.camera.updateProjectionMatrix();
  }, [fovDeg]);

  // 2. Build 3D Terrain & Load Authentic Real DEM Data
  useEffect(() => {
    if (!threeRef.current) return;
    const { scene, camera, waterGroup, peakMarkersGroup } = threeRef.current;

    let isCancelled = false;

    // Helper function to safely dispose Object3D
    const disposeHierarchy = (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
    };

    // Clear existing terrain
    if (threeRef.current.terrainMesh) {
      scene.remove(threeRef.current.terrainMesh);
      disposeHierarchy(threeRef.current.terrainMesh);
      threeRef.current.terrainMesh = null;
    }

    // Clear water
    while (waterGroup.children.length > 0) {
      const child = waterGroup.children[0];
      waterGroup.remove(child);
      disposeHierarchy(child);
    }

    // Clear peak markers
    while (peakMarkersGroup.children.length > 0) {
      const child = peakMarkersGroup.children[0];
      peakMarkersGroup.remove(child);
      disposeHierarchy(child);
    }

    // Camera stands at eye-level directly on natural terrain (minimum 0m)
    const eyeLevel = Math.max(1.8, location.observerElevation + 2.2);
    camera.position.set(0, eyeLevel, 0);

    // 46km x 46km terrain coverage (23km radius from observer)
    const terrainSize = 46000;
    const segments = 160; // 160x160 = 25,600 quads for fluid 60fps rendering
    const geom = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    geom.rotateX(-Math.PI / 2); // Horizontal ground plane (Y up, -Z North, +X East)

    const posAttr = geom.attributes.position;
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    // Initial pass: Analytical elevation as instant baseline (minimum height 0m)
    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const xKm = x / 1000;
      const yKm = -z / 1000;

      let alt = Math.max(0, getCartographicElevation(location, xKm, yKm, calculatedPeaks));

      // Local observer footing guarantee (within 35m radius)
      const distFromEye = Math.hypot(x, z);
      if (distFromEye < 35) {
        const blend = Math.min(1, distFromEye / 35);
        alt = location.observerElevation * (1 - blend) + alt * blend;
        alt = Math.min(alt, eyeLevel - 1.6);
        alt = Math.max(0, alt);
      }

      // Perimeter edge fade: smoothly taper terrain towards 0m beyond 18.5km
      // so the terrain border seamlessly disappears into the horizon fog (at 21km)
      if (distFromEye > 18500) {
        const edgeTaper = Math.max(0, (23000 - distFromEye) / 4500);
        alt = alt * edgeTaper;
      }

      posAttr.setY(i, alt);

      // Natural stratification colors (visible during initial aerial tile load)
      let r = 0.42, g = 0.46, b = 0.38;
      if (alt < 900) {
        r = 0.28; g = 0.44; b = 0.22;
      } else if (alt < 1500) {
        const t = (alt - 900) / 600;
        r = 0.24 + t * 0.08; g = 0.38 - t * 0.05; b = 0.20 + t * 0.05;
      } else if (alt < 2150) {
        const t = (alt - 1500) / 650;
        r = 0.36 + t * 0.16; g = 0.35 + t * 0.15; b = 0.29 + t * 0.17;
      } else if (alt < 2800) {
        const t = (alt - 2150) / 650;
        r = 0.54 + t * 0.22; g = 0.52 + t * 0.22; b = 0.50 + t * 0.24;
      } else {
        const t = Math.min(1.0, (alt - 2800) / 550);
        r = 0.78 + t * 0.18; g = 0.80 + t * 0.18; b = 0.86 + t * 0.14;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    posAttr.needsUpdate = true;
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(geom, terrainMat);
    scene.add(terrainMesh);
    threeRef.current.terrainMesh = terrainMesh;

    // Real 3D Summit Crosses & Peak Markers (placed right on summits)
    for (const peak of calculatedPeaks) {
      const px = peak.xKm * 1000;
      const pz = -peak.yKm * 1000;
      const py = Math.max(0, peak.elevation);

      const peakMarkerObj = new THREE.Group();

      // Summit Cross
      const mastGeom = new THREE.CylinderGeometry(2.5, 2.5, 32, 8);
      const mastMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
      const mast = new THREE.Mesh(mastGeom, mastMat);
      mast.position.set(px, py + 16, pz);

      const crossbarGeom = new THREE.CylinderGeometry(2, 2, 18, 8);
      crossbarGeom.rotateZ(Math.PI / 2);
      const crossbar = new THREE.Mesh(crossbarGeom, mastMat);
      crossbar.position.set(px, py + 23, pz);

      // Glowing peak beacon
      const beaconGeom = new THREE.SphereGeometry(18, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: peak.isTarget ? 0xf59e0b : 0x38bdf8,
        fog: false,
      });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.set(px, py + 8, pz);

      peakMarkerObj.add(beacon);
      peakMarkerObj.add(mast);
      peakMarkerObj.add(crossbar);
      peakMarkersGroup.add(peakMarkerObj);
    }

    // 3. Load Authentic AWS Terrarium DEM Digital Elevation Model (0m minimum)
    setIsDemLoading(true);
    setDemActive(false);

    loadDemElevationSampler(location.observerPos.lat, location.observerPos.lng, terrainSize)
      .then((demSampler) => {
        if (isCancelled || !demSampler.isLoaded || !threeRef.current?.terrainMesh) return;

        const meshGeom = threeRef.current.terrainMesh.geometry as THREE.BufferGeometry;
        const currentPosAttr = meshGeom.attributes.position;

        let appliedDemPoints = 0;

        for (let i = 0; i < vertexCount; i++) {
          const x = currentPosAttr.getX(i);
          const z = currentPosAttr.getZ(i);

          const demAlt = demSampler.getElevationAtMeters(x, z);
          if (demAlt !== null && demAlt >= 0 && demAlt <= 4800) {
            appliedDemPoints++;
            let finalAlt = Math.max(0, demAlt);

            // Preserve local station platform within 40m
            const dist = Math.hypot(x, z);
            if (dist < 40) {
              const blend = dist / 40;
              finalAlt = location.observerElevation * (1 - blend) + demAlt * blend;
              finalAlt = Math.min(finalAlt, eyeLevel - 1.5);
              finalAlt = Math.max(0, finalAlt);
            }

            // Outer perimeter edge fade towards 0m (dissolves cleanly into fog before 21km)
            if (dist > 18500) {
              const edgeTaper = Math.max(0, (23000 - dist) / 4500);
              finalAlt = finalAlt * edgeTaper;
            }

            currentPosAttr.setY(i, finalAlt);
          }
        }

        if (appliedDemPoints > vertexCount * 0.4) {
          currentPosAttr.needsUpdate = true;
          meshGeom.computeVertexNormals();
          setDemActive(true);
        }
      })
      .catch(() => {
        // Keep baseline analytical elevation
      })
      .finally(() => {
        if (!isCancelled) setIsDemLoading(false);
      });

    // 4. Load Single High-Resolution Draped Aerial Orthophoto Layer
    setIsTextureLoading(true);
    const maxAniso = threeRef.current.renderer.capabilities.getMaxAnisotropy();

    createDrapedAerialTexture(location.observerPos.lat, location.observerPos.lng, terrainSize, maxAniso)
      .then((texture) => {
        if (isCancelled || !threeRef.current?.terrainMesh || !texture) return;

        // Dispose prior texture
        if (threeRef.current.currentTexture) {
          threeRef.current.currentTexture.dispose();
        }
        threeRef.current.currentTexture = texture;

        const mat = threeRef.current.terrainMesh.material as THREE.MeshStandardMaterial;
        mat.map = texture;
        mat.vertexColors = false;
        mat.needsUpdate = true;
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsTextureLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [location, calculatedPeaks]);

  // Peak Markers are permanently hidden
  useEffect(() => {
    if (!threeRef.current) return;
    threeRef.current.peakMarkersGroup.visible = false;
  }, []);

  // Update Solar Position, Lighting, Atmosphere & Sky
  useEffect(() => {
    if (!threeRef.current) return;
    const { scene, dirLight, hemiLight, sunMesh, starsMesh, skyDomeMesh } = threeRef.current;

    const zenithCol = new THREE.Color(solar.skyZenithColor);
    const horizonCol = new THREE.Color(solar.skyHorizonColor);

    scene.background = horizonCol;
    if (scene.fog) {
      (scene.fog as THREE.Fog).color.copy(horizonCol);
      (scene.fog as THREE.Fog).near = solar.isDaylight ? 6500 : 4000;
      (scene.fog as THREE.Fog).far = solar.isDaylight ? 21000 : 18000;
    }

    if (skyDomeMesh) {
      const colorAttr = skyDomeMesh.geometry.attributes.color as THREE.BufferAttribute;
      const posAttr = skyDomeMesh.geometry.attributes.position as THREE.BufferAttribute;
      if (colorAttr && posAttr) {
        for (let i = 0; i < posAttr.count; i++) {
          const yNorm = Math.max(0, Math.min(1, posAttr.getY(i) / 56000));
          const r = horizonCol.r * (1 - yNorm) + zenithCol.r * yNorm;
          const g = horizonCol.g * (1 - yNorm) + zenithCol.g * yNorm;
          const b = horizonCol.b * (1 - yNorm) + zenithCol.b * yNorm;
          colorAttr.setXYZ(i, r, g, b);
        }
        colorAttr.needsUpdate = true;
      }
    }

    // Directional Sun/Moon in 3D
    const azimRad = THREE.MathUtils.degToRad(solar.azimuthDeg);
    const elevRad = THREE.MathUtils.degToRad(Math.max(-8, solar.elevationDeg));
    const distance = 44000;

    const sunX = distance * Math.sin(azimRad) * Math.cos(elevRad);
    const sunY = distance * Math.sin(elevRad);
    const sunZ = -distance * Math.cos(azimRad) * Math.cos(elevRad);

    dirLight.position.set(sunX, Math.max(1000, sunY), sunZ);
    sunMesh.position.set(sunX, sunY, sunZ);

    if (solar.isDaylight) {
      dirLight.color.set(solar.sunColor);
      dirLight.intensity = Math.max(0.35, solar.directIntensity * 1.5);
      hemiLight.color.copy(zenithCol);
      hemiLight.groundColor.set(0x334155);
      hemiLight.intensity = Math.max(0.45, solar.ambientIntensity * 0.95);

      (sunMesh.material as THREE.MeshBasicMaterial).color.set(solar.sunColor);
      sunMesh.scale.setScalar(1.0);
      (starsMesh.material as THREE.PointsMaterial).opacity = 0;
    } else {
      dirLight.color.set(0x93c5fd);
      dirLight.intensity = 0.15;
      hemiLight.color.set(0x0f172a);
      hemiLight.groundColor.set(0x030712);
      hemiLight.intensity = 0.25;

      (sunMesh.material as THREE.MeshBasicMaterial).color.set(0xfef08a);
      sunMesh.scale.setScalar(0.75);
      (starsMesh.material as THREE.PointsMaterial).opacity = 0.9;
    }
  }, [solar]);

  // Pointer Handlers for 360° Panoramic Pan & Tilt
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startHeading: headingDeg,
      startPitch: pitchDeg,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !canvasContainerRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const width = canvasContainerRef.current.clientWidth || 400;

    const degPerPixel = fovDeg / width;
    const newHeading = ((dragStartRef.current.startHeading - dx * degPerPixel) % 360 + 360) % 360;
    const newPitch = Math.max(-25, Math.min(30, dragStartRef.current.startPitch + dy * degPerPixel * 0.7));

    onHeadingChange(newHeading);
    setPitchDeg(newPitch);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragStartRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-stone-950 select-none touch-none ${className}`}
    >
      {/* Three.js WebGL 3D Canvas */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing block"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Cartographic Compass Heading Tape across top (Hidden in hard difficulty) */}
      {showCompassTape && !hideCompassAndVisier && (
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <CompassTape headingDeg={headingDeg} fovDeg={fovDeg} />
        </div>
      )}

      {/* Center Tactical Sighting Crosshair with Azimuth Readout (Hidden in hard difficulty) */}
      {showSightCrosshair && !hideCompassAndVisier && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-15">
          <div className="relative flex items-center justify-center">
            {/* Reticle Circle */}
            <div className="w-8 h-8 rounded-full border border-amber-400/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80"></div>
            </div>
            {/* Crosshair Ticks */}
            <div className="absolute w-12 h-px bg-amber-400/30"></div>
            <div className="absolute h-12 w-px bg-amber-400/30"></div>

            {/* Live Bearing Readout below reticle */}
            <div className="absolute top-10 whitespace-nowrap px-2 py-0.5 rounded bg-stone-950/80 backdrop-blur-sm border border-stone-700/60 text-[10px] font-mono-numbers text-amber-300 font-semibold shadow">
              {Math.round(headingDeg)}° {Math.round(headingDeg) >= 338 || Math.round(headingDeg) < 23 ? 'N' : Math.round(headingDeg) < 68 ? 'NE' : Math.round(headingDeg) < 113 ? 'E' : Math.round(headingDeg) < 158 ? 'SE' : Math.round(headingDeg) < 203 ? 'S' : Math.round(headingDeg) < 248 ? 'SW' : Math.round(headingDeg) < 293 ? 'W' : 'NW'} · {pitchDeg >= 0 ? `+${pitchDeg.toFixed(1)}°` : `${pitchDeg.toFixed(1)}°`}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar on 3D View */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
        {/* Left: Fixed Time of Day Display (Adjustable ONLY in Creator Mode) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {isCreatorMode ? (
            <button
              onClick={() => setShowTimeControls(!showTimeControls)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900/85 backdrop-blur-md border border-stone-700/80 text-xs font-medium text-stone-200 hover:bg-stone-800 hover:text-white transition-colors shadow-md min-h-[36px]"
              title="Creator: Sonnenstand & Tageszeit für diesen Ort festlegen"
            >
              {solar.isDaylight ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
              )}
              <span className="text-[11px] font-mono-numbers font-semibold">
                {Math.floor(timeOfDayHour).toString().padStart(2, '0')}:
                {Math.floor((timeOfDayHour % 1) * 60).toString().padStart(2, '0')}
              </span>
              <span className="text-stone-400 text-[10px] hidden sm:inline">· {solar.phaseName}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900/85 backdrop-blur-md border border-stone-700/80 text-xs font-medium text-stone-200 shadow-md min-h-[36px] select-none pointer-events-none">
              {solar.isDaylight ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
              )}
              <span className="text-[11px] font-mono-numbers font-semibold">
                {Math.floor(timeOfDayHour).toString().padStart(2, '0')}:
                {Math.floor((timeOfDayHour % 1) * 60).toString().padStart(2, '0')}
              </span>
              <span className="text-stone-400 text-[10px] hidden sm:inline">· {solar.phaseName}</span>
            </div>
          )}
        </div>

        {/* Right: Sighting aids & Zoom controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Toggle Sighting Crosshair (Hidden in hard difficulty) */}
          {!hideCompassAndVisier && (
            <button
              onClick={() => setShowSightCrosshair(!showSightCrosshair)}
              className={`p-1.5 rounded-lg backdrop-blur-md border text-xs flex items-center gap-1 shadow-md transition-colors min-h-[36px] ${
                showSightCrosshair
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                  : 'bg-stone-900/85 text-stone-400 border-stone-700 hover:text-stone-200'
              }`}
              title="Peilungs-Fadenkreuz ein-/ausblenden"
            >
              <Target className="w-4 h-4" />
              <span className="text-[11px] hidden md:inline">Visier</span>
            </button>
          )}

          {/* FOV / Zoom */}
          <div className="flex items-center bg-stone-900/85 backdrop-blur-md border border-stone-700/80 rounded-lg p-0.5 shadow-md min-h-[36px]">
            <button
              onClick={() => setFovDeg((prev) => Math.min(95, prev + 10))}
              className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition-colors"
              title="Weitwinkel"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono-numbers text-stone-300 px-1">{Math.round(fovDeg)}°</span>
            <button
              onClick={() => setFovDeg((prev) => Math.max(35, prev - 10))}
              className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded transition-colors"
              title="Teleobjektiv"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Time-of-Day Drawer (Only in Creator Mode) */}
      {isCreatorMode && showTimeControls && (
        <div className="absolute bottom-12 left-2 right-2 max-w-md mx-auto p-3.5 rounded-xl bg-stone-900/95 backdrop-blur-md border border-stone-700 shadow-2xl z-30 text-stone-200 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Fixe Sonnenzeit für diesen Ort festlegen</span>
            </div>
            {onToggleLiveTime && (
              <button
                onClick={onToggleLiveTime}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors font-medium ${
                  isLiveTime
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {isLiveTime ? '● Live MEZ' : 'Live-Zeit'}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <input
              type="range"
              min="0"
              max="24"
              step="0.25"
              value={timeOfDayHour}
              onChange={(e) => onTimeChange?.(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-stone-700 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] font-mono-numbers text-stone-400">
              <span>00:00 Nacht</span>
              <span>06:00 Dämmerung</span>
              <span>12:00 Mittag</span>
              <span>18:30 Sonnenuntergang</span>
              <span>24:00</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1 mt-2.5">
            {[
              { label: 'Früh', hour: 6.0 },
              { label: 'Vormittag', hour: 9.5 },
              { label: 'Mittag', hour: 13.0 },
              { label: 'Abend', hour: 19.5 },
              { label: 'Nacht', hour: 23.0 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => onTimeChange?.(p.hour)}
                className={`px-1.5 py-1 text-[11px] rounded text-center transition-colors ${
                  Math.abs(timeOfDayHour - p.hour) < 1.0
                    ? 'bg-amber-400 text-stone-950 font-bold'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

