import { Paciente } from '@/app/home/(user)/dashboard/historialclinico/[id]/types';

/** Obtiene un paciente por id. */
export async function fetchPacienteById(supabase: any, pacienteId: string): Promise<Paciente> {
  const { data, error } = await supabase
    .from('pacientes' as any)
    .select('*')
    .eq('id', pacienteId)
    .single();

  if (error) throw error;
  return data as unknown as Paciente;
}

/** Actualiza el estado del paciente. */
export async function updatePacienteEstado(
  supabase: any,
  pacienteId: string,
  nuevoEstado: string
): Promise<void> {
  // Verificar usuario por posibles políticas RLS
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  const { data, error } = await supabase
    .from('pacientes' as any)
    .update({ estado: nuevoEstado })
    .eq('id', pacienteId)
    .eq('user_id', userId)
    .select('id, estado')
    .single();

  if (error) throw error;
  if (!data) throw new Error('No se encontró el paciente para actualizar');
}