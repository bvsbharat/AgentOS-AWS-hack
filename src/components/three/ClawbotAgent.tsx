import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Agent, AgentColor, AccessoryType } from '@/types';
import { useAgentStore } from '@/store/agentStore';

interface ClawbotAgentProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

const colorMap: Record<AgentColor, string> = {
  blue: '#4a9eff',
  green: '#3dd68c',
  purple: '#b07cff',
  orange: '#ff9f43',
  red: '#ff6b6b',
  yellow: '#ffd93d',
  cyan: '#00d2d3',
  pink: '#ff6b9d',
};

const darkColorMap: Record<AgentColor, string> = {
  blue: '#2d7ae0',
  green: '#28b872',
  purple: '#8b5cf6',
  orange: '#e08530',
  red: '#e04545',
  yellow: '#e6c235',
  cyan: '#00b5b5',
  pink: '#e0537a',
};

const statusColors = {
  available: '#22c55e',
  busy: '#eab308',
  deep_focus: '#ef4444',
  sleeping: '#6b7280',
};

// --- Curved antenna using a tube ---
function CurvedAntenna({ side, color }: { side: 'left' | 'right'; color: string }) {
  const curve = useMemo(() => {
    const dir = side === 'left' ? -1 : 1;
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(dir * 0.05, 0, 0),
      new THREE.Vector3(dir * 0.12, 0.12, 0),
      new THREE.Vector3(dir * 0.2, 0.22, 0),
      new THREE.Vector3(dir * 0.22, 0.32, 0),
    ]);
  }, [side]);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 12, 0.025, 8, false);
  }, [curve]);

  return (
    <group position={[0, 0.55, 0]}>
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Antenna tip ball */}
      <mesh position={[side === 'left' ? -0.22 : 0.22, 0.32, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
    </group>
  );
}

// --- Accessories adapted for blob body ---
function Accessory({ type, mainColor, darkColor }: { type: AccessoryType; mainColor: string; darkColor: string }) {
  if (type === 'none') return null;

  switch (type) {
    case 'glasses':
      return (
        <group position={[0, 0.12, 0.52]}>
          {/* Bridge */}
          <mesh>
            <boxGeometry args={[0.1, 0.025, 0.025]} />
            <meshStandardMaterial color="#2d3748" metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Left frame */}
          <mesh position={[-0.16, 0, 0]}>
            <torusGeometry args={[0.09, 0.018, 8, 16]} />
            <meshStandardMaterial color="#2d3748" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[-0.16, 0, 0.005]}>
            <circleGeometry args={[0.075, 16]} />
            <meshStandardMaterial color="#88ddff" transparent opacity={0.35} />
          </mesh>
          {/* Right frame */}
          <mesh position={[0.16, 0, 0]}>
            <torusGeometry args={[0.09, 0.018, 8, 16]} />
            <meshStandardMaterial color="#2d3748" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0.16, 0, 0.005]}>
            <circleGeometry args={[0.075, 16]} />
            <meshStandardMaterial color="#88ddff" transparent opacity={0.35} />
          </mesh>
        </group>
      );
    case 'headphones':
      return (
        <group position={[0, 0.25, 0]}>
          {/* Band */}
          <mesh position={[0, 0.28, 0]}>
            <torusGeometry args={[0.42, 0.025, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Left cup */}
          <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 16]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.065, 16]} />
            <meshStandardMaterial color={darkColor} />
          </mesh>
          {/* Right cup */}
          <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 16]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.065, 16]} />
            <meshStandardMaterial color={darkColor} />
          </mesh>
        </group>
      );
    case 'hat':
      return (
        <group position={[0, 0.52, 0]}>
          <mesh>
            <cylinderGeometry args={[0.38, 0.38, 0.035, 24]} />
            <meshStandardMaterial color="#5c3d1e" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.22, 0.26, 0.26, 24]} />
            <meshStandardMaterial color="#744210" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.265, 0.265, 0.04, 24]} />
            <meshStandardMaterial color="#c9a23c" metalness={0.4} roughness={0.3} />
          </mesh>
        </group>
      );
    case 'bowtie':
      return (
        <group position={[0, -0.25, 0.48]}>
          <mesh position={[-0.06, 0, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.1, 0.06, 0.03]} />
            <meshStandardMaterial color="#ef4444" roughness={0.5} />
          </mesh>
          <mesh position={[0.06, 0, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.1, 0.06, 0.03]} />
            <meshStandardMaterial color="#ef4444" roughness={0.5} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#cc3333" />
          </mesh>
        </group>
      );
    case 'crown':
      return (
        <group position={[0, 0.52, 0]}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.24, 0.1, 24]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.15} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={[
                Math.sin((i * 2 * Math.PI) / 5) * 0.18,
                0.12,
                Math.cos((i * 2 * Math.PI) / 5) * 0.18,
              ]}
            >
              <coneGeometry args={[0.04, 0.1, 4]} />
              <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.15} />
            </mesh>
          ))}
          {[0, 2, 4].map((i) => (
            <mesh
              key={`g-${i}`}
              position={[
                Math.sin((i * 2 * Math.PI) / 5) * 0.23,
                0.03,
                Math.cos((i * 2 * Math.PI) / 5) * 0.23,
              ]}
            >
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'sunglasses':
      return (
        <group position={[0, 0.12, 0.52]}>
          <mesh>
            <boxGeometry args={[0.46, 0.025, 0.025]} />
            <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.13, -0.015, 0.005]}>
            <boxGeometry args={[0.16, 0.1, 0.02]} />
            <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0.13, -0.015, 0.005]}>
            <boxGeometry args={[0.16, 0.1, 0.02]} />
            <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

// --- Main Agent Component ---

export function ClawbotAgent({ agent, isSelected, onClick }: ClawbotAgentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const selectionRingRef = useRef<THREE.Mesh>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, z: 0 });

  const { gl } = useThree();
  const moveAgent = useAgentStore((state) => state.moveAgent);
  const updateAgent = useAgentStore((state) => state.updateAgent);
  const selectAgent = useAgentStore((state) => state.selectAgent);
  const office = useAgentStore((state) => state.office);
  const tasks = useAgentStore((state) => state.tasks);

  const activeTask = tasks.find(
    (t) => t.assignedTo === agent.id && (t.status === 'in_progress' || t.status === 'review')
  );
  const effectiveStatus = activeTask ? 'busy' : agent.status;

  const mainColor = colorMap[agent.color];
  const darkColor = darkColorMap[agent.color];
  const statusColor = statusColors[effectiveStatus];

  const animState = useRef({
    bounceOffset: 0,
    blinkTimer: 0,
    isBlinking: false,
  });

  // Keyboard movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (office.selectedAgent !== agent.id) return;
      if (effectiveStatus !== 'available') return;
      const speed = 1;
      let newX = agent.position.x;
      let newZ = agent.position.z;
      switch (e.key) {
        case 'ArrowUp': newZ -= speed; break;
        case 'ArrowDown': newZ += speed; break;
        case 'ArrowLeft': newX -= speed; break;
        case 'ArrowRight': newX += speed; break;
        default: return;
      }
      e.preventDefault();
      moveAgent(agent.id, { x: newX, z: newZ });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [office.selectedAgent, agent.id, agent.position.x, agent.position.z, moveAgent, effectiveStatus]);

  // Drag
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (effectiveStatus !== 'available') return;
    setIsDragging(true);
    selectAgent(agent.id);
    onClick();
    setDragOffset({ x: e.point.x - agent.position.x, z: e.point.z - agent.position.z });
    if (gl.domElement) gl.domElement.style.cursor = 'grabbing';
  };
  const handlePointerUp = () => {
    setIsDragging(false);
    if (gl.domElement) gl.domElement.style.cursor = 'auto';
  };
  const handlePointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();
    moveAgent(agent.id, { x: e.point.x - dragOffset.x, z: e.point.z - dragOffset.z });
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;

    // Gentle squish bounce
    const bounce = Math.sin(time * 2.5) * 0.04;
    groupRef.current.position.y = isDragging ? 0.3 : bounce;

    // Body squish (scale pulse)
    if (bodyRef.current) {
      const squish = Math.sin(time * 2.5) * 0.015;
      bodyRef.current.scale.set(1 + squish, 1 - squish, 1 + squish);
    }

    // Arm wiggle
    if (leftArmRef.current && rightArmRef.current) {
      if (effectiveStatus === 'available') {
        const wave = Math.sin(time * 2) * 0.2;
        leftArmRef.current.rotation.z = 0.6 + wave;
        rightArmRef.current.rotation.z = -0.6 - wave;
      } else if (effectiveStatus === 'busy') {
        leftArmRef.current.rotation.z = 0.6 + Math.sin(time * 6) * 0.15;
        rightArmRef.current.rotation.z = -0.6 + Math.sin(time * 6 + Math.PI) * 0.15;
      } else {
        leftArmRef.current.rotation.z = 0.6;
        rightArmRef.current.rotation.z = -0.6;
      }
    }

    // Blinking
    animState.current.blinkTimer += delta;
    if (animState.current.blinkTimer > 3) {
      animState.current.isBlinking = true;
      if (animState.current.blinkTimer > 3.15) {
        animState.current.isBlinking = false;
        animState.current.blinkTimer = 0;
      }
    }

    // Selection ring
    if (selectionRingRef.current) {
      selectionRingRef.current.rotation.y += delta * 2;
      selectionRingRef.current.visible = isSelected;
    }

    if (!isDragging && effectiveStatus === 'available' && agent.targetPosition) {
      const dx = agent.targetPosition.x - agent.position.x;
      const dz = agent.targetPosition.z - agent.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 0.05) {
        const step = Math.min(distance, delta * 1.6);
        moveAgent(agent.id, {
          x: agent.position.x + (dx / distance) * step,
          z: agent.position.z + (dz / distance) * step,
        });
      } else {
        updateAgent(agent.id, { targetPosition: undefined });
      }
    }

    // Rotation
    if (agent.targetPosition) {
      const dx = agent.targetPosition.x - agent.position.x;
      const dz = agent.targetPosition.z - agent.position.z;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y, Math.atan2(dx, dz), delta * 5
      );
    }
  });

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
      {/* Selection ring */}
      <mesh
        ref={selectionRingRef}
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={isSelected}
      >
        <ringGeometry args={[0.9, 1.05, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.7} />
      </mesh>

      {/* Floating label */}
      <Html
        position={[0, 2.3, 0]}
        center
        distanceFactor={15}
        zIndexRange={[0, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          whiteSpace: 'nowrap',
        }}>
          {activeTask && (
            <div style={{
              background: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '4px',
              padding: '1px 6px',
              fontSize: '8px',
              color: '#fbbf24',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, sans-serif',
            }}>
              {activeTask.title}
            </div>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderRadius: '6px',
            padding: '2px 8px',
            border: `1px solid ${statusColor}40`,
            fontFamily: 'system-ui, sans-serif',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }} />
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#e2e8f0' }}>
              {agent.name}
            </span>
            <span style={{ fontSize: '8px', color: statusColor, textTransform: 'capitalize' }}>
              {effectiveStatus === 'deep_focus' ? 'Focus' : effectiveStatus}
            </span>
          </div>
        </div>
      </Html>

      {/* ===== BLOB BODY ===== */}
      <group ref={bodyRef} position={[0, 0.85, 0]}>

        {/* Main blob — one big sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial
            color={mainColor}
            roughness={0.45}
            metalness={0.02}
          />
        </mesh>

        {/* Subtle belly highlight — lighter ellipse on front */}
        <mesh position={[0, -0.08, 0.5]}>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshStandardMaterial
            color={mainColor}
            roughness={0.35}
            metalness={0.0}
            emissive={mainColor}
            emissiveIntensity={0.08}
          />
        </mesh>

        {/* --- Curved antennae --- */}
        <CurvedAntenna side="left" color={mainColor} />
        <CurvedAntenna side="right" color={mainColor} />

        {/* --- Eyes --- */}
        <group position={[0, 0.1, 0.48]}>
          {/* Left eye — big dark circle */}
          <mesh position={[-0.16, 0, 0]}>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} />
          </mesh>
          {/* Left eye highlight — small bright dot */}
          <mesh position={[-0.12, 0.05, 0.1]}
            scale={animState.current.isBlinking ? [1, 0.1, 1] : [1, 1, 1]}
          >
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#b0e0ff" emissiveIntensity={0.8} />
          </mesh>
          {/* Left eye secondary highlight */}
          <mesh position={[-0.19, -0.02, 0.1]}
            scale={animState.current.isBlinking ? [1, 0.1, 1] : [1, 1, 1]}
          >
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>

          {/* Right eye — big dark circle */}
          <mesh position={[0.16, 0, 0]}>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} />
          </mesh>
          {/* Right eye highlight */}
          <mesh position={[0.2, 0.05, 0.1]}
            scale={animState.current.isBlinking ? [1, 0.1, 1] : [1, 1, 1]}
          >
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#b0e0ff" emissiveIntensity={0.8} />
          </mesh>
          {/* Right eye secondary highlight */}
          <mesh position={[0.13, -0.02, 0.1]}
            scale={animState.current.isBlinking ? [1, 0.1, 1] : [1, 1, 1]}
          >
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* --- Stub arms --- */}
        {/* Left arm nub */}
        <group ref={leftArmRef} position={[-0.55, -0.05, 0]}>
          <mesh>
            <capsuleGeometry args={[0.09, 0.1, 8, 12]} />
            <meshStandardMaterial color={mainColor} roughness={0.45} />
          </mesh>
        </group>

        {/* Right arm nub */}
        <group ref={rightArmRef} position={[0.55, -0.05, 0]}>
          <mesh>
            <capsuleGeometry args={[0.09, 0.1, 8, 12]} />
            <meshStandardMaterial color={mainColor} roughness={0.45} />
          </mesh>
        </group>

        {/* Accessory */}
        <Accessory type={agent.accessory} mainColor={mainColor} darkColor={darkColor} />
      </group>

      {/* --- Legs --- */}
      {/* Left thigh */}
      <mesh position={[-0.2, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 12]} />
        <meshStandardMaterial color={darkColor} roughness={0.45} />
      </mesh>
      {/* Left shin */}
      <mesh position={[-0.2, 0.02, 0.02]} castShadow>
        <capsuleGeometry args={[0.09, 0.16, 8, 12]} />
        <meshStandardMaterial color={darkColor} roughness={0.45} />
      </mesh>
      {/* Left foot */}
      <mesh position={[-0.2, -0.08, 0.08]} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.24]} />
        <meshStandardMaterial color={darkColor} roughness={0.5} />
      </mesh>

      {/* Right thigh */}
      <mesh position={[0.2, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.2, 8, 12]} />
        <meshStandardMaterial color={darkColor} roughness={0.45} />
      </mesh>
      {/* Right shin */}
      <mesh position={[0.2, 0.02, 0.02]} castShadow>
        <capsuleGeometry args={[0.09, 0.16, 8, 12]} />
        <meshStandardMaterial color={darkColor} roughness={0.45} />
      </mesh>
      {/* Right foot */}
      <mesh position={[0.2, -0.08, 0.08]} castShadow>
        <boxGeometry args={[0.18, 0.08, 0.24]} />
        <meshStandardMaterial color={darkColor} roughness={0.5} />
      </mesh>

      {/* Ground shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
