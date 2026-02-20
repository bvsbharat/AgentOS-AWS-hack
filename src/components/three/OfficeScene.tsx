import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
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

export function OfficeScene() {
  const office = useAgentStore((state) => state.office);

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
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={80}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />
        
        <SceneContent />
        
        {/* Grid helper for floor */}
        <Grid
          position={[0, -0.01, 0]}
          args={[100, 100]}
          cellSize={2}
          cellThickness={0.5}
          cellColor={office.isNight ? '#1a3a5c' : '#3a7ac5'}
          sectionSize={10}
          sectionThickness={1}
          sectionColor={office.isNight ? '#2a5a8c' : '#5aa0e5'}
          fadeDistance={80}
          fadeStrength={1}
          infiniteGrid
        />
      </Canvas>
    </div>
  );
}
