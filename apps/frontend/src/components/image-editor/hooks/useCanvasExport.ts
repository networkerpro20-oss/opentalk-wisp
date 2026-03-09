import { RefObject, useCallback } from 'react';
import Konva from 'konva';

const MAX_EXPORT_SIZE = 1280;

export function useCanvasExport(stageRef: RefObject<Konva.Stage | null>) {
  const exportAsBase64 = useCallback((quality = 0.7): string | null => {
    const stage = stageRef.current;
    if (!stage) return null;

    // Export the stage at full resolution
    const dataUrl = stage.toDataURL({
      mimeType: 'image/jpeg',
      quality,
    });

    // If the exported image is too large (>2MB base64), reduce quality further
    if (dataUrl.length > 2 * 1024 * 1024) {
      return stage.toDataURL({
        mimeType: 'image/jpeg',
        quality: 0.5,
      });
    }

    return dataUrl;
  }, [stageRef]);

  return { exportAsBase64 };
}
