// AvatarCropper.tsx — Crop & resize avatar before upload
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Check, RotateCw } from 'lucide-react';

interface AvatarCropperProps {
  imageFile: File;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export default function AvatarCropper({ imageFile, onCrop, onCancel }: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState('');
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  const CANVAS_SIZE = 280;
  const OUTPUT_SIZE = 400; // final exported image size

  // Load image
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      // Auto-fit: calculate initial zoom to fill the circle
      const minDim = Math.min(image.width, image.height);
      const initialZoom = CANVAS_SIZE / minDim;
      setZoom(initialZoom * 1.05);
      setOffset({ x: 0, y: 0 });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Draw preview
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw image centered with zoom + offset + rotation
    const cx = CANVAS_SIZE / 2 + offset.x;
    const cy = CANVAS_SIZE / 2 + offset.y;

    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    ctx.restore();
  }, [img, zoom, offset, rotation]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse/touch handlers
  function handlePointerDown(e: React.PointerEvent) {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function handlePointerUp() {
    setDragging(false);
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(z => Math.max(0.2, Math.min(5, z + delta)));
  }

  // Export cropped image
  function handleCrop() {
    if (!img) return;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = OUTPUT_SIZE;
    outCanvas.height = OUTPUT_SIZE;
    const ctx = outCanvas.getContext('2d')!;

    // Scale factor from preview to output
    const scale = OUTPUT_SIZE / CANVAS_SIZE;

    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const cx = (CANVAS_SIZE / 2 + offset.x) * scale;
    const cy = (CANVAS_SIZE / 2 + offset.y) * scale;

    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * scale, zoom * scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    outCanvas.toBlob(
      (blob) => {
        if (blob) onCrop(blob);
      },
      'image/webp',
      0.9
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="rounded-3xl p-6 w-[360px] shadow-2xl"
          style={{
            background: 'rgba(20,20,25,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-200">Ajustar Foto</h3>
            <button onClick={onCancel} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas preview */}
          <div className="flex justify-center mb-4">
            <div
              className="relative rounded-full overflow-hidden cursor-grab active:cursor-grabbing"
              style={{
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                boxShadow: '0 0 0 2px rgba(255,255,255,0.1), 0 0 40px rgba(249,115,22,0.1)',
              }}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
                className="block"
                style={{ touchAction: 'none' }}
              />
              {/* Ring overlay */}
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.15)' }} />
            </div>
          </div>

          <p className="text-[10px] text-zinc-600 text-center mb-4">
            Arraste para mover • Scroll para zoom
          </p>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-5">
            <ZoomOut className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <input
              type="range"
              min="0.2"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${((zoom - 0.2) / 3.8) * 100}%, rgba(255,255,255,0.1) ${((zoom - 0.2) / 3.8) * 100}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <ZoomIn className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <button
              onClick={() => setRotation(r => r + 90)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors ml-1"
              title="Rotacionar"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-400 transition-all hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCrop}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all flex items-center justify-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
              }}
            >
              <Check className="w-3.5 h-3.5" />
              Aplicar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
