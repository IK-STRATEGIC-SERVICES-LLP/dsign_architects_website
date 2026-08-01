import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

interface LoadOBJOptions {
  objPath: string;
  mtlPath?: string;
  textureDir?: string;
  scale?: number;
}

interface LoadedModel {
  object: THREE.Group | THREE.Object3D;
  boundingBox: THREE.Box3;
}

export function useOBJLoader(options: LoadOBJOptions) {
  const [model, setModel] = useState<LoadedModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, LoadedModel>>(new Map());

  useEffect(() => {
    const cacheKey = `${options.objPath}-${options.mtlPath}`;

    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      setModel(cacheRef.current.get(cacheKey)!);
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadModel = async () => {
      try {
        const objLoader = new OBJLoader();
        let object: THREE.Group | THREE.Object3D;

        // Load MTL if provided
        if (options.mtlPath) {
          const mtlLoader = new MTLLoader();

          // Set texture path if provided
          if (options.textureDir) {
            mtlLoader.setResourcePath(options.textureDir + '/');
          }

          const materials = await mtlLoader.loadAsync(options.mtlPath);
          objLoader.setMaterials(materials);
          object = await objLoader.loadAsync(options.objPath);
        } else {
          object = await objLoader.loadAsync(options.objPath);
        }

        // Apply scale if specified
        if (options.scale && options.scale !== 1) {
          object.scale.multiplyScalar(options.scale);
        }

        // Calculate bounding box
        const boundingBox = new THREE.Box3().setFromObject(object);

        const loadedModel: LoadedModel = { object, boundingBox };

        // Cache the model
        cacheRef.current.set(cacheKey, loadedModel);

        if (mounted) {
          setModel(loadedModel);
          setError(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load OBJ model';
        console.error('OBJ Loader Error:', errorMessage);
        if (mounted) {
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      mounted = false;
    };
  }, [options.objPath, options.mtlPath, options.textureDir, options.scale]);

  return { model, loading, error };
}
