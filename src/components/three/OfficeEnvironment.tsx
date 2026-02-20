import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAgentStore } from '@/store/agentStore';

// Bright wood floor plank pattern texture (procedural)
function useWoodTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Warm light wood base
    ctx.fillStyle = '#c8a06a';
    ctx.fillRect(0, 0, 512, 512);

    // Draw planks
    const plankHeight = 64;
    for (let y = 0; y < 512; y += plankHeight) {
      const shade = y % (plankHeight * 2) === 0 ? 0 : 15;
      ctx.fillStyle = `rgb(${185 + shade}, ${145 + shade}, ${95 + shade})`;
      ctx.fillRect(0, y, 512, plankHeight - 1);

      // Plank gap
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(0, y + plankHeight - 1, 512, 1);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(160, 120, 70, 0.3)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 6; i++) {
        const gy = y + Math.random() * plankHeight;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(128, gy + (Math.random() - 0.5) * 4, 384, gy + (Math.random() - 0.5) * 4, 512, gy);
        ctx.stroke();
      }

      // Vertical plank seams
      const offset = y % (plankHeight * 2) === 0 ? 0 : 170;
      ctx.fillStyle = '#8a6a3a';
      for (let x = offset; x < 512; x += 340) {
        ctx.fillRect(x, y, 1, plankHeight);
      }
    }

    // Subtle varnish highlights
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 360);
    gradient.addColorStop(0, 'rgba(255, 230, 190, 0.12)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    return texture;
  }, []);
}

// Carpet texture with subtle pattern
function useCarpetTexture(color: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Base carpet color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 128);

    // Carpet fiber noise
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const brightness = Math.random() > 0.4 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)';
      ctx.fillStyle = brightness;
      ctx.fillRect(x, y, 1, 1);
    }

    // Subtle diamond pattern overlay
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < 128; x += 16) {
      for (let y = 0; y < 128; y += 16) {
        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + 16, y + 8);
        ctx.lineTo(x + 8, y + 16);
        ctx.lineTo(x, y + 8);
        ctx.closePath();
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }, [color]);
}

// Bright carpet colors
const carpetColors: Record<string, string> = {
  '#3b82f6': '#4a7ac8',   // Dev Room - bright blue
  '#a855f7': '#8a5cc8',   // Design Studio - bright purple
  '#22c55e': '#3aaa5e',   // Research Lab - bright emerald
  '#f59e0b': '#c89040',   // Meeting Room - warm golden
  '#ec4899': '#c85a8a',   // Break Room - bright rose
};

// Room name label colors
const roomLabelColors: Record<string, string> = {
  '#3b82f6': '#4a90ff',
  '#a855f7': '#b86dff',
  '#22c55e': '#3ddb6e',
  '#f59e0b': '#ffb830',
  '#ec4899': '#ff5caa',
};

// Room component with glass walls, glow strips, and labels
function RoomZone({
  position,
  size,
  color,
  name,
}: {
  position: [number, number, number];
  size: [number, number];
  color: string;
  name: string;
}) {
  const carpetColor = carpetColors[color] || color;
  const carpetTexture = useCarpetTexture(carpetColor);
  const labelColor = roomLabelColors[color] || color;
  const wallHeight = 4;
  const wallThickness = 0.05;
  const halfW = size[0] / 2;
  const halfH = size[1] / 2;

  return (
    <group position={position}>
      {/* Carpet floor - transparent so wood shows through */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial
          map={carpetTexture}
          color="#ffffff"
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.95}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* 4 Glass walls */}
      {/* Front wall (negative Z) */}
      <mesh position={[0, wallHeight / 2, -halfH]}>
        <boxGeometry args={[size[0], wallHeight, wallThickness]} />
        <meshPhysicalMaterial
          color="#88ccff"
          transparent
          opacity={0.15}
          transmission={0.6}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      {/* Back wall (positive Z) */}
      <mesh position={[0, wallHeight / 2, halfH]}>
        <boxGeometry args={[size[0], wallHeight, wallThickness]} />
        <meshPhysicalMaterial
          color="#88ccff"
          transparent
          opacity={0.15}
          transmission={0.6}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      {/* Left wall (negative X) */}
      <mesh position={[-halfW, wallHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, size[1]]} />
        <meshPhysicalMaterial
          color="#88ccff"
          transparent
          opacity={0.15}
          transmission={0.6}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      {/* Right wall (positive X) */}
      <mesh position={[halfW, wallHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, size[1]]} />
        <meshPhysicalMaterial
          color="#88ccff"
          transparent
          opacity={0.15}
          transmission={0.6}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Neon cyan glow strips at wall base */}
      <mesh position={[0, 0.05, -halfH]}>
        <boxGeometry args={[size[0], 0.1, 0.06]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[0, 0.05, halfH]}>
        <boxGeometry args={[size[0], 0.1, 0.06]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[-halfW, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.1, size[1]]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[halfW, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.1, size[1]]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.0} />
      </mesh>

      {/* Room-colored accent strips at wall top */}
      <mesh position={[0, wallHeight, -halfH]}>
        <boxGeometry args={[size[0], 0.08, 0.06]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0, wallHeight, halfH]}>
        <boxGeometry args={[size[0], 0.08, 0.06]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-halfW, wallHeight, 0]}>
        <boxGeometry args={[0.06, 0.08, size[1]]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[halfW, wallHeight, 0]}>
        <boxGeometry args={[0.06, 0.08, size[1]]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>

      {/* Floating room name label */}
      <Html
        position={[0, wallHeight + 1.5, 0]}
        center
        distanceFactor={20}
        zIndexRange={[0, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '14px',
            fontWeight: 'bold',
            color: labelColor,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            textShadow: `0 0 10px ${labelColor}, 0 0 20px ${labelColor}, 0 0 40px ${labelColor}`,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {name}
        </div>
      </Html>
    </group>
  );
}

// Desk component with dual monitors and chair
function Desk({
  position,
  hasComputer = true,
}: {
  position: [number, number, number];
  hasComputer?: boolean;
}) {
  const screenLeftRef = useRef<THREE.Mesh>(null);
  const screenRightRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (hasComputer) {
      const t = Date.now() * 0.01;
      const intensity = 0.5 + Math.sin(t) * 0.08;
      if (screenLeftRef.current) {
        (screenLeftRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
      }
      if (screenRightRef.current) {
        (screenRightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
      }
    }
  });

  return (
    <group position={position}>
      {/* Desk surface - warm wood */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.1, 1.5]} />
        <meshStandardMaterial color="#8b6914" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Desk legs */}
      {[
        [-1.2, 0.75, -0.6],
        [1.2, 0.75, -0.6],
        [-1.2, 0.75, 0.6],
        [1.2, 0.75, 0.6],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.08, 1.5, 0.08]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {hasComputer && (
        <>
          {/* Left monitor bezel */}
          <mesh position={[-0.5, 2.2, -0.4]} castShadow>
            <boxGeometry args={[1.0, 0.75, 0.06]} />
            <meshStandardMaterial color="#0a0a14" metalness={0.3} roughness={0.2} />
          </mesh>
          {/* Left screen */}
          <mesh ref={screenLeftRef} position={[-0.5, 2.2, -0.36]}>
            <planeGeometry args={[0.9, 0.65]} />
            <meshStandardMaterial
              color="#1a3a5a"
              emissive="#1a3a5a"
              emissiveIntensity={0.5}
            />
          </mesh>
          {/* Left monitor stand */}
          <mesh position={[-0.5, 1.8, -0.4]} castShadow>
            <boxGeometry args={[0.12, 0.4, 0.12]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
          </mesh>

          {/* Right monitor bezel */}
          <mesh position={[0.5, 2.2, -0.4]} castShadow>
            <boxGeometry args={[1.0, 0.75, 0.06]} />
            <meshStandardMaterial color="#0a0a14" metalness={0.3} roughness={0.2} />
          </mesh>
          {/* Right screen */}
          <mesh ref={screenRightRef} position={[0.5, 2.2, -0.36]}>
            <planeGeometry args={[0.9, 0.65]} />
            <meshStandardMaterial
              color="#1a3a5a"
              emissive="#1a3a5a"
              emissiveIntensity={0.5}
            />
          </mesh>
          {/* Right monitor stand */}
          <mesh position={[0.5, 1.8, -0.4]} castShadow>
            <boxGeometry args={[0.12, 0.4, 0.12]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
          </mesh>

          {/* Keyboard */}
          <mesh position={[0, 1.56, 0.2]} castShadow>
            <boxGeometry args={[1.2, 0.04, 0.4]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.5} />
          </mesh>
        </>
      )}

      {/* Chair behind desk */}
      <group position={[0, 0, 1.2]}>
        {/* Seat */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.8, 0.08, 0.8]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.5} />
        </mesh>
        {/* Back */}
        <mesh position={[0, 1.4, 0.35]} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.08]} />
          <meshStandardMaterial color="#2d2d3d" metalness={0.2} roughness={0.5} />
        </mesh>
        {/* Pedestal */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Star base */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.sin((angle * Math.PI) / 180) * 0.3,
              0.05,
              Math.cos((angle * Math.PI) / 180) * 0.3,
            ]}
            rotation={[0, (angle * Math.PI) / 180, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Coffee machine for break room
function CoffeeMachine({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[1.5, 2, 1]} />
        <meshStandardMaterial color="#2d2d3d" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.5, 0.51]}>
        <planeGeometry args={[1, 0.8]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Couch for break room
function Couch({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[3, 1, 1.5]} />
        <meshStandardMaterial color="#5a3520" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.2, -0.6]} castShadow>
        <boxGeometry args={[3, 1, 0.3]} />
        <meshStandardMaterial color="#6a4028" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Meeting table
function MeetingTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table top - polished wood */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[3, 3, 0.12, 32]} />
        <meshStandardMaterial color="#7a5020" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* Table base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.5, 1, 16]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Chairs around table */}
      {[0, 90, 180, 270].map((angle, i) => (
        <group
          key={i}
          rotation={[0, (angle * Math.PI) / 180, 0]}
          position={[
            Math.sin((angle * Math.PI) / 180) * 4,
            0,
            Math.cos((angle * Math.PI) / 180) * 4,
          ]}
        >
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1, 0.1, 1]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1, -0.4]} castShadow>
            <boxGeometry args={[1, 1, 0.1]} />
            <meshStandardMaterial color="#2d2d3d" metalness={0.2} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Multi-leaf plant decoration
function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.3, 0.8, 16]} />
        <meshStandardMaterial color="#6b4226" roughness={0.8} />
      </mesh>
      {/* Soil disk */}
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.04, 16]} />
        <meshStandardMaterial color="#3a2818" roughness={0.9} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#2a6a25" roughness={0.7} />
      </mesh>
      {/* 5 leaves at different angles */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((angle * Math.PI) / 180) * 0.35,
            1.3 + (i % 2) * 0.25,
            Math.cos((angle * Math.PI) / 180) * 0.35,
          ]}
          rotation={[
            0.3 * (i % 2 === 0 ? 1 : -1),
            (angle * Math.PI) / 180,
            0.4,
          ]}
          castShadow
        >
          <sphereGeometry args={[0.25, 8, 6]} />
          <meshStandardMaterial color="#228b22" />
        </mesh>
      ))}
      {/* Top leaf cluster */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#2aaa35" />
      </mesh>
    </group>
  );
}

// Full wall-sized idea board on the +X (right) wall of the meeting room
// position = center of the meeting room in world coords
// halfW = half-width (x), halfH = half-depth (z) of the room
function IdeaBoardWall({ position, halfW, halfH, allHandsMode }: { position: [number, number, number]; halfW: number; halfH: number; allHandsMode: boolean }) {
  const wx = halfW - 0.12; // sticky notes sit just in front of the white surface
  const stickyNotes = useMemo(() => [
    // Column 1 (toward -Z)
    { pos: [wx, 2.8, -5] as [number, number, number], color: '#fef08a' },
    { pos: [wx, 1.8, -4.5] as [number, number, number], color: '#bbf7d0' },
    { pos: [wx, 1.2, -5.3] as [number, number, number], color: '#bfdbfe' },
    // Column 2
    { pos: [wx, 2.6, -1.8] as [number, number, number], color: '#fecaca' },
    { pos: [wx, 1.5, -1.4] as [number, number, number], color: '#fef08a' },
    { pos: [wx, 1.0, -2.2] as [number, number, number], color: '#bbf7d0' },
    // Column 3
    { pos: [wx, 2.7, 1.8] as [number, number, number], color: '#bbf7d0' },
    { pos: [wx, 1.6, 2.3] as [number, number, number], color: '#fecaca' },
    { pos: [wx, 1.1, 1.5] as [number, number, number], color: '#fef08a' },
    // Column 4 (toward +Z)
    { pos: [wx, 2.5, 5.2] as [number, number, number], color: '#bfdbfe' },
    { pos: [wx, 1.7, 5.6] as [number, number, number], color: '#fef08a' },
    { pos: [wx, 1.2, 4.8] as [number, number, number], color: '#fecaca' },
  ], [wx]);

  return (
    <group position={position}>
      {/* Board backing - dark frame on +X wall, spanning Z, facing -X */}
      <mesh position={[halfW - 0.03, 2.2, 0]} castShadow>
        <boxGeometry args={[0.08, 3.5, 14]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* White writable surface - facing -X (into the room) */}
      <mesh position={[halfW - 0.08, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[13.5, 3.2]} />
        <meshStandardMaterial
          color="#f5f5f0"
          emissive="#f5f5f0"
          emissiveIntensity={0.05}
          roughness={0.2}
        />
      </mesh>

      {/* Section dividers - 3 vertical lines splitting into 4 columns along Z */}
      {[-3.4, 0, 3.4].map((z, i) => (
        <mesh key={i} position={[halfW - 0.1, 2.2, z]}>
          <boxGeometry args={[0.01, 3.0, 0.04]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      ))}

      {/* "IDEA BOARD" title label */}
      <Html
        position={[halfW - 0.03, 4.2, 0]}
        center
        distanceFactor={18}
        zIndexRange={[0, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#f59e0b',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            textShadow: '0 0 10px #f59e0b, 0 0 20px #f59e0b, 0 0 40px #f59e0b',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          IDEA BOARD
        </div>
      </Html>

      {/* Sticky note clusters on the +X wall, facing -X */}
      {stickyNotes.map((note, i) => (
        <mesh key={i} position={note.pos} rotation={[0, -Math.PI / 2, (i * 0.07 - 0.2) * 0.5]}>
          <boxGeometry args={[1.2, 0.9, 0.02]} />
          <meshStandardMaterial color={note.color} emissive={note.color} emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* Collaboration content overlay when allHandsMode is active */}
      {allHandsMode && (
        <Html position={[halfW - 0.1, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]} transform distanceFactor={12} zIndexRange={[0, 0]}>
          <div style={{
            width: '400px',
            background: 'rgba(240, 240, 240, 0.95)',
            color: '#111827',
            borderRadius: '8px',
            padding: '14px 18px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '11px',
            lineHeight: 1.4,
            boxShadow: '0 6px 24px rgba(0,0,0,0.3)',
            border: '2px solid #f59e0b',
          }}>
            <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '13px', color: '#f59e0b' }}>
              All-Hands: Collaboration Board
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><strong>Goals</strong><br/>Align goals + scope</div>
              <div><strong>Tasks</strong><br/>Split tasks by strength</div>
              <div><strong>Blockers</strong><br/>Identify blockers early</div>
              <div><strong>Timeline</strong><br/>Sync on timeline</div>
            </div>
            <div style={{ marginTop: '8px', fontStyle: 'italic', opacity: 0.7 }}>Share outcomes across all agents</div>
          </div>
        </Html>
      )}
    </group>
  );
}

export function OfficeEnvironment() {
  const woodTexture = useWoodTexture();
  const office = useAgentStore((state) => state.office);

  return (
    <group>
      {/* Main bright wooden floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          map={woodTexture}
          color="#dbb880"
          roughness={0.5}
          metalness={0.03}
        />
      </mesh>

      {/* Dev Room - FRONT (swapped to z=10 position) */}
      <RoomZone
        position={[-15, 0, 10]}
        size={[20, 15]}
        color="#3b82f6"
        name="Dev Room"
      />
      <Desk position={[-20, 0, 2]} />
      <Desk position={[-15, 0, 2]} />
      <Desk position={[-10, 0, 2]} />
      <Desk position={[-5, 0, 2]} />
      <Desk position={[0, 0, 2]} />
      <Plant position={[-22, 0, 4]} />
      <Plant position={[2, 0, 4]} />

      {/* Design Studio - BACK (swapped to z=-10 position) */}
      <RoomZone
        position={[-15, 0, -10]}
        size={[15, 12]}
        color="#a855f7"
        name="Design Studio"
      />
      <Desk position={[-18, 0, -16]} />
      <Desk position={[-12, 0, -16]} />
      <Desk position={[-18, 0, -12]} />
      <Desk position={[-12, 0, -12]} />
      <Plant position={[-20, 0, -14]} />

      {/* Research Lab - no bookshelf */}
      <RoomZone
        position={[0, 0, 15]}
        size={[15, 12]}
        color="#22c55e"
        name="Research Lab"
      />
      <Desk position={[-5, 0, 8]} />
      <Desk position={[0, 0, 8]} />
      <Desk position={[5, 0, 8]} />
      <Desk position={[-5, 0, 12]} />
      <Desk position={[0, 0, 12]} />
      <Plant position={[7, 0, 9]} />

      {/* Meeting Room (now at z=15) */}
      <RoomZone
        position={[15, 0, 15]}
        size={[18, 15]}
        color="#f59e0b"
        name="Meeting Room"
      />
      <MeetingTable position={[15, 0, 15]} />
      <IdeaBoardWall position={[15, 0, 15]} halfW={9} halfH={7.5} allHandsMode={office.allHandsMode} />
      <Plant position={[22, 0, 20]} />
      <Plant position={[6, 0, 9]} />

      {/* Break Room (now at z=0) */}
      <RoomZone
        position={[15, 0, 0]}
        size={[12, 12]}
        color="#ec4899"
        name="Break Room"
      />
      <CoffeeMachine position={[15, 0, 0]} />
      <Couch position={[15, 0, 3]} rotation={Math.PI} />
      <Couch position={[18, 0, 0]} rotation={-Math.PI / 2} />
      <Plant position={[20, 0, 5]} />

      {/* Central hallway strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[8, 30]} />
        <meshStandardMaterial
          color="#c0a070"
          roughness={0.3}
          metalness={0.05}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
