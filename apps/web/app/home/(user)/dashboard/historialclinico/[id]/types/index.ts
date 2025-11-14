/**
 * Tipos del dominio clínico del paciente y sus recetas.
 * Autocontenidos y reutilizables.
 */
/**
 * Tipos del dominio de Historial Clínico.
 * Cada interfaz está documentada para mejorar la mantenibilidad y testabilidad.
 */
export interface Paciente {
  id: string;
  user_id: string;
  nombre: string;
  edad: number | null;
  sexo: string | null;
  domicilio: string | null;
  motivo_consulta: string | null;
  diagnostico_id: string | null;
  telefono: string | null;
  fecha_de_cita: string | null;
  created_at: string | null;
  updated_at: string | null;
  estado: string | null;
  fecha_nacimiento: string | null;
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
}

export interface Diagnostico {
  id: string;
  paciente_id: string;
  user_id: string;
  fecha_diagnostico: string;
  tipo_diagnostico: string | null;
  diagnostico: string | null;
  tratamiento_refraactivo: string | null;
  tratamiento: string | null;
  observaciones: string | null;
  proxima_visita: string | null;
  vb_salud_ocular: boolean;
  created_at: string;
  rx_uso_od_id?: string | null;
  rx_uso_oi_id?: string | null;
  rx_final_od_id?: string | null;
  rx_final_oi_id?: string | null;
}

export type RxType = 'uso' | 'final';
export type EyeType = 'OD' | 'OI';

export interface Relacion {
  tipo: RxType;
  ojo: EyeType;
  diagnosticoId: string;
}

export interface Rx {
  id: string;
  tipo: RxType;
  ojo: EyeType;
  esf: number | null;
  cil: number | null;
  eje: number | null;
  add: number | null;
  fecha: string;
  user_id: string;
  created_at: string;
  esfera?: number | null;
  cilindro?: number | null;
  adicion?: number | null;
  altura?: number | null;
  observaciones?: string | null;
  relacion?: Relacion;
}