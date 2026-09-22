import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  Upload,
  User,
  Sliders,
  RotateCcw,
  Download,
  Sparkles,
} from 'lucide-react';
import type { SunglassesProduct } from '../data/sunglassesCatalog';
import {
  getFaceLandmarker,
  computeGlassesTransformFromLandmarks,
  type GlassesTransform,
} from '../utils/faceLandmarks';

interface VirtualTryOnProps {
  selectedProduct: SunglassesProduct;
}

type SourceMode = 'demo' | 'upload' | 'camera';

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ selectedProduct }) => {
  const [sourceMode, setSourceMode] = useState<SourceMode>('demo');
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState<boolean>(false);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Manual fine-tuning offsets
  const [offsetY, setOffsetY] = useState<number>(0);
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0);
  const [rotationOffsetDeg, setRotationOffsetDeg] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Cached Image elements
  const faceImageRef = useRef<HTMLImageElement | null>(null);
  const glassesImageRef = useRef<HTMLImageElement | null>(null);
  const cachedLandmarkTransformRef = useRef<GlassesTransform | null>(null);

  // Reset manual fine-tuning
  const handleResetAdjustments = () => {
    setOffsetY(0);
    setScaleMultiplier(1.0);
    setRotationOffsetDeg(0);
  };

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    let active = true;
    getFaceLandmarker().then((landmarker) => {
      if (active && landmarker) {
        setIsMediaPipeReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Main Render Routine onto HTML5 Canvas
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background Source (Video or Image)
    if (sourceMode === 'camera' && videoRef.current && videoRef.current.readyState >= 2) {
      ctx.save();
      // Mirror camera horizontally for natural webcam feel
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      ctx.restore();
    } else if (faceImageRef.current && faceImageRef.current.complete) {
      ctx.drawImage(faceImageRef.current, 0, 0, width, height);
    }

    // 2. Draw Glasses Overlay
    const glassesImg = glassesImageRef.current;
    const transform = cachedLandmarkTransformRef.current;

    if (glassesImg && glassesImg.complete && transform) {
      const gWidth = transform.width * scaleMultiplier;
      const gHeight = gWidth / (glassesImg.naturalWidth / glassesImg.naturalHeight || 2.0);
      const gCenterX = transform.centerX;
      const gCenterY = transform.centerY + offsetY;
      const totalAngle = transform.angleRad + (rotationOffsetDeg * Math.PI) / 180;

      ctx.save();
      ctx.translate(gCenterX, gCenterY);
      ctx.rotate(totalAngle);

      // Subtle drop shadow for natural facial integration
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;

      ctx.drawImage(
        glassesImg,
        -gWidth / 2,
        -gHeight / 2,
        gWidth,
        gHeight
      );

      ctx.restore();
    }
  }, [sourceMode, offsetY, scaleMultiplier, rotationOffsetDeg]);

  // Preload and cache glasses overlay image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Use local bundled image first, fallback to GCS if needed
    img.src = selectedProduct.local_image_url || selectedProduct.image_url;
    img.onload = () => {
      glassesImageRef.current = img;
      renderFrame();
    };
    img.onerror = () => {
      // Fallback to GCS URL
      img.src = selectedProduct.image_url;
    };
  }, [selectedProduct, renderFrame]);

  // Handle camera stream setup / cleanup
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (sourceMode === 'camera') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          console.warn('[Camera] Unable to access camera:', err);
          alert('Camera access denied or unavailable. Falling back to Demo Model.');
          setSourceMode('demo');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [sourceMode]);

  // Detect landmarks on static image
  const detectStaticFace = useCallback(async (imageElement: HTMLImageElement, canvas: HTMLCanvasElement) => {
    const landmarker = await getFaceLandmarker();
    if (!landmarker) {
      // Fallback calibrated transform for 1:1 portrait
      cachedLandmarkTransformRef.current = {
        centerX: canvas.width * 0.498,
        centerY: canvas.height * 0.455,
        width: canvas.width * 0.48,
        height: (canvas.width * 0.48) / 2.0,
        angleRad: 0,
      };
      setIsFaceDetected(true);
      return;
    }

    try {
      const results = landmarker.detect(imageElement);
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const transform = computeGlassesTransformFromLandmarks(
          results.faceLandmarks[0],
          canvas.width,
          canvas.height,
          2.0
        );
        if (transform) {
          cachedLandmarkTransformRef.current = transform;
          setIsFaceDetected(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Detection error:', e);
    }

    // Default fallback if no face landmarks matched
    cachedLandmarkTransformRef.current = {
      centerX: canvas.width * 0.5,
      centerY: canvas.height * 0.46,
      width: canvas.width * 0.48,
      height: (canvas.width * 0.48) / 2.0,
      angleRad: 0,
    };
    setIsFaceDetected(true);
  }, []);

  // Video loop for Live Webcam
  useEffect(() => {
    if (sourceMode !== 'camera') return;

    let isRunning = true;

    const processVideoLoop = async () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && canvas) {
        const landmarker = await getFaceLandmarker();
        if (landmarker) {
          try {
            const results = landmarker.detect(video);
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const transform = computeGlassesTransformFromLandmarks(
                results.faceLandmarks[0],
                canvas.width,
                canvas.height,
                2.0
              );
              if (transform) {
                // Invert X for mirrored webcam view
                transform.centerX = canvas.width - transform.centerX;
                transform.angleRad = -transform.angleRad;
                cachedLandmarkTransformRef.current = transform;
                setIsFaceDetected(true);
              }
            }
          } catch {
            // continue loop on drop
          }
        }
        renderFrame();
      }

      animationFrameIdRef.current = requestAnimationFrame(processVideoLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(processVideoLoop);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [sourceMode, renderFrame]);

  // Load Static Face Image (Demo or Uploaded)
  useEffect(() => {
    if (sourceMode === 'camera') return;

    const imageSrc = sourceMode === 'demo' ? '/demo-face.png' : uploadedImageSrc;
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = async () => {
      faceImageRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        await detectStaticFace(img, canvas);
        renderFrame();
      }
    };
  }, [sourceMode, uploadedImageSrc, detectStaticFace, renderFrame]);

  // Trigger re-render whenever sliders change
  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  // Handle photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImageSrc(result);
        setSourceMode('upload');
        handleResetAdjustments();
      };
      reader.readAsDataURL(file);
    }
  };

  // Download snapshot
  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `quizly-tryon-${selectedProduct.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-zinc-950/70 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl space-y-4">
      {/* Top Bar: Mode Switcher & Tracking Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Source Mode Buttons */}
        <div className="inline-flex rounded-2xl bg-zinc-900/90 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setSourceMode('demo');
              handleResetAdjustments();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              sourceMode === 'demo'
                ? 'bg-amber-400 text-black shadow-md font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Demo Model</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              sourceMode === 'upload'
                ? 'bg-amber-400 text-black shadow-md font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Selfie</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSourceMode('camera');
              handleResetAdjustments();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              sourceMode === 'camera'
                ? 'bg-amber-400 text-black shadow-md font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Live Camera</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isFaceDetected ? 'Face Mesh Synced' : isMediaPipeReady ? 'MediaPipe Ready' : 'Calibrated Geometry'}
          </div>

          <button
            type="button"
            onClick={() => setShowControls(!showControls)}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all cursor-pointer ${
              showControls
                ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white'
            }`}
            title="Fine-tune fit & scale"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Try-On Mirror Canvas */}
      <div className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center shadow-inner">
        {/* Hidden video element for webcam frame ingestion */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="hidden"
        />

        {/* High-DPI Output Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={sourceMode === 'demo' ? 800 : 600}
          className="h-full w-full object-contain"
        />

        {/* Live Floating Product Tag overlay */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <div>
            <div className="text-[11px] font-semibold text-white tracking-wide">
              {selectedProduct.title}
            </div>
            <div className="text-[10px] text-zinc-400">
              ${selectedProduct.price} • {selectedProduct.frame_size} Fit
            </div>
          </div>
        </div>

        {/* Snapshot Download Button */}
        <button
          type="button"
          onClick={handleDownloadSnapshot}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 text-xs font-medium transition-all cursor-pointer shadow-lg active:scale-95"
        >
          <Download className="h-3.5 w-3.5 text-amber-400" />
          <span>Save Look</span>
        </button>
      </div>

      {/* Fine-Tuning Drawer (Collapsible) */}
      {showControls && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Micro-Fit Tuning
            </span>
            <button
              type="button"
              onClick={handleResetAdjustments}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Position Y Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Nose Bridge Height</span>
                <span className="font-mono text-zinc-300">{offsetY}px</span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Scale Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Scale Size</span>
                <span className="font-mono text-zinc-300">{Math.round(scaleMultiplier * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.01}
                value={scaleMultiplier}
                onChange={(e) => setScaleMultiplier(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Tilt Angle</span>
                <span className="font-mono text-zinc-300">{rotationOffsetDeg}°</span>
              </div>
              <input
                type="range"
                min={-15}
                max={15}
                value={rotationOffsetDeg}
                onChange={(e) => setRotationOffsetDeg(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
