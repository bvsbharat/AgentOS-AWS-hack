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
    // Bright ambient
    if (ambientRef.current) {
      ambientRef.current.intensity = 1.2;
      ambientRef.current.color = new THREE.Color('#ffffff');
    }

    // Bright directional
    if (directionalRef.current) {
      directionalRef.current.intensity = 2.0;
      directionalRef.current.color = new THREE.Color('#ffffff');

      const angle = ((time - 6) / 12) * Math.PI;
      const x = Math.cos(angle) * 50;
      const y = Math.sin(angle) * 50;
      directionalRef.current.position.set(x, Math.max(y, 30), 20);
    }

    // Bright background
    scene.fog = new THREE.Fog('#f0f4f8', 50, 140);
    scene.background = new THREE.Color('#f0f4f8');
  }, [isNight, time, scene]);

  return (
    <>
      {/* Bright ambient light */}
      <ambientLight ref={ambientRef} intensity={1.2} color="#ffffff" />

      {/* Main directional light - bright white */}
      <directionalLight
        ref={directionalRef}
        position={[30, 50, 20]}
        intensity={2.0}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Fill light from top */}
      <directionalLight
        position={[0, 60, 0]}
        intensity={1.0}
        color="#ffffff"
      />

      {/* Bright ceiling lights over each room */}
      <pointLight position={[-15, 12, 10]} intensity={2.0} color="#ffffff" distance={30} decay={1.5} />
      <pointLight position={[-15, 12, -10]} intensity={2.0} color="#ffffff" distance={30} decay={1.5} />
      <pointLight position={[0, 12, 15]} intensity={2.0} color="#ffffff" distance={30} decay={1.5} />
      <pointLight position={[15, 12, 0]} intensity={2.0} color="#ffffff" distance={30} decay={1.5} />
      <pointLight position={[15, 12, 15]} intensity={2.0} color="#ffffff" distance={30} decay={1.5} />

      {/* Warm accent lights */}
      <pointLight position={[-20, 6, -15]} intensity={0.5} color="#ffdd99" distance={15} decay={2} />
      <pointLight position={[20, 6, 20]} intensity={0.5} color="#ffdd99" distance={15} decay={2} />

      {/* Neon accent lights */}
      <pointLight position={[-22, 3, -18]} intensity={0.4} color="#00ffff" distance={10} decay={2} />
      <pointLight position={[22, 3, 20]} intensity={0.4} color="#ff00ff" distance={10} decay={2} />
    </>
  );
}
