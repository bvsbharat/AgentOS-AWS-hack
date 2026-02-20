import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAgentStore } from '@/store/agentStore';

// Room component
function RoomZone({ 
  position, 
  size, 
  color,
  isNight 
}: { 
  position: [number, number, number]; 
  size: [number, number]; 
  color: string;
  isNight: boolean;
}) {
  const glowIntensity = isNight ? 0.4 : 0.15;
  
  return (
    <group position={position}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.3}
          emissive={color}
          emissiveIntensity={glowIntensity}
        />
      </mesh>
      
      {/* Room border glow */}
      <lineSegments position={[0, 0.02, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(size[0], size[1])]} />
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>
    </group>
  );
}

// Desk component - simplified without chair (agents stand beside)
function Desk({ 
  position, 
  hasComputer = true
}: { 
  position: [number, number, number]; 
  hasComputer?: boolean;
}) {
  const screenRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (screenRef.current && hasComputer) {
      const material = screenRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Desk surface */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.1, 1.5]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      
      {/* Desk legs */}
      <mesh position={[-1.2, 0.75, -0.6]} castShadow>
        <boxGeometry args={[0.1, 1.5, 0.1]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[1.2, 0.75, -0.6]} castShadow>
        <boxGeometry args={[0.1, 1.5, 0.1]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[-1.2, 0.75, 0.6]} castShadow>
        <boxGeometry args={[0.1, 1.5, 0.1]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[1.2, 0.75, 0.6]} castShadow>
        <boxGeometry args={[0.1, 1.5, 0.1]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      {hasComputer && (
        <>
          {/* Monitor */}
          <mesh position={[0, 2.2, -0.4]} castShadow>
            <boxGeometry args={[1.5, 1, 0.1]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
          
          {/* Screen */}
          <mesh 
            ref={screenRef}
            position={[0, 2.2, -0.34]} 
          >
            <planeGeometry args={[1.3, 0.8]} />
            <meshStandardMaterial 
              color="#00ff88" 
              emissive="#00ff88"
              emissiveIntensity={0.8}
            />
          </mesh>
          
          {/* Monitor stand */}
          <mesh position={[0, 1.8, -0.4]} castShadow>
            <boxGeometry args={[0.2, 0.4, 0.2]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          
          {/* Keyboard */}
          <mesh position={[0, 1.56, 0.2]} castShadow>
            <boxGeometry args={[1.2, 0.05, 0.4]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
        </>
      )}
    </group>
  );
}

// Coffee machine for break room
function CoffeeMachine({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[1.5, 2, 1]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      <mesh position={[0, 1.5, 0.51]}>
        <planeGeometry args={[1, 0.8]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Couch for break room
function Couch({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[3, 1, 1.5]} />
        <meshStandardMaterial color="#744210" />
      </mesh>
      <mesh position={[0, 1.2, -0.6]} castShadow>
        <boxGeometry args={[3, 1, 0.3]} />
        <meshStandardMaterial color="#744210" />
      </mesh>
    </group>
  );
}

// Meeting table
function MeetingTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[3, 3, 0.1, 32]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.5, 1, 16]} />
        <meshStandardMaterial color="#2d3748" />
      </mesh>
      
      {/* Chairs around table */}
      {[0, 90, 180, 270].map((angle, i) => (
        <group key={i} rotation={[0, (angle * Math.PI) / 180, 0]} position={[Math.sin((angle * Math.PI) / 180) * 4, 0, Math.cos((angle * Math.PI) / 180) * 4]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1, 0.1, 1]} />
            <meshStandardMaterial color="#2d3748" />
          </mesh>
          <mesh position={[0, 1, -0.4]} castShadow>
            <boxGeometry args={[1, 1, 0.1]} />
            <meshStandardMaterial color="#4a5568" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Plant decoration
function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.3, 1, 16]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#228b22" />
      </mesh>
    </group>
  );
}

export function OfficeEnvironment() {
  const office = useAgentStore((state) => state.office);
  const isNight = office.isNight;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color={isNight ? '#1a202c' : '#e2e8f0'} 
          roughness={0.8}
        />
      </mesh>

      {/* Dev Room - Desks along back wall, agents work in front */}
      <RoomZone 
        position={[-15, 0, -10]} 
        size={[20, 15]} 
        color="#3b82f6"
        isNight={isNight}
      />
      {/* Desks along the back (north) */}
      <Desk position={[-20, 0, -18]} />
      <Desk position={[-15, 0, -18]} />
      <Desk position={[-10, 0, -18]} />
      <Desk position={[-5, 0, -18]} />
      <Desk position={[0, 0, -18]} />
      {/* Plants for decoration */}
      <Plant position={[-22, 0, -16]} />
      <Plant position={[2, 0, -16]} />

      {/* Design Studio - Desks along back */}
      <RoomZone 
        position={[-15, 0, 10]} 
        size={[15, 12]} 
        color="#a855f7"
        isNight={isNight}
      />
      <Desk position={[-18, 0, 4]} />
      <Desk position={[-12, 0, 4]} />
      <Desk position={[-18, 0, 8]} />
      <Desk position={[-12, 0, 8]} />
      <Plant position={[-20, 0, 6]} />

      {/* Research Lab - Desks in rows */}
      <RoomZone 
        position={[0, 0, 15]} 
        size={[15, 12]} 
        color="#22c55e"
        isNight={isNight}
      />
      <Desk position={[-5, 0, 8]} />
      <Desk position={[0, 0, 8]} />
      <Desk position={[5, 0, 8]} />
      <Desk position={[-5, 0, 12]} />
      <Desk position={[0, 0, 12]} />

      {/* Meeting Room */}
      <RoomZone 
        position={[15, 0, 0]} 
        size={[18, 15]} 
        color="#f59e0b"
        isNight={isNight}
      />
      <MeetingTable position={[15, 0, 0]} />
      <Plant position={[22, 0, 5]} />

      {/* Break Room */}
      <RoomZone 
        position={[15, 0, 15]} 
        size={[12, 12]} 
        color="#ec4899"
        isNight={isNight}
      />
      <CoffeeMachine position={[15, 0, 15]} />
      <Couch position={[15, 0, 18]} rotation={Math.PI} />
      <Couch position={[18, 0, 15]} rotation={-Math.PI / 2} />

      {/* Central hallway area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[8, 30]} />
        <meshStandardMaterial 
          color={isNight ? '#2d3748' : '#cbd5e0'} 
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}
