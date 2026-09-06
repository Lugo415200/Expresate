import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import config from "../../../shared/backend.json";

// Public project configuration already shipped by the website. Never use a
// service-role credential here: access is controlled by existing Supabase RLS.
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || config.url,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || config.anonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
    global: {
      fetch: async (input, init) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        const abort = () => controller.abort();
        init?.signal?.addEventListener("abort", abort);
        if (init?.signal?.aborted) controller.abort();
        try {
          return await fetch(input, { ...init, signal: controller.signal });
        } finally {
          clearTimeout(timeout);
          init?.signal?.removeEventListener("abort", abort);
        }
      },
    },
  },
);
