import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useAgentStore } from '@/store/agentStore';
import { OfficeEnvironment } from './OfficeEnvironment';
import { ClawbotAgent } from './ClawbotAgent';
import { Lighting } from './Lighting';

function SceneContent() {
  const agents = useAgentStore((state) => state.agents);
  const office = useAgentStore((state) => state.office);
  const selectAgent = useAgentStore((state) => state.selectAgent);
  const setTime = useAgentStore((state) => state.setTime);

  const groupRef = useRef<THREE.Group>(null);

  // Day/night cycle animation
  useFrame((_, delta) => {
    // Update time
    const currentTime = office.time;
    const newTime = (currentTime + delta * 0.1) % 24;
    if (Math.floor(newTime) !== Math.floor(currentTime)) {
      setTime(newTime);
    }
  });

  return (
    <group ref={groupRef}>
      <OfficeEnvironment />

      {agents.map((agent) => (
        <ClawbotAgent
          key={agent.id}
          agent={agent}
          isSelected={office.selectedAgent === agent.id}
          onClick={() => selectAgent(agent.id)}
        />
      ))}
    </group>
  );
}

function CameraKeyboardControls({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree();
  const selectedAgent = useAgentStore((state) => state.office.selectedAgent);

  useEffect(() => {
    const panSpeed = 1;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedAgent !== null) return;

      const controls = controlsRef.current;
      if (!controls) return;

      let dx = 0;
      let dz = 0;

      switch (e.key) {
        case 'ArrowUp':
          dz = -panSpeed;
          break;
        case 'ArrowDown':
          dz = panSpeed;
          break;
        case 'ArrowLeft':
          dx = -panSpeed;
          break;
        case 'ArrowRight':
          dx = panSpeed;
          break;
        default:
          return;
      }

      e.preventDefault();
      controls.target.x += dx;
      controls.target.z += dz;
      camera.position.x += dx;
      camera.position.z += dz;
      controls.update();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAgent, camera, controlsRef]);

  return null;
}

export function OfficeScene() {
  const office = useAgentStore((state) => state.office);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <PerspectiveCamera
          makeDefault
          position={[30, 35, 30]}
          fov={45}
          near={0.1}
          far={1000}
        />

        <Lighting isNight={office.isNight} time={office.time} />

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={80}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />

        <CameraKeyboardControls controlsRef={controlsRef} />
        <SceneContent />
      </Canvas>
    </div>
  );
}
