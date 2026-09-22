# Quizly: Lightweight Visual Try-On (VTO) Specification
## High-Level Engineering Blueprint for Google Cloud Hackathon

---

### 1. Architectural Strategy & Evaluation

For a rapid hackathon delivery (under 2 hours), **Google MediaPipe Face Landmark Detection + HTML5 2D Canvas Overlay** strongly outperforms generative inpainting (e.g. Diffusion / Banana.dev / Imagen):

| Dimension | Google MediaPipe + 2D Canvas | Generative AI Inpainting (Diffusion / Banana) |
| :--- | :--- | :--- |
| **Execution** | Client-side (in-browser WebAssembly/WebGL) | Server-side GPU API |
| **Latency** | **< 50 milliseconds** | 4 to 12 seconds per image |
| **Infrastructure / Cost** | **Zero server cost, zero GPU instances** | Requires GPU (A10G/T4) or paid external API |
| **Product Fidelity** | **100% exact SKU match** (uses real product PNG) | High hallucination risk (altered frames / colors) |
| **Implementation Time**| **~30 to 45 minutes** | 3 to 5 hours (masking, prompts, timeouts) |
| **Failure Modes** | None (deterministic geometry) | Face distortion, artifacts, API rate limits |

---

### 2. User Journey & Integration Flow

The try-on is placed at the high-intent climax of the funnel:

```
[Adaptive Quiz: 7–15 Questions]
              │
              ▼
[Step: Snap / Upload Selfie] ───> `<input type="file" accept="image/*" capture="user">`
              │
      ┌───────┴────────────────────────┐
      ▼                                ▼
[MediaPipe Landmark Engine]      [Gemini 2.0 Flash Vision]
(Calculates scale, rotation,     (Extracts face shape, bridge,
 nose bridge anchor)              skin tone for match justification)
      │                                │
      └───────┬────────────────────────┘
              ▼
[Final Results / Conversion Screen]
 • Interactive Try-On Canvas (User wearing Hero Pair)
 • 1-Click Toggles to try Alternative Pairs
 • "Before / After" Split View
 • Personalized Rationale (Softens jawline, blocks driving glare)
 • Direct "Claim 15% Off & Buy" CTA
```

---

### 3. Landmark Coordinate Formulas & Geometry Engine

Using Google MediaPipe's 478 3D Face Landmarks, the overlay engine uses three anchor points:

```
                    (168) Nose Bridge / Glabella Anchor
                             ┌─────┴─────┐
      (33) Left Outer Eye ───┤  GLASSES  ├─── (263) Right Outer Eye
                             └───────────┘
               (234) Left Temple ───── (454) Right Temple
```

#### Key Mathematical Formulas:

1. **Center Anchor $(X_c, Y_c)$**:
   $$\text{Anchor} = \text{Landmark } 168 \quad (\text{midpoint between eyebrows and bridge})$$

2. **Rotation Angle ($\theta$)**:
   $$\theta = \arctan2(Y_{263} - Y_{33},\; X_{263} - X_{33})$$
   *Compensates smoothly for any head tilt / roll.*

3. **Frame Scale & Width ($W_{\text{glasses}}$)**:
   $$\text{Face Temple Width} = \sqrt{(X_{454} - X_{234})^2 + (Y_{454} - Y_{234})^2}$$
   $$W_{\text{glasses}} = \text{Face Temple Width} \times 1.05$$
   $$\text{Height} = W_{\text{glasses}} \times \text{Aspect Ratio of Product PNG}$$

4. **Realistic Canvas Shading**:
   - `ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'` with an 8px blur to simulate natural cast shadows on the cheeks and bridge.
   - Global opacity set to 0.92–0.96 for realistic polarized / gradient lens transparency.

---

### 4. Product Asset Requirements

To support the try-on engine, each sunglasses SKU in the catalog requires:
- **Image Format**: Transparent 24-bit PNG.
- **Perspective**: Perfectly flat, front-facing product photography with temples folded back.
- **Dimensions**: ~800 × 320 px (or similar 2.5:1 ratio).
- **Hosting**: Served directly from Google Cloud Storage or public `/public/glasses/` directory.

---

### 5. Frontend Integration Hooks

The Try-On module exposes three clean UI hooks to the main Quizly app:

1. **`initializeFaceDetector()`**:
   - Loads `@mediapipe/tasks-vision` FaceLandmarker bundle via CDN or ES module.
   - Pre-warms the detector in the background while user answers early quiz questions.

2. **`renderTryOn(selfieImageElement, sunglassesSkuId, canvasTarget)`**:
   - Detects landmarks on the static selfie.
   - Clears canvas, renders selfie base layer.
   - Applies rotation, scale, and translation transforms to render the requested sunglasses SKU.

3. **`switchFrame(newSkuId)`**:
   - Re-draws the canvas with a new frame overlay in <15ms without re-running facial landmark detection.

---

### 6. Hackathon Quick-Start (Execution in 4 Steps)

1. **Step 1 (10 mins)**: Add `<script src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js">` to the HTML head.
2. **Step 2 (15 mins)**: Prepare 3 front-facing transparent PNGs for the catalog's top models.
3. **Step 3 (20 mins)**: Implement the 4-formula geometry transform on an HTML5 `<canvas>`.
4. **Step 4 (15 mins)**: Connect the selfie upload input at the quiz finish line to the canvas renderer.
