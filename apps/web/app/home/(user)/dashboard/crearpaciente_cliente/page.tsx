"use client";
//este componente le permite al cliente crear un paciente
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, RefreshCw, Calendar as CalendarIcon, Home, Users } from "lucide-react";
import { format, isSameDay, startOfDay, addDays } from "date-fns";
import { es, id } from "date-fns/locale";
import { useState, useEffect, useRef } from "react";
import { HomeLayoutPageHeader } from '../../../(user)/_components/home-page-header';
import { Trans } from '@kit/ui/trans';
import { PageBody } from '@kit/ui/page';
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
import { Checkbox } from "@kit/ui/checkbox";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
// Importaciones para notificaciones y correos
import { createNotificationsApi } from '@kit/notifications/api';
import { getMailer } from '@kit/mailers';
import { unknown } from "zod";

// Definición de la interfaz para el tipo Paciente
interface Paciente {
  id?: string;
  user_id?: string;
  nombre: string;
  edad?: number;
  sexo?: string;
  domicilio?: string;
  motivo_consulta?: string;
  diagnostico_id?: string;
  telefono?: string;
  fecha_de_cita?: Date | string | null;
  created_at?: string;
  updated_at?: string;
  estado?: string;
  fecha_nacimiento?: Date | string | null;
  ocupacion?: string;
  sintomas_visuales?: string;
  ultimo_examen_visual?: string;
  uso_lentes?: boolean;
  tipos_de_lentes?: string;
  tiempo_de_uso_lentes?: string;
  cirujias?: boolean;
  traumatismos_oculares?: boolean;
  nombre_traumatismos_oculares?: string;
  antecedentes_visuales_familiares?: string;
  antecedente_familiar_salud?: string;
  habitos_visuales?: string;
  salud_general?: string;
  medicamento_actual?: string;
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


  // Estado para el id_account
  const [accountId, setAccountId] = useState<string | null>(null);
  
  // Obtener el id_account de la URL y verificar usuario (opcional)
  const supabase = getSupabaseBrowserClient();
  useEffect(() => {
    // Obtener el id_account de la URL
    const params = new URLSearchParams(window.location.search);
    const accountIdFromUrl = params.get('account_id');
    
    if (accountIdFromUrl) {
      setAccountId(accountIdFromUrl);
      console.log("ID de cuenta desde URL:", accountIdFromUrl);
      // Cargar citas existentes con el id_account
      obtenerCitasExistentes(accountIdFromUrl);
    }
    
    // Verificar si hay un usuario logueado (opcional, no es requerido)
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data.user && !accountIdFromUrl) {
        setUserId(data.user.id);
        console.log("Usuario logueado:", data.user.id);
        // Si no hay account_id en la URL pero hay usuario logueado
        // Intentar obtener su account_id
        try {
          const { data: membership } = await supabase
            .from("accounts_memberships" as any)
            .select("account_id")
            .eq("user_id", data.user.id)
            .limit(1)
            .maybeSingle() as any;
            
          if (membership?.account_id) {
            setAccountId(membership.account_id);
            console.log("ID de cuenta desde usuario:", membership.account_id);
            obtenerCitasExistentes(membership.account_id);
          }
        } catch (e) {
          console.warn("Error obteniendo account_id del usuario:", e);
        }
      }
    };
    
    checkUser();
  }, []);

  // Función para obtener las citas existentes
  const obtenerCitasExistentes = async (id: string) => {
    setCargandoCitas(true);
    try {
      // Obtener pacientes con sus fechas de cita
      // Primero intentamos obtener los usuarios asociados a la cuenta
      const { data: usersData, error: usersError } = await supabase
        .from('accounts_memberships' as any)
        .select('user_id')
        .eq('account_id', id);
        
      if (usersError) {
        console.error("Error al obtener usuarios de la cuenta:", usersError);
        return;
      }
      
      // Extraer los IDs de usuario
      const userIds = usersData ? usersData.map((item: any) => item.user_id) : [];
      
      // Si no hay usuarios, usar el ID proporcionado directamente
      if (userIds.length === 0) {
        userIds.push(id);
      }
      
      // Obtener pacientes con sus fechas de cita para todos los usuarios de la cuenta
      const { data, error } = await supabase
        .from('pacientes' as any)
        .select('fecha_de_cita')
        .in('user_id', userIds)
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
  const [telefono, setTelefono] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [motivoConsultaOtro, setMotivoConsultaOtro] = useState("");
  const [fechaCita, setFechaCita] = useState<Date | undefined>(undefined);
  const [fechaCitaOpen, setFechaCitaOpen] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | undefined>(undefined);
  const [fechaNacimientoOpen, setFechaNacimientoOpen] = useState(false);
  const [ocupacion, setOcupacion] = useState("");
  const [sintomasVisuales, setSintomasVisuales] = useState("");
  const [sintomasVisualesSeleccionados, setSintomasVisualesSeleccionados] = useState<string[]>([]);
  const [sintomasVisualesOtro, setSintomasVisualesOtro] = useState("");
  const [ultimoExamenVisual, setUltimoExamenVisual] = useState<Date | undefined>(undefined);
  const [usaLentes, setUsaLentes] = useState(false);
  const [tipoLentesSeleccionados, setTipoLentesSeleccionados] = useState<string[]>([]);
  const [tiempoUsoLentes, setTiempoUsoLentes] = useState("");
  const [cirugiasOculares, setCirugiasOculares] = useState(false);
  const [traumatismosOculares, setTraumatismosOculares] = useState(false);
  const [traumatismosDetalle, setTraumatismosDetalle] = useState("");
  const [antecedentesVisualesFamiliares, setAntecedentesVisualesFamiliares] = useState("");
  const [antecedentesVisualesFamiliaresSeleccionados, setAntecedentesVisualesFamiliaresSeleccionados] = useState<string[]>([]);
  const [antecedentesVisualesFamiliaresOtros, setAntecedentesVisualesFamiliaresOtros] = useState("");
  const [antecedentesVisualesFamiliaresError, setAntecedentesVisualesFamiliaresError] = useState<string | null>(null);
  const [antecedentesFamiliaresSalud, setAntecedentesFamiliaresSalud] = useState("");
  const [habitosVisuales, setHabitosVisuales] = useState("");
  const [habitosVisualesSeleccionados, setHabitosVisualesSeleccionados] = useState<string[]>([]);
  const [saludGeneral, setSaludGeneral] = useState("");
  const [antecedentesFamiliaresSaludSeleccionados, setAntecedentesFamiliaresSaludSeleccionados] = useState<string[]>([]);
  const [saludGeneralSeleccionados, setSaludGeneralSeleccionados] = useState<string[]>([]);
  const [medicamentosActuales, setMedicamentosActuales] = useState("");

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
    (telefono === "" || validateTelefono(telefono) === null) &&
    sexo.trim() !== "" &&
    motivoConsulta.trim() !== "" &&
    sintomasVisualesSeleccionados.length > 0 &&
    antecedentesVisualesFamiliaresSeleccionados.length > 0 &&
    antecedentesFamiliaresSaludSeleccionados.length > 0 &&
    habitosVisualesSeleccionados.length > 0 &&
    saludGeneralSeleccionados.length > 0;

  // Función para limpiar el formulario
  const limpiarFormulario = () => {
    setNombre("");
    setTelefono("");
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
    setFechaNacimiento(undefined);
    setFechaCita(undefined);
    setFechaNacimientoOpen(false);
    setOcupacion("");
    setSintomasVisuales("");
    setUltimoExamenVisual(undefined);
    setUsaLentes(false);
    setTipoLentesSeleccionados([]);
    setTiempoUsoLentes("");
    setCirugiasOculares(false);
    setTraumatismosOculares(false);
    setTraumatismosDetalle("");
    setAntecedentesVisualesFamiliares("");
    setAntecedentesFamiliaresSalud("");
    setHabitosVisuales("");
    setSaludGeneral("");
    setMedicamentosActuales("");
    setError(null);
    setSuccess(false);
    setTouched({});
    setTelefonoError(null);
  };

  // Función para establecer la fecha actual exacta sin modificaciones
  const establecerFechaHoy = () => {
    // Usamos startOfDay para normalizar la fecha actual sin hora/minutos/segundos
    const fechaHoy = startOfDay(new Date());
    setFechaCita(fechaHoy);
    // Cerramos el popover del calendario para evitar modificaciones manuales
    setFechaCitaOpen(false);
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

    const telefonoErrorMsg = validateTelefono(telefono);
    if (telefono && telefonoErrorMsg) {
      setError(telefonoErrorMsg);
      telefonoRef.current?.focus();
      return;
    }

    // Verificar que tenemos un accountId
    if (!accountId) {
      setError("No se pudo identificar la cuenta. Verifique el enlace o escanee nuevamente el código QR.");
      return;
    }
    
    // Validación anti-spam: limitar el número de solicitudes por IP
    const clientIP = window.sessionStorage.getItem('lastSubmitIP');
    const lastSubmitTime = window.sessionStorage.getItem('lastSubmitTime');
    const currentTime = new Date().getTime();
    
    if (clientIP && lastSubmitTime && (currentTime - parseInt(lastSubmitTime)) < 60000) { // 1 minuto
      setError("Por favor, espere un momento antes de enviar otra solicitud.");
      return;
    }
    
    // Guardar información de esta solicitud
    window.sessionStorage.setItem('lastSubmitIP', 'client-ip');
    window.sessionStorage.setItem('lastSubmitTime', currentTime.toString());

    setIsSubmitting(true);
    setError(null);

    try {
      // Intentar obtener un usuario asociado a la cuenta para asignarlo como user_id
      let userId = null;
      
      // Primero verificamos si hay un usuario logueado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user) {
        userId = user.id;
      } else {
        // Si no hay usuario logueado, intentamos obtener el primer usuario asociado a la cuenta
        const { data: usersData } = await supabase
          .from('accounts_memberships' as any)
          .select('user_id')
          .eq('account_id', accountId)
          .limit(1);
          
        if (usersData && usersData.length > 0) {
          userId = usersData[0]?.user_id;
        }
      }
      // Preparar el domicilio según el tipo seleccionado
      let domicilioFinal = domicilio;
      if (domicilioCompleto) {
        domicilioFinal = `${domicilioFields.calle} ${domicilioFields.numero}${domicilioFields.interior ? ', Int. ' + domicilioFields.interior : ''}, Col. ${domicilioFields.colonia}`;
      }

      // Insertar en Supabase
      const { data, error: insertError } = await (supabase.from("pacientes" as any) as any)
        .insert([{
          user_id: userId, // Usar userId si está disponible, o accountId como respaldo
          account_id: accountId, // Guardar el account_id explícitamente
          nombre,
          edad: edad ? parseInt(edad) : undefined,
          fecha_nacimiento: fechaNacimiento ? fechaNacimiento.toISOString() : undefined,
          sexo,
          domicilio: domicilioFinal,
          motivo_consulta: motivoConsulta === "Otro" ? `Otro: ${motivoConsultaOtro}` : motivoConsulta,
          telefono,
          fecha_de_cita: (fechaCita ? fechaCita : startOfDay(new Date())).toISOString(),
          estado: "pendiente",
          ocupacion,
          sintomas_visuales: sintomasVisualesSeleccionados.length > 0
            ? sintomasVisualesSeleccionados.map(s => s === "Otro" ? `Otro: ${sintomasVisualesOtro}` : s).join(", ")
            : sintomasVisuales,
          antecedentes_visuales_familiares: antecedentesVisualesFamiliaresSeleccionados.length > 0
            ? antecedentesVisualesFamiliaresSeleccionados.map(a => a === "Otros" ? `Otros: ${antecedentesVisualesFamiliaresOtros}` : a).join(", ")
            : antecedentesVisualesFamiliares,
          ultimo_examen_visual: ultimoExamenVisual ? format(ultimoExamenVisual, "yyyy-MM-dd") : "",
          uso_lentes: usaLentes,
          tipos_de_lentes: tipoLentesSeleccionados.length > 0 ? tipoLentesSeleccionados.join(", ") : "",
          tiempo_de_uso_lentes: tiempoUsoLentes,
          cirujias: cirugiasOculares,
          traumatismos_oculares: traumatismosOculares,
          nombre_traumatismos_oculares: traumatismosDetalle,
          // Duplicate key removed; antecedentes_visuales_familiares is already set above
          antecedente_familiar_salud: antecedentesFamiliaresSaludSeleccionados.length > 0
            ? antecedentesFamiliaresSaludSeleccionados.join(", ")
            : antecedentesFamiliaresSalud,
          habitos_visuales: habitosVisualesSeleccionados.length > 0
            ? habitosVisualesSeleccionados.join(", ")
            : habitosVisuales,
          salud_general: saludGeneralSeleccionados.length > 0
            ? saludGeneralSeleccionados.join(", ")
            : saludGeneral,
          medicamento_actual: medicamentosActuales
        }]);

      if (insertError) {
        console.error("Error insertando paciente:", insertError);
        setError("No se pudo crear el paciente");
        return;
      }
      // Se ha eliminado la creación automática de registros en las tablas rx y diagnóstico
      // Solo se mantiene la creación del paciente

      // Obtener el account_id del usuario para enviar la notificación (primera membresía encontrada)
      let accountId: string | undefined;
      try {
        const { data: membership, error: membershipError } = await (supabase
          .from("accounts_memberships" as any)
          .select("account_id")
          .eq("user_id", user?.id)
          .limit(1)
          .maybeSingle() as any);

        if (membershipError) {
          console.warn("No se pudo obtener accounts_memberships, intentando memberships:", membershipError);
          const { data: membership2 } = await (supabase
            .from("memberships" as any)
            .select("account_id")
            .eq("user_id", user?.id)
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

      // Enviar notificación usando la API de Makerkit
      if (accountId && linkLocal) {
        try {
          // Usar la API de notificaciones de Makerkit
          const response = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              account_id: accountId,
              body: `Has creado un nuevo paciente: ${nombre}`,
              link: linkLocal,
              type: "info",
              channel: "in_app", // Solo enviar notificación in-app
            }),
          });

          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }

          // Enviar notificación por email por separado
          // const emailResponse = await fetch("/api/notifications", {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({
          //     account_id: accountId,
          //     body: `Has creado un nuevo paciente: ${nombre}`,
          //     link: linkLocal,
          //     type: "info",
          //     channel: "email", // Solo enviar notificación por email
          //   }),
          // });

          // if (!emailResponse.ok) {
          //   throw new Error(`Error HTTP en email: ${emailResponse.status}`);
          // }

          console.log("Notificaciones enviadas correctamente");
        } catch (err) {
          console.error("Error al enviar notificaciones:", err);
        }
      } else {
        console.warn("No se pudo determinar accountId o linkLocal para las notificaciones");
      }

      setSuccess(true);

      // Verificar si la fecha de cita es hoy para determinar la redirección
      // Usamos la constante FECHA_HOY para comparar

      // Normalizar la fecha de cita usando startOfDay para garantizar consistencia
      const fechaCitaObj = startOfDay(fechaCita ? new Date(fechaCita) : new Date());


      // Mostrar mensaje de éxito
      setSuccess(true);

      // Mensaje simple para clientes externos
      showAlert(
        'success', 
        'USTED HA SIDO REGISTRADO', 
        ''
      );

      // Para clientes externos, no redirigimos a otra página
      // Solo limpiamos el formulario después de un tiempo
      setTimeout(() => {
        limpiarFormulario();
        window.scrollTo(0, 0);
      }, 5000); // Damos tiempo para que vean el mensaje

    } catch (err) {
      console.error("Error al crear paciente:", err);
      setError("Ocurrió un error al crear el paciente. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.home'} />}
        description={<Trans i18nKey={'common:homeTabDescription'} />}
      />
      <PageBody>
        <div className="container mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Registro de Paciente</h1>
      
      {/* Mensaje de bienvenida para clientes externos */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6">
        <h2 className="font-semibold text-lg mb-2">¡Bienvenido al registro de pacientes de OpticsLab!</h2>
        <p className="mb-2">Complete el siguiente formulario para agendar su cita. Todos los campos marcados con * son obligatorios.</p>
        <p>Su información será tratada con confidencialidad y solo será utilizada para brindarle una mejor atención.</p>
      </div>

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
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" autoComplete="off">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      autoComplete="off"
                  className={touched['nombre'] && nombre.trim() === "" ? "border-red-300" : ""}
                />
                {touched['nombre'] && nombre.trim() === "" && (
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
                      autoComplete="off"
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
                      autoComplete="off"
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
                      autoComplete="off"
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
                            autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={domicilioFields.numero}
                      onChange={(e) => handleDomicilioFieldChange('numero', e.target.value)}
                      placeholder="Número exterior"
                            autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interior">Interior (opcional)</Label>
                    <Input
                      id="interior"
                      value={domicilioFields.interior}
                      onChange={(e) => handleDomicilioFieldChange('interior', e.target.value)}
                      placeholder="Número interior"
                            autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colonia">Colonia</Label>
                    <Input
                      id="colonia"
                      value={domicilioFields.colonia}
                      onChange={(e) => handleDomicilioFieldChange('colonia', e.target.value)}
                      placeholder="Ingrese la colonia"
                            autoComplete="off"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Motivo de consulta */}
            <div className="space-y-2">
                  <Label>Motivo de Consulta</Label>
                  <RadioGroup
                    value={motivoConsulta}
                    onValueChange={setMotivoConsulta}
                    className="space-y-2 flex flex-col"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Revisión de rutina" id="revision-rutina" />
                      <Label htmlFor="revision-rutina" className="font-normal">Revisión de rutina</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Visión borrosa" id="vision-borrosa" />
                      <Label htmlFor="vision-borrosa" className="font-normal">Visión borrosa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Dolor o molestia ocular" id="dolor-ocular" />
                      <Label htmlFor="dolor-ocular" className="font-normal">Dolor o molestia ocular</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Revisión de lentes" id="revision-lentes" />
                      <Label htmlFor="revision-lentes" className="font-normal">Revisión de lentes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Otro" id="otro-motivo" />
                      <Label htmlFor="otro-motivo" className="font-normal">Otro</Label>
                    </div>
                    {motivoConsulta === "Otro" && (
                      <div className="pl-6 pt-2">
                        <Input
                          placeholder="Especifique el motivo"
                          value={motivoConsulta === "Otro" ? motivoConsultaOtro : ""}
                          onChange={(e) => setMotivoConsultaOtro(e.target.value)}
                          className="w-full"
                          autoComplete="off"
                        />
                      </div>
                    )}
                  </RadioGroup>
                </div>

                {/* Ocupación y Último examen visual en 2 columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ocupación */}
                  <div className="space-y-2">
                    <Label htmlFor="ocupacion">Ocupación</Label>
                    <Input
                      id="ocupacion"
                      value={ocupacion}
                      onChange={(e) => setOcupacion(e.target.value)}
                      placeholder="Ingrese la ocupación"
                      autoComplete="off"
                    />
                  </div>

                  {/* Último Examen Visual */}
                  <div className="space-y-2">
                    <Label htmlFor="ultimoExamenVisual">Último Examen Visual</Label>
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!ultimoExamenVisual ? "text-muted-foreground" : ""
                              }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {ultimoExamenVisual ? (
                              format(ultimoExamenVisual, "PPP", { locale: es })
                            ) : (
                              <span>Seleccione una fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={ultimoExamenVisual}
                            onSelect={setUltimoExamenVisual}
                            initialFocus
                            disableNavigation={false}
                            fromDate={undefined}
                            toDate={new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Síntomas Visuales */}
                <div className="space-y-2">
                  <Label htmlFor="sintomasVisuales">Síntomas Visuales</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {[
                      "Visión borrosa de lejos",
                      "Visión borrosa de cerca",
                      "Dolor de cabeza",
                      "Ardor o picazón ocular",
                      "Lagrimeo",
                      "Enrojecimiento ocular",
                      "Sensibilidad a la luz solar",
                      "Sensibilidad a la luz artificial",
                      "Ve doble (diplopía)",
                      "Moscas volantes o destellos",
                      "Pérdida momentánea de visión"
                    ].map((sintoma) => (
                      <div key={sintoma} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sintoma-${sintoma}`}
                          checked={sintomasVisualesSeleccionados.includes(sintoma)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSintomasVisualesSeleccionados([...sintomasVisualesSeleccionados, sintoma]);
                            } else {
                              setSintomasVisualesSeleccionados(
                                sintomasVisualesSeleccionados.filter((item) => item !== sintoma)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={`sintoma-${sintoma}`} className="font-normal">{sintoma}</Label>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sintoma-otro"
                        checked={sintomasVisualesSeleccionados.includes("Otro")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSintomasVisualesSeleccionados([...sintomasVisualesSeleccionados, "Otro"]);
                          } else {
                            setSintomasVisualesSeleccionados(
                              sintomasVisualesSeleccionados.filter((item) => item !== "Otro")
                            );
                            setSintomasVisualesOtro("");
                          }
                        }}
                      />
                      <Label htmlFor="sintoma-otro" className="font-normal">Otro</Label>
                    </div>
                  </div>
                  {sintomasVisualesSeleccionados.includes("Otro") && (
                    <div className="pt-2">
                      <Input
                        placeholder="Especifique otros síntomas visuales"
                        value={sintomasVisualesOtro}
                        onChange={(e) => setSintomasVisualesOtro(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>



                {/* Uso de Lentes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="usaLentes">¿Usa Lentes?</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{usaLentes ? "Sí" : "No"}</span>
                      <Switch
                        id="usaLentes"
                        checked={usaLentes}
                        onCheckedChange={setUsaLentes}
                      />
                    </div>
                  </div>
                </div>

                {usaLentes && (
                  <>
                    {/* Contenedor de dos columnas para Tipo de Lentes y Tiempo de Uso */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tipo de Lentes - Primera columna */}
                      <div className="space-y-2">
                        <Label>Tipo de Lentes</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="lentes-monofocales"
                              checked={tipoLentesSeleccionados.includes("Monofocales")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTipoLentesSeleccionados([...tipoLentesSeleccionados, "Monofocales"]);
                                } else {
                                  setTipoLentesSeleccionados(tipoLentesSeleccionados.filter(tipo => tipo !== "Monofocales"));
                                }
                              }}
                            />
                            <Label htmlFor="lentes-monofocales" className="font-normal">Monofocales</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="lentes-bifocales"
                              checked={tipoLentesSeleccionados.includes("Bifocales")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTipoLentesSeleccionados([...tipoLentesSeleccionados, "Bifocales"]);
                                } else {
                                  setTipoLentesSeleccionados(tipoLentesSeleccionados.filter(tipo => tipo !== "Bifocales"));
                                }
                              }}
                            />
                            <Label htmlFor="lentes-bifocales" className="font-normal">Bifocales</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="lentes-progresivos"
                              checked={tipoLentesSeleccionados.includes("Progresivos")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTipoLentesSeleccionados([...tipoLentesSeleccionados, "Progresivos"]);
                                } else {
                                  setTipoLentesSeleccionados(tipoLentesSeleccionados.filter(tipo => tipo !== "Progresivos"));
                                }
                              }}
                            />
                            <Label htmlFor="lentes-progresivos" className="font-normal">Progresivos</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="lentes-contacto"
                              checked={tipoLentesSeleccionados.includes("De contacto")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTipoLentesSeleccionados([...tipoLentesSeleccionados, "De contacto"]);
                                } else {
                                  setTipoLentesSeleccionados(tipoLentesSeleccionados.filter(tipo => tipo !== "De contacto"));
                                }
                              }}
                            />
                            <Label htmlFor="lentes-contacto" className="font-normal">De contacto</Label>
                          </div>
                        </div>
                      </div>

                      {/* Tiempo de Uso de Lentes - Segunda columna */}
                      <div className="space-y-2">
                        <Label htmlFor="tiempoUsoLentes">Tiempo de Uso de Lentes</Label>
                        <Input
                          id="tiempoUsoLentes"
                          value={tiempoUsoLentes}
                          onChange={(e) => setTiempoUsoLentes(e.target.value)}
                          placeholder="Tiempo que lleva usando lentes"
                          className="h-full"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Cirugías Oculares */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cirugiasOculares">¿Ha tenido cirugías oculares?</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{cirugiasOculares ? "Sí" : "No"}</span>
                      <Switch
                        id="cirugiasOculares"
                        checked={cirugiasOculares}
                        onCheckedChange={setCirugiasOculares}
                      />
                    </div>
                  </div>
                </div>

                {/* Traumatismos Oculares */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="traumatismosOculares">¿Ha tenido traumatismos oculares?</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{traumatismosOculares ? "Sí" : "No"}</span>
                      <Switch
                        id="traumatismosOculares"
                        checked={traumatismosOculares}
                        onCheckedChange={setTraumatismosOculares}
                      />
                    </div>
                  </div>
                </div>

                {traumatismosOculares && (
                  <div className="space-y-2">
                    <Label htmlFor="traumatismosDetalle">Detalles de Traumatismos Oculares</Label>
                    <Textarea
                      id="traumatismosDetalle"
                      value={traumatismosDetalle}
                      onChange={(e) => setTraumatismosDetalle(e.target.value)}
                      placeholder="Describa los traumatismos oculares"
                      className="min-h-[80px]"
                    />
                  </div>
                )}

                {/* Antecedentes Visuales Familiares */}
                <div className="space-y-2">
                  <Label htmlFor="antecedentesVisualesFamiliares">Antecedentes Visuales Familiares</Label>
                  {antecedentesVisualesFamiliaresError && (
                    <p className="text-sm text-red-500">{antecedentesVisualesFamiliaresError}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {[
                      "Miopía",
                      "Hipermetropía",
                      "Astigmatismo",
                      "Presbicia",
                      "Estrabismo",
                      "Ambliopía"
                    ].map((antecedente) => (
                      <div key={antecedente} className="flex items-center space-x-2">
                        <Checkbox
                          id={`antecedente-${antecedente}`}
                          checked={antecedentesVisualesFamiliaresSeleccionados.includes(antecedente)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Si seleccionamos una opción y "Ninguno" estaba seleccionado, quitamos "Ninguno"
                              if (antecedentesVisualesFamiliaresSeleccionados.includes("Ninguno")) {
                                setAntecedentesVisualesFamiliaresSeleccionados(
                                  antecedentesVisualesFamiliaresSeleccionados
                                    .filter(item => item !== "Ninguno")
                                    .concat(antecedente)
                                );
                              } else {
                                setAntecedentesVisualesFamiliaresSeleccionados([
                                  ...antecedentesVisualesFamiliaresSeleccionados,
                                  antecedente
                                ]);
                              }
                              setAntecedentesVisualesFamiliaresError(null);
                            } else {
                              setAntecedentesVisualesFamiliaresSeleccionados(
                                antecedentesVisualesFamiliaresSeleccionados.filter((item) => item !== antecedente)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={`antecedente-${antecedente}`} className="font-normal">{antecedente}</Label>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="antecedente-ninguno"
                        checked={antecedentesVisualesFamiliaresSeleccionados.includes("Ninguno")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Si seleccionamos "Ninguno", deseleccionamos todas las demás opciones
                            setAntecedentesVisualesFamiliaresSeleccionados(["Ninguno"]);
                            setAntecedentesVisualesFamiliaresOtros("");
                            setAntecedentesVisualesFamiliaresError(null);
                          } else {
                            setAntecedentesVisualesFamiliaresSeleccionados([]);
                          }
                        }}
                      />
                      <Label htmlFor="antecedente-ninguno" className="font-normal">Ninguno</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="antecedente-otros"
                        checked={antecedentesVisualesFamiliaresSeleccionados.includes("Otros")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Si seleccionamos "Otros" y "Ninguno" estaba seleccionado, quitamos "Ninguno"
                            if (antecedentesVisualesFamiliaresSeleccionados.includes("Ninguno")) {
                              setAntecedentesVisualesFamiliaresSeleccionados(["Otros"]);
                            } else {
                              setAntecedentesVisualesFamiliaresSeleccionados([
                                ...antecedentesVisualesFamiliaresSeleccionados,
                                "Otros"
                              ]);
                            }
                            setAntecedentesVisualesFamiliaresError(null);
                          } else {
                            setAntecedentesVisualesFamiliaresSeleccionados(
                              antecedentesVisualesFamiliaresSeleccionados.filter((item) => item !== "Otros")
                            );
                            setAntecedentesVisualesFamiliaresOtros("");
                          }
                        }}
                      />
                      <Label htmlFor="antecedente-otros" className="font-normal">Otros</Label>
                    </div>
                  </div>
                  {antecedentesVisualesFamiliaresSeleccionados.includes("Otros") && (
                    <div className="pt-2">
                      <Input
                        placeholder="Especifique otros antecedentes visuales familiares"
                        value={antecedentesVisualesFamiliaresOtros}
                        onChange={(e) => {
                          setAntecedentesVisualesFamiliaresOtros(e.target.value);
                          if (!e.target.value.trim()) {
                            setAntecedentesVisualesFamiliaresError("Debe especificar los otros antecedentes");
                          } else {
                            setAntecedentesVisualesFamiliaresError(null);
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Antecedentes Familiares de Salud */}
                <div className="space-y-2">
                  <Label>Antecedentes Familiares de Salud</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
                    {[
                      "Diabetes",
                      "Hipertensión",
                      "Enfermedades tiroideas",
                      "Glaucoma",
                      "Catarata"
                    ].map((antecedente) => (
                      <div key={antecedente} className="flex items-center space-x-2">
                        <Checkbox
                          id={`antecedenteSalud-${antecedente}`}
                          checked={antecedentesFamiliaresSaludSeleccionados.includes(antecedente)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Si seleccionamos una opción y "Ninguno" estaba seleccionado, quitamos "Ninguno"
                              if (antecedentesFamiliaresSaludSeleccionados.includes("Ninguno")) {
                                setAntecedentesFamiliaresSaludSeleccionados(
                                  antecedentesFamiliaresSaludSeleccionados
                                    .filter(item => item !== "Ninguno")
                                    .concat(antecedente)
                                );
                              } else {
                                setAntecedentesFamiliaresSaludSeleccionados([
                                  ...antecedentesFamiliaresSaludSeleccionados,
                                  antecedente
                                ]);
                              }
                            } else {
                              setAntecedentesFamiliaresSaludSeleccionados(
                                antecedentesFamiliaresSaludSeleccionados.filter((item) => item !== antecedente)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={`antecedenteSalud-${antecedente}`} className="font-normal">{antecedente}</Label>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="antecedenteSalud-ninguno"
                        checked={antecedentesFamiliaresSaludSeleccionados.includes("Ninguno")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Si seleccionamos "Ninguno", deseleccionamos todas las demás opciones
                            setAntecedentesFamiliaresSaludSeleccionados(["Ninguno"]);
                          } else {
                            setAntecedentesFamiliaresSaludSeleccionados([]);
                          }
                        }}
                      />
                      <Label htmlFor="antecedenteSalud-ninguno" className="font-normal">Ninguno</Label>
                    </div>
                  </div>
                </div>

                {/* Hábitos Visuales */}
                <div className="space-y-2">
                  <Label>Hábitos Visuales</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
                    {[
                      "Usa computadora o celular más de 6 h al día",
                      "Lee con poca luz",
                      "Trabaja al aire libre",
                      "Expone sus ojos al sol sin protección",
                      "Usa lentes de protección en el trabajo"
                    ].map((habito) => (
                      <div key={habito} className="flex items-center space-x-2">
                        <Checkbox
                          id={`habito-${habito}`}
                          checked={habitosVisualesSeleccionados.includes(habito)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setHabitosVisualesSeleccionados([
                                ...habitosVisualesSeleccionados,
                                habito
                              ]);
                            } else {
                              setHabitosVisualesSeleccionados(
                                habitosVisualesSeleccionados.filter((item) => item !== habito)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={`habito-${habito}`} className="font-normal">{habito}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Salud General */}
                <div className="space-y-2">
                  <Label>Salud General</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border rounded-md p-3">
                    {[
                      "Diabetes",
                      "Hipertensión",
                      "Enfermedades tiroideas",
                      "Glaucoma",
                      "Catarata"
                    ].map((condicion) => (
                      <div key={condicion} className="flex items-center space-x-2">
                        <Checkbox
                          id={`saludGeneral-${condicion}`}
                          checked={saludGeneralSeleccionados.includes(condicion)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Si seleccionamos una opción y "Ninguno" estaba seleccionado, quitamos "Ninguno"
                              if (saludGeneralSeleccionados.includes("Ninguno")) {
                                setSaludGeneralSeleccionados(
                                  saludGeneralSeleccionados
                                    .filter(item => item !== "Ninguno")
                                    .concat(condicion)
                                );
                              } else {
                                setSaludGeneralSeleccionados([
                                  ...saludGeneralSeleccionados,
                                  condicion
                                ]);
                              }
                            } else {
                              setSaludGeneralSeleccionados(
                                saludGeneralSeleccionados.filter((item) => item !== condicion)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={`saludGeneral-${condicion}`} className="font-normal">{condicion}</Label>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saludGeneral-ninguno"
                        checked={saludGeneralSeleccionados.includes("Ninguno")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Si seleccionamos "Ninguno", deseleccionamos todas las demás opciones
                            setSaludGeneralSeleccionados(["Ninguno"]);
                          } else {
                            setSaludGeneralSeleccionados([]);
                          }
                        }}
                      />
                      <Label htmlFor="saludGeneral-ninguno" className="font-normal">Ninguno</Label>
                    </div>
                  </div>
                </div>

                {/* Medicamentos Actuales y Fecha de Cita en 2 columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Medicamentos Actuales */}
                  <div className="space-y-2">
                    <Label htmlFor="medicamentosActuales">Medicamentos Actuales</Label>
                    <Input
                      id="medicamentosActuales"
                      value={medicamentosActuales}
                      onChange={(e) => setMedicamentosActuales(e.target.value)}
                      placeholder="Describa los medicamentos que toma actualmente"
                    />
                  </div>

                  {/* Fecha de Cita */}
                  <div className="space-y-2">
                    <Label htmlFor="fechaCita">Fecha de Cita</Label>
                    <div className="flex space-x-2">
                      <Popover open={fechaCitaOpen} onOpenChange={setFechaCitaOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!fechaCita ? "text-muted-foreground" : ""
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
                            onSelect={(date) => {
                              setFechaCita(date);
                              // Solo cerramos el popover si se selecciona una fecha
                              if (date) setFechaCitaOpen(false);
                            }}
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
      </PageBody>
    </>
  );
}