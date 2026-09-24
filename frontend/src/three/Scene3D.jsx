import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Scroll-linked camera rig: drifts down + pushes in as user scrolls (r3f: mutate refs, no setState in useFrame)
function Rig() {
  const { camera } = useThree();
  useFrame(() => {
    const y = window.scrollY || 0;
    const t = Math.min(y / 2500, 1);
    camera.position.y = THREE.MathUtils.lerp(0, -1.6, t);
    camera.position.z = THREE.MathUtils.lerp(7.5, 5.2, t);
    camera.lookAt(0, camera.position.y * 0.4, 0);
  });
  return null;
}
function Knot() {
  const ref = useRef();
  useFrame((s) => {
    ref.current.rotation.x = s.clock.elapsedTime * 0.16;
    ref.current.rotation.y = s.clock.elapsedTime * 0.22;
  });
  return (
    <Float speed={1.8} rotationIntensity={0.5} floatIntensity={1.1}>
      <mesh ref={ref}>
        <torusKnotGeometry args={[1.2, 0.33, 200, 28]} />
        <meshStandardMaterial color="#0a5c36" metalness={0.6} roughness={0.24} emissive="#0a5c36" emissiveIntensity={0.35} />
      </mesh>
      {[1.95, 2.35].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2.4 + i * 0.35, 0.3, 0]}>
          <torusGeometry args={[r, 0.03, 12, 140]} />
          <meshStandardMaterial color="#c9a227" metalness={1} roughness={0.18} emissive="#c9a227" emissiveIntensity={0.65} />
        </mesh>
      ))}
    </Float>
  );
}
// Instanced gold dust — 1 draw call (threejs perf best practice)
function Dust({ n = 500 }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: n }, () => ({
    x: (Math.random() - 0.5) * 16, y: (Math.random() - 0.5) * 10, z: (Math.random() - 0.5) * 8,
    s: 0.02 + Math.random() * 0.05, p: Math.random() * Math.PI * 2
  })), [n]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    for (let i = 0; i < n; i++) {
      const d = seeds[i];
      dummy.position.set(d.x, d.y + Math.sin(t * 0.5 + d.p) * 0.5, d.z);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[null, null, n]}><sphereGeometry args={[1, 8, 8]} /><meshBasicMaterial color="#e8c766" transparent opacity={0.8} /></instancedMesh>;
}
export default function Scene3D() {
  return (
    <Canvas className="webgl-fixed" camera={{ position: [0, 0, 7.5], fov: 52 }}
      gl={{ antialias: true, alpha: true }} dpr={[1, 1.75]}>
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 6, 4]} intensity={1.5} />
      <pointLight position={[-5, -2, 3]} intensity={30} color="#c9a227" />
      <pointLight position={[4, 3, -2]} intensity={18} color="#16a34a" />
      <Stars radius={40} depth={25} count={1500} factor={3.2} fade speed={0.6} />
      <Knot />
      <Dust />
      <ContactShadows position={[0, -2.8, 0]} opacity={0.42} scale={12} blur={2.4} color="#000000" />
      <Rig />
    </Canvas>
  );
}
