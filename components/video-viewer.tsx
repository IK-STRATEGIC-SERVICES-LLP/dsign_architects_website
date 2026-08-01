// Native <video> already ships play/pause, seek, volume, and fullscreen
// controls in every browser — no WebGL/canvas involved, so this renders
// fine on the server (unlike the 3D and panorama viewers).
export function VideoViewer({ src, poster }: { src: string; poster?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <video
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        className="max-h-full max-w-full"
      />
    </div>
  );
}
