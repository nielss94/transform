import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please create .env.local file with:\n" +
      "EXPO_PUBLIC_SUPABASE_URL=your_project_url_here\n" +
      "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database schema
export interface Transformation {
  id: string;
  before_photo_url: string;
  after_photo_url?: string;
  created_at: string;
  updated_at: string;
  user_id?: string; // For future user association
}

export interface SupabaseTransformation {
  id: string;
  before_photo_url: string;
  after_photo_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}
