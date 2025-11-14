import { useEffect, useState } from 'react';
import { Rx } from '@/app/home/(user)/dashboard/historialclinico/[id]/types';
import { fetchRecetasByPaciente } from '@/app/home/(user)/dashboard/historialclinico/[id]/services/recetas';

export function useRecetas(supabase: any, pacienteId: string) {
  const [recetas, setRecetas] = useState<Rx[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      const r = await fetchRecetasByPaciente(supabase, pacienteId);
      setRecetas(r as any);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las recetas');
    }
  };

  useEffect(() => {
    refetch();
  }, [pacienteId]);

  useEffect(() => {
    const handleRecetasUpdated = (event: any) => {
      if (event.detail) setRecetas(event.detail);
    };
    window.addEventListener('recetasUpdated', handleRecetasUpdated);
    return () => window.removeEventListener('recetasUpdated', handleRecetasUpdated);
  }, []);

  return { recetas, error, refetch, setRecetas, setError };
}