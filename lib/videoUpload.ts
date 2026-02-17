import { getSupabase } from "@/lib/supabaseClient";

// Videos are publicly accessible via getPublicUrl() — this is intentional
// to support QR code sharing in PDF reports.
export async function uploadVideoBlob(
  blob: Blob,
  mockIdRef: string,
  answerId: number
): Promise<string | null> {
  try {
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    if (blob.size > MAX_VIDEO_SIZE) {
      console.warn(`Video too large (${(blob.size / 1024 / 1024).toFixed(1)}MB), skipping upload`);
      return null;
    }

    const supabase = getSupabase();
    const path = `${mockIdRef}/${answerId}.webm`;
    const { error } = await supabase.storage
      .from("interview-videos")
      .upload(path, blob, {
        contentType: blob.type || "video/webm",
        upsert: true,
      });

    if (error) {
      console.error("Video upload failed:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("interview-videos")
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (err) {
    console.error("Video upload error:", err);
    return null;
  }
}
