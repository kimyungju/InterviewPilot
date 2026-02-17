import { generateSpeech } from "@/app/actions/speech";
import type { VoiceGender } from "@/lib/voiceUtils";

export interface CloudTtsHandle {
  onended: (() => void) | null;
  cancel: () => void;
}

export async function speakWithCloudTts(
  text: string,
  gender: VoiceGender
): Promise<CloudTtsHandle> {
  const voice = gender === "male" ? "onyx" : "nova";
  const dataUrl = await generateSpeech(text, voice);
  const audio = new Audio(dataUrl);

  const handle: CloudTtsHandle = {
    onended: null,
    cancel: () => {
      audio.pause();
      audio.currentTime = 0;
    },
  };

  audio.onended = () => handle.onended?.();
  audio.onerror = () => handle.onended?.();

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay blocked (common on iOS Safari without user gesture).
      // Trigger onended so the countdown sequence can still proceed.
      setTimeout(() => handle.onended?.(), 0);
    });
  }

  return handle;
}
