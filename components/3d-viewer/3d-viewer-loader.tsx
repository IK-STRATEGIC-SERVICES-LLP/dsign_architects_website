'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/viewers/loading-spinner';

const Viewer3DClient = dynamic(() => import('./3d-viewer').then((mod) => ({ default: mod.Viewer3D })), {
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink-raised to-ink">
      <LoadingSpinner />
    </div>
  ),
  ssr: false,
});

interface Viewer3DLoaderProps {
  objPath: string;
  mtlPath?: string;
  textureDir?: string;
  scale?: number;
  title?: string;
}

export function Viewer3DLoader(props: Viewer3DLoaderProps) {
  return <Viewer3DClient {...props} />;
}
