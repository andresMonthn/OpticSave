"use client"

import * as React from "react";
import { getDB } from "./db";
import type { InventarioLocal, PacienteLocal, DiagnosticoLocal, RxLocal } from "./types";
import { enqueueOperation, toSyncPayload, toPacientePayload, toDiagnosticoPayload, toRxPayload } from "./sync";
import { supabase } from "../supabase-client";

interface UseInventariosDBOptions {
  userId: string;
  isOnline: boolean;
  offlineAccepted: boolean;
}

// Hook para interactuar con Dexie y, si está online, con Supabase
export function useInventariosDB(options: UseInventariosDBOptions) {
  const db = React.useMemo(() => getDB(), []);

  const list = React.useCallback(async (): Promise<InventarioLocal[]> => {
    // Siempre lee de Dexie para consistencia
    return db.inventarios.orderBy("localId").toArray();
  }, [db]);

  const add = React.useCallback(
    async (item: Omit<InventarioLocal, "localId" | "id" | "_status" | "user_id">) => {
      const record: InventarioLocal = {
        ...item,
        user_id: options.userId,
        _status: options.isOnline ? "synced" : "pending",
      };
      const localId = await db.inventarios.add(record);

      if (options.isOnline) {
        // Inserta en Supabase y actualiza id remoto
        const { data, error } = await supabase
          .from("inventarios" as any)
          .insert([
            {
              user_id: options.userId,
              nombre_producto: record.nombre_producto ?? null,
              categoria: record.categoria ?? null,
              marca: record.marca ?? null,
              modelo: record.modelo ?? null,
              cantidad: String(record.cantidad),
              precio: String(record.precio),
              descripcion: record.descripcion ?? null,
              caducidad: record.caducidad ?? null,
            },
          ])
          .select();
        const inserted: any = (data as any)?.[0];
        if (!error && inserted?.id) {
          await db.inventarios.update(localId, { id: inserted.id, _status: "synced" });
        } else {
          // Si falla, encola para posterior sync
          await enqueueOperation(db, {
            table: "inventarios",
            operation: "insert",
            payload: toSyncPayload({ ...record, localId }),
          });
          await db.inventarios.update(localId, { _status: "pending" });
        }
      } else if (options.offlineAccepted) {
        await enqueueOperation(db, {
          table: "inventarios",
          operation: "insert",
          payload: toSyncPayload({ ...record, localId }),
        });
      }

      return localId;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  const update = React.useCallback(
    async (localId: number, changes: Partial<InventarioLocal>) => {
      const current = await db.inventarios.get(localId);
      if (!current) return false;
      const next: InventarioLocal = { ...current, ...changes };
      await db.inventarios.update(localId, next);

      if (options.isOnline && current.id) {
        const { error } = await supabase
          .from("inventarios" as any)
          .update({
            nombre_producto: next.nombre_producto ?? null,
            categoria: next.categoria ?? null,
            marca: next.marca ?? null,
            modelo: next.modelo ?? null,
            cantidad: String(next.cantidad),
            precio: String(next.precio),
            descripcion: next.descripcion ?? null,
            caducidad: next.caducidad ?? null,
          })
          .eq("id", current.id)
          .eq("user_id", options.userId);
        if (error) {
          await enqueueOperation(db, {
            table: "inventarios",
            operation: "update",
            payload: toSyncPayload(next),
          });
          await db.inventarios.update(localId, { _status: "pending" });
        } else {
          await db.inventarios.update(localId, { _status: "synced" });
        }
      } else if (options.offlineAccepted) {
        await enqueueOperation(db, {
          table: "inventarios",
          operation: "update",
          payload: toSyncPayload(next),
        });
        await db.inventarios.update(localId, { _status: "pending" });
      }

      return true;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  const remove = React.useCallback(
    async (localId: number) => {
      const current = await db.inventarios.get(localId);
      if (!current) return false;

      await db.inventarios.delete(localId);

      if (options.isOnline && current.id) {
        const { error } = await supabase
          .from("inventarios" as any)
          .delete()
          .eq("id", current.id)
          .eq("user_id", options.userId);
        if (error) {
          await enqueueOperation(db, {
            table: "inventarios",
            operation: "delete",
            payload: { id: current.id, user_id: options.userId },
          });
        }
      } else if (options.offlineAccepted && current.id) {
        await enqueueOperation(db, {
          table: "inventarios",
          operation: "delete",
          payload: { id: current.id, user_id: options.userId },
        });
      }

      return true;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  return { list, add, update, remove, db };
}

interface UsePacientesDBOptions {
  userId: string;
  isOnline: boolean;
  offlineAccepted: boolean;
}

export function usePacientesDB(options: UsePacientesDBOptions) {
  const db = React.useMemo(() => getDB(), []);

  const list = React.useCallback(async (): Promise<PacienteLocal[]> => {
    return db.pacientes.orderBy("localId").toArray();
  }, [db]);

  const add = React.useCallback(
    async (item: Omit<PacienteLocal, "localId" | "id" | "_status" | "user_id">) => {
      const record: PacienteLocal = {
        ...item,
        user_id: options.userId,
        _status: options.isOnline ? "synced" : "pending",
      };
      const localId = await db.pacientes.add(record);

      if (options.isOnline) {
        const payload = toPacientePayload(record);
        const { data, error } = await supabase.from("pacientes" as any).insert([
          {
            ...payload,
          },
        ]).select();
        const inserted: any = (data as any)?.[0];
        if (!error && inserted?.id) {
          await db.pacientes.update(localId, { id: inserted.id, _status: "synced" });
        } else {
          await enqueueOperation(db, { table: "pacientes", operation: "insert", payload });
          await db.pacientes.update(localId, { _status: "pending" });
        }
      } else if (options.offlineAccepted) {
        await enqueueOperation(db, { table: "pacientes", operation: "insert", payload: toPacientePayload(record) });
      }

      return localId;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  const update = React.useCallback(
    async (localId: number, changes: Partial<PacienteLocal>) => {
      const current = await db.pacientes.get(localId);
      if (!current) return false;
      const next: PacienteLocal = { ...current, ...changes };
      await db.pacientes.update(localId, next);

      if (options.isOnline && current.id) {
        const payload = toPacientePayload(next);
        const { error } = await supabase
          .from("pacientes" as any)
          .update(payload)
          .eq("id", current.id)
          .eq("user_id", options.userId);
        if (error) {
          await enqueueOperation(db, { table: "pacientes", operation: "update", payload });
          await db.pacientes.update(localId, { _status: "pending" });
        } else {
          await db.pacientes.update(localId, { _status: "synced" });
        }
      } else if (options.offlineAccepted) {
        await enqueueOperation(db, { table: "pacientes", operation: "update", payload: toPacientePayload(next) });
        await db.pacientes.update(localId, { _status: "pending" });
      }

      return true;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  const remove = React.useCallback(
    async (localId: number) => {
      const current = await db.pacientes.get(localId);
      if (!current) return false;
      await db.pacientes.delete(localId);

      if (options.isOnline && current.id) {
        const { error } = await supabase
          .from("pacientes" as any)
          .delete()
          .eq("id", current.id)
          .eq("user_id", options.userId);
        if (error) {
          await enqueueOperation(db, { table: "pacientes", operation: "delete", payload: { id: current.id, user_id: options.userId } });
        }
      } else if (options.offlineAccepted && current.id) {
        await enqueueOperation(db, { table: "pacientes", operation: "delete", payload: { id: current.id, user_id: options.userId } });
      }

      return true;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  return { list, add, update, remove, db };
}

interface UseDiagnosticoDBOptions {
  userId: string;
  isOnline: boolean;
  offlineAccepted: boolean;
}

export function useDiagnosticoDB(options: UseDiagnosticoDBOptions) {
  const db = React.useMemo(() => getDB(), []);

  const list = React.useCallback(async (): Promise<DiagnosticoLocal[]> => {
    return db.diagnostico.orderBy("localId").toArray();
  }, [db]);

  const add = React.useCallback(
    async (item: Omit<DiagnosticoLocal, "localId" | "id" | "_status" | "user_id"> & { paciente_id: string }) => {
      const record: DiagnosticoLocal = {
        ...item,
        user_id: options.userId,
        _status: options.isOnline ? "synced" : "pending",
      };
      const localId = await db.diagnostico.add(record);

      if (options.isOnline) {
        const payload = toDiagnosticoPayload(record);
        const { data, error } = await supabase.from("diagnostico" as any).insert([
          {
            ...payload,
          },
        ]).select();
        const inserted: any = (data as any)?.[0];
        if (!error && inserted?.id) {
          await db.diagnostico.update(localId, { id: inserted.id, _status: "synced" });
        } else {
          await enqueueOperation(db, { table: "diagnostico", operation: "insert", payload });
          await db.diagnostico.update(localId, { _status: "pending" });
        }
      } else if (options.offlineAccepted) {
        await enqueueOperation(db, { table: "diagnostico", operation: "insert", payload: toDiagnosticoPayload(record) });
      }
      return localId;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  const update = React.useCallback(
    async (localId: number, changes: Partial<DiagnosticoLocal>) => {
      const current = await db.diagnostico.get(localId);
      if (!current) return false;
      const next: DiagnosticoLocal = { ...current, ...changes };
      await db.diagnostico.update(localId, next);

      if (options.isOnline && current.id) {
        const payload = toDiagnosticoPayload(next);
        const { error } = await supabase.from("diagnostico" as any).update(payload).eq("id", current.id).eq("user_id", options.userId);
        if (error) {
          await enqueueOperation(db, { table: "diagnostico", operation: "update", payload });
          await db.diagnostico.update(localId, { _status: "pending" });
        } else {
          await db.diagnostico.update(localId, { _status: "synced" });
        }
      } else if (options.offlineAccepted) {
        await enqueueOperation(db, { table: "diagnostico", operation: "update", payload: toDiagnosticoPayload(next) });
        await db.diagnostico.update(localId, { _status: "pending" });
      }
      return true;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  const remove = React.useCallback(
    async (localId: number) => {
      const current = await db.diagnostico.get(localId);
      if (!current) return false;
      await db.diagnostico.delete(localId);

      if (options.isOnline && current.id) {
        const { error } = await supabase.from("diagnostico" as any).delete().eq("id", current.id).eq("user_id", options.userId);
        if (error) {
          await enqueueOperation(db, { table: "diagnostico", operation: "delete", payload: { id: current.id, paciente_id: current.paciente_id, user_id: options.userId } as any });
        }
      } else if (options.offlineAccepted && current.id) {
        await enqueueOperation(db, { table: "diagnostico", operation: "delete", payload: { id: current.id, paciente_id: current.paciente_id, user_id: options.userId } as any });
      }
      return true;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  return { list, add, update, remove, db };
}

interface UseRxDBOptions {
  userId: string;
  isOnline: boolean;
  offlineAccepted: boolean;
}

export function useRxDB(options: UseRxDBOptions) {
  const db = React.useMemo(() => getDB(), []);

  const list = React.useCallback(async (): Promise<RxLocal[]> => {
    return db.rx.orderBy("localId").toArray();
  }, [db]);

  const add = React.useCallback(
    async (item: Omit<RxLocal, "localId" | "id" | "_status" | "user_id"> & { paciente_id: string }) => {
      const record: RxLocal = {
        ...item,
        user_id: options.userId,
        _status: options.isOnline ? "synced" : "pending",
      };
      const localId = await db.rx.add(record);

      if (options.isOnline) {
        const payload = toRxPayload(record);
        const { data, error } = await supabase.from("rx" as any).insert([
          {
            ...payload,
          },
        ]).select();
        const inserted: any = (data as any)?.[0];
        if (!error && inserted?.id) {
          await db.rx.update(localId, { id: inserted.id, _status: "synced" });
        } else {
          await enqueueOperation(db, { table: "rx", operation: "insert", payload });
          await db.rx.update(localId, { _status: "pending" });
        }
      } else if (options.offlineAccepted) {
        await enqueueOperation(db, { table: "rx", operation: "insert", payload: toRxPayload(record) });
      }
      return localId;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  const update = React.useCallback(
    async (localId: number, changes: Partial<RxLocal>) => {
      const current = await db.rx.get(localId);
      if (!current) return false;
      const next: RxLocal = { ...current, ...changes };
      await db.rx.update(localId, next);

      if (options.isOnline && current.id) {
        const payload = toRxPayload(next);
        const { error } = await supabase
          .from("rx" as any)
          .update(payload)
          .eq("id", current.id)
          .eq("user_id", options.userId);
        if (error) {
          await enqueueOperation(db, { table: "rx", operation: "update", payload });
          await db.rx.update(localId, { _status: "pending" });
        } else {
          await db.rx.update(localId, { _status: "synced" });
        }
      } else if (options.offlineAccepted) {
        await enqueueOperation(db, { table: "rx", operation: "update", payload: toRxPayload(next) });
        await db.rx.update(localId, { _status: "pending" });
      }
      return true;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  const remove = React.useCallback(
    async (localId: number) => {
      const current = await db.rx.get(localId);
      if (!current) return false;
      await db.rx.delete(localId);

      if (options.isOnline && current.id) {
        const { error } = await supabase.from("rx" as any).delete().eq("id", current.id).eq("user_id", options.userId);
        if (error) {
          await enqueueOperation(db, { table: "rx", operation: "delete", payload: { id: current.id, user_id: options.userId, paciente_id: current.paciente_id } as any });
        }
      } else if (options.offlineAccepted && current.id) {
        await enqueueOperation(db, { table: "rx", operation: "delete", payload: { id: current.id, user_id: options.userId, paciente_id: current.paciente_id } as any });
      }
      return true;
    },
    [db, options.isOnline, options.offlineAccepted, options.userId],
  );

  return { list, add, update, remove, db };
}