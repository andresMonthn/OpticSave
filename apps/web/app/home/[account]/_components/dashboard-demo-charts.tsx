'use client';

import { useEffect, useMemo, useState } from 'react';

import { ArrowDown, ArrowUp, Menu, TrendingUp, Users, Calendar, CheckCircle, Clock } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
} from 'recharts';

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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@kit/ui/dropdown-menu';
import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';
import MagicBento from './MagicBento';
import MagicBentoDemo from './MagicBentoDemo';

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
};

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
  const [pacientesNuevos, setPacientesNuevos] = useState<number>(0);
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
        'animate-in fade-in flex flex-col space-y-4 w-full h-full min-h-[calc(100vh-10rem)] duration-500'
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
          <div className="flex justify-end mb-2 w-full">
            {/* Botón de configuración de gráficos */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-sm md:text-base">
                  <Menu className="h-4 w-4 mr-2" />
                  Configurar gráficos
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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

          <div
            className={
              'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 w-full auto-rows-fr'
            }
          >
            <MagicBento
              variant="overlay"
              enableSpotlight
              enableStars
              clickEffect
              glowColor="0, 100, 255"
              className="w-full h-full"
            >
              <Card className="w-full h-full">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className={'flex items-center gap-2.5 text-lg md:text-xl'}>
                    <span>Total Pacientes</span>
                    <Trend trend={comparacionMensual > 0 ? 'up' : comparacionMensual < 0 ? 'down' : 'stale'}>
                      {comparacionMensual > 0 ? `+${comparacionMensual}%` : `${comparacionMensual}%`}
                    </Trend>
                  </CardTitle>

                  <CardDescription className="text-sm">
                    <span>Número total de pacientes registrados</span>
                  </CardDescription>

                  <div>
                    <Figure>{totalPacientes}</Figure>
                  </div>
                </CardHeader>

                <CardContent className={'space-y-4 p-4 md:p-6'}>
                  <Chart data={pacientesPorMes} />
                </CardContent>
              </Card>
            </MagicBento>


            <MagicBento
              variant="overlay"
              enableSpotlight
              enableStars
              clickEffect
              glowColor="0, 100, 255"
              className="w-full h-full"
            >
              <Card className="w-full h-full">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className={'flex items-center gap-2.5 text-lg md:text-xl'}>
                    <span>Pacientes Atendidos</span>
                    <Trend trend={'up'}>{pacientesAtendidos > 0 && totalPacientes > 0 ?
                      `${Math.round((pacientesAtendidos / totalPacientes) * 100)}%` : '0%'}
                    </Trend>
                  </CardTitle>

                  <CardDescription className="text-sm">
                    <span>Pacientes con estado "atendido"</span>
                  </CardDescription>

                  <div>
                    <Figure>{pacientesAtendidos}</Figure>
                  </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6">
                  <Chart data={pacientesPorMes.map(item => ({
                    name: item.name,
                    value: Math.round(item.value * (pacientesAtendidos / totalPacientes || 0))
                  }))} />
                </CardContent>
              </Card>
            </MagicBento>

            {/* Magic Bento demo card */}
            <MagicBento
              variant="overlay"
              enableSpotlight
              enableStars      
              clickEffect
              glowColor="0, 100, 255"
              className="w-full h-full"
              style={{borderRadius: '12px'}}
            >
              <Card className="w-full h-full">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className={'flex items-center gap-2.5 text-lg md:text-xl'}>
                    <span>Pacientes Pendientes</span>
                    <Trend trend={pacientesPendientes > pacientesAtendidos ? 'down' : 'up'}>
                      {pacientesPendientes > 0 && totalPacientes > 0 ?
                        `${Math.round((pacientesPendientes / totalPacientes) * 100)}%` : '0%'}
                    </Trend>
                  </CardTitle>

                  <CardDescription className="text-sm">
                    <span>Pacientes con estado "pendiente"</span>
                  </CardDescription>

                  <div>
                    <Figure>{pacientesPendientes}</Figure>
                  </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6">
                  <Chart data={pacientesPorMes.map(item => ({
                    name: item.name,
                    value: Math.round(item.value * (pacientesPendientes / totalPacientes || 0))
                  }))} />
                </CardContent>
              </Card>
            </MagicBento>


            <MagicBento 
              variant="overlay" 
              enableSpotlight 
              enableStars 
              clickEffect 
              glowColor="0, 100, 255"
              className="w-full h-full"
            >
              <Card className="w-full h-full">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className={'flex items-center gap-2.5 text-lg md:text-xl'}>
                    <span>Nuevos Pacientes</span>
                    <Trend trend={comparacionMensual > 0 ? 'up' : 'down'}>
                      {comparacionMensual > 0 ? `+${comparacionMensual}%` : `${comparacionMensual}%`}
                    </Trend>
                  </CardTitle>

                  <CardDescription className="text-sm">
                    <span>Pacientes registrados este mes</span>
                  </CardDescription>

                  <div>
                    <Figure>{pacientesPorMes.length > 0 ? pacientesPorMes[pacientesPorMes.length - 1].value : 0}</Figure>
                  </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6">
                  <Chart data={pacientesPorMes} />
                </CardContent>
              </Card>
            </MagicBento>
          </div>

          {chartVisibility.pacientesPorMes && (
            <PacientesPorMesChart data={pacientesPorMes} />
          )}

          {chartVisibility.estadoPacientes && (
            <EstadoPacientesChart data={pacientesPorEstado} />
          )}

          {chartVisibility.pacientesActivos && (
            <PacientesActivosChart data={activosPorMes} />
          )}

          {chartVisibility.pacientesDestacados && (
            <div className="w-full">
              <Card className="w-full">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl">Pacientes Destacados</CardTitle>
                  <CardDescription className="text-sm">Mostrando los pacientes más recientes</CardDescription>
                </CardHeader>

                <CardContent className="p-4 md:p-6 overflow-x-auto">
                  <PacientesTable pacientes={pacientes.slice(0, 10)} />
                </CardContent>
              </Card>
            </div>
          )}
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
    <ChartContainer config={chartConfig} className="w-full h-full min-h-[10vh]">
      <LineChart data={props.data} width={undefined} height={undefined}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: '0.7rem' }}
          height={30}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Line
          dataKey="value"
          type="natural"
          stroke="var(--color-pacientes)"
          strokeWidth={2}
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
    <MagicBento variant="overlay" enableSpotlight enableStars clickEffect glowColor="0, 100, 255"> <Card>
      <CardHeader>
        <CardTitle>Pacientes por Mes</CardTitle>
        <CardDescription>
          Mostrando el número de pacientes registrados por mes
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer className={'h-64 w-full'} config={chartConfig}>
          <AreaChart data={data}>
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
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
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

      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {data.length >= 2 && ((data[data.length - 1]?.value || 0) > (data[data.length - 2]?.value || 0)) ? (
                <>Tendencia al alza este mes <TrendingUp className="h-4 w-4" /></>
              ) : (
                <>Tendencia a la baja este mes <ArrowDown className="h-4 w-4" /></>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Últimos 8 meses
            </div>
          </div>
        </div>
      </CardFooter>
    </Card></MagicBento>

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
    <MagicBento variant="overlay" enableSpotlight enableStars clickEffect glowColor="0, 100, 255">
      <Card>
        <CardHeader>
          <CardTitle>Estado de Pacientes</CardTitle>
          <CardDescription>
            Distribución de pacientes por estado
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ChartContainer className={'h-64 w-full'} config={chartConfig}>
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
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
    <MagicBento variant="overlay" enableSpotlight enableStars enableBorderGlow clickEffect glowColor="0, 0, 25">
      <Card>
        <CardHeader>
          <CardTitle>Pacientes Activos por Mes</CardTitle>
          <CardDescription>Conteo de pacientes con estado "activo" por mes</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className={'h-64 w-full'} config={chartConfig}>
            <AreaChart data={data}>
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

// Estilos responsivos con media queries
const responsiveStyles = {
  tableContainer: 'w-full overflow-x-auto',
  table: 'min-w-full',
  tableHeader: 'text-xs md:text-sm',
  tableCell: 'text-xs md:text-sm py-2 md:py-3',
  badge: 'text-xs whitespace-nowrap',
};

function PacientesTable({ pacientes }: { pacientes: Paciente[] }) {
  return (
    <div className={responsiveStyles.tableContainer}>
      <Table className={responsiveStyles.table}>
        <TableHeader>
          <TableRow>
            <TableHead className={responsiveStyles.tableHeader}>Paciente</TableHead>
            <TableHead className={responsiveStyles.tableHeader}>Edad</TableHead>
            <TableHead className={responsiveStyles.tableHeader}>Fecha de Cita</TableHead>
            <TableHead className={responsiveStyles.tableHeader}>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pacientes.map((paciente) => (
            <TableRow key={paciente.id}>
              <TableCell className={`flex flex-col ${responsiveStyles.tableCell}`}>
                <span>{`${paciente.nombre} ${paciente.apellido}`}</span>
                <span className={'text-muted-foreground text-xs md:text-sm'}>
                  {paciente.telefono}
                </span>
              </TableCell>
              <TableCell className={responsiveStyles.tableCell}>{paciente.edad}</TableCell>
              <TableCell className={responsiveStyles.tableCell}>{new Date(paciente.fecha_de_cita).toLocaleDateString('es-ES')}</TableCell>
              <TableCell className={responsiveStyles.tableCell}>
                <BadgeWithTrend
                  trend={
                    paciente.estado === 'atendido'
                      ? 'up'
                      : paciente.estado === 'pendiente'
                        ? 'stale'
                        : 'down'
                  }
                  className={responsiveStyles.badge}
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

function BadgeWithTrend(props: React.PropsWithChildren<{ trend: string, className?: string }>) {
  const colorClassName = useMemo(() => {
    switch (props.trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-destructive';
      case 'stale':
        return 'text-orange-500';
    }
  }, [props.trend]);

  // Mejora de accesibilidad: añadir aria-label para lectores de pantalla
  const trendLabel = props.trend === 'up' ? 'positivo' : props.trend === 'down' ? 'negativo' : 'estable';
  
  return (
    <Badge
      variant={'outline'}
      className={`border-transparent px-1.5 font-normal ${props.className || ''}`}
      aria-label={`Estado ${trendLabel}`}
    >
      <span className={colorClassName}>{props.children}</span>
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

export function VisitorsChart() {
  const chartData = useMemo(
    () => [
      { date: '2024-04-01', desktop: 222, mobile: 150 },
      { date: '2024-04-02', desktop: 97, mobile: 180 },
      { date: '2024-04-03', desktop: 167, mobile: 120 },
      { date: '2024-04-04', desktop: 242, mobile: 260 },
      { date: '2024-04-05', desktop: 373, mobile: 290 },
      { date: '2024-04-06', desktop: 301, mobile: 340 },
      { date: '2024-04-07', desktop: 245, mobile: 180 },
      { date: '2024-04-08', desktop: 409, mobile: 320 },
      { date: '2024-04-09', desktop: 59, mobile: 110 },
      { date: '2024-04-10', desktop: 261, mobile: 190 },
      { date: '2024-04-11', desktop: 327, mobile: 350 },
      { date: '2024-04-12', desktop: 292, mobile: 210 },
      { date: '2024-04-13', desktop: 342, mobile: 380 },
      { date: '2024-04-14', desktop: 137, mobile: 220 },
      { date: '2024-04-15', desktop: 120, mobile: 170 },
      { date: '2024-04-16', desktop: 138, mobile: 190 },
      { date: '2024-04-17', desktop: 446, mobile: 360 },
      { date: '2024-04-18', desktop: 364, mobile: 410 },
      { date: '2024-04-19', desktop: 243, mobile: 180 },
      { date: '2024-04-20', desktop: 89, mobile: 150 },
      { date: '2024-04-21', desktop: 137, mobile: 200 },
      { date: '2024-04-22', desktop: 224, mobile: 170 },
      { date: '2024-04-23', desktop: 138, mobile: 230 },
      { date: '2024-04-24', desktop: 387, mobile: 290 },
      { date: '2024-04-25', desktop: 215, mobile: 250 },
      { date: '2024-04-26', desktop: 75, mobile: 130 },
      { date: '2024-04-27', desktop: 383, mobile: 420 },
      { date: '2024-04-28', desktop: 122, mobile: 180 },
      { date: '2024-04-29', desktop: 315, mobile: 240 },
      { date: '2024-04-30', desktop: 454, mobile: 380 },
      { date: '2024-05-01', desktop: 165, mobile: 220 },
      { date: '2024-05-02', desktop: 293, mobile: 310 },
      { date: '2024-05-03', desktop: 247, mobile: 190 },
      { date: '2024-05-04', desktop: 385, mobile: 420 },
      { date: '2024-05-05', desktop: 481, mobile: 390 },
      { date: '2024-05-06', desktop: 498, mobile: 520 },
      { date: '2024-05-07', desktop: 388, mobile: 300 },
      { date: '2024-05-08', desktop: 149, mobile: 210 },
      { date: '2024-05-09', desktop: 227, mobile: 180 },
      { date: '2024-05-10', desktop: 293, mobile: 330 },
      { date: '2024-05-11', desktop: 335, mobile: 270 },
      { date: '2024-05-12', desktop: 197, mobile: 240 },
      { date: '2024-05-13', desktop: 197, mobile: 160 },
      { date: '2024-05-14', desktop: 448, mobile: 490 },
      { date: '2024-05-15', desktop: 473, mobile: 380 },
      { date: '2024-05-16', desktop: 338, mobile: 400 },
      { date: '2024-05-17', desktop: 499, mobile: 420 },
      { date: '2024-05-18', desktop: 315, mobile: 350 },
      { date: '2024-05-19', desktop: 235, mobile: 180 },
      { date: '2024-05-20', desktop: 177, mobile: 230 },
      { date: '2024-05-21', desktop: 82, mobile: 140 },
      { date: '2024-05-22', desktop: 81, mobile: 120 },
      { date: '2024-05-23', desktop: 252, mobile: 290 },
      { date: '2024-05-24', desktop: 294, mobile: 220 },
      { date: '2024-05-25', desktop: 201, mobile: 250 },
      { date: '2024-05-26', desktop: 213, mobile: 170 },
      { date: '2024-05-27', desktop: 420, mobile: 460 },
      { date: '2024-05-28', desktop: 233, mobile: 190 },
      { date: '2024-05-29', desktop: 78, mobile: 130 },
      { date: '2024-05-30', desktop: 340, mobile: 280 },
      { date: '2024-05-31', desktop: 178, mobile: 230 },
      { date: '2024-06-01', desktop: 178, mobile: 200 },
      { date: '2024-06-02', desktop: 470, mobile: 410 },
      { date: '2024-06-03', desktop: 103, mobile: 160 },
      { date: '2024-06-04', desktop: 439, mobile: 380 },
      { date: '2024-06-05', desktop: 88, mobile: 140 },
      { date: '2024-06-06', desktop: 294, mobile: 250 },
      { date: '2024-06-07', desktop: 323, mobile: 370 },
      { date: '2024-06-08', desktop: 385, mobile: 320 },
      { date: '2024-06-09', desktop: 438, mobile: 480 },
      { date: '2024-06-10', desktop: 155, mobile: 200 },
      { date: '2024-06-11', desktop: 92, mobile: 150 },
      { date: '2024-06-12', desktop: 492, mobile: 420 },
      { date: '2024-06-13', desktop: 81, mobile: 130 },
      { date: '2024-06-14', desktop: 426, mobile: 380 },
      { date: '2024-06-15', desktop: 307, mobile: 350 },
      { date: '2024-06-16', desktop: 371, mobile: 310 },
      { date: '2024-06-17', desktop: 475, mobile: 520 },
      { date: '2024-06-18', desktop: 107, mobile: 170 },
      { date: '2024-06-19', desktop: 341, mobile: 290 },
      { date: '2024-06-20', desktop: 408, mobile: 450 },
      { date: '2024-06-21', desktop: 169, mobile: 210 },
      { date: '2024-06-22', desktop: 317, mobile: 270 },
      { date: '2024-06-23', desktop: 480, mobile: 530 },
      { date: '2024-06-24', desktop: 132, mobile: 180 },
      { date: '2024-06-25', desktop: 141, mobile: 190 },
      { date: '2024-06-26', desktop: 434, mobile: 380 },
      { date: '2024-06-27', desktop: 448, mobile: 490 },
      { date: '2024-06-28', desktop: 149, mobile: 200 },
      { date: '2024-06-29', desktop: 103, mobile: 160 },
      { date: '2024-06-30', desktop: 446, mobile: 400 },
    ],
    [],
  );

  const chartConfig = {
    visitors: {
      label: 'Visitors',
    },
    desktop: {
      label: 'Desktop',
      color: 'var(--chart-1)',
    },
    mobile: {
      label: 'Mobile',
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitors</CardTitle>
        <CardDescription>
          Showing total visitors for the last 6 months
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer className={'h-64 w-full'} config={chartConfig}>
          <AreaChart accessibilityLayer data={chartData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              January - June 2024
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export function PageViewsChart() {
  const [activeChart, setActiveChart] =
    useState<keyof typeof chartConfig>('desktop');

  const chartData = [
    { date: '2024-04-01', desktop: 222, mobile: 150 },
    { date: '2024-04-02', desktop: 97, mobile: 180 },
    { date: '2024-04-03', desktop: 167, mobile: 120 },
    { date: '2024-04-04', desktop: 242, mobile: 260 },
    { date: '2024-04-05', desktop: 373, mobile: 290 },
    { date: '2024-04-06', desktop: 301, mobile: 340 },
    { date: '2024-04-07', desktop: 245, mobile: 180 },
    { date: '2024-04-08', desktop: 409, mobile: 320 },
    { date: '2024-04-09', desktop: 59, mobile: 110 },
    { date: '2024-04-10', desktop: 261, mobile: 190 },
    { date: '2024-04-11', desktop: 327, mobile: 350 },
    { date: '2024-04-12', desktop: 292, mobile: 210 },
    { date: '2024-04-13', desktop: 342, mobile: 380 },
    { date: '2024-04-14', desktop: 137, mobile: 220 },
    { date: '2024-04-15', desktop: 120, mobile: 170 },
    { date: '2024-04-16', desktop: 138, mobile: 190 },
    { date: '2024-04-17', desktop: 446, mobile: 360 },
    { date: '2024-04-18', desktop: 364, mobile: 410 },
    { date: '2024-04-19', desktop: 243, mobile: 180 },
    { date: '2024-04-20', desktop: 89, mobile: 150 },
    { date: '2024-04-21', desktop: 137, mobile: 200 },
    { date: '2024-04-22', desktop: 224, mobile: 170 },
    { date: '2024-04-23', desktop: 138, mobile: 230 },
    { date: '2024-04-24', desktop: 387, mobile: 290 },
    { date: '2024-04-25', desktop: 215, mobile: 250 },
    { date: '2024-04-26', desktop: 75, mobile: 130 },
    { date: '2024-04-27', desktop: 383, mobile: 420 },
    { date: '2024-04-28', desktop: 122, mobile: 180 },
    { date: '2024-04-29', desktop: 315, mobile: 240 },
    { date: '2024-04-30', desktop: 454, mobile: 380 },
    { date: '2024-05-01', desktop: 165, mobile: 220 },
    { date: '2024-05-02', desktop: 293, mobile: 310 },
    { date: '2024-05-03', desktop: 247, mobile: 190 },
    { date: '2024-05-04', desktop: 385, mobile: 420 },
    { date: '2024-05-05', desktop: 481, mobile: 390 },
    { date: '2024-05-06', desktop: 498, mobile: 520 },
    { date: '2024-05-07', desktop: 388, mobile: 300 },
    { date: '2024-05-08', desktop: 149, mobile: 210 },
    { date: '2024-05-09', desktop: 227, mobile: 180 },
    { date: '2024-05-10', desktop: 293, mobile: 330 },
    { date: '2024-05-11', desktop: 335, mobile: 270 },
    { date: '2024-05-12', desktop: 197, mobile: 240 },
    { date: '2024-05-13', desktop: 197, mobile: 160 },
    { date: '2024-05-14', desktop: 448, mobile: 490 },
    { date: '2024-05-15', desktop: 473, mobile: 380 },
    { date: '2024-05-16', desktop: 338, mobile: 400 },
    { date: '2024-05-17', desktop: 499, mobile: 420 },
    { date: '2024-05-18', desktop: 315, mobile: 350 },
    { date: '2024-05-19', desktop: 235, mobile: 180 },
    { date: '2024-05-20', desktop: 177, mobile: 230 },
    { date: '2024-05-21', desktop: 82, mobile: 140 },
    { date: '2024-05-22', desktop: 81, mobile: 120 },
    { date: '2024-05-23', desktop: 252, mobile: 290 },
    { date: '2024-05-24', desktop: 294, mobile: 220 },
    { date: '2024-05-25', desktop: 201, mobile: 250 },
    { date: '2024-05-26', desktop: 213, mobile: 170 },
    { date: '2024-05-27', desktop: 420, mobile: 460 },
    { date: '2024-05-28', desktop: 233, mobile: 190 },
    { date: '2024-05-29', desktop: 78, mobile: 130 },
    { date: '2024-05-30', desktop: 340, mobile: 280 },
    { date: '2024-05-31', desktop: 178, mobile: 230 },
    { date: '2024-06-01', desktop: 178, mobile: 200 },
    { date: '2024-06-02', desktop: 470, mobile: 410 },
    { date: '2024-06-03', desktop: 103, mobile: 160 },
    { date: '2024-06-04', desktop: 439, mobile: 380 },
    { date: '2024-06-05', desktop: 88, mobile: 140 },
    { date: '2024-06-06', desktop: 294, mobile: 250 },
    { date: '2024-06-07', desktop: 323, mobile: 370 },
    { date: '2024-06-08', desktop: 385, mobile: 320 },
    { date: '2024-06-09', desktop: 438, mobile: 480 },
    { date: '2024-06-10', desktop: 155, mobile: 200 },
    { date: '2024-06-11', desktop: 92, mobile: 150 },
    { date: '2024-06-12', desktop: 492, mobile: 420 },
    { date: '2024-06-13', desktop: 81, mobile: 130 },
    { date: '2024-06-14', desktop: 426, mobile: 380 },
    { date: '2024-06-15', desktop: 307, mobile: 350 },
    { date: '2024-06-16', desktop: 371, mobile: 310 },
    { date: '2024-06-17', desktop: 475, mobile: 520 },
    { date: '2024-06-18', desktop: 107, mobile: 170 },
    { date: '2024-06-19', desktop: 341, mobile: 290 },
    { date: '2024-06-20', desktop: 408, mobile: 450 },
    { date: '2024-06-21', desktop: 169, mobile: 210 },
    { date: '2024-06-22', desktop: 317, mobile: 270 },
    { date: '2024-06-23', desktop: 480, mobile: 530 },
    { date: '2024-06-24', desktop: 132, mobile: 180 },
    { date: '2024-06-25', desktop: 141, mobile: 190 },
    { date: '2024-06-26', desktop: 434, mobile: 380 },
    { date: '2024-06-27', desktop: 448, mobile: 490 },
    { date: '2024-06-28', desktop: 149, mobile: 200 },
    { date: '2024-06-29', desktop: 103, mobile: 160 },
    { date: '2024-06-30', desktop: 446, mobile: 400 },
  ];

  const chartConfig = {
    views: {
      label: 'Page Views',
    },
    desktop: {
      label: 'Desktop',
      color: 'var(--chart-1)',
    },
    mobile: {
      label: 'Mobile',
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  const total = useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
    }),
    [chartData],
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Page Views</CardTitle>

          <CardDescription>
            Showing total visitors for the last 3 months
          </CardDescription>
        </div>

        <div className="flex">
          {['desktop', 'mobile'].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-muted-foreground text-xs">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-64 w-full"
        >
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
