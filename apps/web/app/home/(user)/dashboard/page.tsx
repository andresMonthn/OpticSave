
"use client";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { useEffect } from "react";

export default function Dashboard() {
  const supabase = getSupabaseBrowserClient();

  // Mantener la página sin redirecciones para evitar bucles en offline
  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      console.log(res);
    });
  }, [supabase]);

}
