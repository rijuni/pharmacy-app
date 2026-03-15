import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Capsule = () => {
  const mesh = useRef();
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x += 0.005;
      mesh.current.rotation.y += 0.01;
      // Floating motion
      mesh.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <mesh
      ref={mesh}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      scale={hovered ? 1.2 : 1.0}
    >
      <capsuleGeometry args={[1, 2, 4, 18]} />
      <meshStandardMaterial 
        color={hovered ? "#4ade80" : "#22c55e"} 
        roughness={0.1}
        metalness={0.8}
      />
    </mesh>
  );
};

const ThreeScene = () => {
  return (
    <div className="w-full h-[400px] cursor-grab active:cursor-grabbing">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Float speed={4} rotationIntensity={1} floatIntensity={2}>
          <Capsule />
        </Float>

        {/* Decorative background sphere */}
        <Sphere args={[1, 32, 32]} position={[-3, 2, -5]} scale={2}>
          <MeshDistortMaterial
            color="#dcfce7"
            attach="material"
            distort={0.4}
            speed={2}
          />
        </Sphere>

        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

export default ThreeScene;
