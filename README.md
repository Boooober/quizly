# Quizly: Hyperpersonalized Sunglasses Recommendation Agent
## GCP Hackathon Architecture & Implementation Guide

Quizly is an adaptive, conversion-focused quiz funnel engineered to maximize sunglasses sales. It couples an intelligent AI diagnostic agent running on Google Cloud's **Vertex AI Agent Engine** (Reasoning Engine) with an instant, real-time client-side **MediaPipe 2D Visual Try-On (VTO)** engine.

---

### 1. Architectural Highlights

- **Decoupled Funnel**:
  - **Diagnostic Agent (Vertex AI Reasoning Engine / Gemini 2.5 Flash)**: Interactively interviews the user (8 screens) across cephalometrics, fit pain points, lifestyle environments, style semiotics and commercial calibration. Builds trust and extracts structured diagnostic signals without making direct product recommendations.
  - **Downstream Recommender & Offer Engine**: Matches the user's answers against the 20 curated sunglasses archetypes in `sunglasses.jsonl`, generating high-converting "Why It Fits You" personalized rationale and discount offers.
  - **Visual Try-On (VTO)**: Real-time 2D canvas overlay using MediaPipe 478 face landmarks for instant in-browser try-on (<50ms latency).
- **Backend API (NestJS on Cloud Run)**: Implements `POST /quiz/submit-answer` with Swagger OpenAPI specs and rigorous class-validator DTOs.
- **Infrastructure as Code (Pulumi)**: Fully provisions the Vertex AI Reasoning Engine, Artifact Registry, Cloud Run backend, and IAM permissions in `pulumi/`.

---

### 2. API Contract & DTOs

The backend exposes `POST /quiz/submit-answer` ([`apps/backend/src/app.controller.ts`](file:///Users/illia.kazachkovskyi/Documents/Illia%20Project/quizly/apps/backend/src/app.controller.ts)) with DTOs defined in [`apps/backend/src/quiz.dto.ts`](file:///Users/illia.kazachkovskyi/Documents/Illia%20Project/quizly/apps/backend/src/quiz.dto.ts):

#### Supported Question Types
- `"singleChoice"`: 2 to 4 answer options (single selection).
- `"multiChoice"`: Exactly 4 answer options (multi-selection).

#### Request Body: `AnsweredQuestionDto[]`
Send an array of all questions asked so far and the user's selected answers (send `[]` to start the quiz):
```json
[
  {
    "question": "Is your face longer than it is wide, or about equal?",
    "answers": [
      "Noticeably longer than wide",
      "About equal"
    ],
    "typeOfQuestion": "singleChoice",
    "selectedAnswers": [
      "Noticeably longer than wide"
    ]
  }
]
```

#### Response: `NextQuestionResponseDto`
Returns the next question to ask, or `nextQuestion: null` when the diagnostic survey is complete (8 questions):
```json
{
  "nextQuestion": {
    "question": "What frustrates you most about sunglasses staying in place?",
    "answers": [
      "They slide down my nose constantly",
      "They leave red pinch marks on my nose",
      "They sit too high above my eyebrows",
      "No issues, they fit fine"
    ],
    "typeOfQuestion": "singleChoice"
  }
}
```
When complete:
```json
{
  "nextQuestion": null
}
```

---

### 3. Repository Structure

```
├── apps/
│   └── backend/                    # NestJS API backend (Cloud Run)
│       ├── src/
│       │   ├── app.controller.ts   # POST /quiz/submit-answer
│       │   ├── app.service.ts      # Queries Vertex AI Reasoning Engine
│       │   └── quiz.dto.ts         # TypeScript DTOs & Validation
│       ├── Dockerfile              # Container image definition
│       └── package.json
├── pulumi/                         # Pulumi GCP Infrastructure
│   ├── agent/
│   │   └── prompt.md               # Diagnostic consultation system prompt
│   ├── index.ts                    # Vertex AI Reasoning Engine & Cloud Run
│   └── Pulumi.dev.yaml             # GCP project & region config
├── images/                         # Product & VTO transparent PNG overlays (sg-01 to sg-20)
├── sunglasses.jsonl                # 20 curated sunglasses archetypes
├── sunglasses_design_ontology.md   # 16-dimensional optical ontology
├── quizly-question-framework.md    # 4-pillar onboarding question framework
├── quizly-agent-architecture.md    # In-depth architectural blueprint
└── visual-try-on-spec.md           # MediaPipe 2D VTO specification
```

---

### 4. Running & Deployment

#### Running the Backend Locally:
```bash
cd apps/backend
npm install
npm run start:dev
```
Access the Swagger documentation at: `http://localhost:3000/docs`

#### Deploying Infrastructure with Pulumi:
```bash
cd pulumi
pulumi up
```
*(Requires active GCP credentials authenticated with `gcloud auth application-default login`).*
