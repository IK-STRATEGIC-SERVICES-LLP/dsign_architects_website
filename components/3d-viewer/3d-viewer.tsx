'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useOBJLoader } from '@/lib/use-obj-loader';
import { LoadingSpinner } from '@/components/viewers/loading-spinner';

interface ModelMeshProps {
  objPath: string;
  mtlPath?: string;
  textureDir?: string;
  scale?: number;
  onLoad?: () => void;
}

function ModelMesh({
  objPath,
  mtlPath,
  textureDir,
  scale,
  onLoad,
}: ModelMeshProps) {
  const { model, loading, error } = useOBJLoader({
    objPath,
    mtlPath,
    textureDir,
    scale,
  });

  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (model && !hasInitialized) {
      const { boundingBox } = model;
      const center = boundingBox.getCenter(new THREE.Vector3());
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

      cameraZ *= 1.5; // Zoom out a bit more

      camera.position.set(center.x, center.y * 0.8, center.z + cameraZ);
      camera.lookAt(center.x, center.y, center.z);
      camera.updateProjectionMatrix();

      if (groupRef.current) {
        groupRef.current.position.copy(center.multiplyScalar(-1));
      }

      setHasInitialized(true);
      onLoad?.();
    }
  }, [model, camera, hasInitialized, onLoad]);

  if (error) {
    return null; // Error handled by parent component
  }

  if (!model || loading) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <primitive object={model.object} />
    </group>
  );
}

interface Viewer3DProps {
  objPath: string;
  mtlPath?: string;
  textureDir?: string;
  scale?: number;
  title?: string;
}

export function Viewer3D({
  objPath,
  mtlPath,
  textureDir,
  scale,
  title,
}: Viewer3DProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink-raised to-ink">
        <div className="text-center">
          <p className="text-porcelain/60 mb-2">Unable to load 3D model</p>
          <p className="text-sm text-mist">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-ink-raised to-ink">
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 100], fov: 50, near: 0.1, far: 10000 }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 1.5) : 1}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
          <directionalLight position={[-10, -20, -10]} intensity={0.3} />

          {/* Model */}
          <ModelMesh
            objPath={objPath}
            mtlPath={mtlPath}
            textureDir={textureDir}
            scale={scale}
            onLoad={() => setIsLoaded(true)}
          />

          {/* Controls */}
          <OrbitControls
            autoRotate
            autoRotateSpeed={2}
            enableDamping
            dampingFactor={0.05}
            enableZoom
            minDistance={10}
            maxDistance={500}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
