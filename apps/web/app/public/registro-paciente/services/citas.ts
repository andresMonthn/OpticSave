import type { CitaInfo } from "../types/types";

// Servicio de obtención de citas por user_id usando Supabase
export async function getCitasInfoByUserId(supabase: any, userId: string): Promise<CitaInfo[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('pacientes' as any)
    .select('fecha_de_cita')
    .eq('user_id', userId)
    .not('fecha_de_cita', 'is', null);

  if (error) {
    console.error("Error al obtener citas:", error);
    return [];
  }

  const citasPorFecha = new Map<string, number>();
  const pacientes = (data as any[]) || [];

  pacientes.forEach(paciente => {
    if (paciente?.fecha_de_cita) {
      const fecha = paciente.fecha_de_cita.split('T')[0];
      citasPorFecha.set(fecha, (citasPorFecha.get(fecha) || 0) + 1);
    }
  });

  const citasInfoArray: CitaInfo[] = Array.from(citasPorFecha.entries()).map(
    ([fechaStr, cantidad]) => ({
      fecha: new Date(fechaStr),
      cantidadPacientes: cantidad,
    })
  );

  return citasInfoArray;
}