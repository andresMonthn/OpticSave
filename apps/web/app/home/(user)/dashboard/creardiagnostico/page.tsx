'use client';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@kit/ui/card';
import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';
import { useRouter } from 'next/navigation';
import { Search, User, Calendar, Phone, ArrowRight } from 'lucide-react';

// Interfaz para el tipo de paciente
interface Paciente {
    id: string;
    nombre: string;
    apellido: string;
    edad: number | null;
    telefono: string | null;
    fecha_de_cita: string | null;
    estado: string | null;
}

export default function CrearDiagnostico() {
    const [searchTerm, setSearchTerm] = useState('');
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();

    // Función para buscar pacientes con debounce
    const buscarPacientes = useCallback(async (term: string) => {
        if (!term.trim()) {
            setPacientes([]);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            // Buscar por nombre o apellido que contenga el término de búsqueda
            const { data, error } = await supabase
                .from('pacientes' as any)
                .select('*')
                .or(`nombre.ilike.%${term}%,apellido.ilike.%${term}%`)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            // Convertir a tipo Paciente de forma segura
            if (data) {
                setPacientes(data as unknown as Paciente[]);
            } else {
                setPacientes([]);
            }
        } catch (err: any) {
            console.error('Error al buscar pacientes:', err);
            setError(err.message || 'Error al buscar pacientes');
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Efecto para realizar búsqueda en tiempo real con debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.trim().length >= 2) {
                buscarPacientes(searchTerm);
            } else if (searchTerm.trim().length === 0) {
                setPacientes([]);
            }
        }, 300); // 300ms de debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm, buscarPacientes]);

    // Manejar cambios en el input de búsqueda
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Navegar al historial clínico del paciente
    const navegarAHistorialClinico = (pacienteId: string) => {
        router.push(`/home/dashboard/historialclinico/${pacienteId}`);
    };

    // Formatear fecha para mostrar
    const formatearFecha = (fechaStr: string | null) => {
        if (!fechaStr) return 'No disponible';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-ES');
    };

    // Obtener el color del estado del paciente
    const getEstadoColor = (estado: string | null) => {
        switch (estado) {
            case 'activo':
                return 'bg-green-100 text-green-800';
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800';
            case 'expirada':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Buscar Paciente</h1>
            
            <div className="relative mb-6">
                <div className="relative">
                    <Input
                        placeholder="Ingresa el nombre o apellido del paciente (mínimo 2 caracteres)"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-10"
                        autoFocus
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
                
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            {pacientes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pacientes.map((paciente) => (
                        <Card key={paciente.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center">
                                    <User className="mr-2" size={18} />
                                    {paciente.nombre} {paciente.apellido}
                                </CardTitle>
                                <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getEstadoColor(paciente.estado)}`}>
                                    {paciente.estado || 'Sin estado'}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm flex items-center mb-1">
                                    <Calendar className="mr-2 text-gray-500" size={16} />
                                    Edad: {paciente.edad || 'No disponible'}
                                </div>
                                <div className="text-sm flex items-center mb-1">
                                    <Phone className="mr-2 text-gray-500" size={16} />
                                    Tel: {paciente.telefono || 'No disponible'}
                                </div>
                                <div className="text-sm flex items-center">
                                    <Calendar className="mr-2 text-gray-500" size={16} />
                                    Cita: {formatearFecha(paciente.fecha_de_cita)}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 pb-3">
                                <Button 
                                    className="w-full" 
                                    onClick={() => navegarAHistorialClinico(paciente.id)}
                                >
                                    Ver Historial Clínico
                                    <ArrowRight className="ml-2" size={16} />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : searchTerm.length >= 2 ? (
                <div className="text-center py-8 text-gray-500">
                    No se encontraron pacientes con ese nombre o apellido
                </div>
            ) : searchTerm.length > 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Ingresa al menos 2 caracteres para buscar
                </div>
            ) : null}
        </div>
    );
}