import { Paciente, Diagnostico, Rx } from './types';

export async function fetchPacienteById(
  supabase: any,
  pacienteId: string
): Promise<Paciente> {
  const { data, error } = await supabase
    .from('pacientes' as any)
    .select('*')
    .eq('id', pacienteId)
    .single();

  if (error) throw error;
  return data as unknown as Paciente;
}

export async function fetchRecetasByPaciente(
  supabase: any,
  pacienteId: string
): Promise<Rx[]> {
  const { data: diagData, error: diagError } = await supabase
    .from('diagnostico' as any)
    .select('*')
    .eq('paciente_id', pacienteId);

  if (diagError) throw diagError;

  if (!diagData || !Array.isArray(diagData) || diagData.length === 0) {
    return [];
  }

  const diagnosticos = diagData as unknown as Diagnostico[];

  const recetasMap: Record<string, { tipo: string; ojo: string; diagnosticoId: string }> = {};

  diagnosticos.forEach((diag) => {
    if (diag.rx_uso_od_id) {
      recetasMap[diag.rx_uso_od_id] = { tipo: 'uso', ojo: 'OD', diagnosticoId: diag.id };
    }
    if (diag.rx_uso_oi_id) {
      recetasMap[diag.rx_uso_oi_id] = { tipo: 'uso', ojo: 'OI', diagnosticoId: diag.id };
    }
    if (diag.rx_final_od_id) {
      recetasMap[diag.rx_final_od_id] = { tipo: 'final', ojo: 'OD', diagnosticoId: diag.id };
    }
    if (diag.rx_final_oi_id) {
      recetasMap[diag.rx_final_oi_id] = { tipo: 'final', ojo: 'OI', diagnosticoId: diag.id };
    }
  });

  const rxIds = Object.keys(recetasMap);
  if (rxIds.length === 0) return [];

  const { data: rxData, error: rxError } = await supabase
    .from('rx' as any)
    .select('*')
    .in('id', rxIds);

  if (rxError) throw rxError;
  if (!rxData || !Array.isArray(rxData)) return [];

  const recetasEnriquecidas = (rxData as unknown as Rx[]).map((rx) => {
    const relacion = recetasMap[rx.id];
    return {
      ...rx,
      relacion: relacion
        ? {
            tipo: relacion.tipo as any,
            ojo: relacion.ojo as any,
            diagnosticoId: relacion.diagnosticoId,
          }
        : undefined,
    };
  });

  return recetasEnriquecidas;
}