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

const MAX_IMAGE_SIZE = 1920;

function downscaleImage(img: HTMLImageElement): HTMLCanvasElement {
  let { width, height } = img;
  if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
    const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export default function EditorCanvas({ imageSrc, stageRef, containerRef }: EditorCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDrawing = useRef(false);
  const currentStroke = useRef<number[]>([]);
  const transformerRef = useRef<Konva.Transformer>(null);

  const {
    tool, annotations, brushColor, brushSize, rotation,
    addAnnotation, updateAnnotation, selectedAnnotationId,
    setSelectedAnnotationId, setTextInputPosition, setIsAddingText,
  } = useEditorState();

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = downscaleImage(img);
      const downscaled = new window.Image();
      downscaled.onload = () => {
        setImage(downscaled);
        setImageSize({ width: downscaled.width, height: downscaled.height });
      };
      downscaled.src = canvas.toDataURL('image/jpeg', 0.95);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Calculate stage size to fit container
  useEffect(() => {
    function updateSize() {
      const container = containerRef.current;
      if (!container || !image) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const isRotated = rotation % 180 !== 0;
      const imgW = isRotated ? image.height : image.width;
      const imgH = isRotated ? image.width : image.height;

      const scaleX = containerWidth / imgW;
      const scaleY = containerHeight / imgH;
      const fitScale = Math.min(scaleX, scaleY, 1);

      const stageW = Math.round(imgW * fitScale);
      const stageH = Math.round(imgH * fitScale);

      setScale(fitScale);
      setStageSize({ width: stageW, height: stageH });
      setOffset({
        x: Math.round((containerWidth - stageW) / 2),
        y: Math.round((containerHeight - stageH) / 2),
      });
    }

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
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

  // Drawing handlers
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
      // Force re-render for live stroke preview
      const stage = stageRef.current;
      if (stage) stage.batchDraw();
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

  if (!image || stageSize.width === 0) return null;

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
          {/* Background image */}
          <KonvaImage
            name="background-image"
            image={image}
            x={isRotated ? (image.height) : 0}
            y={isRotated ? 0 : 0}
            rotation={rotation}
            width={image.width}
            height={image.height}
          />

          {/* Stroke annotations */}
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

          {/* Live drawing stroke */}
          {isDrawing.current && currentStroke.current.length >= 4 && (
            <Line
              points={currentStroke.current}
              stroke={brushColor}
              strokeWidth={brushSize / scale}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Text annotations */}
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

          {/* Transformer for selected text */}
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
