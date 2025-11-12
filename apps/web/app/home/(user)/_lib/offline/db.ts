"use client"

import Dexie, { Table } from "dexie";
import type { InventarioLocal, SyncQueueItem, PacienteLocal } from "./types";

export class OptiOfflineDB extends Dexie {
  inventarios!: Table<InventarioLocal, number>; // por localId
  syncQueue!: Table<SyncQueueItem, number>;
  pacientes!: Table<PacienteLocal, number>;
  diagnostico!: Table<any, number>; // tipamos abajo
  rx!: Table<any, number>;

  constructor() {
    super("OptiOfflineDB");
    // v1: inventarios + syncQueue
    this.version(1).stores({
      inventarios:
        "++localId,id,user_id,nombre_producto,categoria,marca,modelo,cantidad,precio,caducidad,_status",
      syncQueue: "++id,table,operation,status,timestamp",
    });
    // v2: añadimos pacientes
    this.version(2).stores({
      inventarios:
        "++localId,id,user_id,nombre_producto,categoria,marca,modelo,cantidad,precio,caducidad,_status",
      syncQueue: "++id,table,operation,status,timestamp",
      pacientes:
        "++localId,id,user_id,nombre,edad,sexo,telefono,estado,fecha_de_cita,fecha_nacimiento,diagnostico_id,_status",
    });
    // v3: añadimos diagnostico y rx
    this.version(3).stores({
      inventarios:
        "++localId,id,user_id,nombre_producto,categoria,marca,modelo,cantidad,precio,caducidad,_status",
      syncQueue: "++id,table,operation,status,timestamp",
      pacientes:
        "++localId,id,user_id,nombre,edad,sexo,telefono,estado,fecha_de_cita,fecha_nacimiento,diagnostico_id,_status",
      diagnostico:
        "++localId,id,user_id,paciente_id,rx_uso_od_id,rx_uso_oi_id,rx_final_od_id,rx_final_oi_id,_status",
      rx:
        "++localId,id,user_id,paciente_id,diagnostico_id,add,cil,esf,eje,_status",
    });
  }
}

// Singleton para reutilizar la instancia
let _db: OptiOfflineDB | null = null;
export function getDB() {
  if (!_db) _db = new OptiOfflineDB();
  return _db;
}