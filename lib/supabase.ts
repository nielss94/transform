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

// Safe AsyncStorage import with fallback
let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (error) {
  console.warn("AsyncStorage not available, using in-memory storage fallback");
}

// Create storage with proper fallback
const createStorage = () => {
  const memoryStorage = new Map<string, string>();

  return {
    getItem: async (key: string): Promise<string | null> => {
      if (AsyncStorage) {
        try {
          return await AsyncStorage.getItem(key);
        } catch (error) {
          console.warn("AsyncStorage error, falling back to memory:", error);
        }
      }
      return memoryStorage.get(key) || null;
    },
    setItem: async (key: string, value: string): Promise<void> => {
      if (AsyncStorage) {
        try {
          await AsyncStorage.setItem(key, value);
          return;
        } catch (error) {
          console.warn("AsyncStorage error, falling back to memory:", error);
        }
      }
      memoryStorage.set(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
      if (AsyncStorage) {
        try {
          await AsyncStorage.removeItem(key);
          return;
        } catch (error) {
          console.warn("AsyncStorage error, falling back to memory:", error);
        }
      }
      memoryStorage.delete(key);
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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
  user_name?: string;
  user_avatar?: string;
}

export interface SupabaseTransformation {
  id: string;
  before_photo_url: string;
  after_photo_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}
