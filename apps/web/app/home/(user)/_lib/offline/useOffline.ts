"use client"

import * as React from "react";
import { getDB } from "./db";
import { syncInventarios, syncPacientes, syncDiagnostico, syncRx } from "./sync";

interface UseOfflineOptions {
  autoPrompt?: boolean; // muestra confirm al perder conexión
}

export function useOffline(options: UseOfflineOptions = { autoPrompt: true }) {
  const [isOnline, setIsOnline] = React.useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [offlineAccepted, setOfflineAccepted] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const v = window.localStorage.getItem("optisave_offline_accepted");
      return v === "true";
    } catch {
      return false;
    }
  });
  const [syncing, setSyncing] = React.useState<boolean>(false);
  const [lastSyncAt, setLastSyncAt] = React.useState<number | null>(null);
  const db = React.useMemo(() => getDB(), []);

  const setOfflineAcceptedPersist = React.useCallback((value: boolean) => {
    setOfflineAccepted(value);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("optisave_offline_accepted", value ? "true" : "false");
      }
    } catch {}
  }, []);

  const promptOffline = React.useCallback(() => {
    const ok = typeof window !== "undefined" ? window.confirm("Sin conexión. ¿Quieres continuar trabajando offline?") : true;
    setOfflineAcceptedPersist(ok);
    return ok;
  }, [setOfflineAcceptedPersist]);

  React.useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      // al volver en línea, sincroniza
      (async () => {
        try {
          setSyncing(true);
          await syncInventarios(db);
          await syncPacientes(db);
          await syncDiagnostico(db);
          await syncRx(db);
          setLastSyncAt(Date.now());
        } finally {
          setSyncing(false);
        }
      })();
    }
    function handleOffline() {
      setIsOnline(false);
      if (options.autoPrompt) {
        promptOffline();
      }
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [db, options.autoPrompt, promptOffline]);

  return {
    isOnline,
    offlineAccepted,
    setOfflineAccepted: setOfflineAcceptedPersist,
    promptOffline,
    syncing,
    lastSyncAt,
    db,
  };
}