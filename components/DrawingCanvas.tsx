"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { getStroke } from "perfect-freehand";

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
}

interface DrawingCanvasProps {
  onExport: (imageBase64: string) => void;
  onClear: () => void;
}

const STROKE_OPTIONS = {
  size: 4,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
};

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
}

export default function DrawingCanvas({ onExport, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor] = useState("#1a1a1a");
  const [penSize] = useState(4);

  const redraw = useCallback(
    (allStrokes: Stroke[], active: Point[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawStroke = (points: Point[], color: string, size: number) => {
        if (points.length < 2) return;
        const stroke = getStroke(
          points.map((p) => [p.x, p.y, p.pressure]),
          { ...STROKE_OPTIONS, size }
        );
        const path = new Path2D(getSvgPathFromStroke(stroke));
        ctx.fillStyle = color;
        ctx.fill(path);
      };

      for (const s of allStrokes) {
        drawStroke(s.points, s.color, s.size);
      }
      if (active.length > 1) {
        drawStroke(active, penColor, penSize);
      }
    },
    [penColor, penSize]
  );

  // Set canvas pixel density on mount (once only — intentionally no deps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    redraw(strokes, currentStroke);
  }, [strokes, currentStroke, redraw]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "touch") return; // ignore finger touch, only pen
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setCurrentStroke([getPos(e)]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || e.pointerType === "touch") return;
    e.preventDefault();
    setCurrentStroke((prev) => [...prev, getPos(e)]);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    setStrokes((prev) => [
      ...prev,
      { points: currentStroke, color: penColor, size: penSize },
    ]);
    setCurrentStroke([]);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    onClear();
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    redraw(strokes, []);
    const image = canvas.toDataURL("image/png");
    onExport(image);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 safe-top">
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 active:bg-gray-100"
          >
            ↩ Deshacer
          </button>
          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 active:bg-gray-100 text-red-500"
          >
            Limpiar
          </button>
        </div>
        <button
          onClick={handleExport}
          disabled={strokes.length === 0}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white disabled:opacity-40 active:bg-blue-700"
        >
          Guardar en Google Docs →
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 w-full touch-none bg-white cursor-crosshair"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
