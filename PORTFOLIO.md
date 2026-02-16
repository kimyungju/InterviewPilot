# AI Mock Interview Generator

## 1. Overview & Motivation

Preparing for technical interviews is a feedback-starved process. Candidates rehearse answers in their heads, record themselves on their phones, or pay for one-off coaching sessions — none of which provide structured, repeatable, diagnostic feedback. The gap is not access to questions; it is access to a realistic interview loop that evaluates *what you said* against *what you should have said*, broken down by competency.

This project is a full-stack AI mock interview platform that closes that gap. Users describe a target role — job title, description, experience level — and the system generates a tailored set of interview questions with model answers via OpenAI. The interview itself runs in the browser: the platform reads each question aloud using text-to-speech, records the candidate's spoken response via the Web Speech API, and submits each answer for AI-powered multi-dimensional feedback. Results are stored per-session, displayed in a collapsible review interface, and exportable as a formatted PDF report.

Key capabilities:

- **Three creation modes** — standard form, reference-material-based (paste or upload a PDF), and resume-personalized interviews that probe specific claims from the candidate's background
- **Configurable interviews** — type (behavioral, technical, system design), difficulty (junior/mid/senior), question count, and a question bank with random or sequential selection
- **Live speech interface** — TTS reads the question, a visual countdown starts, speech recognition captures the answer, and AI feedback scores across four competency dimensions
- **Bilingual support** — full English and Korean localization including AI prompts, TTS voice selection, and PDF rendering with CJK font injection
- **PDF export** — client-side report generation with per-question breakdowns, competency scores, and suggested improvements

The platform targets job seekers, CS students, and career changers who want structured practice without scheduling a human coach. It exists at the intersection of a real product and an engineering demonstration — every architectural decision serves both goals simultaneously.

---

## 2. Technical Architecture & Workflow

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                           │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  react-webcam │  │ Web Speech   │  │  jsPDF (PDF export)        │ │
│  │  (video feed) │  │ API (STT/TTS)│  │  + NotoSansKR font loader  │ │
│  └──────────────┘  └──────────────┘  └────────────────────────────┘ │
│                           │                                         │
│              spoken answer │  TTS playback                          │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────┐                   │
│  │  Next.js 16 App Router (React 19)            │                   │
│  │  Client pages: dashboard, interview, feedback │                   │
│  └──────────────────────────┬───────────────────┘                   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ Server Actions
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Server (Node.js)                              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Clerk Auth   │  │ OpenAI API   │  │ pdf-parse    │              │
│  │ (middleware + │  │ (gpt-4o-mini │  │ (resume text │              │
│  │  currentUser) │  │  json_object) │  │  extraction) │              │
│  └──────────────┘  └──────┬───────┘  └──────────────┘              │
│                           │                                         │
│                           ▼                                         │
│                    ┌──────────────┐                                  │
│                    │ Drizzle ORM  │                                  │
│                    │ + PostgreSQL │                                  │
│                    │  (Supabase)  │                                  │
│                    └──────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Auth & Data Isolation

Clerk middleware guards all `/dashboard/**` routes at the edge. Every server action independently calls `currentUser()` as a second authentication check before touching the database — defense in depth that prevents data access even if middleware is bypassed:

```typescript
// app/actions/interview.ts — dual-layer auth guard
async function getAuthEmail(): Promise<string> {
  const user = await currentUser();
  if (!user?.emailAddresses?.[0]?.emailAddress) {
    throw new Error("Unauthorized");
  }
  return user.emailAddresses[0].emailAddress;
}
```

Every query filters on the authenticated user's email. Delete operations enforce ownership with a compound `WHERE` clause (`mockId = ? AND createdBy = ?`), preventing IDOR vulnerabilities even if an attacker guesses a valid UUID.

### Data Model

Two tables in Drizzle ORM handle the full lifecycle:

- **MockInterview** — stores job metadata, interview configuration (type, difficulty, language), and AI-generated Q&A pairs as a JSON string (`jsonMockResp`). The `mockId` (UUID) serves as the application-level join key, decoupling the external identifier from the auto-increment primary key.
- **UserAnswer** — stores per-question user responses, structured AI feedback as JSON, and a denormalized `rating` field for quick aggregation without parsing the feedback blob.

### Interview Lifecycle

```
Create  →  OpenAI generates Q&A pairs  →  Drizzle INSERT (MockInterview)
Execute →  TTS reads question → countdown → Speech Recognition captures answer
Submit  →  OpenAI scores answer (4 competencies) → Drizzle INSERT (UserAnswer)
Review  →  Collapsible feedback display → PDF export with competency breakdown
```

---

## 3. Tech Stack Deep Dive

| Technology | Role | Why Over Alternatives | Tradeoff |
|---|---|---|---|
| **Next.js 16 + React 19** | Framework | App Router enables server actions — no API routes needed. All AI calls and DB mutations are colocated `"use server"` functions with type-safe client invocation | Newer ecosystem; middleware file naming conventions still shifting |
| **OpenAI (gpt-4o-mini)** | Question generation + answer evaluation | `json_object` response format reduces parsing failures. Cost-efficient for structured output tasks (~10x cheaper than GPT-4o with sufficient quality for rubric scoring) | Per-call latency adds 2-4s to each answer submission; no streaming for structured JSON mode |
| **Drizzle ORM + Supabase** | Database | Type-safe schema with zero codegen. Push-based migrations via `drizzle-kit push` — no migration files to manage during rapid iteration | No automatic rollback; push-based workflow requires manual recovery if a schema change fails |
| **Clerk** | Authentication | Drop-in auth with webhook sync, social login, and per-request JWT validation. Avoids building session management and OAuth flows from scratch | External dependency on a critical path; webhook ordering requires defensive coding |
| **Web Speech API** | Speech I/O | Native browser API — zero bundle cost, no third-party ASR service fees. Supports both recognition (STT) and synthesis (TTS) in a single API surface | Browser-dependent accuracy and voice availability; no Safari STT support; voice quality varies by OS |
| **Tailwind CSS v4 + shadcn/ui** | Styling | CSS variable-based theming enables dark mode with a single provider. Radix primitives handle accessibility (focus traps, ARIA) without custom implementation | Design token migration from v3 to v4 required reworking the globals.css structure |

---

## 4. Technical Challenges & Solutions

### Challenge 1: Speech Recognition Lifecycle and Countdown Race Conditions

**Constraint:** The interview flow chains three async operations — TTS reads the question aloud, a 3-second visual countdown plays, then speech recognition starts automatically. The user can also navigate between questions or manually toggle recording at any point during this sequence.

**Why the naive approach fails:** React state captured inside `useEffect` closures goes stale. If a user taps "Record" during the countdown, the timer callback still sees the old `isRecording` value and starts a second recognition session — crashing the browser's speech engine, which only allows one active session.

**Solution:** A ref-mirrored state pattern. `isRecordingRef` stays in sync with `isRecording` state but is readable inside timer callbacks without stale closure issues. All pending timers are tracked in `countdownTimersRef` and bulk-cancelled on cleanup:

```typescript
// app/dashboard/interview/[interviewId]/start/page.tsx — lines 36-38, 86-124
const recognitionRef = useRef<SpeechRecognition | null>(null);
const isRecordingRef = useRef(false);
const countdownTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

useEffect(() => {
  if (questions.length === 0 || !speechSupported) return;

  countdownTimersRef.current.forEach(clearTimeout);   // cancel pending timers
  countdownTimersRef.current = [];
  window.speechSynthesis?.cancel();                    // stop in-progress TTS

  const utterance = handleTextToSpeech(questions[activeIndex].question);

  const startCountdown = () => {
    setCountdown(3);
    const t1 = setTimeout(() => setCountdown(2), 1000);
    const t2 = setTimeout(() => setCountdown(1), 2000);
    const t3 = setTimeout(() => {
      setCountdown(null);
      if (!isRecordingRef.current && recognitionRef.current) {
        setUserAnswer("");
        recognitionRef.current.start();
        setIsRecording(true);
        isRecordingRef.current = true;
      }
    }, 3000);
    countdownTimersRef.current = [t1, t2, t3];
  };

  if (utterance) { utterance.onend = startCountdown; }
  else { startCountdown(); }

  return () => {
    countdownTimersRef.current.forEach(clearTimeout);
    window.speechSynthesis?.cancel();
  };
}, [activeIndex, questions.length, speechSupported]);
```

Three race conditions are handled simultaneously: stale closure reads (ref guard on line 12), question navigation during TTS/countdown (cleanup cancels all timers and TTS), and TTS unavailability (fallback to immediate countdown). The effect cleanup function guarantees no orphaned timers survive a re-render.

**Tradeoff:** Maintaining parallel ref + state for the same value adds cognitive overhead. The alternative — using only refs — would eliminate the duplication but lose React's re-render trigger for UI updates (the recording indicator animation depends on `isRecording` state).

### Challenge 2: OpenAI JSON Response Shape Unpredictability

**Constraint:** OpenAI's `json_object` response format guarantees valid JSON but does not guarantee the shape. The same prompt can return `[{...}]` (top-level array) or `{"questions": [{...}]}` (wrapped in an envelope object). The wrapping key name varies between runs.

**Why the naive approach fails:** Parsing with `JSON.parse()` then accessing `parsed[0]` works when the response is an array but throws when it is an object. Checking for a hardcoded key like `parsed.questions` works until the model decides to use `parsed.interview_questions` instead.

**Solution:** A two-step extraction that handles both shapes without brittle key matching:

```typescript
// app/actions/interview.ts — lines 220-224
const parsed = JSON.parse(responseText);
const arr = Array.isArray(parsed)
  ? parsed
  : Object.values(parsed).find(Array.isArray);
if (!arr) throw new Error("No questions array found");
```

If the response is already an array, use it directly. If it is an object, scan all property values and take the first one that is an array. This handles `{"questions": [...]}`, `{"data": [...]}`, and any other envelope shape the model invents.

**Tradeoff:** The approach assumes only one array-valued property matters. If the model returned an object with multiple array properties, the wrong one could be selected. In practice, the prompt constrains output to a single list, making this a safe assumption. The alternative — requesting `response_format: { type: "json_schema" }` with a strict schema — would eliminate ambiguity but is only available on newer model versions and adds latency.

### Challenge 3: Cross-Browser Voice Selection Without a Standard API

**Constraint:** The Web Speech API provides `getVoices()` but exposes no metadata about voice gender or quality. Voice availability, naming conventions, and initialization timing differ across Chrome, Edge, Firefox, and Safari.

**Why the naive approach fails:** Picking the first available voice produces inconsistent results — a deep male voice on one OS, a robotic default on another. Users expect the interviewer voice to match their preference, which requires classification logic the browser does not provide.

**Solution:** A heuristic classification system that reverse-engineers gender from voice name substrings, scores quality from keywords, and chains three fallback tiers:

```typescript
// lib/voiceUtils.ts — lines 55-92
export function scoreVoiceQuality(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (name.includes("online") || name.includes("neural")) score += 20;
  if (name.includes("premium")) score += 15;
  if (!voice.localService || name.includes("enhanced")) score += 10;
  if (name.includes("microsoft")) score += 5;
  return score;
}

export function selectVoice(
  voices: SpeechSynthesisVoice[],
  preferredGender: VoiceGender,
  language: "en" | "ko" = "en"
): SpeechSynthesisVoice | null {
  const langPrefix = language === "ko" ? "ko" : "en";
  const filtered = voices.filter((v) => v.lang.startsWith(langPrefix));
  if (filtered.length === 0) return null;

  const matched = filtered.filter(
    (v) => classifyVoiceGender(v) === preferredGender
  );
  if (matched.length > 0) {
    return matched.sort(
      (a, b) => scoreVoiceQuality(b) - scoreVoiceQuality(a)
    )[0];
  }

  const unclassified = filtered.filter(
    (v) => classifyVoiceGender(v) === null
  );
  if (unclassified.length > 0) return unclassified.sort(...)[0];
  return filtered.sort(...)[0];
}
```

Gender classification uses separate English and Korean name lists (e.g., `"sun-hi"`, `"yuna"` for Korean female; `"jenny"`, `"aria"` for English female). The `loadVoices()` function handles Chrome's async initialization by listening for `voiceschanged` with a 3-second hard timeout fallback for Safari, which sometimes never fires the event.

**Tradeoff:** Name-based heuristics break when browser vendors rename voices. The classification lists require manual maintenance as new voices are added. The alternative — letting users pick from a raw dropdown — would be more robust but creates a poor UX when the list contains 30+ voices with cryptic identifiers like `"Microsoft Server Speech Text to Speech Voice (en-US, AriaNeural)"`.

---

## 5. Impact & Future Roadmap

### Current State

- End-to-end interview pipeline: create, execute with speech I/O, receive multi-dimensional AI feedback, and export a PDF report
- Bilingual support (English + Korean) across all layers: UI, AI prompts, TTS voice selection, and PDF rendering with CJK font injection
- Question bank system with AI-assisted suggestion, manual curation, and random or sequential selection modes
- Configurable interview parameters: type, difficulty, question count, and resume-based personalization

### Scalability Considerations

- Server actions with per-request auth verification scale horizontally behind Vercel's edge network without session affinity requirements
- JSON-stringified feedback in the `UserAnswer` table avoids schema migrations when adding new competency dimensions — the parsing layer handles both legacy and enhanced formats transparently
- Stateless interview execution (each question submission is an independent server action) means no server-side session state to manage or lose

### Planned Features

- **Video recording and playback** — capture webcam video alongside speech recognition during the interview session. Requires chunked MediaRecorder uploads to object storage (Supabase Storage or S3) and a synchronized playback interface that aligns video segments with per-question feedback.
- **Multi-provider AI support** — abstract the OpenAI dependency behind a provider interface to support Gemini, Claude, and local models. The structured JSON response format constraint narrows viable providers to those supporting equivalent output modes, which Gemini and Claude both now offer.

The architecture is designed for this kind of extension: server actions isolate AI provider logic, the schema accommodates new feedback dimensions without migrations, and the client-side speech pipeline operates independently of the backend. Each layer evolves without cascading rewrites.
