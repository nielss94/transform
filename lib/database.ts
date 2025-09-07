import { supabase, SupabaseTransformation, Transformation } from "./supabase";

/**
 * Database service for managing transformations
 */
export class TransformationService {
  /**
   * Creates a new transformation record
   */
  static async createTransformation(
    beforePhotoUrl: string
  ): Promise<Transformation | null> {
    try {
      const { data, error } = await supabase
        .from("transformations")
        .insert({
          before_photo_url: beforePhotoUrl,
          after_photo_url: null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating transformation:", error);
        return null;
      }

      return {
        id: data.id,
        before_photo_url: data.before_photo_url,
        after_photo_url: data.after_photo_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
      };
    } catch (error) {
      console.error("Error creating transformation:", error);
      return null;
    }
  }

  /**
   * Updates a transformation with the after photo
   */
  static async updateTransformation(
    id: string,
    afterPhotoUrl: string
  ): Promise<Transformation | null> {
    try {
      const { data, error } = await supabase
        .from("transformations")
        .update({
          after_photo_url: afterPhotoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating transformation:", error);
        return null;
      }

      return {
        id: data.id,
        before_photo_url: data.before_photo_url,
        after_photo_url: data.after_photo_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
      };
    } catch (error) {
      console.error("Error updating transformation:", error);
      return null;
    }
  }

  /**
   * Fetches all completed transformations (for display in feed)
   */
  static async getCompletedTransformations(): Promise<Transformation[]> {
    try {
      const { data, error } = await supabase
        .from("transformations")
        .select("*")
        .not("after_photo_url", "is", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transformations:", error);
        return [];
      }

      return data.map((item: SupabaseTransformation) => ({
        id: item.id,
        before_photo_url: item.before_photo_url,
        after_photo_url: item.after_photo_url || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_id: item.user_id || undefined,
      }));
    } catch (error) {
      console.error("Error fetching transformations:", error);
      return [];
    }
  }

  /**
   * Deletes a transformation and its associated photos
   */
  static async deleteTransformation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("transformations")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting transformation:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting transformation:", error);
      return false;
    }
  }

  /**
   * Get a specific transformation by ID
   */
  static async getTransformation(id: string): Promise<Transformation | null> {
    try {
      const { data, error } = await supabase
        .from("transformations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching transformation:", error);
        return null;
      }

      return {
        id: data.id,
        before_photo_url: data.before_photo_url,
        after_photo_url: data.after_photo_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
      };
    } catch (error) {
      console.error("Error fetching transformation:", error);
      return null;
    }
  }
}
