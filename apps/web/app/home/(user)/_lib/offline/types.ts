// Tipos compartidos para offline y sincronización

export type SyncOperation = "insert" | "update" | "delete";
export type SyncStatus = "pending" | "synced" | "failed";

// Registro de inventario local (Dexie)
export interface InventarioLocal {
  localId?: number; // id autoincremental local
  id?: string; // id UUID de Supabase cuando esté sincronizado
  user_id: string;
  nombre_producto: string | null;
  categoria: string | null;
  marca: string | null;
  modelo: string | null;
  cantidad: number; // se almacena en número localmente
  precio: number; // se almacena en número localmente
  descripcion: string | null;
  caducidad: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  _status?: SyncStatus;
}

// Payload para sincronización con Supabase (usa tipos del esquema)
export interface InventarioSyncPayload {
  localId?: number;
  id?: string;
  user_id: string;
  nombre_producto?: string | null;
  categoria?: string | null;
  marca?: string | null;
  modelo?: string | null;
  cantidad?: string | null; // texto en BD
  precio?: string | null; // texto en BD
  descripcion?: string | null;
  caducidad?: string | null;
}

// Elemento en cola de sincronización
export interface SyncQueueItem {
  id?: number;
  table: "inventarios" | "pacientes" | "diagnostico" | "rx";
  operation: SyncOperation;
  payload: InventarioSyncPayload | PacienteSyncPayload | DiagnosticoSyncPayload | RxSyncPayload;
  timestamp: number;
  status: SyncStatus;
}

// Pacientes
export interface PacienteLocal {
  localId?: number;
  id?: string;
  user_id: string;
  nombre: string; // not null según esquema
  edad: number | null;
  sexo: string | null;
  domicilio: string | null;
  motivo_consulta: string | null;
  diagnostico_id: string | null;
  telefono: string | null;
  fecha_de_cita: string | null; // texto
  created_at?: string | null;
  updated_at?: string | null;
  estado: string | null;
  fecha_nacimiento: string | null; // YYYY-MM-DD
  ocupacion: string | null;
  sintomas_visuales: string | null;
  ultimo_examen_visual: string | null;
  uso_lentes: boolean | null;
  tipos_de_lentes: string | null;
  tiempo_de_uso_lentes: string | null;
  cirujias: boolean | null;
  traumatismos_oculares: boolean | null;
  nombre_traumatismos_oculares: string | null;
  antecedentes_visuales_familiares: string | null;
  antecedente_familiar_salud: string | null;
  habitos_visuales: string | null;
  salud_general: string | null;
  medicamento_actual: string | null;
  _status?: SyncStatus;
}

export interface PacienteSyncPayload {
  id?: string;
  user_id: string;
  nombre?: string;
  edad?: number | null;
  sexo?: string | null;
  domicilio?: string | null;
  motivo_consulta?: string | null;
  diagnostico_id?: string | null;
  telefono?: string | null;
  fecha_de_cita?: string | null;
  estado?: string | null;
  fecha_nacimiento?: string | null; // YYYY-MM-DD
  ocupacion?: string | null;
  sintomas_visuales?: string | null;
  ultimo_examen_visual?: string | null;
  uso_lentes?: boolean | null;
  tipos_de_lentes?: string | null;
  tiempo_de_uso_lentes?: string | null;
  cirujias?: boolean | null;
  traumatismos_oculares?: boolean | null;
  nombre_traumatismos_oculares?: string | null;
  antecedentes_visuales_familiares?: string | null;
  antecedente_familiar_salud?: string | null;
  habitos_visuales?: string | null;
  salud_general?: string | null;
  medicamento_actual?: string | null;
}

// Diagnóstico
export interface DiagnosticoLocal {
  localId?: number;
  id?: string;
  paciente_id: string; // not null
  user_id: string; // not null
  vb_salud_ocular: boolean | null;
  rx_uso_od_id: string | null;
  rx_uso_oi_id: string | null;
  rx_final_od_id: string | null;
  rx_final_oi_id: string | null;
  dip: string | null; // texto
  proxima_visita: string | null; // texto
  created_at?: string | null;
  updated_at?: string | null;
  _status?: SyncStatus;
}

export interface DiagnosticoSyncPayload {
  id?: string;
  paciente_id: string;
  user_id: string;
  vb_salud_ocular?: boolean | null;
  rx_uso_od_id?: string | null;
  rx_uso_oi_id?: string | null;
  rx_final_od_id?: string | null;
  rx_final_oi_id?: string | null;
  dip?: string | null;
  proxima_visita?: string | null;
}

// RX
export interface RxLocal {
  localId?: number;
  id?: string;
  user_id: string; // puede ser null en BD, usamos string aquí para consistencia
  add: string | null;
  cil: string | null;
  esf: string | null;
  eje: string | null;
  diagnostico_id: string | null; // referencia opcional
  paciente_id: string; // not null
  created_at?: string | null;
  updated_at?: string | null;
  _status?: SyncStatus;
}

export interface RxSyncPayload {
  id?: string;
  user_id?: string | null;
  add?: string | null;
  cil?: string | null;
  esf?: string | null;
  eje?: string | null;
  diagnostico_id?: string | null;
  paciente_id?: string;
}