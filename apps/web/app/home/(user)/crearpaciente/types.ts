export interface Paciente {
  id?: string;
  user_id?: string;
  nombre: string;
  edad?: number;
  sexo?: string;
  domicilio?: string;
  motivo_consulta?: string;
  diagnostico_id?: string;
  telefono?: string;
  fecha_de_cita?: Date | string | null;
  created_at?: string;
  updated_at?: string;
  estado?: string;
  fecha_nacimiento?: Date | string | null;
  ocupacion?: string;
  sintomas_visuales?: string;
  ultimo_examen_visual?: string;
  uso_lentes?: boolean;
  tipos_de_lentes?: string;
  tiempo_de_uso_lentes?: string;
  cirujias?: boolean;
  traumatismos_oculares?: boolean;
  nombre_traumatismos_oculares?: string;
  antecedentes_visuales_familiares?: string;
  antecedente_familiar_salud?: string;
  habitos_visuales?: string;
  salud_general?: string;
  medicamento_actual?: string;
}

export interface DomicilioCompleto {
  calle: string;
  numero: string;
  interior: string;
  colonia: string;
}

export interface CitaInfo {
  fecha: Date;
  cantidadPacientes: number;
}