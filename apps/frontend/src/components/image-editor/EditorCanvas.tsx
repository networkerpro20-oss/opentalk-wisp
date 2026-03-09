import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { useEditorState } from './hooks/useEditorState';
import { EditorTool, StrokeAnnotation, TextAnnotation } from './types';

interface EditorCanvasProps {
  imageSrc: string;
  stageRef: React.RefObject<Konva.Stage | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const MAX_IMAGE_SIZE = 1280;

export default function EditorCanvas({ imageSrc, stageRef, containerRef }: EditorCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const isDrawing = useRef(false);
  const currentStroke = useRef<number[]>([]);
  const transformerRef = useRef<Konva.Transformer>(null);

  const {
    tool, annotations, brushColor, brushSize, rotation,
    addAnnotation, updateAnnotation, selectedAnnotationId,
    setSelectedAnnotationId, setTextInputPosition, setIsAddingText,
  } = useEditorState();

  // Load image directly (no double conversion)
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Downscale if needed using a canvas
      if (img.width > MAX_IMAGE_SIZE || img.height > MAX_IMAGE_SIZE) {
        const ratio = Math.min(MAX_IMAGE_SIZE / img.width, MAX_IMAGE_SIZE / img.height);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const smallImg = new window.Image();
        smallImg.onload = () => setImage(smallImg);
        smallImg.src = canvas.toDataURL('image/jpeg', 0.85);
      } else {
        setImage(img);
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Calculate stage size - use polling to wait for container dimensions
  useEffect(() => {
    if (!image) return;
    const img = image;

    function updateSize() {
      const container = containerRef.current;
      if (!container) return false;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Container not yet laid out
      if (containerWidth === 0 || containerHeight === 0) return false;

      const isRotated = rotation % 180 !== 0;
      const imgW = isRotated ? img.height : img.width;
      const imgH = isRotated ? img.width : img.height;

      const fitScale = Math.min(containerWidth / imgW, containerHeight / imgH, 1);
      const stageW = Math.round(imgW * fitScale);
      const stageH = Math.round(imgH * fitScale);

      setScale(fitScale);
      setStageSize({ width: stageW, height: stageH });
      setOffset({
        x: Math.round((containerWidth - stageW) / 2),
        y: Math.round((containerHeight - stageH) / 2),
      });
      setReady(true);
      return true;
    }

    // Try immediately, then retry with rAF if container not ready
    if (!updateSize()) {
      let attempts = 0;
      const tryUpdate = () => {
        if (updateSize() || attempts > 20) return;
        attempts++;
        requestAnimationFrame(tryUpdate);
      };
      requestAnimationFrame(tryUpdate);
    }

    const handleResize = () => updateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [image, rotation, containerRef]);

  // Transformer for selected text
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (selectedAnnotationId) {
      const node = stageRef.current.findOne(`#${selectedAnnotationId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedAnnotationId, stageRef]);

  const getPointerPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x / scale, y: pos.y / scale };
  }, [stageRef, scale]);

  const handlePointerDown = useCallback(() => {
    if (tool === EditorTool.DRAW) {
      isDrawing.current = true;
      const pos = getPointerPos();
      if (pos) currentStroke.current = [pos.x, pos.y];
    } else if (tool === EditorTool.TEXT) {
      const pos = getPointerPos();
      if (pos) {
        setTextInputPosition({ x: pos.x * scale + offset.x, y: pos.y * scale + offset.y });
        setIsAddingText(true);
      }
    }
  }, [tool, getPointerPos, scale, offset, setTextInputPosition, setIsAddingText]);

  const handlePointerMove = useCallback(() => {
    if (!isDrawing.current || tool !== EditorTool.DRAW) return;
    const pos = getPointerPos();
    if (pos) {
      currentStroke.current = [...currentStroke.current, pos.x, pos.y];
      stageRef.current?.batchDraw();
    }
  }, [tool, getPointerPos, stageRef]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current || tool !== EditorTool.DRAW) return;
    isDrawing.current = false;
    if (currentStroke.current.length >= 4) {
      const stroke: StrokeAnnotation = {
        type: 'stroke',
        id: `stroke-${Date.now()}`,
        points: [...currentStroke.current],
        color: brushColor,
        strokeWidth: brushSize,
      };
      addAnnotation(stroke);
    }
    currentStroke.current = [];
  }, [tool, brushColor, brushSize, addAnnotation]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage() || e.target.name() === 'background-image') {
      setSelectedAnnotationId(null);
    }
  }, [setSelectedAnnotationId]);

  const handleTextDragEnd = useCallback((id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    updateAnnotation(id, { x: e.target.x(), y: e.target.y() } as Partial<TextAnnotation>);
  }, [updateAnnotation]);

  const handleTextTransformEnd = useCallback((id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    updateAnnotation(id, {
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
    } as Partial<TextAnnotation>);
  }, [updateAnnotation]);

  if (!image || !ready) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Cargando imagen...</div>
      </div>
    );
  }

  const isRotated = rotation % 180 !== 0;

  return (
    <div style={{ marginLeft: offset.x, marginTop: offset.y }}>
      <Stage
        ref={stageRef as React.LegacyRef<Konva.Stage>}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{ cursor: tool === EditorTool.DRAW ? 'crosshair' : tool === EditorTool.TEXT ? 'text' : 'default' }}
      >
        <Layer>
          <KonvaImage
            name="background-image"
            image={image}
            x={isRotated ? image.height : 0}
            y={0}
            rotation={rotation}
            width={image.width}
            height={image.height}
          />

          {annotations.filter((a): a is StrokeAnnotation => a.type === 'stroke').map((stroke) => (
            <Line
              key={stroke.id}
              points={stroke.points}
              stroke={stroke.color}
              strokeWidth={stroke.strokeWidth / scale}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation="source-over"
            />
          ))}

          {annotations.filter((a): a is TextAnnotation => a.type === 'text').map((t) => (
            <Text
              key={t.id}
              id={t.id}
              text={t.text}
              x={t.x}
              y={t.y}
              fontSize={t.fontSize / scale}
              fill={t.color}
              rotation={t.rotation}
              scaleX={t.scaleX}
              scaleY={t.scaleY}
              draggable={tool === EditorTool.TEXT}
              onClick={() => setSelectedAnnotationId(t.id)}
              onTap={() => setSelectedAnnotationId(t.id)}
              onDragEnd={(e) => handleTextDragEnd(t.id, e)}
              onTransformEnd={(e) => handleTextTransformEnd(t.id, e)}
            />
          ))}

          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 20 || newBox.height < 20) return oldBox;
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}
