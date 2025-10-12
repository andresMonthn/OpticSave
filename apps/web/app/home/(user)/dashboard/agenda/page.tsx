"use client";
import { TeamAccountLayoutPageHeader } from '../../../[account]/_components/team-account-layout-page-header';
import { Trans } from '@kit/ui/trans';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@kit/ui/dialog';
import { Separator } from '@kit/ui/separator';
import { Avatar, AvatarFallback } from '@kit/ui/avatar';

// Tipo para los pacientes - usando la definición correcta
interface Paciente {
  id: string;
  user_id: string;
  nombre: string;
  apellido: string;
  edad: number | null;
  sexo: string | null;
  domicilio: string | null;
  motivo_consulta: string | null;
  telefono: string | null;
  fecha_de_cita: string | null;
  created_at: string;
  updated_at: string;
  estado?: string | null;
}

// Nueva interfaz para diagnosticos
interface Diagnostico {
  id: string;
  paciente_id: string;
  proxima_visita: string | null;
  created_at?: string;
}

export default function Agenda() {
  const account = useParams().account as string;
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  // Estado para mapear paciente_id -> proxima_visita
  const [diagnosticosMap, setDiagnosticosMap] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Paciente[]>([]);

  const supabase = getSupabaseBrowserClient();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Función para obtener pacientes con citas
  const fetchPacientes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar autenticación
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('Usuario no autenticado');
        return;
      }

      // Obtener todos los pacientes del usuario (sin filtrar por fecha_de_cita)
      const { data: pacientesData, error: pacientesError } = await supabase
        .from('pacientes' as any)
        .select('*')
        .eq('user_id', userData.user.id);

      if (pacientesError) {
        console.error('Error fetching pacientes:', pacientesError);
        setError('Error al cargar las citas de pacientes');
        return;
      }

      const pacientesList = (pacientesData as unknown as Paciente[]) || [];
      setPacientes(pacientesList);

      // Obtener diagnosticos de esos pacientes para leer su proxima_visita
      const pacienteIds = pacientesList.map((p) => p.id);
      if (pacienteIds.length > 0) {
        const { data: diagnosticosData, error: diagnosticosError } = await supabase
          .from('diagnostico' as any)
          .select('id,paciente_id,proxima_visita,created_at')
          .in('paciente_id', pacienteIds)
          .not('proxima_visita', 'is', null)
          .order('created_at', { ascending: false });

        if (diagnosticosError) {
          console.error('Error fetching diagnosticos:', diagnosticosError);
        } else {
          const map: Record<string, string> = {};
          (diagnosticosData as any[])?.forEach((d) => {
            // Guardar la más reciente por paciente (lista ya viene ordenada desc por created_at)
            if (!map[d.paciente_id] && d.proxima_visita) {
              map[d.paciente_id] = d.proxima_visita as string;
            }
          });
          setDiagnosticosMap(map);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener citas de un día específico
  const getCitasDelDia = (date: Date) => {
    // Crear una fecha local para evitar problemas de zona horaria
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    
    return pacientes.filter(paciente => {
      let coincide = false;
      
      // Verificar cita programada en pacientes
      if (paciente.fecha_de_cita) {
        const citaDate = new Date(paciente.fecha_de_cita);
        citaDate.setHours(0, 0, 0, 0);
        coincide = coincide || (citaDate.getTime() === localDate.getTime());
      }

      // Verificar próxima visita desde diagnosticos
      const proxima = diagnosticosMap[paciente.id];
      if (proxima) {
        const proxDate = new Date(proxima);
        proxDate.setHours(0, 0, 0, 0);
        coincide = coincide || (proxDate.getTime() === localDate.getTime());
      }

      return coincide;
    });
  };

  // Función para buscar pacientes
  const searchPacientes = (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    const normalizedTerm = term.toLowerCase().trim();
    const results = pacientes.filter(paciente => 
      paciente.nombre.toLowerCase().includes(normalizedTerm) || 
      paciente.apellido.toLowerCase().includes(normalizedTerm) ||
      (paciente.telefono && paciente.telefono.includes(normalizedTerm))
    );
    
    setSearchResults(results);
  };

  // useEffect para cargar datos al montar el componente
  useEffect(() => {
    fetchPacientes();
  }, []);
  
  // useEffect para actualizar resultados de búsqueda cuando cambia el término
  useEffect(() => {
    searchPacientes(searchTerm);
  }, [searchTerm, pacientes]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    // Días del siguiente mes para completar la grilla
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);
  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 1);
      } else {
        newDate.setDate(prev.getDate() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Mini calendario para el sidebar
  const renderMiniCalendar = () => {
    const miniDays = getDaysInMonth(currentDate);
    return (
      <div className=" rounded-lg border border-gray-200 p-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-sm font-medium text-gray-600">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
            <div key={index} className="text-center text-gray-500 font-medium py-1">
              {day}
            </div>
          ))}
          {miniDays.slice(0, 35).map((day, index) => (
            <button
              key={index}
              className={`w-6 h-6 text-xs rounded-full flex items-center justify-center hover:bg-gray-100 ${
                isToday(day.date)
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-500'
              }`}
            >
              {day.date.getDate()}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => (
    <div className="flex h-full ">
      {/* Calendario principal */}
      <div className="flex-1 flex flex-col">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dayNames.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0 bg-transparent">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 flex-1">
          {days.map((day, index) => (
            <div
               key={index}
               className="min-h-[120px] p-2 border-r border-b border-gray-200 last:border-r-0 cursor-pointer relative hover:bg-gray-500 hover:bg-opacity-50 transition-colors"
              onClick={() => {
                console.log('Crear evento para:', day.date);
              }}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center text-sm rounded-full mb-1 ${
                  isToday(day.date)
                    ? 'bg-blue-600 text-white font-semibold'
                    : day.isCurrentMonth
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
              >
                {day.date.getDate()}
              </div>
              {/* Espacio para eventos del día */}
              <div className="space-y-1">
                {/* Mostrar citas de pacientes */}
                {getCitasDelDia(day.date).map((paciente) => (
                  <Dialog key={paciente.id}>
                    <DialogTrigger asChild>
                      <div 
                        className="bg-blue-500 text-white text-xs px-2 py-1 rounded text-center cursor-pointer hover:bg-blue-600 transition-colors"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          router.push(`/home/dashboard/historialclinico/${paciente.id}`);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          <Avatar className="w-4 h-4">
                            <AvatarFallback className="text-xs bg-blue-400">
                              {paciente.nombre.charAt(0)}{paciente.apellido.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{paciente.nombre} {paciente.apellido}</span>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {paciente.nombre.charAt(0)}{paciente.apellido.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{paciente.nombre} {paciente.apellido}</span>
                        </DialogTitle>
                        <DialogDescription>
                          Información del paciente y cita médica
                        </DialogDescription>
                      </DialogHeader>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Detalles de la Cita</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Edad</p>
                              <p className="text-sm">{paciente.edad || 'No especificada'} años</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Sexo</p>
                              <Badge variant="secondary">{paciente.sexo || 'No especificado'}</Badge>
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Domicilio</p>
                            <p className="text-sm">{paciente.domicilio || 'No especificado'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Teléfono</p>
                            <p className="text-sm">{paciente.telefono || 'No especificado'}</p>
                          </div>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Motivo de Consulta</p>
                            <p className="text-sm">{paciente.motivo_consulta || 'Consulta general'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Próxima visita</p>
                            <p className="text-sm">{diagnosticosMap[paciente.id] ? new Date(diagnosticosMap[paciente.id] as string).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'No programada'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Estado</p>
                            <Badge variant={paciente.estado === 'activo' ? 'default' : 'secondary'}>
                              {paciente.estado || 'Pendiente'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 lg:space-y-6" style={{ height: 'calc(100vh - 160px)', margin: '50px' }}>
      <TeamAccountLayoutPageHeader
        account={account}
        title={<Trans i18nKey={'common:routes.dashboard'} />}
        description={<AppBreadcrumbs />}
      />
      
      <div className="flex h-[800px] rounded-lg shadow-sm border border-gray-200">
        {/* Sidebar izquierdo */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} border-r border-gray-200 bg-transparent transition-all duration-300 flex flex-col`}>
          {/* Header del sidebar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xl font-normal text-gray-700">Calendario</span>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {!sidebarCollapsed && (
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Input de búsqueda */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar pacientes..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              {/* Resultados de búsqueda */}
              {searchResults.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Resultados de búsqueda</h3>
                  <div className="space-y-2">
                    {searchResults.map((paciente) => (
                      <Card key={paciente.id} className="overflow-hidden">
                        <CardHeader className="p-3 pb-0">
                          <CardTitle className="text-sm flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {paciente.nombre.charAt(0)}{paciente.apellido.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{paciente.nombre} {paciente.apellido}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                          <div className="text-xs text-gray-500">
                            <div className="flex items-center space-x-1 mb-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Fecha de cita: {paciente.fecha_de_cita ? new Date(paciente.fecha_de_cita).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'No programada'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 8h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                              </svg>
                              <span>Próxima visita: {diagnosticosMap[paciente.id] ? new Date(diagnosticosMap[paciente.id] as string).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'No programada'}</span>
                            </div>
                            {paciente.telefono && (
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{paciente.telefono}</span>
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2 text-xs"
                            onClick={() => {
                              // Navegar a la fecha en el calendario: prioridad fecha_de_cita, luego proxima_visita
                              if (paciente.fecha_de_cita) {
                                setCurrentDate(new Date(paciente.fecha_de_cita));
                              } else if (diagnosticosMap[paciente.id]) {
                                setCurrentDate(new Date(diagnosticosMap[paciente.id] as string));
                              }
                            }}
                          >
                            Ver en calendario
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini calendario */}
              {renderMiniCalendar()}


            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          {/* Barra de herramientas superior */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {/* Navegación de fecha */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Mes anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Mes siguiente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Hoy
                </button>
              </div>

              {/* Título del mes */}
              <h2 className="text-2xl font-normal text-gray-600">
                {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              </h2>
            </div>

            {/* Controles de la derecha */}
            <div className="flex items-center space-x-2">
              {/* Barra de búsqueda */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar paciente"
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>



              {/* Botones de configuración */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Ayuda"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>


              </div>
            </div>
          </div>

          {/* Contenido del calendario */}
          <div className="flex-1 overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">Cargando citas...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-20">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{error}</span>
                  <button 
                    onClick={() => setError(null)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {renderMonthView()}
          </div>
        </div>

        {/* Dropdowns */}
        {showHelp && (
           <div className="absolute right-4 top-20 w-64 rounded-lg shadow-lg border bg-white z-50">
             <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">Ayuda del Calendario</h3>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Haz clic en un día para crear un evento</li>
                <li>• Usa las flechas para navegar entre meses</li>
                <li>• El botón "Hoy" te lleva al mes actual</li>
                <li>• Cambia entre vistas de día, semana y mes</li>
                <li>• Busca pacientes para ver sus citas</li>
              </ul>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}