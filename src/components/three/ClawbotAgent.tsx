import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Agent, AgentColor, AccessoryType } from '@/types';
import { useAgentStore } from '@/store/agentStore';

interface ClawbotAgentProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

const colorMap: Record<AgentColor, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
  yellow: '#eab308',
  cyan: '#06b6d4',
  pink: '#ec4899',
};

// Status indicator colors
const statusColors = {
  available: '#22c55e',
  busy: '#eab308',
  deep_focus: '#ef4444',
  sleeping: '#6b7280',
};

function Accessory({ type }: { type: AccessoryType }) {
  if (type === 'none') return null;

  switch (type) {
    case 'glasses':
      return (
        <group position={[0, 0.35, 0.35]}>
          <mesh>
            <boxGeometry args={[0.5, 0.15, 0.05]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
          <mesh position={[-0.15, 0, 0]}>
            <circleGeometry args={[0.08, 16]} />
            <meshStandardMaterial color="#00aaff" transparent opacity={0.7} />
          </mesh>
          <mesh position={[0.15, 0, 0]}>
            <circleGeometry args={[0.08, 16]} />
            <meshStandardMaterial color="#00aaff" transparent opacity={0.7} />
          </mesh>
        </group>
      );
    case 'headphones':
      return (
        <group position={[0, 0.5, 0]}>
          <mesh position={[-0.35, 0, 0]}>
            <boxGeometry args={[0.1, 0.3, 0.2]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          <mesh position={[0.35, 0, 0]}>
            <boxGeometry args={[0.1, 0.3, 0.2]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[0.35, 0.05, 8, 32, Math.PI]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
        </group>
      );
    case 'hat':
      return (
        <group position={[0, 0.65, 0]}>
          <mesh>
            <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
            <meshStandardMaterial color="#744210" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.3, 16]} />
            <meshStandardMaterial color="#744210" />
          </mesh>
        </group>
      );
    case 'bowtie':
      return (
        <group position={[0, 0.1, 0.35]}>
          <mesh>
            <coneGeometry args={[0.1, 0.2, 4]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh rotation={[0, Math.PI, 0]}>
            <coneGeometry args={[0.1, 0.2, 4]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      );
    case 'crown':
      return (
        <group position={[0, 0.65, 0]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, 0.15, 5]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh 
              key={i} 
              position={[
                Math.sin((i * 2 * Math.PI) / 5) * 0.25,
                0.15,
                Math.cos((i * 2 * Math.PI) / 5) * 0.25
              ]}
            >
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>
      );
    case 'sunglasses':
      return (
        <group position={[0, 0.35, 0.35]}>
          <mesh>
            <boxGeometry args={[0.5, 0.12, 0.05]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
          <mesh position={[-0.15, 0, 0.02]}>
            <boxGeometry args={[0.15, 0.1, 0.02]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh position={[0.15, 0, 0.02]}>
            <boxGeometry args={[0.15, 0.1, 0.02]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

export function ClawbotAgent({ agent, isSelected, onClick }: ClawbotAgentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const selectionRingRef = useRef<THREE.Mesh>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, z: 0 });
  
  const { gl } = useThree();
  const moveAgent = useAgentStore((state) => state.moveAgent);
  const selectAgent = useAgentStore((state) => state.selectAgent);
  const office = useAgentStore((state) => state.office);

  const mainColor = colorMap[agent.color];
  const statusColor = statusColors[agent.status];

  // Animation states
  const animState = useRef({
    bounceOffset: 0,
    armWave: 0,
    blinkTimer: 0,
    isBlinking: false,
  });

  // Handle keyboard movement for selected agent
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (office.selectedAgent !== agent.id) return;
      
      const speed = 1;
      let newX = agent.position.x;
      let newZ = agent.position.z;

      switch (e.key) {
        case 'ArrowUp':
          newZ -= speed;
          break;
        case 'ArrowDown':
          newZ += speed;
          break;
        case 'ArrowLeft':
          newX -= speed;
          break;
        case 'ArrowRight':
          newX += speed;
          break;
        default:
          return;
      }

      e.preventDefault();
      moveAgent(agent.id, { x: newX, z: newZ });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [office.selectedAgent, agent.id, agent.position.x, agent.position.z, moveAgent]);

  // Handle drag
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    selectAgent(agent.id);
    onClick();
    
    // Calculate offset from click point to agent center
    const point = e.point;
    setDragOffset({
      x: point.x - agent.position.x,
      z: point.z - agent.position.z
    });
    
    // Disable orbit controls while dragging
    if (gl.domElement) {
      gl.domElement.style.cursor = 'grabbing';
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (gl.domElement) {
      gl.domElement.style.cursor = 'auto';
    }
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();
    
    const point = e.point;
    const newX = point.x - dragOffset.x;
    const newZ = point.z - dragOffset.z;
    
    moveAgent(agent.id, { x: newX, z: newZ });
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    // Idle bounce animation
    animState.current.bounceOffset = Math.sin(time * 3) * 0.02;
    groupRef.current.position.y = isDragging ? 0.3 : animState.current.bounceOffset;

    // Arm waving when available
    if (agent.status === 'available' && leftArmRef.current && rightArmRef.current) {
      animState.current.armWave = Math.sin(time * 2) * 0.1;
      leftArmRef.current.rotation.z = 0.3 + animState.current.armWave;
      rightArmRef.current.rotation.z = -0.3 - animState.current.armWave;
    }

    // Working animation when busy
    if (agent.status === 'busy' && leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(time * 8) * 0.3;
      rightArmRef.current.rotation.x = Math.sin(time * 8 + Math.PI) * 0.3;
    }

    // Head bob for deep focus
    if (agent.status === 'deep_focus' && headRef.current) {
      headRef.current.rotation.x = Math.sin(time * 1.5) * 0.05;
    }

    // Blinking animation
    animState.current.blinkTimer += delta;
    if (animState.current.blinkTimer > 3) {
      animState.current.isBlinking = true;
      if (animState.current.blinkTimer > 3.15) {
        animState.current.isBlinking = false;
        animState.current.blinkTimer = 0;
      }
    }

    // Selection ring animation
    if (selectionRingRef.current) {
      selectionRingRef.current.rotation.y += delta * 2;
      selectionRingRef.current.visible = isSelected;
    }

    // Smooth rotation towards movement direction
    if (agent.targetPosition) {
      const dx = agent.targetPosition.x - agent.position.x;
      const dz = agent.targetPosition.z - agent.position.z;
      const targetAngle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetAngle,
        delta * 5
      );
    }
  });

  // Handle click
  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <group 
      ref={groupRef} 
      position={[agent.position.x, 0, agent.position.z]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerUp}
    >
      {/* Selection indicator ring */}
      <mesh 
        ref={selectionRingRef}
        position={[0, 0.1, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        visible={isSelected}
      >
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
      </mesh>

      {/* Status indicator above head */}
      <mesh position={[0.6, 1.8, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color={statusColor} 
          emissive={statusColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Head group */}
      <group ref={headRef} position={[0, 1.2, 0]}>
        {/* Main head shape - rounded cube */}
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.8, 0.8]} />
          <meshStandardMaterial 
            color={mainColor} 
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        {/* Eyes container */}
        <group position={[0, 0.05, 0.38]}>
          {/* Left eye */}
          <mesh position={[-0.2, 0, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh 
            position={[-0.2, 0, 0.08]} 
            scale={animState.current.isBlinking ? [1, 0.1, 1] : [1, 1, 1]}
          >
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
          {/* Eye shine */}
          <mesh position={[-0.15, 0.08, 0.15]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>

          {/* Right eye */}
          <mesh position={[0.2, 0, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh 
            position={[0.2, 0, 0.08]} 
            scale={animState.current.isBlinking ? [1, 0.1, 1] : [1, 1, 1]}
          >
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
          {/* Eye shine */}
          <mesh position={[0.25, 0.08, 0.15]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* Mouth */}
        <mesh position={[0, -0.25, 0.38]}>
          <capsuleGeometry args={[0.06, 0.2, 4, 8]} />
          <meshStandardMaterial color="#1a202c" />
        </mesh>

        {/* Cheeks */}
        <mesh position={[-0.35, -0.1, 0.35]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial color="#ffb6c1" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.35, -0.1, 0.35]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial color="#ffb6c1" transparent opacity={0.6} />
        </mesh>

        {/* Accessory */}
        <Accessory type={agent.accessory} />
      </group>

      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.6, 0.7, 0.5]} />
        <meshStandardMaterial 
          color={mainColor} 
          roughness={0.3}
        />
      </mesh>

      {/* Belly screen */}
      <mesh position={[0, 0.5, 0.26]}>
        <planeGeometry args={[0.35, 0.4]} />
        <meshStandardMaterial 
          color="#1a202c" 
          emissive={mainColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.4, 0.7, 0]}>
        <mesh position={[-0.15, -0.2, 0]} rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
          <meshStandardMaterial color={mainColor} />
        </mesh>
        {/* Claw hand */}
        <group position={[-0.35, -0.5, 0]}>
          <mesh rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.08, 0.25, 0.08]} />
            <meshStandardMaterial color={mainColor} />
          </mesh>
          <mesh rotation={[0, 0, 0.5]} position={[-0.1, 0.1, 0]}>
            <boxGeometry args={[0.08, 0.2, 0.08]} />
            <meshStandardMaterial color={mainColor} />
          </mesh>
        </group>
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.4, 0.7, 0]}>
        <mesh position={[0.15, -0.2, 0]} rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
          <meshStandardMaterial color={mainColor} />
        </mesh>
        {/* Claw hand */}
        <group position={[0.35, -0.5, 0]}>
          <mesh rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.08, 0.25, 0.08]} />
            <meshStandardMaterial color={mainColor} />
          </mesh>
          <mesh rotation={[0, 0, -0.5]} position={[0.1, 0.1, 0]}>
            <boxGeometry args={[0.08, 0.2, 0.08]} />
            <meshStandardMaterial color={mainColor} />
          </mesh>
        </group>
      </group>

      {/* Legs */}
      <mesh position={[-0.2, 0.1, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.3, 4, 8]} />
        <meshStandardMaterial color={mainColor} />
      </mesh>
      <mesh position={[0.2, 0.1, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.3, 4, 8]} />
        <meshStandardMaterial color={mainColor} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.2, 0, 0.15]} castShadow>
        <boxGeometry args={[0.25, 0.1, 0.35]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[0.2, 0, 0.15]} castShadow>
        <boxGeometry args={[0.25, 0.1, 0.35]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>

      {/* Shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
