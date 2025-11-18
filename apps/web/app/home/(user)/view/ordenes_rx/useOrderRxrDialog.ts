"use client";
import { useCallback, useState } from "react";

export function useOrderRxrDialog() {
  const [open, setOpen] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const openAt = useCallback((id: string, coords: { x: number; y: number }) => {
    setRowId(id);
    setPosition(coords);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setRowId(null);
    setPosition(null);
  }, []);

  return { open, setOpen, rowId, setRowId, position, setPosition, openAt, close };
}