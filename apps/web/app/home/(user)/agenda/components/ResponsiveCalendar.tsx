"use client";
import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@kit/ui/dialog';
import { Separator } from '@kit/ui/separator';
import { Avatar, AvatarFallback } from '@kit/ui/avatar';
import { useRouter } from 'next/navigation';

// Tipo para los pacientes
interface Paciente {
  id: string;
  user_id: string;
  nombre: string | null;
  apellido: string | null;
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
  sintomas_visuales: string | null;
  ultimo_examen_visual: string | null;
  uso_lentes: boolean | null;
  tipos_de_lentes: string | null;
  tiempo_de_uso_lentes: string | null;
  cirujias: boolean | null;
  traumatismos_oculares: boolean | null;
  nombre_traumatismos_oculares: string | null;
  antecedentes_visuales_familiares: string | null;
  antecedente_familiar_salud: string | null;
  habitos_visuales: string | null;
  salud_general: string | null;
  medicamento_actual: string | null;
}

export default function ResponsiveCalendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<number>(0);
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  // Detectar si es un dispositivo móvil y configurar interacciones táctiles
  const checkIsMobile = useCallback(() => {
    const isMobileDevice = window.innerWidth < 768;
    setIsMobile(isMobileDevice);
    
    // Configurar interacciones táctiles específicas para móviles
    if (isMobileDevice) {
      // Asegurar que los elementos táctiles tengan suficiente área de toque (mínimo 44x44px)
      const style = document.createElement('style');
      style.innerHTML = `
        .calendar-day-mobile { 
          min-height: 44px;
          min-width: 44px;
        }
        .calendar-touch-target {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Detectar cambios en el tamaño de la ventana
  useEffect(() => {
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [checkIsMobile]);

  // Inicializar el mes actual
  useEffect(() => {
    setCurrentMonth(currentDate.getMonth());
  }, [currentDate]);

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

      // Obtener todos los pacientes del usuario con optimización
      const { data: pacientesData, error: pacientesError } = await supabase
        .from('pacientes' as any)
        .select('id, user_id, nombre, edad, sexo, telefono, domicilio, motivo_consulta, diagnostico_id, estado, fecha_de_cita, created_at')
        .eq('user_id', userData.user.id)
        .order('fecha_de_cita', { ascending: true });

      if (pacientesError) {
        console.error('Error fetching pacientes:', pacientesError);
        setError('Error al cargar las citas de pacientes');
        return;
      }

      const pacientesList = (pacientesData as unknown as Paciente[]) || [];
      setPacientes(pacientesList);
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
      // Verificar cita programada en pacientes
      if (paciente.fecha_de_cita) {
        const citaDate = new Date(paciente.fecha_de_cita);
        citaDate.setHours(0, 0, 0, 0);
        return citaDate.getTime() === localDate.getTime();
      }
      return false;
    });
  };

  // useEffect para cargar datos al montar el componente
  useEffect(() => {
    fetchPacientes();
  }, []);

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

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(monthIndex);
      return newDate;
    });
    setShowMonthSelector(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);

  // Renderizado para dispositivos móviles (estilo de la imagen de referencia)
  const renderMobileCalendar = () => {
    return (
      <div className="flex flex-col h-full bg-purple-900 text-white p-4">
        {/* Header con navegación */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-medium">Agenda</h1>
          <button className="text-sm font-medium">DONE</button>
        </div>

        {/* Selector de mes y año con botones de navegación */}
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-purple-800 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setShowMonthSelector(!showMonthSelector)}
              className="text-2xl font-bold flex items-center"
            >
              {monthNames[currentDate.getMonth()]}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <span className="text-lg text-purple-300">{currentDate.getFullYear()}</span>
          </div>
          
          <button 
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-purple-800 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Selector de mes (desplegable) */}
        {showMonthSelector && (
          <div className="absolute top-32 left-4 right-4 bg-purple-800 rounded-lg p-4 z-10">
            <div className="grid grid-cols-3 gap-4">
              {monthNames.map((month, index) => (
                <button
                  key={month}
                  onClick={() => selectMonth(index)}
                  className={`p-2 rounded-lg ${
                    index === currentMonth ? 'bg-purple-600' : 'hover:bg-purple-700'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Días de la semana */}
        <div className="grid grid-cols-7 mb-2">
          {['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].map((day) => (
            <div key={day} className="text-center text-xs text-purple-300 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendario del mes actual */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {days.slice(0, 35).map((day, index) => {
            const hasCitas = getCitasDelDia(day.date).length > 0;
            const isSelected = isToday(day.date);
            
            return (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <button
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm relative
                      ${!day.isCurrentMonth ? 'text-purple-500' : ''}
                      ${isSelected ? 'bg-purple-600 text-white' : ''}
                      ${hasCitas && !isSelected ? 'font-bold' : ''}
                    `}
                  >
                    {day.date.getDate()}
                    {hasCitas && (
                      <div className="absolute bottom-1 flex justify-center space-x-0.5">
                        <div className="w-1.5 h-1.5 bg-purple-300 rounded-full" />
                      </div>
                    )}
                  </button>
                </DialogTrigger>
                {hasCitas && (
                  <DialogContent className="sm:max-w-[425px] bg-purple-900 text-white border-purple-700">
                    <DialogHeader>
                      <DialogTitle>
                        Citas del {day.date.getDate()} de {monthNames[day.date.getMonth()]}
                      </DialogTitle>
                      <DialogDescription className="text-purple-300">
                        {getCitasDelDia(day.date).length} {getCitasDelDia(day.date).length === 1 ? 'paciente' : 'pacientes'} agendados
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                      {getCitasDelDia(day.date).map((paciente) => (
                        <Card key={paciente.id} className="bg-purple-800 border-purple-700">
                          <CardHeader className="p-3">
                            <CardTitle className="flex items-center space-x-2 text-base">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-purple-600 text-xs">
                                  {paciente.nombre ? paciente.nombre.charAt(0) : ''}
                                </AvatarFallback>
                              </Avatar>
                              <span>{paciente.nombre || ''}</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-0 text-sm text-purple-200">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-xs text-purple-300">Edad</p>
                                <p>{paciente.edad || 'N/A'} años</p>
                              </div>
                              <div>
                                <p className="text-xs text-purple-300">Teléfono</p>
                                <p>{paciente.telefono || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-purple-300">Motivo</p>
                                <p>{paciente.motivo_consulta || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-purple-300">Motivo</p>
                              <p>{paciente.motivo_consulta || 'Consulta general'}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                )}
              </Dialog>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizado para escritorio (reutilizando el código existente)
  const renderDesktopCalendar = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Header del calendario */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Hoy
            </button>
          </div>
          <h2 className="text-xl font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar paciente..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Vista del mes */}
        <div className="flex-1 flex flex-col">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {dayNames.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 flex-1">
            {days.map((day, index) => {
              const citasDelDia = getCitasDelDia(day.date);
              const hasCitas = citasDelDia.length > 0;
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b border-gray-200 last:border-r-0 relative 
                    ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'} 
                    ${hasCitas ? 'hover:bg-blue-50' : 'hover:bg-gray-100'} 
                    transition-colors`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-sm rounded-full 
                        ${isToday(day.date)
                          ? 'bg-blue-600 text-white font-semibold'
                          : day.isCurrentMonth
                          ? 'text-gray-700'
                          : 'text-gray-400'
                        }`}
                    >
                      {day.date.getDate()}
                    </div>
                    
                    {/* Indicador de citas */}
                    {hasCitas && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                    )}
                  </div>
                  
                  {/* Espacio para eventos del día */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {/* Mostrar citas de pacientes */}
                    {citasDelDia.map((paciente) => (
                      <Dialog key={paciente.id}>
                        <DialogTrigger asChild>
                          <div 
                            className="bg-blue-500 text-white text-xs px-2 py-1 rounded text-center cursor-pointer hover:bg-blue-600 transition-colors"
                            onContextMenu={(e) => {
                              e.preventDefault();
                              router.push(`/home/historialclinico/${paciente.id}`);
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <Avatar className="w-4 h-4">
                                <AvatarFallback className="text-xs bg-blue-400">
                                  {paciente.nombre ? paciente.nombre.charAt(0) : ''}{paciente.apellido ? paciente.apellido.charAt(0) : ''}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{`${paciente.nombre || ''} ${paciente.apellido || ''}`}</span>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {paciente.nombre ? paciente.nombre.charAt(0) : ''}{paciente.apellido ? paciente.apellido.charAt(0) : ''}
                                </AvatarFallback>
                              </Avatar>
                              <span>{paciente.nombre || ''} {paciente.apellido || ''}</span>
                            </DialogTitle>
                            <DialogDescription>
                              Información del paciente y cita médica
                            </DialogDescription>
                          </DialogHeader>
                          <Card>
                            <CardHeader className="p-4">
                              <CardTitle>Detalles de la Cita</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Edad</p>
                                  <p>{paciente.edad || 'No especificada'} años</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Sexo</p>
                                  <Badge variant="secondary">{paciente.sexo || 'No especificado'}</Badge>
                                </div>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-sm font-medium text-gray-500">Domicilio</p>
                                <p>{paciente.domicilio || 'No especificado'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                                <p>{paciente.telefono || 'No especificado'}</p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-sm font-medium text-gray-500">Motivo de Consulta</p>
                                <p>{paciente.motivo_consulta || 'Consulta general'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Próxima visita</p>
                                <p>No programada</p>
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
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Mostrar mensaje de carga
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Cargando calendario...</p>
      </div>
    );
  }

  // Mostrar mensaje de error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button 
          onClick={fetchPacientes} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  // Mostrar mensaje si no hay datos
  if (pacientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas programadas</h3>
        <p className="text-gray-500 mb-4">Aún no hay pacientes con citas en el calendario.</p>
      </div>
    );
  }

  // Renderizado condicional basado en el tamaño de pantalla
  return isMobile ? renderMobileCalendar() : renderDesktopCalendar();
}