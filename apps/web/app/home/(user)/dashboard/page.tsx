
"use client";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir inmediatamente a /home
    router.replace("/home");
  }, [router]);

  useEffect(() => {
    supabase.auth.getUser().then((res) => {
      console.log(res);
    });
  }, [supabase]);

  return (
    <div></div>
  );
}
