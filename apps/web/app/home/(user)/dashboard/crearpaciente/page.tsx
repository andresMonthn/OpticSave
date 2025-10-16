"use client";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, RefreshCw, Calendar as CalendarIcon, Home, Users } from "lucide-react";
import { format, isSameDay, startOfDay, addDays } from "date-fns";
import { es, id } from "date-fns/locale";
import { useState, useEffect, useRef } from "react";
// Constante para monitorear la fecha actual
const FECHA_HOY = startOfDay(new Date());
// Importaciones de componentes UI desde @kit/ui
import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { Textarea } from "@kit/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { RadioGroup, RadioGroupItem } from "@kit/ui/radio-group";
import { Calendar } from "@kit/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@kit/ui/popover";
import { Switch } from "@kit/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@kit/ui/tooltip";
import { Badge } from "@kit/ui/badge";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";

// Inicializa Supabase


// Verificar si las variables de entorno están definidas

// Definición de la interfaz para el tipo Paciente
interface Paciente {
  id?: string;
  user_id?: string;
  nombre: string;
  apellido: string;
  edad?: number;
  sexo?: string;
  domicilio?: string;
  motivo_consulta?: string;
  diagnostico_id?: string;
  telefono?: string;
  fecha_de_cita?: string;
  created_at?: string;
  updated_at?: string;
  estado?: string;
}

// Interfaz para los campos de domicilio completo
interface DomicilioCompleto {
  calle: string;
  numero: string;
  interior: string;
  colonia: string;
}

// Interfaz para las citas
interface CitaInfo {
  fecha: Date;
  cantidadPacientes: number;
}

export default function CrearPacientePage() {
  const router = useRouter();

  // Referencias para los inputs
  const nombreRef = useRef<HTMLInputElement>(null);
  const apellidoRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  
  // Estado para el usuario actual
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estado para las alertas
  const [alertInfo, setAlertInfo] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });
  
  // Función para mostrar alertas
  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setAlertInfo({
      show: true,
      type,
      title,
      message
    });

    // Ocultar la alerta después de 3 segundos
    setTimeout(() => {
      setAlertInfo(prev => ({ ...prev, show: false }));
    }, 3000);
  };


  // Verificar usuario logueado al cargar el componente
  const supabase = getSupabaseBrowserClient();
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        console.log("Usuario logueado:", data.user.id);
        // Cargar citas existentes después de verificar el usuario
        obtenerCitasExistentes(data.user.id);
      } else if (error) {
        console.error("Error al verificar usuario:", error);
      }
    };
    checkUser();
  }, []);



  // Función para obtener las citas existentes
  const obtenerCitasExistentes = async (userId: string) => {
    setCargandoCitas(true);
    try {
      // Obtener pacientes con sus fechas de cita
      const { data, error } = await supabase
        .from('pacientes' as any)
        .select('fecha_de_cita')
        .eq('user_id', userId)
        .not('fecha_de_cita', 'is', null);
      
      if (error) {
        console.error("Error al obtener citas:", error);
        return;
      }
      
      // Procesar los datos para contar pacientes por fecha
      const citasPorFecha = new Map<string, number>();
      
      // Asegurarse de que data es un array y hacer type assertion
      const pacientes = (data as any[]) || [];
      
      pacientes.forEach(paciente => {
        if (paciente && paciente.fecha_de_cita) {
          const fecha = paciente.fecha_de_cita.split('T')[0]; // Formato YYYY-MM-DD
          citasPorFecha.set(fecha, (citasPorFecha.get(fecha) || 0) + 1);
        }
      });
      
      // Convertir a array de CitaInfo
      const citasInfoArray: CitaInfo[] = Array.from(citasPorFecha.entries()).map(
        ([fechaStr, cantidad]) => ({
          fecha: new Date(fechaStr),
          cantidadPacientes: cantidad
        })
      );
      
      setCitasInfo(citasInfoArray);
    } catch (err) {
      console.error("Error al procesar citas:", err);
    } finally {
      setCargandoCitas(false);
    }
  };
  
  // Estados para los campos del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaCita, setFechaCita] = useState<Date | undefined>(undefined);
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | undefined>(undefined);
  const [fechaNacimientoOpen, setFechaNacimientoOpen] = useState(false);
  
  // Estados para validación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [telefonoError, setTelefonoError] = useState<string | null>(null);
  
  // Estado para las citas existentes
  const [citasInfo, setCitasInfo] = useState<CitaInfo[]>([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  
  // Estado para el switch de domicilio
  const [domicilioCompleto, setDomicilioCompleto] = useState(false);
  const [domicilioFields, setDomicilioFields] = useState<DomicilioCompleto>({
    calle: "",
    numero: "",
    interior: "",
    colonia: ""
  });
  
  // Marcar campo como tocado
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };
  
  // Validación de teléfono
  const validateTelefono = (value: string) => {
    if (value && (value.length < 10 || value.length > 10)) {
      return "El teléfono debe tener exactamente 10 dígitos";
    }
    return null;
  };
  
  // Manejar cambio en el teléfono
  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo permitir dígitos
    setTelefono(value);
    const error = validateTelefono(value);
    setTelefonoError(error);
  };
  
  // Manejar cambio en los campos de domicilio completo
  const handleDomicilioFieldChange = (field: keyof DomicilioCompleto, value: string) => {
    setDomicilioFields({
      ...domicilioFields,
      [field]: value
    });
  };
  
  // Validación de formulario
  const isFormValid = 
    nombre.trim() !== "" && 
    apellido.trim() !== "" && 
    (telefono === "" || validateTelefono(telefono) === null);
  
  // Función para limpiar el formulario
  const limpiarFormulario = () => {
    setNombre("");
    setApellido("");
    setEdad("");
    setSexo("");
    setDomicilio("");
    setDomicilioCompleto(false);
    setDomicilioFields({
      calle: "",
      numero: "",
      interior: "",
      colonia: ""
    });
    setMotivoConsulta("");
    setTelefono("");
    setFechaCita(undefined);
    setError(null);
    setSuccess(false);
    setTouched({});
    setTelefonoError(null);
  };
  
  // Función para establecer la fecha actual
  const establecerFechaHoy = () => {
    setFechaCita(new Date());
  };
  
  // Función para manejar el envío del formulario
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const supabase = getSupabaseBrowserClient();

  // Validar campos requeridos
  if (nombre.trim() === "") {
    setError("El nombre es requerido");
    nombreRef.current?.focus();
    return;
  }
  
  if (apellido.trim() === "") {
    setError("El apellido es requerido");
    apellidoRef.current?.focus();
    return;
  }
  
  const telefonoErrorMsg = validateTelefono(telefono);
  if (telefono && telefonoErrorMsg) {
    setError(telefonoErrorMsg);
    telefonoRef.current?.focus();
    return;
  }

  setIsSubmitting(true);
  setError(null);
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
      setError("Debes iniciar sesión para crear un paciente");
      return;
    }
    // Preparar el domicilio según el tipo seleccionado
    let domicilioFinal = domicilio;
    if (domicilioCompleto) {
      domicilioFinal = `${domicilioFields.calle} ${domicilioFields.numero}${domicilioFields.interior ? ', Int. ' + domicilioFields.interior : ''}, Col. ${domicilioFields.colonia}`;
    }

    // Insertar en Supabase
    const { data, error: insertError } = await (supabase.from("pacientes" as any )as any)
      .insert([{
        user_id: user.id,
        nombre,
        apellido,
        edad: edad ? parseInt(edad) : undefined,
        fecha_nacimiento: fechaNacimiento ? fechaNacimiento.toISOString() : undefined,
        sexo,
        domicilio: domicilioFinal,
        motivo_consulta: motivoConsulta,
        telefono,
        fecha_de_cita: (fechaCita ? addDays(fechaCita, 1) : addDays(new Date(), 1)).toISOString(),
        estado: "pendiente",
      }]);
    
    if (insertError) {
      console.error("Error insertando paciente:", insertError);
      setError("No se pudo crear el paciente");
      return;
    }
    const pacienteId = (data as any)?.id as string | undefined;

    // Obtener el account_id del usuario para enviar la notificación (primera membresía encontrada)
    let accountId: string | undefined;
    try {
      const { data: membership, error: membershipError } = await (supabase
        .from("accounts_memberships" as any)
        .select("account_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle() as any);

      if (membershipError) {
        console.warn("No se pudo obtener accounts_memberships, intentando memberships:", membershipError);
        const { data: membership2 } = await (supabase
          .from("memberships" as any)
          .select("account_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle() as any);
        accountId = (membership2 as any)?.account_id;
      } else {
        accountId = (membership as any)?.account_id;
      }
    } catch (e) {
      console.warn("Error obteniendo account_id:", e);
    }

    // Construir link local al historial clínico del paciente recién creado
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const linkLocal = `http://localhost:3000/home/dashboard/view`;

    // Enviar notificación vía ruta de servidor (usa client admin en el servidor)
    if (accountId && linkLocal) {
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_id: accountId,
            body: `Has creado un nuevo paciente: ${nombre} ${apellido}`,
            link: linkLocal,
            type: "info",
            channel: "in_app",
          }),
        });
      } catch (err) {
        console.error("Error al enviar notificación:", err);
      }
    } else {
      console.warn("No se pudo determinar accountId o linkLocal para la notificación");
    }

    setSuccess(true);
    
    // Verificar si la fecha de cita es hoy para determinar la redirección
    // Usamos la constante FECHA_HOY para comparar
    
    // Normalizar la fecha de cita usando startOfDay para garantizar consistencia
    const fechaCitaObj = startOfDay(fechaCita ? new Date(fechaCita) : new Date());
    
    
    // Mostrar mensaje de éxito
    setSuccess(true);
    
    if (isSameDay(fechaCitaObj, FECHA_HOY)) {
      showAlert('success', 'Paciente creado exitosamente', 'La cita es para hoy. Redirigiendo al historial clínico...');
    } else {
      showAlert('success', 'Paciente creado exitosamente', 'La cita no es para hoy. Redirigiendo a la página principal...');
    }
    
    // Redirigir al componente estático de redirección
    setTimeout(() => {
      // Siempre redirigimos al componente estático que buscará el paciente más reciente
      router.push('/home/dashboard/redireccion-paciente');
    }, 2000); // Mantenemos el tiempo de espera en 2 segundos

  } catch (err) {
    console.error("Error al crear paciente:", err);
    setError("Ocurrió un error al crear el paciente. Por favor intente nuevamente.");
  } finally {
    setIsSubmitting(false);
  }
};

  
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Crear Nuevo Paciente</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 flex items-center text-sm sm:text-base">
          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 flex items-center text-sm sm:text-base">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
          <span className="break-words">Paciente creado exitosamente. {fechaCita && FECHA_HOY.getTime() === startOfDay(new Date(fechaCita)).getTime() 
            ? "La cita es para hoy. Redirigiendo al historial clínico..." 
            : "La cita no es para hoy. Redirigiendo a la página principal..."}</span>
        </div>
      )}
      
      <Card className="shadow-md">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">Información del Paciente</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Nombre - Campo requerido */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  ref={nombreRef}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onBlur={() => handleBlur('nombre')}
                  placeholder="Ingrese el nombre"
                  required
                  className={touched['nombre'] && nombre.trim() === "" ? "border-red-300" : ""}
                />
                {touched['nombre'] && nombre.trim() === "" && (
                  <p className="text-red-500 text-xs">Este campo es requerido</p>
                )}
              </div>
              
              {/* Apellido - Campo requerido */}
              <div className="space-y-2">
                <Label htmlFor="apellido">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="apellido"
                  ref={apellidoRef}
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  onBlur={() => handleBlur('apellido')}
                  placeholder="Ingrese el apellido"
                  required
                  className={touched['apellido'] && apellido.trim() === "" ? "border-red-300" : ""}
                />
                {touched['apellido'] && apellido.trim() === "" && (
                  <p className="text-red-500 text-xs">Este campo es requerido</p>
                )}
              </div>
              
              {/* Fecha de Nacimiento */}
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                <Popover open={fechaNacimientoOpen} onOpenChange={setFechaNacimientoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="fechaNacimiento"
                      className="w-full justify-between font-normal"
                    >
                      {fechaNacimiento ? format(fechaNacimiento, "PPP", { locale: es }) : "Seleccionar fecha"}
                      <CalendarIcon className="h-4 w-4 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaNacimiento}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        setFechaNacimiento(date);
                        // Calcular edad automáticamente si se selecciona fecha
                        if (date) {
                          const hoy = new Date();
                          let edadCalculada = hoy.getFullYear() - date.getFullYear();
                          const m = hoy.getMonth() - date.getMonth();
                          if (m < 0 || (m === 0 && hoy.getDate() < date.getDate())) {
                            edadCalculada--;
                          }
                          setEdad(edadCalculada.toString());
                        }
                        setFechaNacimientoOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Edad */}
              <div className="space-y-2">
                <Label htmlFor="edad">Edad</Label>
                <Input
                  id="edad"
                  type="number"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  placeholder="Ingrese la edad"
                />
              </div>
              
              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  ref={telefonoRef}
                  value={telefono}
                  onChange={handleTelefonoChange}
                  onBlur={() => handleBlur('telefono')}
                  placeholder="Ingrese el teléfono (10 dígitos)"
                  maxLength={10}
                  className={telefonoError ? "border-red-300" : ""}
                />
                {telefonoError && (
                  <p className="text-red-500 text-xs">{telefonoError}</p>
                )}
              </div>
            </div>
            
            {/* Sexo - Radio buttons */}
            <div className="space-y-2">
              <Label>Sexo</Label>
              <RadioGroup value={sexo} onValueChange={setSexo} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="femenino" id="femenino" />
                  <Label htmlFor="femenino">Femenino</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="masculino" id="masculino" />
                  <Label htmlFor="masculino">Masculino</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Domicilio con switch */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="domicilio-switch">Domicilio</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="domicilio-switch" className="text-sm">Simple</Label>
                  <Switch 
                    id="domicilio-switch" 
                    checked={domicilioCompleto} 
                    onCheckedChange={setDomicilioCompleto} 
                  />
                  <Label htmlFor="domicilio-switch" className="text-sm">Completo</Label>
                </div>
              </div>
              
              {!domicilioCompleto ? (
                // Domicilio simple
                <Input
                  id="domicilio"
                  value={domicilio}
                  onChange={(e) => setDomicilio(e.target.value)}
                  placeholder="Ingrese el domicilio"
                />
              ) : (
                // Domicilio completo
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calle">Calle</Label>
                    <Input
                      id="calle"
                      value={domicilioFields.calle}
                      onChange={(e) => handleDomicilioFieldChange('calle', e.target.value)}
                      placeholder="Ingrese la calle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={domicilioFields.numero}
                      onChange={(e) => handleDomicilioFieldChange('numero', e.target.value)}
                      placeholder="Número exterior"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interior">Interior (opcional)</Label>
                    <Input
                      id="interior"
                      value={domicilioFields.interior}
                      onChange={(e) => handleDomicilioFieldChange('interior', e.target.value)}
                      placeholder="Número interior"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colonia">Colonia</Label>
                    <Input
                      id="colonia"
                      value={domicilioFields.colonia}
                      onChange={(e) => handleDomicilioFieldChange('colonia', e.target.value)}
                      placeholder="Ingrese la colonia"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Motivo de consulta */}
            <div className="space-y-2">
              <Label htmlFor="motivoConsulta">Motivo de consulta</Label>
              <Textarea
                id="motivoConsulta"
                value={motivoConsulta}
                onChange={(e) => setMotivoConsulta(e.target.value)}
                placeholder="Describa el motivo de la consulta"
                rows={3}
              />
            </div>
            
            {/* Fecha de consulta */}
            <div className="space-y-2">
              <Label htmlFor="fechaCita">Fecha de consulta</Label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !fechaCita ? "text-muted-foreground" : ""
                      }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaCita ? (
                        format(fechaCita, "PPP", { locale: es })
                      ) : (
                        <span>Seleccione una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-2 flex items-center justify-between border-b">
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-1" />
                        <span>Pacientes por día</span>
                      </div>
                      {cargandoCitas && (
                        <div className="text-xs text-muted-foreground">Cargando...</div>
                      )}
                    </div>
                    <Calendar
                      mode="single"
                      selected={fechaCita}
                      onSelect={setFechaCita}
                      initialFocus
                      modifiers={{
                        booked: (date) => 
                          citasInfo.some(cita => isSameDay(date, cita.fecha))
                      }}
                      modifiersClassNames={{
                        booked: "relative"
                      }}
                      components={{
                        Day: (props: any) => {
                          // Acceder a la fecha desde el objeto day
                          const date = props.day?.date;
                          const citaDelDia = citasInfo.find(cita => 
                            date && isSameDay(date, cita.fecha)
                          );
                          
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <td className="relative">
                                    <div 
                                      {...props} 
                                      className={props.className}
                                      role="button"
                                      tabIndex={0}
                                    >
                                      {props.children}
                                    </div>
                                    {citaDelDia && (
                                      <Badge 
                                        variant="outline" 
                                        className="absolute -bottom-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-blue-100"
                                      >
                                        {citaDelDia.cantidadPacientes}
                                      </Badge>
                                    )}
                                  </td>
                                </TooltipTrigger>
                                {citaDelDia && (
                                  <TooltipContent>
                                    <p className="text-xs">{citaDelDia.cantidadPacientes} paciente(s) agendado(s)</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          );
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <Button 
                  type="button" 
                  onClick={establecerFechaHoy}
                  className="flex items-center"
                >
                  Hoy
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 mt-4 sm:mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={limpiarFormulario}
                disabled={isSubmitting}
                className="w-full sm:w-auto order-2 sm:order-1 flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Limpiar datos
              </Button>
              
              <Button 
                type="submit" 
                disabled={!isFormValid || isSubmitting}
                className="bg-primary text-white w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Guardar paciente
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}