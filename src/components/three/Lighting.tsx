import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface LightingProps {
  isNight: boolean;
  time: number;
}

export function Lighting({ isNight, time }: LightingProps) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();

  useEffect(() => {
    // Update ambient light based on time
    if (ambientRef.current) {
      const intensity = isNight ? 0.2 : 0.6;
      const color = isNight ? new THREE.Color('#1a2a4a') : new THREE.Color('#ffffff');
      ambientRef.current.intensity = intensity;
      ambientRef.current.color = color;
    }

    // Update directional light (sun/moon)
    if (directionalRef.current) {
      const intensity = isNight ? 0.3 : 1.2;
      const color = isNight ? new THREE.Color('#6a8aff') : new THREE.Color('#fff8e7');
      directionalRef.current.intensity = intensity;
      directionalRef.current.color = color;
      
      // Adjust sun position based on time
      const angle = ((time - 6) / 12) * Math.PI; // 6am to 6pm
      const x = Math.cos(angle) * 50;
      const y = Math.sin(angle) * 50;
      directionalRef.current.position.set(x, y, 20);
    }

    // Update scene fog for atmosphere
    if (isNight) {
      scene.fog = new THREE.Fog('#0a1525', 20, 100);
      scene.background = new THREE.Color('#0a1525');
    } else {
      scene.fog = new THREE.Fog('#e8f4ff', 30, 120);
      scene.background = new THREE.Color('#e8f4ff');
    }
  }, [isNight, time, scene]);

  return (
    <>
      {/* Ambient light */}
      <ambientLight ref={ambientRef} intensity={0.6} color="#ffffff" />
      
      {/* Main directional light (sun/moon) */}
      <directionalLight
        ref={directionalRef}
        position={[30, 50, 20]}
        intensity={1.2}
        color="#fff8e7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Office area point lights for warm glow */}
      <pointLight
        position={[-15, 8, -10]}
        intensity={isNight ? 0.8 : 0.3}
        color="#ffaa44"
        distance={25}
        decay={2}
      />
      <pointLight
        position={[15, 8, 0]}
        intensity={isNight ? 0.8 : 0.3}
        color="#ffaa44"
        distance={25}
        decay={2}
      />
      <pointLight
        position={[15, 8, 15]}
        intensity={isNight ? 0.6 : 0.2}
        color="#ff8866"
        distance={20}
        decay={2}
      />
      
      {/* Neon accent lights for futuristic feel */}
      <pointLight
        position={[-20, 5, -15]}
        intensity={isNight ? 1.0 : 0.4}
        color="#00ffff"
        distance={15}
        decay={2}
      />
      <pointLight
        position={[20, 5, 20]}
        intensity={isNight ? 1.0 : 0.4}
        color="#ff00ff"
        distance={15}
        decay={2}
      />
    </>
  );
}
