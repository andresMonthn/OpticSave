"use client";

import React from "react";
import { useOffline } from "../_lib/offline/useOffline";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { setCachedUserId } from "../_lib/offline/auth-cache";
import { Badge } from "@kit/ui/badge";

export default function OfflineWrapper({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const { isOnline, offlineAccepted, setOfflineAccepted, promptOffline, syncing, lastSyncAt } = useOffline({ autoPrompt: false });

  React.useEffect(() => {
    (async () => {
      try {
        if (isOnline) {
          const { data: auth } = await supabase.auth.getUser();
          if (auth?.user?.id) {
            // Cache local y cookie para permitir acceso offline vía middleware
            setCachedUserId(auth.user.id);
            try {
              if (typeof document !== 'undefined') {
                document.cookie = `optisave_user_id=${auth.user.id}; path=/; max-age=31536000`;
                localStorage.setItem('optisave_user_id', auth.user.id);
              }
            } catch {}
          }
        } else if (!offlineAccepted) {
          setOfflineAccepted(promptOffline());
        } else {
          // Offline aceptado: garantizar cookie si existe caché local
          try {
            if (typeof document !== 'undefined') {
              const cached = localStorage.getItem('optisave_user_id');
              if (cached) {
                document.cookie = `optisave_user_id=${cached}; path=/; max-age=31536000`;
              }
            }
          } catch {}
        }
      } catch {
        // ignore network errors
      }
    })();
  }, [isOnline, offlineAccepted, setOfflineAccepted, promptOffline, supabase]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 px-4 py-2">
        {!isOnline && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border border-yellow-300">Modo Offline</Badge>
        )}
        {syncing && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border border-blue-300">Sincronizando...</Badge>
        )}
        {lastSyncAt && (
          <span className="text-xs text-muted-foreground">Última sync: {new Date(lastSyncAt).toLocaleString()}</span>
        )}
      </div>
      {children}
    </div>
  );
}