import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  Sliders,
  RotateCcw,
  Download,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { SunglassesProduct } from '../data/sunglassesCatalog';
import {
  getFaceLandmarker,
  computeGlassesTransformFromLandmarks,
  type GlassesTransform,
} from '../utils/faceLandmarks';

interface VirtualTryOnProps {
  selectedProduct: SunglassesProduct;
  whyReasons?: string[];
  alternatives?: SunglassesProduct[];
  onSelectProduct?: (product: SunglassesProduct) => void;
  onProceedToPaywall?: () => void;
  onRetakeQuiz?: () => void;
}

type CameraState = 'requesting' | 'active' | 'denied' | 'unsupported';

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({
  selectedProduct,
  whyReasons = [],
  alternatives = [],
  onSelectProduct,
  onProceedToPaywall,
  onRetakeQuiz,
}) => {
  const [cameraState, setCameraState] = useState<CameraState>('requesting');
  const [isMediaPipeReady, setIsMediaPipeReady] = useState<boolean>(false);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Manual fine-tuning offsets
  const [offsetY, setOffsetY] = useState<number>(0);
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0);
  const [rotationOffsetDeg, setRotationOffsetDeg] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Cached glasses image element and smoothed landmark transform
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

    // 1. Draw Live Video Feed (horizontally mirrored for vanity mirror experience)
    if (videoRef.current && videoRef.current.readyState >= 2) {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      ctx.restore();
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

      // Subtle drop shadow for natural facial depth
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
  }, [offsetY, scaleMultiplier, rotationOffsetDeg]);

  // Preload and cache glasses overlay image whenever selected product changes
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedProduct.local_image_url || selectedProduct.image_url;
    img.onload = () => {
      glassesImageRef.current = img;
      renderFrame();
    };
    img.onerror = () => {
      img.src = selectedProduct.image_url;
    };
  }, [selectedProduct, renderFrame]);

  // Start live webcam stream
  const startCamera = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => setCameraState('unsupported'));
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then(async (stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraState('active');
      })
      .catch((err) => {
        console.warn('[Camera] Access error:', err);
        setCameraState('denied');
      });
  }, []);

  // Request camera on mount
  useEffect(() => {
    void startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [startCamera]);

  // Real-time Video Processing Loop (MediaPipe landmark detection + dynamic scaling)
  useEffect(() => {
    if (cameraState !== 'active') return;

    let isRunning = true;

    const processVideoLoop = async () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && canvas) {
        // Direct synchronization with camera feed aspect ratio to avoid distortion
        if (video.videoWidth && video.videoHeight) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
        }

        const glassesImg = glassesImageRef.current;
        const aspectRatio =
          glassesImg && glassesImg.naturalWidth && glassesImg.naturalHeight
            ? glassesImg.naturalWidth / glassesImg.naturalHeight
            : 2.5;

        const landmarker = await getFaceLandmarker();
        if (landmarker) {
          try {
            const results = landmarker.detect(video);
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
              const transform = computeGlassesTransformFromLandmarks(
                results.faceLandmarks[0],
                canvas.width,
                canvas.height,
                aspectRatio
              );

              if (transform) {
                // Invert horizontal coordinate & tilt angle for natural mirrored view
                transform.centerX = canvas.width - transform.centerX;
                transform.angleRad = -transform.angleRad;

                // Exponential Moving Average (LERP) smoothing between video frames
                const prev = cachedLandmarkTransformRef.current;
                if (!prev) {
                  cachedLandmarkTransformRef.current = transform;
                } else {
                  const lerp = 0.35;
                  cachedLandmarkTransformRef.current = {
                    centerX: prev.centerX * (1 - lerp) + transform.centerX * lerp,
                    centerY: prev.centerY * (1 - lerp) + transform.centerY * lerp,
                    width: prev.width * (1 - lerp) + transform.width * lerp,
                    height: prev.height * (1 - lerp) + transform.height * lerp,
                    angleRad: prev.angleRad * (1 - lerp) + transform.angleRad * lerp,
                  };
                }
                setIsFaceDetected(true);
              }
            } else {
              setIsFaceDetected(false);
            }
          } catch {
            // Keep loop alive on dropped frames
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
  }, [cameraState, renderFrame]);

  // Redraw when sliders change
  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

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
    <div className="w-full space-y-6">
      {/* Mirror Container */}
      <div className="w-full rounded-3xl border border-white/10 bg-zinc-950/70 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Top Header Bar: Status & Micro-Fit Toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cameraState === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${cameraState === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="text-xs font-medium text-zinc-300">
              {cameraState === 'active' ? (isFaceDetected ? 'Live Mirror • Face Tracking Active' : 'Live Mirror • Looking for face') : 'Starting Live Camera...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isMediaPipeReady && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Optical Tracking 60fps
              </span>
            )}

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

        {/* Live Camera Viewport */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center shadow-inner">
          {/* Hidden video element for webcam feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="hidden"
          />

          {/* High-DPI Output Canvas */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="h-full w-full object-cover"
          />

          {/* Fallback Overlay if Camera Permission is Pending or Denied */}
          {cameraState === 'requesting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md p-6 text-center">
              <Camera className="h-10 w-10 text-amber-400 animate-pulse mb-3" />
              <p className="text-sm font-medium text-white">Connecting your camera mirror...</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Please allow camera access when prompted by your browser to see your glasses live.
              </p>
            </div>
          )}

          {cameraState === 'denied' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6 text-center">
              <AlertCircle className="h-10 w-10 text-rose-400 mb-3" />
              <p className="text-sm font-semibold text-white">Camera Access Required</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                To try on your custom fit live, please enable camera access in your browser address bar.
              </p>
              <button
                type="button"
                onClick={() => void startCamera()}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold cursor-pointer transition-all shadow-lg active:scale-95"
              >
                Retry Camera
              </button>
            </div>
          )}

          {cameraState === 'unsupported' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6 text-center">
              <Camera className="h-10 w-10 text-zinc-500 mb-3" />
              <p className="text-sm font-semibold text-white">Webcam Not Supported</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Your browser or device does not support webcam streaming.
              </p>
            </div>
          )}

          {/* Floating Live Product Badge */}
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

          {/* Snapshot Button */}
          {cameraState === 'active' && (
            <button
              type="button"
              onClick={handleDownloadSnapshot}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 text-xs font-medium transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              <span>Save Look</span>
            </button>
          )}
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
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Bridge Height</span>
                  <span>{offsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Temple Span Scale</span>
                  <span>{Math.round(scaleMultiplier * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.01"
                  value={scaleMultiplier}
                  onChange={(e) => setScaleMultiplier(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Ear Tilt Rotation</span>
                  <span>{rotationOffsetDeg}°</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  value={rotationOffsetDeg}
                  onChange={(e) => setRotationOffsetDeg(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alternative Recommendations Carousel (If available) */}
      {alternatives.length > 0 && onSelectProduct && (
        <div className="space-y-2">
          <p className="caption text-faint">Or try on other algorithm matches:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {alternatives.map((alt) => {
              const isSelected = alt.id === selectedProduct.id;
              return (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => onSelectProduct(alt)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10 text-white'
                      : 'border-white/10 bg-tile hover:border-white/20 text-muted'
                  }`}
                >
                  <img
                    src={alt.local_image_url || alt.image_url}
                    alt={alt.title}
                    className="h-9 w-12 object-contain rounded"
                  />
                  <div className="truncate min-w-0">
                    <p className="text-xs font-medium text-ink truncate">{alt.title}</p>
                    <p className="caption text-faint">${alt.price}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Information Card with AI Fit Reasoning */}
      <div className="rounded-2xl border border-white/10 bg-tile p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="caption px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 font-semibold border border-amber-400/20">
                ⭐ 99% Fit Match
              </span>
              <span className="caption text-faint">{selectedProduct.aesthetic_archetype}</span>
            </div>
            <h2 className="mt-2 text-xl font-medium text-ink">{selectedProduct.title}</h2>
            <p className="caption text-muted mt-0.5">
              {selectedProduct.brand} • {selectedProduct.frame_material}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-ink">${selectedProduct.price}</span>
            <p className="caption text-faint">Free Shipping</p>
          </div>
        </div>

        {/* AI "Why" Reasoning */}
        {whyReasons.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-rule">
            <p className="caption text-ink font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Why this pair fits your profile:
            </p>
            <ul className="space-y-2">
              {whyReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted leading-relaxed">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Primary Call to Action: Proceed to Paywall */}
      <div className="pt-2 pb-6 space-y-3">
        <button
          type="button"
          onClick={onProceedToPaywall}
          className="w-full min-h-14 flex items-center justify-center gap-2 rounded-pill bg-ink text-page hover:bg-accent-strong text-[1.0625rem] font-semibold transition-all cursor-pointer shadow-lg active:scale-98"
        >
          <span>Claim My Fit & Proceed to Checkout</span>
          <ArrowRight className="h-5 w-5" />
        </button>

        {onRetakeQuiz && (
          <div className="text-center">
            <button
              type="button"
              onClick={onRetakeQuiz}
              className="caption text-faint hover:text-muted cursor-pointer transition-colors"
            >
              Start over / Retake quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
