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
  audio.play();

  return handle;
}
