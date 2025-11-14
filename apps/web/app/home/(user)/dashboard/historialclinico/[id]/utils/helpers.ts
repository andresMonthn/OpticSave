/**
 * Utilidades puras del módulo Historial Clínico.
 *
 * - formatDateSafe: formatea fechas de manera segura, devolviendo un fallback si es inválida.
 * - getAppointmentStatus: calcula días restantes, si la cita expiró y el nuevo estado.
 */
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea fechas de forma segura con un fallback legible.
 */
export const formatDateSafe = (
  val: string | Date | null | undefined,
  fallback: string
): string => {
  if (!val) return fallback;
  const d = val instanceof Date ? val : new Date(String(val));
  return isValid(d) ? format(d, 'PPP', { locale: es }) : fallback;
};

export type AppointmentStatus = {
  diasRestantes: number | null;
  citaExpirada: boolean;
  nuevoEstado: string; // 'Completado' | 'Pendiente' | 'Programado'
};

/**
 * Calcula el estado de la cita a partir de una fecha ISO.
 */
export const getAppointmentStatus = (fechaCita: string | null): AppointmentStatus | null => {
  if (!fechaCita) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let fechaCitaObj: Date;
  try {
    fechaCitaObj = parseISO(fechaCita);
    if (!isValid(fechaCitaObj)) {
      throw new Error('Fecha inválida');
    }
    fechaCitaObj.setHours(0, 0, 0, 0);
  } catch (error) {
    return null;
  }

  const diferenciaTiempo = fechaCitaObj.getTime() - hoy.getTime();
  const diasRestantesCalc = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));

  let nuevoEstado = '';
  let citaExpirada = false;

  if (diasRestantesCalc < 0) {
    nuevoEstado = 'Completado';
    citaExpirada = true;
  } else if (diasRestantesCalc === 0) {
    nuevoEstado = 'Pendiente';
  } else {
    nuevoEstado = 'Programado';
  }

  return {
    diasRestantes: diasRestantesCalc,
    citaExpirada,
    nuevoEstado,
  };
};