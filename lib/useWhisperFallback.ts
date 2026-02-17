"use client";

import { useRef, useCallback, useState } from "react";

const AUDIO_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function getSupportedAudioMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const mime of AUDIO_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

interface WhisperFallbackOptions {
  language: string;
  onTranscript: (text: string) => void;
  onTranscribing: (busy: boolean) => void;
}

interface WhisperFallbackReturn {
  isWhisperMode: boolean;
  startRecording: (audioTrack: MediaStreamTrack | null) => void;
  stopRecording: () => Promise<string>;
  cancelRecording: () => void;
  activateWhisperMode: () => void;
}

export function useWhisperFallback(
  options: WhisperFallbackOptions
): WhisperFallbackReturn {
  const [isWhisperMode, setIsWhisperMode] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const activateWhisperMode = useCallback(() => {
    setIsWhisperMode(true);
  }, []);

  const startRecording = useCallback((audioTrack: MediaStreamTrack | null) => {
    if (!audioTrack) return;

    const stream = new MediaStream([audioTrack]);
    const mimeType = getSupportedAudioMime();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start();
    recorderRef.current = recorder;
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return "";

    const blob = await new Promise<Blob>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Recorder stop timed out"));
      }, 5000);

      recorder.onstop = () => {
        clearTimeout(timeout);
        const mime = recorder.mimeType || "audio/webm";
        resolve(new Blob(chunksRef.current, { type: mime }));
        chunksRef.current = [];
      };

      recorder.stop();
    });

    recorderRef.current = null;

    if (blob.size === 0) return "";

    optionsRef.current.onTranscribing(true);
    try {
      const formData = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      formData.append("audio", blob, `recording.${ext}`);
      formData.append("language", optionsRef.current.language);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.text || "";
      optionsRef.current.onTranscript(text);
      return text;
    } catch (error) {
      console.error("Whisper transcription failed:", error);
      return "";
    } finally {
      optionsRef.current.onTranscribing(false);
    }
  }, []);

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  return {
    isWhisperMode,
    startRecording,
    stopRecording,
    cancelRecording,
    activateWhisperMode,
  };
}
