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
 * - Landmark 33 & 263: Right & left eye outer corners for rotation angle & eye level
 * - Landmark 127 & 356: Right & left ear connection points (tragus)
 * - Landmark 234 & 454: Right & left temporal edges of face
 */
export function computeGlassesTransformFromLandmarks(
  landmarks: Array<{ x: number; y: number; z?: number }>,
  canvasWidth: number,
  canvasHeight: number,
  aspectRatio: number = 2.5
): GlassesTransform | null {
  if (!landmarks || landmarks.length < 455) return null;

  // Landmark 168 = Glabella / Nose Bridge
  const bridge = landmarks[168];
  // Landmark 33 = right eye outer, Landmark 263 = left eye outer
  const rightEyeOuter = landmarks[33];
  const leftEyeOuter = landmarks[263];
  // Landmark 234 = right temporal, Landmark 454 = left temporal
  const rightTemporal = landmarks[234];
  const leftTemporal = landmarks[454];
  // Landmark 127 = right ear connection, Landmark 356 = left ear connection
  const rightEar = landmarks[127];
  const leftEar = landmarks[356];

  const p1X = rightEyeOuter.x * canvasWidth;
  const p1Y = rightEyeOuter.y * canvasHeight;
  const p2X = leftEyeOuter.x * canvasWidth;
  const p2Y = leftEyeOuter.y * canvasHeight;

  // Face tilt angle between eye canthi
  const angleRad = Math.atan2(p2Y - p1Y, p2X - p1X);

  // Face width across temples
  const t1X = rightTemporal.x * canvasWidth;
  const t1Y = rightTemporal.y * canvasHeight;
  const t2X = leftTemporal.x * canvasWidth;
  const t2Y = leftTemporal.y * canvasHeight;
  const templeDist = Math.hypot(t2X - t1X, t2Y - t1Y);

  // Face width across ear tragus points
  const e1X = rightEar.x * canvasWidth;
  const e1Y = rightEar.y * canvasHeight;
  const e2X = leftEar.x * canvasWidth;
  const e2Y = leftEar.y * canvasHeight;
  const earDist = Math.hypot(e2X - e1X, e2Y - e1Y);

  // Auto-scale glasses width to span from ear to ear across face temples
  // In optical anatomy, front chassis covers 100-104% of ear distance or 1.18x temple width
  const glassesWidth = Math.max(earDist * 1.02, templeDist * 1.18);
  const glassesHeight = glassesWidth / (aspectRatio || 2.5);

  // Horizontal center between eyes & bridge
  const eyeMidX = (p1X + p2X) / 2;
  const bridgeX = bridge.x * canvasWidth;
  const centerX = eyeMidX * 0.7 + bridgeX * 0.3;

  // Vertical center: Align lenses directly over eye pupils with slight bridge offset
  const eyeMidY = (p1Y + p2Y) / 2;
  const bridgeY = bridge.y * canvasHeight;
  const centerY = eyeMidY * 0.75 + bridgeY * 0.25;

  return {
    centerX,
    centerY,
    width: glassesWidth,
    height: glassesHeight,
    angleRad,
  };
}
