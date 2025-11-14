import { useEffect, useState } from 'react';
import { getAppointmentStatus } from '@/app/home/(user)/dashboard/historialclinico/[id]/utils/helpers';
import { Paciente } from '@/app/home/(user)/dashboard/historialclinico/[id]/types';
import { fetchPacienteById, updatePacienteEstado } from '@/app/home/(user)/dashboard/historialclinico/[id]/services/paciente';

export function shouldUpdatePacienteEstado(prev: string | null, next: string) {
  return prev !== next;
}

export function usePaciente(supabase: any, pacienteId: string) {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  const [citaExpirada, setCitaExpirada] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      const data = await fetchPacienteById(supabase, pacienteId);
      setPaciente(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del paciente');
    } finally {
      setLoading(false);
    }
  };

  const verificarEstadoCita = async (fechaCita: string | null) => {
    const status = getAppointmentStatus(fechaCita);
    if (!status) return;
    const { diasRestantes, citaExpirada, nuevoEstado } = status;
    setDiasRestantes(diasRestantes);
    setCitaExpirada(citaExpirada);
    if (paciente && shouldUpdatePacienteEstado(paciente.estado, nuevoEstado)) {
      try {
        await updatePacienteEstado(supabase, pacienteId, nuevoEstado);
        setPaciente((prev) => (prev ? { ...prev, estado: nuevoEstado } : prev));
      } catch (err: any) {
        setError(err.message || 'Error al actualizar el estado del paciente');
      }
    }
  };

  useEffect(() => {
    refetch();
  }, [pacienteId]);

  useEffect(() => {
    if (paciente && paciente.fecha_de_cita) {
      verificarEstadoCita(paciente.fecha_de_cita);
    }
  }, [paciente]);

  return {
    paciente,
    loading,
    error,
    diasRestantes,
    citaExpirada,
    refetch,
    verificarEstadoCita,
    setPaciente,
    setError,
  };
}