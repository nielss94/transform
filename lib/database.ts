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
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return null;
      }

      const { data, error } = await supabase
        .from("transformations")
        .insert({
          before_photo_url: beforePhotoUrl,
          after_photo_url: null,
          user_id: user.id,
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
   * Fetches all completed transformations (for display in feed) with user information
   */
  static async getCompletedTransformations(): Promise<Transformation[]> {
    try {
      const { data: transformations, error } = await supabase
        .from("transformations")
        .select("*")
        .not("after_photo_url", "is", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transformations:", error);
        return [];
      }

      // Get current user to identify their own posts
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      return transformations.map((item: SupabaseTransformation) => {
        let userName = "Anonymous User";
        let userAvatar = undefined;

        // If this is the current user's post, show their info
        if (currentUser && item.user_id === currentUser.id) {
          userName =
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            currentUser.email?.split("@")[0] ||
            "You";
          userAvatar =
            currentUser.user_metadata?.avatar_url ||
            currentUser.user_metadata?.picture;
        } else {
          // For other users, generate a consistent name based on user_id
          if (item.user_id) {
            // Create a simple hash of the user_id to generate consistent names
            const hash = item.user_id.split("-")[0];
            const names = [
              "Alex",
              "Jordan",
              "Casey",
              "Riley",
              "Avery",
              "Quinn",
              "Sage",
              "River",
              "Phoenix",
              "Rowan",
            ];
            const nameIndex = parseInt(hash.slice(-1), 16) % names.length;
            userName = names[nameIndex];
          }
        }

        return {
          id: item.id,
          before_photo_url: item.before_photo_url,
          after_photo_url: item.after_photo_url || undefined,
          created_at: item.created_at,
          updated_at: item.updated_at,
          user_id: item.user_id || undefined,
          user_name: userName,
          user_avatar: userAvatar,
        };
      });
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
   * Get incomplete transformations (missing after photo) for the current user
   */
  static async getIncompleteTransformations(): Promise<Transformation[]> {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return [];
      }

      const { data, error } = await supabase
        .from("transformations")
        .select("*")
        .eq("user_id", user.id)
        .is("after_photo_url", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching incomplete transformations:", error);
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
      console.error("Error fetching incomplete transformations:", error);
      return [];
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

  /**
   * Get all transformations for the current user
   */
  static async getUserTransformations(): Promise<Transformation[]> {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return [];
      }

      const { data, error } = await supabase
        .from("transformations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user transformations:", error);
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
      console.error("Error fetching user transformations:", error);
      return [];
    }
  }
}
