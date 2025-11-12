"use client"

import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";

export function getSupabaseClient() {
  return getSupabaseBrowserClient();
}

export const supabase = getSupabaseBrowserClient();