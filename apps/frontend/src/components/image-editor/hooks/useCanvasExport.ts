import { RefObject, useCallback } from 'react';
import Konva from 'konva';

export function useCanvasExport(stageRef: RefObject<Konva.Stage | null>) {
  const exportAsBase64 = useCallback((quality = 0.85): string | null => {
    const stage = stageRef.current;
    if (!stage) return null;

    return stage.toDataURL({
      mimeType: 'image/jpeg',
      quality,
    });
  }, [stageRef]);

  return { exportAsBase64 };
}
