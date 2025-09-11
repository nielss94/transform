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

// Authentication types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
    picture?: string;
  };
  app_metadata?: any;
  created_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Types for our database schema
export interface Transformation {
  id: string;
  before_photo_url: string;
  after_photo_url?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface SupabaseTransformation {
  id: string;
  before_photo_url: string;
  after_photo_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}
