import * as FileSystem from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { supabase } from "./supabase";

const STORAGE_BUCKET = "transformation-photos";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Compresses and optimizes image for upload
 */
async function compressImage(uri: string): Promise<string> {
  try {
    // Use the new object-oriented API
    const context = ImageManipulator.manipulate(uri);

    // Apply resize transformation (max 1200px width)
    context.resize({ width: 1200 });

    // Render the final image
    const rendered = await context.renderAsync();

    // Save with compression settings
    const result = await rendered.saveAsync({
      compress: 0.8, // 80% quality
      format: SaveFormat.JPEG,
    });

    return result.uri;
  } catch (error) {
    console.warn("Image compression failed, using original:", error);
    return uri;
  }
}

/**
 * Generates a unique filename for the photo
 */
function generateFileName(prefix: "before" | "after"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.jpg`;
}

/**
 * Uploads a photo to Supabase Storage
 */
export async function uploadPhoto(
  photoUri: string,
  type: "before" | "after"
): Promise<UploadResult> {
  try {
    // Compress the image first
    const compressedUri = await compressImage(photoUri);

    // Read the file as base64
    const fileInfo = await FileSystem.getInfoAsync(compressedUri);
    if (!fileInfo.exists) {
      return { success: false, error: "File does not exist" };
    }

    // Generate unique filename
    const fileName = generateFileName(type);
    const filePath = `transformations/${fileName}`;

    // Read file as binary
    const fileData = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, bytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Deletes a photo from Supabase Storage
 */
export async function deletePhoto(photoUrl: string): Promise<boolean> {
  try {
    // Extract file path from URL
    const url = new URL(photoUrl);
    const pathParts = url.pathname.split("/");
    const filePath = pathParts.slice(-2).join("/"); // Get last two parts (transformations/filename)

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

/**
 * Creates the storage bucket if it doesn't exist (for development)
 */
export async function initializeStorage(): Promise<void> {
  try {
    const { error } = await supabase.storage.getBucket(STORAGE_BUCKET);

    if (error) {
      console.log("Error checking bucket:", error);

      if (
        error.message.includes("not found") ||
        error.message.includes("does not exist")
      ) {
        // Bucket doesn't exist, create it
        const { error: createError } = await supabase.storage.createBucket(
          STORAGE_BUCKET,
          {
            public: true,
            allowedMimeTypes: [
              "image/jpeg",
              "image/png",
              "image/jpg",
              "image/webp",
            ],
            fileSizeLimit: 5242880, // 5MB limit
          }
        );

        if (createError) {
          console.error("Failed to create storage bucket:", createError);
        } else {
          console.log("Storage bucket created successfully");
        }
      } else {
        console.error("Error checking bucket:", error);
      }
    } else {
      console.log("Storage bucket already exists");
    }
  } catch (error) {
    console.error("Storage initialization error:", error);
  }
}
