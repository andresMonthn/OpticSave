'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ArrowDown, ArrowUp, Menu, TrendingUp, Users, Calendar, CheckCircle, Clock, Search, User, Phone, ArrowRight, MapPin, FileText } from 'lucide-react';
import { ChatBot } from "../../../../components/chat-bot/chat-bot"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, } from 'recharts';

import { Badge } from '@kit/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@kit/ui/dropdown-menu';
import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import MagicBento from './MagicBento';
import MagicBentoDemo from './MagicBentoDemo';
import { Separator } from '@kit/ui/separator';

// Definición de tipos
type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
  edad: number;
  sexo: string;
  domicilio: string;
  motivo_consulta: string;
  telefono: string;
  fecha_de_cita: string;
  estado: string;
  created_at: string;
  user_id: string;
  diagnostico_id?: string | null;
  fecha_nacimiento?: string | null;
  ocupacion?: string | null;
};

// Componente de búsqueda de pacientes
function BuscarPacienteComponent() {
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
    <div className="w-full mb-6">
      {/* Logo OpticSave sobre la sección de búsqueda de paciente */}
      <div className="flex justify-center mb-2">
        <Image
          src="/images/logos/logoOpticsave-patreke.png"
          alt="OpticSave Logo"
          width={80}
          height={80}
          priority
          className="w-30 h-20 rounded-full"
        />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-center">BUSCAR PACIENTE</h2>

      <div className="relative mb-6 w-full max-w-xl mx-auto">
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
        <div style={{zIndex: 999999}}>
          <ChatBot />
        </div>


        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full max-w-3xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {pacientes.length > 0 ? (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

export default function DashboardDemo() {
  // Estados para almacenar datos reales
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos procesados para gráficos
  const [pacientesPorMes, setPacientesPorMes] = useState<any[]>([]);
  const [pacientesPorEstado, setPacientesPorEstado] = useState<any[]>([]);
  const [comparacionMensual, setComparacionMensual] = useState<number>(0);
  const [totalPacientes, setTotalPacientes] = useState<number>(0);
  const [pacientesAtendidos, setPacientesAtendidos] = useState<number>(0);
  const [pacientesPendientes, setPacientesPendientes] = useState<number>(0);
  const [pacientesActivos, setPacientesActivos] = useState<number>(0);
  const [activosPorMes, setActivosPorMes] = useState<any[]>([]);
  const [chartVisibility, setChartVisibility] = useState({
    pacientesPorMes: true,
    estadoPacientes: true,
    pacientesActivos: true,
    pacientesDestacados: true,
  });

  // Función para obtener datos de pacientes desde Supabase
  const fetchPacientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();

      // Verificar si el usuario está logueado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("Usuario no autenticado");
      }

      // Obtener pacientes del usuario actual
      const { data, error } = await supabase
        .from("pacientes" as any)
        .select("*")
        .eq("user_id", userData.user.id);

      if (error) {
        throw error;
      }

      setPacientes(data as unknown as Paciente[]);
      procesarDatos(data as unknown as Paciente[]);
    } catch (err: any) {
      console.error("Error al obtener pacientes:", err);
      setError(err.message || "Error al cargar los pacientes");
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar los datos y generar métricas
  const procesarDatos = (data: Paciente[]) => {
    if (!data || data.length === 0) return;

    // Total de pacientes
    setTotalPacientes(data.length);

    // Pacientes por estado
    const atendidos = data.filter(p => (p.estado || '').toLowerCase() === 'atendido').length;
    const pendientes = data.filter(p => (p.estado || '').toLowerCase() === 'pendiente').length;
    const activos = data.filter(p => (p.estado || '').toLowerCase() === 'activo').length;
    setPacientesAtendidos(atendidos);
    setPacientesPendientes(pendientes);
    setPacientesActivos(activos);

    // Datos para gráfico de estados
    setPacientesPorEstado([
      { name: 'Atendidos', value: atendidos },
      { name: 'Pendientes', value: pendientes },
      { name: 'Activos', value: activos },
      { name: 'Otros', value: data.length - atendidos - pendientes - activos }
    ]);

    // Agrupar pacientes por mes
    const porMes = agruparPorMes(data);
    setPacientesPorMes(porMes);

    // Agrupar activos por mes
    const porMesActivos = agruparPorMesActivos(data);
    setActivosPorMes(porMesActivos);

    // Calcular comparación con mes anterior
    if (porMes.length >= 2) {
      const ultimoMes = porMes[porMes.length - 1];
      const penultimoMes = porMes[porMes.length - 2];

      if (ultimoMes && penultimoMes && penultimoMes.value > 0) {
        const mesActual = ultimoMes.value;
        const mesAnterior = penultimoMes.value;
        const porcentaje = ((mesActual - mesAnterior) / mesAnterior) * 100;
        setComparacionMensual(Math.round(porcentaje));
      }
    }
  };

  // Función para agrupar pacientes por mes
  const agruparPorMes = (pacientes: Paciente[]) => {
    const hoy = new Date();
    const meses: { [key: string]: number } = {};

    // Inicializar los últimos 8 meses
    for (let i = 7; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const key = fecha.toLocaleDateString('es-ES', { month: 'long', year: '2-digit' });
      meses[key] = 0;
    }

    // Contar pacientes por mes
    pacientes.forEach(paciente => {
      const fecha = new Date(paciente.created_at);
      const key = fecha.toLocaleDateString('es-ES', { month: 'long', year: '2-digit' });
      if (meses[key] !== undefined) {
        meses[key]++;
      }
    });

    // Convertir a formato para gráficos
    return Object.entries(meses).map(([name, value]) => ({ name, value }));
  };

  // Función para agrupar pacientes activos por mes
  const agruparPorMesActivos = (pacientes: Paciente[]) => {
    const hoy = new Date();
    const meses: { [key: string]: number } = {};

    for (let i = 7; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const key = fecha.toLocaleDateString('es-ES', { month: 'long', year: '2-digit' });
      meses[key] = 0;
    }

    pacientes.forEach(paciente => {
      const fecha = new Date(paciente.created_at);
      const key = fecha.toLocaleDateString('es-ES', { month: 'long', year: '2-digit' });
      const estado = (paciente.estado || '').toLowerCase();
      if (meses[key] !== undefined && estado === 'activo') {
        meses[key]++;
      }
    });

    return Object.entries(meses).map(([name, value]) => ({ name, value }));
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchPacientes();
  }, []);

  return (
    <div
      className={
        'animate-in fade-in flex flex-col space-y-3 w-full duration-500'
      }
    >
      {loading ? (
        <div className="flex justify-center items-center h-full min-h-[40vh]">
          <p>Cargando datos de pacientes...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-full min-h-[40vh]">
          <p className="text-red-500">Error: {error}</p>
        </div>
      ) : (
        <>
          {/* Componente de búsqueda de pacientes */}
          <Separator />
          <Separator />
          <BuscarPacienteComponent />

          <div className="flex justify-end mb-2 w-full px-2">
            {/* Botón de configuración de gráficos */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-sm md:text-base">
                  <Menu className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Configurar gráficos</span>
                  <span className="sm:hidden">Config</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuLabel>Mostrar</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={chartVisibility.pacientesPorMes}
                  onCheckedChange={(checked) =>
                    setChartVisibility((s) => ({ ...s, pacientesPorMes: !!checked }))
                  }
                >
                  Pacientes por Mes
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={chartVisibility.estadoPacientes}
                  onCheckedChange={(checked) =>
                    setChartVisibility((s) => ({ ...s, estadoPacientes: !!checked }))
                  }
                >
                  Estado de Pacientes
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={chartVisibility.pacientesActivos}
                  onCheckedChange={(checked) =>
                    setChartVisibility((s) => ({ ...s, pacientesActivos: !!checked }))
                  }
                >
                  Pacientes Activos
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={chartVisibility.pacientesDestacados}
                  onCheckedChange={(checked) =>
                    setChartVisibility((s) => ({ ...s, pacientesDestacados: !!checked }))
                  }
                >
                  Pacientes Destacados
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {/* Tarjeta Total Pacientes */}
            <MagicBento
              variant="overlay"
              clickEffect
              glowColor="0, 100, 255"
              style={{ borderRadius: '12px' }}
              className="h-auto"
            >
              <Card className="h-full">
                <CardHeader className="p-3">
                  <CardTitle className={'flex items-center gap-2 text-sm'}>
                    <span>Total Pacientes</span>
                    <Trend trend={comparacionMensual > 0 ? 'up' : comparacionMensual < 0 ? 'down' : 'stale'}>
                      {comparacionMensual > 0 ? `+${comparacionMensual}%` : `${comparacionMensual}%`}
                    </Trend>
                  </CardTitle>

                  <CardDescription className="text-xs">
                    <span>Número total de pacientes registrados</span>
                  </CardDescription>

                  <div>
                    <Figure>{totalPacientes}</Figure>
                  </div>
                </CardHeader>

                <CardContent className={'p-2 flex justify-center'}>
                  <Chart data={pacientesPorMes} />
                </CardContent>
              </Card>
            </MagicBento>

            {/* Tarjeta Pacientes Atendidos */}
            <MagicBento
              variant="overlay"
              clickEffect
              glowColor="0, 100, 255"
              style={{ borderRadius: '12px' }}
              className="h-auto"
            >
              <Card className="h-full">
                <CardHeader className="p-3">
                  <CardTitle className={'flex items-center gap-2 text-sm'}>
                    <span>Pacientes Atendidos</span>
                    <Trend trend={'up'}>{pacientesAtendidos > 0 && totalPacientes > 0 ?
                      `${Math.round((pacientesAtendidos / totalPacientes) * 100)}%` : '0%'}
                    </Trend>
                  </CardTitle>

                  <CardDescription className="text-xs">
                    <span>Pacientes con estado "atendido"</span>
                  </CardDescription>

                  <div>
                    <Figure>{pacientesAtendidos}</Figure>
                  </div>
                </CardHeader>

                <CardContent className="p-2 flex justify-center">
                  <Chart data={pacientesPorMes.map(item => ({
                    name: item.name,
                    value: Math.round(item.value * (pacientesAtendidos / totalPacientes || 0))
                  }))} />
                </CardContent>
              </Card>
            </MagicBento>

            {/* Tarjeta Pacientes Activos (solo visible si está activado) */}
            {chartVisibility.pacientesActivos && (
              <MagicBento
                variant="overlay"
                clickEffect
                glowColor="0, 100, 255"
                style={{ borderRadius: '12px' }}
                className="h-auto"
              >
                <Card className="h-full">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">Pacientes Activos</CardTitle>
                    <CardDescription className="text-xs">
                      Mostrando el número de pacientes activos por mes
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-2 flex justify-center">
                    <ChartContainer style={{ width: '100%', height: '200px' }} config={{
                      activos: {
                        label: 'Activos',
                        color: 'var(--chart-2)',
                      },
                    }}>
                      <AreaChart
                        data={activosPorMes}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        width={200}
                        height={200}
                      >
                        <defs>
                          <linearGradient id="fillActivos" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor="var(--chart-2)"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--chart-2)"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tick={{ fontSize: '0.6rem' }}
                          height={30}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dot" />}
                          wrapperStyle={{ zIndex: 100 }}
                        />
                        <Area
                          dataKey="value"
                          type="natural"
                          fill="url(#fillActivos)"
                          fillOpacity={0.4}
                          stroke="var(--chart-2)"
                          stackId="a"
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </MagicBento>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 w-full mt-3">
            {/* Gráfico Pacientes por Mes */}
            {chartVisibility.pacientesPorMes && (
              <div className="w-full">
                <PacientesPorMesChart data={pacientesPorMes} />
              </div>
            )}

            {/* Gráfico Estado de Pacientes */}
            {chartVisibility.estadoPacientes && (
              <div className="w-full">
                <EstadoPacientesChart data={pacientesPorEstado} />
              </div>
            )}
          </div>

          {chartVisibility.pacientesDestacados && (
            <div className="w-full mt-3">
              <Card className="w-full">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm sm:text-base">Pacientes Destacados</CardTitle>
                  <CardDescription className="text-xs">Mostrando los pacientes más recientes</CardDescription>
                </CardHeader>

                <CardContent className="p-2 overflow-x-auto">
                  <PacientesTable pacientes={pacientes.slice(0, 5)} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* 
            DOCUMENTACIÓN DE CAMBIOS REALIZADOS:
            1. Reducción de tamaño: Se redujeron proporcionalmente todos los elementos visuales
               - Gráficos redimensionados a tamaños más compactos (180-220px)
               - Reducción de padding y márgenes
               - Ajuste de tamaños de texto para mantener legibilidad
            
            2. Responsividad completa:
               - Implementación de grid flexible con 1-3 columnas según breakpoint
               - Uso de width: 100% para adaptación a contenedor
               - Optimización para dispositivos móviles y tablets
            
            3. Eliminación de scroll anidado:
               - Eliminación de maxHeight y overflowY del contenedor principal
               - Optimización del layout para evitar scroll horizontal
               - Reducción del número de pacientes mostrados en la tabla
            
            4. Técnicas modernas de CSS:
               - Uso de grid y flexbox para layout responsivo
               - Implementación de gap para espaciado consistente
               - Ajuste de z-index para tooltips
            
            5. Compatibilidad con navegadores:
               - Uso de propiedades CSS estándar soportadas por navegadores modernos
               - Evitado de propiedades experimentales
          */}
        </>
      )}

      {/* Demostración de MagicBento como contenedor */}
      {/* <div className="mt-8">
        <MagicBentoDemo />
      </div> */}
    </div>
  );
}

function Chart(
  props: React.PropsWithChildren<{ data: { value: number; name: string }[] }>,
) {
  const chartConfig = {
    pacientes: {
      label: 'Pacientes',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="w-full h-full" style={{ width: '100%', height: '180px' }}>
      <LineChart
        data={props.data}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        width={180}
        height={180}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          tick={{ fontSize: '0.65rem' }}
          height={20}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
          wrapperStyle={{ zIndex: 100 }}
        />
        <Line
          dataKey="value"
          type="natural"
          stroke="var(--color-pacientes)"
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

function PacientesPorMesChart({ data }: { data: { name: string; value: number }[] }) {
  const chartConfig = {
    pacientes: {
      label: 'Pacientes',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  return (
    <MagicBento variant="overlay" enableSpotlight clickEffect glowColor="0, 100, 255" className="w-full" style={{ borderRadius: '12px' }}>
      <Card className="w-full">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Pacientes por Mes</CardTitle>
          <CardDescription className="text-xs">
            Mostrando el número de pacientes registrados por mes
          </CardDescription>
        </CardHeader>

        <CardContent className="p-2 flex justify-center">
          <ChartContainer className="flex justify-center" style={{ width: '100%', height: '220px' }} config={chartConfig}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              width={220}
              height={220}
            >
              <defs>
                <linearGradient id="fillPacientes" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-pacientes)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-pacientes)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                tick={{ fontSize: '0.65rem' }}
                height={30}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
                wrapperStyle={{ zIndex: 100 }}
              />
              <Area
                dataKey="value"
                type="natural"
                fill="url(#fillPacientes)"
                fillOpacity={0.4}
                stroke="var(--color-pacientes)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>

        <CardFooter className="p-2 sm:p-3">
          <div className="flex w-full items-start gap-1 text-xs">
            <div className="grid gap-1">
              <div className="flex items-center gap-1 leading-none font-medium">
                {data.length >= 2 && ((data[data.length - 1]?.value || 0) > (data[data.length - 2]?.value || 0)) ? (
                  <>Tendencia al alza <TrendingUp className="h-3 w-3" /></>
                ) : (
                  <>Tendencia a la baja <ArrowDown className="h-3 w-3" /></>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 leading-none text-xs">
                Últimos 8 meses
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </MagicBento>
  );
}

function EstadoPacientesChart({ data }: { data: { name: string; value: number }[] }) {
  const chartConfig = {
    estados: {
      label: 'Estados',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  return (
    <MagicBento variant="overlay" enableStars clickEffect glowColor="0, 100, 255" className="w-full" style={{ borderRadius: '12px' }}>
      <Card className="w-full">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Estado de Pacientes</CardTitle>
          <CardDescription className="text-xs">
            Distribución de pacientes por estado
          </CardDescription>
        </CardHeader>

        <CardContent className="p-2 flex justify-center">
          <ChartContainer style={{ width: '100%', height: '220px' }} config={chartConfig}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              width={220}
              height={220}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                tick={{ fontSize: '0.65rem' }}
                height={30}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
                wrapperStyle={{ zIndex: 100 }}
              />
              <Bar
                dataKey="value"
                fill="var(--color-estados)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </MagicBento>
  );
}

function PacientesActivosChart({ data }: { data: { name: string; value: number }[] }) {
  const chartConfig = {
    activos: {
      label: 'Activos',
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  return (
    <MagicBento variant="overlay" enableSpotlight enableStars clickEffect glowColor="0, 100, 255" style={{ borderRadius: '12px' }}>
      <Card className="w-full">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Pacientes Activos por Mes</CardTitle>
          <CardDescription className="text-xs">
            Mostrando el número de pacientes activos por mes
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 flex justify-center">
          <ChartContainer style={{ width: '300px', height: '300px' }} config={chartConfig}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              width={300}
              height={300}
            >
              <defs>
                <linearGradient id="fillActivos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-activos)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-activos)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Area dataKey="value" type="natural" fill="url(#fillActivos)" fillOpacity={0.4} stroke="var(--color-activos)" stackId="a" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </MagicBento>
  );
}

function PacientesTable({ pacientes }: { pacientes: Paciente[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap text-xs sm:text-sm">Paciente</TableHead>
            <TableHead className="whitespace-nowrap text-xs sm:text-sm">Edad</TableHead>
            <TableHead className="whitespace-nowrap text-xs sm:text-sm">Fecha de Cita</TableHead>
            <TableHead className="whitespace-nowrap text-xs sm:text-sm">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pacientes.map((paciente) => (
            <TableRow key={paciente.id}>
              <TableCell className={'flex flex-col text-xs sm:text-sm'}>
                <span className="font-medium whitespace-nowrap">{`${paciente.nombre} ${paciente.apellido}`}</span>
                <span className={'text-muted-foreground text-xs'}>
                  {paciente.telefono}
                </span>
              </TableCell>
              <TableCell className="text-xs sm:text-sm">{paciente.edad}</TableCell>
              <TableCell className="text-xs sm:text-sm whitespace-nowrap text-xs whitespace-nowrap">{new Date(paciente.fecha_de_cita).toLocaleDateString('es-ES')}</TableCell>
              <TableCell>
                <BadgeWithTrend
                  trend={
                    paciente.estado === 'atendido'
                      ? 'up'
                      : paciente.estado === 'pendiente'
                        ? 'stale'
                        : 'down'
                  }
                >
                  {paciente.estado ? paciente.estado.charAt(0).toUpperCase() + paciente.estado.slice(1) : 'Sin estado'}
                </BadgeWithTrend>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BadgeWithTrend(props: React.PropsWithChildren<{ trend: string }>) {
  const className = useMemo(() => {
    switch (props.trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-destructive';
      case 'stale':
        return 'text-orange-500';
    }
  }, [props.trend]);

  return (
    <Badge
      variant={'outline'}
      className={'border-transparent px-1.5 font-normal'}
    >
      <span className={className}>{props.children}</span>
    </Badge>
  );
}

function Figure(props: React.PropsWithChildren) {
  return (
    <div className={'font-heading text-2xl font-semibold'}>
      {props.children}
    </div>
  );
}

function Trend(
  props: React.PropsWithChildren<{
    trend: 'up' | 'down' | 'stale';
  }>,
) {
  const Icon = useMemo(() => {
    switch (props.trend) {
      case 'up':
        return <ArrowUp className={'h-3 w-3 text-green-500'} />;
      case 'down':
        return <ArrowDown className={'text-destructive h-3 w-3'} />;
      case 'stale':
        return <Menu className={'h-3 w-3 text-orange-500'} />;
    }
  }, [props.trend]);

  return (
    <div>
      <BadgeWithTrend trend={props.trend}>
        <span className={'flex items-center space-x-1'}>
          {Icon}
          <span>{props.children}</span>
        </span>
      </BadgeWithTrend>
    </div>
  );
}