import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let landmarkerInstance: FaceLandmarker | null = null;
let isInitializing = false;

export async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (landmarkerInstance) return landmarkerInstance;
  if (isInitializing) return null;

  try {
    isInitializing = true;
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    landmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      numFaces: 1,
    });
    return landmarkerInstance;
  } catch (err) {
    console.warn('[FaceLandmarker] Fallback to calibrated geometry:', err);
    return null;
  } finally {
    isInitializing = false;
  }
}

export interface GlassesTransform {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  angleRad: number;
}

/**
 * Computes the glasses transform from MediaPipe 478 landmarks.
 * - Landmark 168: Nose bridge / Glabella anchor point
 * - Landmark 33 & 263: Left & right outer eye canthi for rotation angle
 * - Landmark 234 & 454: Left & right temporal cheek margins for scaling width
 */
export function computeGlassesTransformFromLandmarks(
  landmarks: Array<{ x: number; y: number; z?: number }>,
  canvasWidth: number,
  canvasHeight: number,
  aspectRatio: number = 2.0 // glasses image width / height
): GlassesTransform | null {
  if (!landmarks || landmarks.length < 455) return null;

  // Landmark 168 = Glabella / Nose Bridge
  const bridge = landmarks[168];
  // Landmark 33 = right eye outer (screen left), Landmark 263 = left eye outer (screen right)
  const leftEyeOuter = landmarks[33];
  const rightEyeOuter = landmarks[263];
  // Landmark 234 = right temporal, Landmark 454 = left temporal
  const leftTemporal = landmarks[234];
  const rightTemporal = landmarks[454];

  const p1X = leftEyeOuter.x * canvasWidth;
  const p1Y = leftEyeOuter.y * canvasHeight;
  const p2X = rightEyeOuter.x * canvasWidth;
  const p2Y = rightEyeOuter.y * canvasHeight;

  // Angle between eyes
  const angleRad = Math.atan2(p2Y - p1Y, p2X - p1X);

  // Face width across temples
  const t1X = leftTemporal.x * canvasWidth;
  const t1Y = leftTemporal.y * canvasHeight;
  const t2X = rightTemporal.x * canvasWidth;
  const t2Y = rightTemporal.y * canvasHeight;
  const templeDist = Math.hypot(t2X - t1X, t2Y - t1Y);

  // Glasses width should span temple to temple with slight optical overhang (~1.08x)
  const glassesWidth = templeDist * 1.08;
  const glassesHeight = glassesWidth / aspectRatio;

  // Anchor center at nose bridge
  const bridgeX = bridge.x * canvasWidth;
  const bridgeY = bridge.y * canvasHeight;

  return {
    centerX: bridgeX,
    centerY: bridgeY + glassesHeight * 0.04, // slight downward bias on bridge
    width: glassesWidth,
    height: glassesHeight,
    angleRad,
  };
}
