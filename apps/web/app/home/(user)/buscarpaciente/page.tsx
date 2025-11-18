'use client';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@kit/ui/card';
import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';
import { useRouter } from 'next/navigation';
import { Search, User, Calendar, Phone, ArrowRight, MapPin, FileText } from 'lucide-react';

// Interfaz para el tipo de paciente según la estructura de la tabla
interface Paciente {
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
    created_at: string;
    updated_at: string;
    estado: string | null;
    fecha_nacimiento: string | null;
    ocupacion: string | null;
}

export default function BuscarPaciente() {
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
            // Verificar autenticación
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                setError('Usuario no autenticado');
                return;
            }
            
            // Buscar por nombre que contenga el término de búsqueda
            const { data, error } = await supabase
                .from('pacientes' as any)
                .select('id, user_id, nombre, edad, sexo, domicilio, motivo_consulta, diagnostico_id, telefono, fecha_de_cita, created_at, updated_at, estado, fecha_nacimiento, ocupacion')
                .eq('user_id', userData.user.id)
                .ilike('nombre', `%${term}%`)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            // Convertir a tipo Paciente de forma segura
            if (data) {
                setPacientes(data ? data as unknown as Paciente[] : []);
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
        router.push(`/home/historialclinico/${pacienteId}`);
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
        <div className="flex flex-col items-center justify-start h-120 p-6">
            <div className="w-full max-w-3xl mx-auto text-center">
                <h1 className="text-3xl font-bold mb-8">Buscar Paciente</h1>        
                <div className="relative mb-10 w-full max-w-xl mx-auto">
                    <div className="relative">
                        <Input
                            placeholder="Ingresa el nombre del paciente (mínimo 2 caracteres)"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-10 h-12 text-lg"
                            autoFocus
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    
                    {loading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}
                </div>
            </div>
            
            {error && (
                <div className="w-full max-w-3xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}
            
            {pacientes.length > 0 ? (
                <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pacientes.map((paciente) => (
                        <Card key={paciente.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center">
                                    <User className="mr-2 text-purple-600" size={20} />
                                    {paciente.nombre}
                                </CardTitle>
                                <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getEstadoColor(paciente.estado)}`}>
                                    {paciente.estado || 'Sin estado'}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-sm flex items-center">
                                        <Calendar className="mr-2 text-gray-500" size={16} />
                                        Edad: {paciente.edad || 'No disponible'}
                                    </div>
                                    <div className="text-sm flex items-center">
                                        <Phone className="mr-2 text-gray-500" size={16} />
                                        Tel: {paciente.telefono || 'No disponible'}
                                    </div>
                                    <div className="text-sm flex items-center">
                                        <MapPin className="mr-2 text-gray-500" size={16} />
                                        {paciente.domicilio ? (
                                            paciente.domicilio.length > 30 
                                                ? `${paciente.domicilio.substring(0, 30)}...` 
                                                : paciente.domicilio
                                        ) : 'Domicilio no disponible'}
                                    </div>
                                    <div className="text-sm flex items-start">
                                        <FileText className="mr-2 text-gray-500 mt-1 flex-shrink-0" size={16} />
                                        <span>
                                            {paciente.motivo_consulta 
                                                ? (paciente.motivo_consulta.length > 50 
                                                    ? `${paciente.motivo_consulta.substring(0, 50)}...` 
                                                    : paciente.motivo_consulta)
                                                : 'Motivo no disponible'}
                                        </span>
                                    </div>
                                    <div className="text-sm flex items-center">
                                        <Calendar className="mr-2 text-gray-500" size={16} />
                                        Cita: {formatearFecha(paciente.fecha_de_cita)}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 pb-3">
                                <Button 
                                    className="w-full bg-purple-600 hover:bg-purple-700" 
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
                <div className="text-center py-12 text-gray-500">
                    No se encontraron pacientes con ese nombre
                </div>
            ) : searchTerm.length > 0 ? (
                <div className="text-center py-12 text-gray-500">
                    Ingresa al menos 2 caracteres para buscar
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400">
                    <Search className="mx-auto mb-4" size={48} />
                    <p className="text-xl">Ingresa el nombre del paciente para comenzar la búsqueda</p>
                </div>
            )}
        </div>
    );
}