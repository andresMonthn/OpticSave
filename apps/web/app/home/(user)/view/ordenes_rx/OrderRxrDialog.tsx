"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@kit/ui/dialog";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { Spinner } from "@kit/ui/spinner";

type OrderRxrDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  position?: { x: number; y: number } | null;
};

type OrdenRxr = Record<string, unknown> & {
  id?: string;
  created_at?: string;
  user_id?: string;
};

export function OrderRxrDialog({ open, onOpenChange, id, position }: OrderRxrDialogProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrdenRxr | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      if (!open || !id) return;
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      setLoading(true);
      setError(null);
      setData(null);
      const { data: diagList, error: diagError } = await supabase
        .from("diagnostico")
        .select("*")
        .eq("paciente_id", id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (!active) return;
      if (diagError) {
        setError(diagError.message ?? "Error al cargar diagnóstico reciente");
        setLoading(false);
        return;
      }
      const diagnostico = Array.isArray(diagList) && diagList.length ? (diagList[0] as any) : null;
      const orderId = diagnostico?.order_rx_id ?? null;
      if (!orderId) {
        setError("Sin orden RX vinculada al diagnóstico más reciente");
        setLoading(false);
        return;
      }
      const query = supabase.from("orden_rx" as any).select("*").eq("id", orderId);
      const { data, error } = uid ? await query.eq("user_id", uid).single() : await query.single();
      if (!active) return;
      if (error) {
        setError(error.message ?? "Error al cargar la orden");
      } else {
        setData(data as unknown as OrdenRxr);
      }
      setLoading(false);
    }
    fetchData();
    return () => {
      active = false;
    };
  }, [open, id, supabase]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-xl fixed ${position ? 'top-0 left-0 translate-x-0 translate-y-0' : ''}`} style={position ? { top: position.y, left: position.x } : undefined}>
        <DialogHeader>
          <DialogTitle>Orden RXR</DialogTitle>
          <DialogDescription>Detalle de la orden {id}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-destructive text-sm">{error}</div>
        ) : data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="rounded-md border p-3">
                <div className="text-xs font-medium text-muted-foreground">{key}</div>
                <div className="text-sm break-words">{String(value ?? "-")}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">Sin datos para la orden solicitada</div>
        )}
      </DialogContent>
    </Dialog>
  );
}