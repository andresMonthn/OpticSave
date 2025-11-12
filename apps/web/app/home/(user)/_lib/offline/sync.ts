"use client"

import type { OptiOfflineDB } from "./db";
import type {
  SyncQueueItem,
  InventarioLocal,
  InventarioSyncPayload,
  PacienteLocal,
  PacienteSyncPayload,
  DiagnosticoLocal,
  DiagnosticoSyncPayload,
  RxLocal,
  RxSyncPayload,
} from "./types";
import { getSupabaseClient } from "../supabase-client";

// Encola una operación para sincronización futura
export async function enqueueOperation(
  db: OptiOfflineDB,
  item: Omit<SyncQueueItem, "id" | "timestamp" | "status">,
) {
  return db.syncQueue.add({
    ...item,
    timestamp: Date.now(),
    status: "pending",
  });
}

// Normaliza número -> texto para BD
function numToText(n?: number | null): string | null {
  if (typeof n === "number") return String(n);
  if (n == null) return null;
  return String(n);
}

// Sincroniza la cola de inventarios con Supabase
export async function syncInventarios(db: OptiOfflineDB) {
  const supabase = getSupabaseClient();
  const { data: auth, error: userError } = await supabase.auth.getUser();
  if (userError || !auth?.user) return; // no se puede sincronizar sin usuario

  const pending = await db.syncQueue.where({ table: "inventarios", status: "pending" }).toArray();

  for (const q of pending) {
    try {
      if (q.operation === "insert") {
        const payload = q.payload as InventarioSyncPayload;
        const { data, error } = await supabase
          .from("inventarios" as any)
          .insert([
            {
              user_id: auth.user.id,
              nombre_producto: payload.nombre_producto ?? null,
              categoria: payload.categoria ?? null,
              marca: payload.marca ?? null,
              modelo: payload.modelo ?? null,
              cantidad: payload.cantidad ?? null,
              precio: payload.precio ?? null,
              descripcion: payload.descripcion ?? null,
              caducidad: payload.caducidad ?? null,
            },
          ])
          .select();
        if (error) throw error;
        const inserted: any = (data as any)?.[0];
        if (inserted?.id) {
          // Vincula el id remoto al registro local si existiera
          if (payload.id) {
            await db.inventarios.where({ id: payload.id }).modify({ _status: "synced" });
          }
          await db.syncQueue.update(q.id!, { status: "synced" });
        }
      } else if (q.operation === "update") {
        const payload = q.payload as InventarioSyncPayload;
        if (!payload.id) throw new Error("Update sin id");
        const { data, error } = await supabase
          .from("inventarios" as any)
          .update({
            nombre_producto: payload.nombre_producto ?? null,
            categoria: payload.categoria ?? null,
            marca: payload.marca ?? null,
            modelo: payload.modelo ?? null,
            cantidad: payload.cantidad ?? null,
            precio: payload.precio ?? null,
            descripcion: payload.descripcion ?? null,
            caducidad: payload.caducidad ?? null,
          })
          .eq("id", payload.id)
          .eq("user_id", auth.user.id)
          .select();
        if (error) throw error;
        await db.syncQueue.update(q.id!, { status: "synced" });
      } else if (q.operation === "delete") {
        const payload = q.payload as InventarioSyncPayload;
        if (!payload.id) throw new Error("Delete sin id");
        const { error } = await supabase
          .from("inventarios" as any)
          .delete()
          .eq("id", payload.id)
          .eq("user_id", auth.user.id);
        if (error) throw error;
        await db.syncQueue.update(q.id!, { status: "synced" });
      }
    } catch (e) {
      await db.syncQueue.update(q.id!, { status: "failed" });
      // Continúa con el siguiente item sin romper todo el ciclo
    }
  }
}

// Helpers para transformar registros locales a payload de Supabase
export function toSyncPayload(item: InventarioLocal): InventarioSyncPayload {
  return {
    id: item.id,
    user_id: item.user_id,
    nombre_producto: item.nombre_producto ?? null,
    categoria: item.categoria ?? null,
    marca: item.marca ?? null,
    modelo: item.modelo ?? null,
    cantidad: numToText(item.cantidad ?? null),
    precio: numToText(item.precio ?? null),
    descripcion: item.descripcion ?? null,
    caducidad: item.caducidad ?? null,
  };
}

// Pacientes: helpers y sincronización
export function toPacientePayload(item: PacienteLocal): PacienteSyncPayload {
  return {
    id: item.id,
    user_id: item.user_id,
    nombre: item.nombre,
    edad: item.edad ?? null,
    sexo: item.sexo ?? null,
    domicilio: item.domicilio ?? null,
    motivo_consulta: item.motivo_consulta ?? null,
    diagnostico_id: item.diagnostico_id ?? null,
    telefono: item.telefono ?? null,
    fecha_de_cita: item.fecha_de_cita ?? null,
    estado: item.estado ?? null,
    fecha_nacimiento: item.fecha_nacimiento ?? null,
    ocupacion: item.ocupacion ?? null,
    sintomas_visuales: item.sintomas_visuales ?? null,
    ultimo_examen_visual: item.ultimo_examen_visual ?? null,
    uso_lentes: item.uso_lentes ?? null,
    tipos_de_lentes: item.tipos_de_lentes ?? null,
    tiempo_de_uso_lentes: item.tiempo_de_uso_lentes ?? null,
    cirujias: item.cirujias ?? null,
    traumatismos_oculares: item.traumatismos_oculares ?? null,
    nombre_traumatismos_oculares: item.nombre_traumatismos_oculares ?? null,
    antecedentes_visuales_familiares: item.antecedentes_visuales_familiares ?? null,
    antecedente_familiar_salud: item.antecedente_familiar_salud ?? null,
    habitos_visuales: item.habitos_visuales ?? null,
    salud_general: item.salud_general ?? null,
    medicamento_actual: item.medicamento_actual ?? null,
  };
}

export async function syncPacientes(db: OptiOfflineDB) {
  const supabase = getSupabaseClient();
  const { data: auth, error: userError } = await supabase.auth.getUser();
  if (userError || !auth?.user) return;

  const pending = await db.syncQueue.where({ table: "pacientes", status: "pending" }).toArray();
  for (const q of pending) {
    try {
      const payload = q.payload as PacienteSyncPayload;
      if (q.operation === "insert") {
        const { data, error } = await supabase
          .from("pacientes" as any)
          .insert([
            {
              user_id: auth.user.id,
              nombre: payload.nombre ?? "",
              edad: payload.edad ?? null,
              sexo: payload.sexo ?? null,
              domicilio: payload.domicilio ?? null,
              motivo_consulta: payload.motivo_consulta ?? null,
              diagnostico_id: payload.diagnostico_id ?? null,
              telefono: payload.telefono ?? null,
              fecha_de_cita: payload.fecha_de_cita ?? null,
              estado: payload.estado ?? null,
              fecha_nacimiento: payload.fecha_nacimiento ?? null,
              ocupacion: payload.ocupacion ?? null,
              sintomas_visuales: payload.sintomas_visuales ?? null,
              ultimo_examen_visual: payload.ultimo_examen_visual ?? null,
              uso_lentes: payload.uso_lentes ?? null,
              tipos_de_lentes: payload.tipos_de_lentes ?? null,
              tiempo_de_uso_lentes: payload.tiempo_de_uso_lentes ?? null,
              cirujias: payload.cirujias ?? null,
              traumatismos_oculares: payload.traumatismos_oculares ?? null,
              nombre_traumatismos_oculares: payload.nombre_traumatismos_oculares ?? null,
              antecedentes_visuales_familiares: payload.antecedentes_visuales_familiares ?? null,
              antecedente_familiar_salud: payload.antecedente_familiar_salud ?? null,
              habitos_visuales: payload.habitos_visuales ?? null,
              salud_general: payload.salud_general ?? null,
              medicamento_actual: payload.medicamento_actual ?? null,
            },
          ])
          .select();
        if (error) throw error;
        const inserted: any = (data as any)?.[0];
        if (inserted?.id) {
          if (payload.id) {
            await db.pacientes.where({ id: payload.id }).modify({ _status: "synced" });
          }
          await db.syncQueue.update(q.id!, { status: "synced" });
        }
      } else if (q.operation === "update") {
        if (!payload.id) throw new Error("Update de paciente sin id");
        const { error } = await supabase
          .from("pacientes" as any)
          .update({
            nombre: payload.nombre ?? undefined,
            edad: payload.edad ?? undefined,
            sexo: payload.sexo ?? undefined,
            domicilio: payload.domicilio ?? undefined,
            motivo_consulta: payload.motivo_consulta ?? undefined,
            diagnostico_id: payload.diagnostico_id ?? undefined,
            telefono: payload.telefono ?? undefined,
            fecha_de_cita: payload.fecha_de_cita ?? undefined,
            estado: payload.estado ?? undefined,
            fecha_nacimiento: payload.fecha_nacimiento ?? undefined,
            ocupacion: payload.ocupacion ?? undefined,
            sintomas_visuales: payload.sintomas_visuales ?? undefined,
            ultimo_examen_visual: payload.ultimo_examen_visual ?? undefined,
            uso_lentes: payload.uso_lentes ?? undefined,
            tipos_de_lentes: payload.tipos_de_lentes ?? undefined,
            tiempo_de_uso_lentes: payload.tiempo_de_uso_lentes ?? undefined,
            cirujias: payload.cirujias ?? undefined,
            traumatismos_oculares: payload.traumatismos_oculares ?? undefined,
            nombre_traumatismos_oculares: payload.nombre_traumatismos_oculares ?? undefined,
            antecedentes_visuales_familiares: payload.antecedentes_visuales_familiares ?? undefined,
            antecedente_familiar_salud: payload.antecedente_familiar_salud ?? undefined,
            habitos_visuales: payload.habitos_visuales ?? undefined,
            salud_general: payload.salud_general ?? undefined,
            medicamento_actual: payload.medicamento_actual ?? undefined,
          })
          .eq("id", payload.id)
          .eq("user_id", auth.user.id);
        if (error) throw error;
        await db.syncQueue.update(q.id!, { status: "synced" });
      } else if (q.operation === "delete") {
        if (!payload.id) throw new Error("Delete de paciente sin id");
        const { error } = await supabase
          .from("pacientes" as any)
          .delete()
          .eq("id", payload.id)
          .eq("user_id", auth.user.id);
        if (error) throw error;
        await db.syncQueue.update(q.id!, { status: "synced" });
      }
    } catch (e) {
      await db.syncQueue.update(q.id!, { status: "failed" });
    }
  }
}

export function toDiagnosticoPayload(item: DiagnosticoLocal): DiagnosticoSyncPayload {
  return {
    id: item.id,
    paciente_id: item.paciente_id,
    user_id: item.user_id,
    vb_salud_ocular: item.vb_salud_ocular ?? null,
    rx_uso_od_id: item.rx_uso_od_id ?? null,
    rx_uso_oi_id: item.rx_uso_oi_id ?? null,
    rx_final_od_id: item.rx_final_od_id ?? null,
    rx_final_oi_id: item.rx_final_oi_id ?? null,
    dip: item.dip ?? null,
    proxima_visita: item.proxima_visita ?? null,
  };
}

export async function syncDiagnostico(db: OptiOfflineDB) {
  const supabase = getSupabaseClient();
  const { data: auth, error: userError } = await supabase.auth.getUser();
  if (userError || !auth?.user) return;

  const pending = await db.syncQueue.where({ table: "diagnostico", status: "pending" }).toArray();
  for (const q of pending) {
    try {
      const payload = q.payload as DiagnosticoSyncPayload;
      if (q.operation === "insert") {
        const { data, error } = await supabase
          .from("diagnostico" as any)
          .insert([
            {
              user_id: auth.user.id,
              paciente_id: payload.paciente_id,
              vb_salud_ocular: payload.vb_salud_ocular ?? null,
              rx_uso_od_id: payload.rx_uso_od_id ?? null,
              rx_uso_oi_id: payload.rx_uso_oi_id ?? null,
              rx_final_od_id: payload.rx_final_od_id ?? null,
              rx_final_oi_id: payload.rx_final_oi_id ?? null,
              dip: payload.dip ?? null,
              proxima_visita: payload.proxima_visita ?? null,
            },
          ])
          .select();
        if (error) throw error;
        const inserted: any = (data as any)?.[0];
        if (inserted?.id) {
          if (payload.id) {
            await db.diagnostico.where({ id: payload.id }).modify({ _status: "synced" });
          }
          await db.syncQueue.update(q.id!, { status: "synced" });
        }
      } else if (q.operation === "update") {
        if (!payload.id) throw new Error("Update de diagnostico sin id");
        const { error } = await supabase
          .from("diagnostico" as any)
          .update({
            vb_salud_ocular: payload.vb_salud_ocular ?? undefined,
            rx_uso_od_id: payload.rx_uso_od_id ?? undefined,
            rx_uso_oi_id: payload.rx_uso_oi_id ?? undefined,
            rx_final_od_id: payload.rx_final_od_id ?? undefined,
            rx_final_oi_id: payload.rx_final_oi_id ?? undefined,
            dip: payload.dip ?? undefined,
            proxima_visita: payload.proxima_visita ?? undefined,
          })
          .eq("id", payload.id)
          .eq("user_id", auth.user.id);
        if (error) throw error;
        await db.syncQueue.update(q.id!, { status: "synced" });
      } else if (q.operation === "delete") {
        if (!payload.id) throw new Error("Delete de diagnostico sin id");
        const { error } = await supabase
          .from("diagnostico" as any)
          .delete()
          .eq("id", payload.id)
          .eq("user_id", auth.user.id);
        if (error) throw error;
        await db.syncQueue.update(q.id!, { status: "synced" });
      }
    } catch (e) {
      await db.syncQueue.update(q.id!, { status: "failed" });
    }
  }
}

export function toRxPayload(item: RxLocal): RxSyncPayload {
  return {
    id: item.id,
    user_id: item.user_id,
    add: item.add ?? null,
    cil: item.cil ?? null,
    esf: item.esf ?? null,
    eje: item.eje ?? null,
    diagnostico_id: item.diagnostico_id ?? null,
    paciente_id: item.paciente_id,
  };
}

export async function syncRx(db: OptiOfflineDB) {
  const supabase = getSupabaseClient();
  const { data: auth, error: userError } = await supabase.auth.getUser();
  if (userError || !auth?.user) return;

  const pending = await db.syncQueue.where({ table: "rx", status: "pending" }).toArray();
  for (const q of pending) {
    try {
      const payload = q.payload as RxSyncPayload;
      if (q.operation === "insert") {
        const { data, error } = await supabase
          .from("rx" as any)
          .insert([
            {
              user_id: auth.user.id,
              add: payload.add ?? null,
              cil: payload.cil ?? null,
              esf: payload.esf ?? null,
              eje: payload.eje ?? null,
              diagnostico_id: payload.diagnostico_id ?? null,
              paciente_id: payload.paciente_id,
            },
          ])
          .select();
        if (error) throw error;
        const inserted: any = (data as any)?.[0];
        if (inserted?.id) {
          if (payload.id) {
            await db.rx.where({ id: payload.id }).modify({ _status: "synced" });
          }
          await db.syncQueue.update(q.id!, { status: "synced" });
        }
      } else if (q.operation === "update") {
        if (!payload.id) throw new Error("Update de rx sin id");
        const { error } = await supabase
          .from("rx" as any)
          .update({
            add: payload.add ?? undefined,
            cil: payload.cil ?? undefined,
            esf: payload.esf ?? undefined,
            eje: payload.eje ?? undefined,
            diagnostico_id: payload.diagnostico_id ?? undefined,
            paciente_id: payload.paciente_id ?? undefined,
          })
          .eq("id", payload.id)
          .eq("user_id", auth.user.id);
        if (error) throw error;
        await db.syncQueue.update(q.id!, { status: "synced" });
      } else if (q.operation === "delete") {
        if (!payload.id) throw new Error("Delete de rx sin id");
        const { error } = await supabase
          .from("rx" as any)
          .delete()
          .eq("id", payload.id)
          .eq("user_id", auth.user.id);
        if (error) throw error;
        await db.syncQueue.update(q.id!, { status: "synced" });
      }
    } catch (e) {
      await db.syncQueue.update(q.id!, { status: "failed" });
    }
  }
}