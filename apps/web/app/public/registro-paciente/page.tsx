"use client";
//este componente le permite al cliente crear un paciente
import { CheckCircle2, XCircle, RefreshCw, Calendar as CalendarIcon, Home, Users, Moon, Sun, Camera } from "lucide-react";
import { format, isSameDay, startOfDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
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
// Eliminado: diálogo de OCR, ahora flujo inline sin modal
import { Switch } from "@kit/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@kit/ui/tooltip";
import { Badge } from "@kit/ui/badge";
import { Checkbox } from "@kit/ui/checkbox";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
// Módulos extraídos para arquitectura limpia
import { ThemeButton } from "./components/ThemeButton";
import { SuccessMessage } from "./components/SuccessMessage";
import { Paciente, DomicilioCompleto, CitaInfo } from "./types/types";
import { validateTelefono, isStepValidCtx } from "./utils/validation";
import { injectStylesOnce } from "./utils/styles";
import { getCitasInfoByUserId } from "./services/citas";


// Estilos de animación personalizados
const styles = `
  @keyframes scale-in-center {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .scale-in-center {
    animation: scale-in-center 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
  }
`;


// Usamos los estilos globales de CSS definidos en la hoja global
// Evitar inyectar múltiples veces en HMR: agregar una única etiqueta de estilo con id estable.
injectStylesOnce('registro-paciente-animations', styles);

// Componente: Aviso de Privacidad
function AvisoDePrivacidad({
  accepted,
  onToggle,
}: {
  accepted: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Aviso de Privacidad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Tu información personal será tratada de forma confidencial y segura. Solo se
          utilizará para fines clínicos y administrativos dentro de la aplicación, y no será
          compartida con terceros sin tu consentimiento.
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Protegemos tus datos con estándares de seguridad.</li>
          <li>Podrás ejercer tus derechos de acceso, rectificación y cancelación.</li>
          <li>Consulta los términos completos en nuestros Términos y Condiciones.</li>
        </ul>
        <div className="flex items-center gap-3 pt-2">
          <Checkbox
            id="acepta-terminos"
            checked={accepted}
            onCheckedChange={(v) => onToggle(!!v)}
            aria-checked={accepted}
            aria-describedby="desc-terminos"
          />
          <Label htmlFor="acepta-terminos" className="text-sm">
            Acepto los Términos y Condiciones y el Aviso de Privacidad
          </Label>
        </div>
        <p id="desc-terminos" className="text-xs text-muted-foreground">
          El botón de envío se habilita al aceptar esta casilla.
        </p>
      </CardContent>
    </Card>
  );
}
// Definición de la interfaz para el tipo Paciente
// Tipos movidos a ./types/types

// Interfaz para los campos de domicilio completo
// Tipos movidos a ./types/types

// Interfaz para las citas
// Tipos movidos a ./types/types

export default function CrearPacientePage() {
  // Estado para controlar la notificación
  
  // Estado y lógica encapsulada para el manejo del tema
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  
  // Efecto para inicializar el tema desde localStorage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('registro-paciente-theme') || 'light';
    setCurrentTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Función para cambiar el tema
  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    
    // Persistencia del tema
    localStorage.setItem('registro-paciente-theme', newTheme);
    
    // Aplicar el tema al documento
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Cierre manual del mensaje de éxito
  const handleCloseSuccess = () => {
    setShowSuccessMessage(false);
    limpiarFormulario();
    window.scrollTo(0, 0);
    window.close();
  };
  
  // Componentes presentacionales extraídos (ThemeButton, SuccessMessage) se importan arriba

  // Referencias para los inputs
  const nombreRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  // OCR: input de captura de cámara
  const ocrInputRef = useRef<HTMLInputElement>(null);
  // Estado para el usuario actual
  const [userId, setUserId] = useState<string | null>(null);
  // Estado para las alertas
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
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

  // Obtener el user_id de la URL
  const supabase = getSupabaseBrowserClient();
  useEffect(() => {
    // Obtener parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    const userIdFromUrl = params.get('user_id');
    
    // Establecer user_id si está presente en la URL
    if (userIdFromUrl) {
      setUserId(userIdFromUrl);
      console.log("ID de usuario desde URL:", userIdFromUrl);
      // Cargar citas existentes con el user_id
      obtenerCitasExistentes(userIdFromUrl);
    } else {
      console.warn("No se proporcionó user_id en la URL");
    }
  }, []);

  // Función para obtener las citas existentes (servicio modular)
  const obtenerCitasExistentes = async (id: string) => {
    if (!id) {
      console.warn("No se proporcionó user_id para obtener citas");
      return;
    }
    setCargandoCitas(true);
    try {
      const citasInfoArray = await getCitasInfoByUserId(supabase, id);
      setCitasInfo(citasInfoArray);
      console.log('Citas obtenidas exitosamente para user_id:', id);
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
  const [ultimoExamenVisual, setUltimoExamenVisual] = useState<string>("");
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

  // Flujo progresivo: pasos y navegación
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    'nombre',
    'fecha_nacimiento',
    'edad',
    'telefono',
    'sexo',
    'domicilio',
    'motivo_consulta',
    'ocupacion',
    'ultimo_examen_visual',
    'sintomas_visuales',
    'uso_lentes',
    'cirugias_y_traumatismos',
    'antecedentes_visuales_familiares',
    'antecedentes_familiares_salud',
    'habitos_visuales',
    'salud_general',
    'medicamento_actual',
    'fecha_de_cita'
  ];

  const isStepValid = (step: number) => {
    return isStepValidCtx(steps, step, {
      nombre,
      fechaNacimiento,
      telefono,
      sexo,
      domicilio,
      domicilioCompleto,
      domicilioFields,
      motivoConsulta,
      motivoConsultaOtro,
      ocupacion,
      sintomasVisualesSeleccionados,
      usaLentes,
      tipoLentesSeleccionados,
      tiempoUsoLentes,
      cirugiasOculares,
      traumatismosOculares,
      traumatismosDetalle,
      antecedentesVisualesFamiliaresSeleccionados,
      antecedentesVisualesFamiliaresOtros,
      antecedentesFamiliaresSaludSeleccionados,
      habitosVisualesSeleccionados,
      saludGeneralSeleccionados,
    });
  };

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  // Estados para validación
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [telefonoError, setTelefonoError] = useState<string | null>(null);
  // Aviso de Privacidad: aceptación de términos para habilitar envío
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // OCR: estados y referencias
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrImageUrl, setOcrImageUrl] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>("");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrRunning, setOcrRunning] = useState<boolean>(false);
  const [ocrText, setOcrText] = useState<string>("");

  // Datos extraídos se aplican directamente al formulario (sin revisión manual)

  // Calidad de imagen
  const [imgResolution, setImgResolution] = useState<{ width: number; height: number } | null>(null);
  const [imgSizeKB, setImgSizeKB] = useState<number | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

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

  // Validación de teléfono movida a utils/validation

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

  // ====== OCR: helpers ======
  // Abre la cámara del dispositivo inmediatamente para capturar imagen
  function openCameraForOCR() {
    setError(null);
    clearOcrData();
    // En móviles, el input con capture abre la cámara. En escritorio, usamos getUserMedia.
    if (isMobileDevice()) {
      ocrInputRef.current?.click();
    } else {
      captureViaMediaDevices();
    }
  }

  function isMobileDevice() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isMobileUA = /android|iphone|ipad|ipod|iemobile|opera mini/i.test(ua);
    const hasCoarsePointer = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
    return isMobileUA || hasCoarsePointer;
  }

  async function captureViaMediaDevices() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      // Fallback a input de archivo si no hay soporte
      ocrInputRef.current?.click();
      return;
    }
    setOcrStatus('Solicitando acceso a la cámara...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      const track = stream.getVideoTracks()[0];
      // Intentar usar ImageCapture si está disponible
      const ImageCaptureCtor: any = (window as any).ImageCapture;
      if (ImageCaptureCtor && typeof ImageCaptureCtor === 'function') {
        const imageCapture = new ImageCaptureCtor(track);
        const blob: Blob = await imageCapture.takePhoto();
        await handleCapturedBlob(blob);
      } else {
        // Capturar un frame del stream con un canvas offscreen
        const video = document.createElement('video');
        video.srcObject = stream as any;
        await video.play();
        // Esperar un pequeño tiempo para que tenga frame
        await new Promise((res) => setTimeout(res, 300));
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo inicializar el contexto de canvas');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/jpeg', 0.95));
        if (!blob) throw new Error('No se pudo capturar la imagen');
        await handleCapturedBlob(blob);
      }
      // Detener stream
      track?.stop();
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      console.error(err);
      setOcrError(err?.message || 'No fue posible abrir la cámara');
      // Fallback a input si falla
      ocrInputRef.current?.click();
    } finally {
      setOcrStatus('');
    }
  }

  async function handleCapturedBlob(blob: Blob) {
    const file = new File([blob], `captura-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
    setOcrFile(file);
    setImgSizeKB(Math.round(file.size / 1024));
    const url = URL.createObjectURL(file);
    setOcrImageUrl(url);
    const img = new Image();
    img.onload = () => {
      setImgResolution({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
    setTimeout(() => { runOCR(); }, 0);
  }
  function clearOcrData() {
    setOcrFile(null);
    if (ocrImageUrl) URL.revokeObjectURL(ocrImageUrl);
    setOcrImageUrl(null);
    setOcrStatus("");
    setOcrError(null);
    setOcrRunning(false);
    setOcrText("");
    setImgResolution(null);
    setImgSizeKB(null);
    setOcrConfidence(null);
  }

  function handleOcrFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setOcrError(null);
    setOcrStatus("");
    setOcrText("");
    setOcrConfidence(null);
    if (file) {
      setOcrFile(file);
      setImgSizeKB(Math.round(file.size / 1024));
      const url = URL.createObjectURL(file);
      setOcrImageUrl(url);
      const img = new Image();
      img.onload = () => {
        setImgResolution({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = url;
      // Ejecutar OCR automáticamente después de la captura
      setTimeout(() => { runOCR(); }, 0);
    } else {
      clearOcrData();
    }
  }

  function isImageQualityAcceptable() {
    if (!imgResolution || imgSizeKB === null) return false;
    const { width, height } = imgResolution;
    const resolutionOk = width >= 800 && height >= 600;
    const sizeOk = imgSizeKB >= 100;
    return resolutionOk && sizeOk;
  }

  async function runOCR() {
    if (!ocrFile || !ocrImageUrl) return;
    setOcrError(null);
    setOcrRunning(true);
    setOcrStatus("Inicializando OCR...");
    try {
      const mod: any = await import('tesseract.js').catch(() => null);
      const Tesseract: any = mod?.default || mod;
      if (!Tesseract) {
        throw new Error('La librería tesseract.js no está instalada. Ejecute `pnpm add tesseract.js`.');
      }
      const result: any = await Tesseract.recognize(
        ocrImageUrl,
        'spa',
        {
          logger: (m: any) => {
            if (m?.status) {
              const pct = m?.progress ? ` ${Math.round(m.progress * 100)}%` : '';
              setOcrStatus(`${m.status}${pct}`);
            }
          }
        }
      );
      const text: string = result?.data?.text || '';
      setOcrText(text);
      let conf: number | null = null;
      const blocks = result?.data?.blocks || [];
      if (Array.isArray(blocks) && blocks.length) {
        const arr = blocks.map((b: any) => b.confidence).filter((c: any) => typeof c === 'number');
        if (arr.length) conf = Math.round(arr.reduce((a: number, b: number) => a + b, 0) / arr.length);
      }
      setOcrConfidence(conf);
      const parsed = parseOcrText(text);
      // Aplicar directamente al formulario
      if (parsed.nombre) {
        setNombre(parsed.nombre.trim());
      }
      if (parsed.fechaNacimiento && isValidDateStr(parsed.fechaNacimiento)) {
        const parts = parsed.fechaNacimiento.replace(/-/g, '/').split('/');
        if (parts.length === 3) {
          const d = parseInt(parts[0]!, 10);
          const m = parseInt(parts[1]!, 10);
          const y = parseInt(parts[2]!, 10);
          if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y)) {
            const fecha = new Date(y, m - 1, d);
            setFechaNacimiento(fecha);
            // Calcular edad automáticamente
            const hoy = new Date();
            let edadCalculada = hoy.getFullYear() - fecha.getFullYear();
            const mes = hoy.getMonth() - fecha.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
              edadCalculada--;
            }
            setEdad(edadCalculada.toString());
          }
        }
      }
      if (parsed.domicilio) {
        setDomicilio(parsed.domicilio.trim());
      }
      setOcrStatus('OCR completado');
    } catch (err: any) {
      console.error(err);
      setOcrError(err?.message || 'Error al procesar la imagen con OCR');
    } finally {
      setOcrRunning(false);
    }
  }

  function parseOcrText(text: string): { nombre?: string; fechaNacimiento?: string; domicilio?: string } {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let nombre: string | undefined;
    let fechaNacimiento: string | undefined;
    let domicilio: string | undefined;

    const namePatterns = [
      /NOMBRE\s*:?\s*(.+)/i,
      /NOMBRES?\s*:?\s*(.+)/i,
      /NAME\s*:?\s*(.+)/i
    ];
    const dobPatterns = [
      /FECHA\s*DE\s*NAC(IMIENTO)?\s*:?\s*([0-3]?\d[\/-][01]?\d[\/-][12]\d{3})/i,
      /DOB\s*:?\s*([0-3]?\d[\/-][01]?\d[\/-][12]\d{3})/i,
    ];
    const addrPatterns = [
      /DOMICILIO\s*:?\s*(.+)/i,
      /DIRECCION|DIRECCIÓN\s*:?\s*(.+)/i,
      /ADDRESS\s*:?\s*(.+)/i
    ];

    for (const l of lines) {
      if (!nombre) {
        for (const re of namePatterns) {
          const m = l.match(re);
          if (m && m[1]) { nombre = sanitizeLine(m[1]); break; }
        }
      }
      if (!fechaNacimiento) {
        for (const re of dobPatterns) {
          const m = l.match(re);
          if (m && m[2]) { fechaNacimiento = m[2]; break; }
          if (m && m[1]) { fechaNacimiento = m[1]; break; }
        }
      }
      if (!domicilio) {
        for (const re of addrPatterns) {
          const m = l.match(re);
          if (m && m[1]) { domicilio = sanitizeLine(m[1]); break; }
        }
      }
      if (nombre && fechaNacimiento && domicilio) break;
    }

    if (!nombre) {
      const candidate = lines.find(l => /^[A-ZÁÉÍÓÚÑ ]{5,}$/.test(l) && l.split(' ').length >= 2);
      if (candidate) nombre = sanitizeLine(candidate);
    }

    return { nombre, fechaNacimiento, domicilio };
  }

  function sanitizeLine(s: string) {
    return s.replace(/[^A-Za-zÀ-ÿ0-9 #.,\-\/]/g, '').trim();
  }

  function isValidDateStr(s: string) {
    return /^(0?[1-9]|[12][0-9]|3[01])[\/-](0?[1-9]|1[0-2])[\/-]([12]\d{3})$/.test(s);
  }

  // Eliminado: applyReviewedToForm. Los datos se aplican automáticamente tras el OCR.

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
    setUltimoExamenVisual("");
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

  // Función para manejar la selección de fechas
  const handleDateSelect = (date: Date | undefined, setDate: (date: Date | undefined) => void, setOpen: (open: boolean) => void) => {
    setDate(date);
    setOpen(false); // Cerrar el calendario automáticamente
  };

  // Función para establecer la fecha actual exacta sin modificaciones
  const establecerFechaHoy = () => {
    // Usamos startOfDay para normalizar la fecha actual sin hora/minutos/segundos
    const fechaHoy = startOfDay(new Date());
    handleDateSelect(fechaHoy, setFechaCita, setFechaCitaOpen);
  };
  
  // Función para rellenar automáticamente todos los campos con datos de prueba
  const rellenarFormularioTest = () => {
    // Datos personales
    setNombre("Paciente de Prueba");
    setTelefono("5512345678");
    setEdad("35");
    setSexo("Masculino");
    setDomicilio("Calle de Prueba 123");
    setOcupacion("Desarrollador");
    
    // Fechas
    const hoy = startOfDay(new Date());
    const fechaNac = new Date();
    fechaNac.setFullYear(fechaNac.getFullYear() - 35); // 35 años atrás
    setFechaNacimiento(fechaNac);
    setFechaCita(hoy);
    
    // Último examen visual (hace 1 año aproximado)
    setUltimoExamenVisual("1");
    
    // Motivo de consulta
    setMotivoConsulta("Revisión rutinaria");
    
    // Síntomas visuales
    setSintomasVisualesSeleccionados(["Visión borrosa", "Fatiga visual"]);
    
    // Uso de lentes
    setUsaLentes(true);
    setTipoLentesSeleccionados(["Monofocales"]);
    setTiempoUsoLentes("5 años");
    
    // Cirugías y traumatismos
    setCirugiasOculares(false);
    setTraumatismosOculares(false);
    
    // Antecedentes
    setAntecedentesVisualesFamiliaresSeleccionados(["Miopía"]);
    setAntecedentesFamiliaresSaludSeleccionados(["Hipertensión"]);
    
    // Hábitos visuales y salud
    setHabitosVisualesSeleccionados(["Uso de computadora"]);
    setSaludGeneralSeleccionados(["Buena salud general"]);
    
    // Medicamentos
    setMedicamentosActuales("Ninguno");
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

    // Verificar que tenemos un user_id
    if (!userId) {
      setError("No se pudo identificar el usuario. Verifique el enlace o escanee nuevamente el código QR.");
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
      // Preparar el domicilio según el tipo seleccionado
      let domicilioFinal = domicilio;
      if (domicilioCompleto) {
        domicilioFinal = `${domicilioFields.calle} ${domicilioFields.numero}${domicilioFields.interior ? ', Int. ' + domicilioFields.interior : ''}, Col. ${domicilioFields.colonia}`;
      }

      
      const { error: insertError } = await supabase
        .from("pacientes" as any)
        .insert([{
          user_id: userId, // Usar el user_id de la URL
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
          ultimo_examen_visual: ultimoExamenVisual
            ? `${parseInt(ultimoExamenVisual, 10)} ${parseInt(ultimoExamenVisual, 10) === 1 ? 'año' : 'años'}`
            : "",
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
        const { data: membership, error: membershipError } = await supabase
          .from("accounts_memberships")
          .select("account_id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (membershipError) {
          console.warn("No se pudo obtener accounts_memberships, intentando memberships:", membershipError);
          const { data: membership2 } = await supabase
            .from("memberships" as any)
            .select("account_id")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();
          accountId = (membership2 as any)?.account_id;
        } else {
          accountId = membership?.account_id;
        }
      } catch (e) {
        console.warn("Error obteniendo account_id:", e);
      }

      

      // Mostrar mensaje de éxito a pantalla completa
      setShowSuccessMessage(true);
      setSuccess(true);

      // Limpiar el formulario, ocultar el mensaje y cerrar la ventana después de 5 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
        limpiarFormulario();
        window.scrollTo(0, 0);
        // Cerrar la ventana después de mostrar el mensaje de éxito
        window.close();
      }, 5000);

    } catch (err) {
      console.error("Error al crear paciente:", err);
      setError("Ocurrió un error al crear el paciente. Por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      {showSuccessMessage && <SuccessMessage onClose={handleCloseSuccess} />}
      <ThemeButton mounted={mounted} currentTheme={currentTheme} onToggle={toggleTheme} />
      {/* Eliminado botón flotante móvil para mantener un único control */}
      
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">OpticSave</h1>
        
        {/* Botón para rellenar automáticamente el formulario (solo visible en desarrollo) */}
        <div className="mt-4 items-center justify-center flex">
          <Button 
            type="button" 
            variant="outline" 
            className="bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200"
            onClick={rellenarFormularioTest}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Pruebas de desarrollo
          </Button>
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
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Información del Paciente</CardTitle>
            <Button
              type="button"
              onClick={openCameraForOCR}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="Capturar imagen para OCR"
              title="Capturar imagen para OCR"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capturar imagen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
              {/* OCR: input oculto que abre la cámara del dispositivo al pulsar el botón principal */}

              {/* Flujo inline sin diálogo: cámara y revisión */}
              {/* Input oculto para abrir la cámara del dispositivo */}
              <input
                ref={ocrInputRef}
                id="ocr-file-inline"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleOcrFileChange}
                autoComplete="off"
                className="hidden"
              />

              {/* Aviso de Privacidad antes de llenar los campos */}
              <AvisoDePrivacidad
                accepted={acceptedTerms}
                onToggle={setAcceptedTerms}
              />

              {/* UI de revisión eliminada: la cámara se abre y el OCR aplica los datos automáticamente */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" autoComplete="off" aria-live="polite">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre - Campo requerido */}
              {currentStep === 0 && (
              <div className="space-y-2 transition-all" role="group" aria-labelledby="step-nombre">
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
                  aria-invalid={touched['nombre'] && nombre.trim() === ""}
                  aria-describedby={touched['nombre'] && nombre.trim() === "" ? 'error-nombre' : undefined}
                  className={touched['nombre'] && nombre.trim() === "" ? "border-red-300" : ""}
                />
                {touched['nombre'] && nombre.trim() === "" && (
                  <p id="error-nombre" className="text-red-500 text-xs" role="alert">Este campo es requerido</p>
                )}
              </div>
              )}



              {/* Fecha de Nacimiento */}
              {currentStep === 1 && (
              <div className="space-y-2 transition-all" role="group" aria-labelledby="step-fecha-nac">
                <Label id="step-fecha-nac" htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                <Popover open={fechaNacimientoOpen} onOpenChange={setFechaNacimientoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="fechaNacimiento"
                      className="w-full justify-between font-normal"
                      aria-invalid={!fechaNacimiento}
                      aria-describedby={!fechaNacimiento ? 'error-fecha-nac' : undefined}
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
                        handleDateSelect(date, setFechaNacimiento, setFechaNacimientoOpen);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {!fechaNacimiento && (
                  <p id="error-fecha-nac" className="text-red-500 text-xs" role="alert">Seleccione una fecha válida</p>
                )}
              </div>
              )}

              {/* Edad */}
              {currentStep === 2 && (
              <div className="space-y-2 transition-all" role="group" aria-labelledby="step-edad">
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
              )}

              {/* Teléfono */}
              {currentStep === 3 && (
              <div className="space-y-2 transition-all" role="group" aria-labelledby="step-telefono">
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
              )}
            </div>

            {/* Sexo - Radio buttons */}
            {currentStep === 4 && (
            <div className="space-y-2 transition-all" role="group" aria-labelledby="step-sexo">
              <Label id="step-sexo">Sexo</Label>
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
              {sexo.trim() === "" && (
                <p className="text-red-500 text-xs" role="alert">Seleccione una opción</p>
              )}
            </div>
            )}

            {/* Domicilio con switch */}
            {currentStep === 5 && (
            <div className="space-y-4 transition-all" role="group" aria-labelledby="step-domicilio">
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
            )}

            {/* Motivo de consulta */}
            {currentStep === 6 && (
            <div className="space-y-2 transition-all" role="group" aria-labelledby="step-motivo">
                  <Label id="step-motivo">Motivo de Consulta</Label>
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
                  {motivoConsulta.trim() === "" && (
                    <p className="text-red-500 text-xs" role="alert">Seleccione una opción</p>
                  )}
                </div>
            )}

                {/* Ocupación y Último examen visual en 2 columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ocupación */}
                  {currentStep === 7 && (
                  <div className="space-y-2 transition-all" role="group" aria-labelledby="step-ocupacion">
                    <Label htmlFor="ocupacion">Ocupación</Label>
                    <Input
                      id="ocupacion"
                      value={ocupacion}
                      onChange={(e) => setOcupacion(e.target.value)}
                      placeholder="Ingrese la ocupación"
                      autoComplete="off"
                    />
                  </div>
                  )}

                  {/* Último Examen Visual (años aproximados) */}
                  {currentStep === 8 && (
                  <div className="space-y-2 transition-all" role="group" aria-labelledby="step-ultimo-examen">
                    <Label htmlFor="ultimoExamenVisual">Último Examen Visual</Label>
                    <Input
                      id="ultimoExamenVisual"
                      type="number"
                      min={0}
                      step={1}
                      value={ultimoExamenVisual}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setUltimoExamenVisual(v);
                      }}
                      placeholder="¿Cuántos años aproximadamente?"
                      autoComplete="off"
                    />
                    <div className="text-xs text-muted-foreground">
                      {ultimoExamenVisual
                        ? `${parseInt(ultimoExamenVisual, 10)} ${parseInt(ultimoExamenVisual, 10) === 1 ? 'año' : 'años'}`
                        : 'Indique un número entero, por ejemplo: 1, 2, 3'}
                    </div>
                  </div>
                  )}
                </div>

                {/* Síntomas Visuales */}
                {currentStep === 9 && (
                <div className="space-y-2 transition-all" role="group" aria-labelledby="step-sintomas">
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
                  {sintomasVisualesSeleccionados.length === 0 && (
                    <p className="text-red-500 text-xs" role="alert">Seleccione al menos un síntoma</p>
                  )}
                </div>
                )}



                {/* Uso de Lentes */}
                {currentStep === 10 && (
                <div className="space-y-2 transition-all" role="group" aria-labelledby="step-lentes">
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
                )}

                {currentStep === 10 && usaLentes && (
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
                    {(tipoLentesSeleccionados.length === 0 || tiempoUsoLentes.trim() === "") && (
                      <p className="text-red-500 text-xs" role="alert">Indique tipo de lentes y tiempo de uso</p>
                    )}
                  </>
                )}

                {/* Cirugías Oculares */}
                {currentStep === 11 && (
                <div className="space-y-2 transition-all" role="group" aria-labelledby="step-cirugias">
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
                )}

                {/* Traumatismos Oculares */}
                {currentStep === 11 && (
                <div className="space-y-2 transition-all" role="group" aria-labelledby="step-trauma">
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
                  {traumatismosOculares && traumatismosDetalle.trim() === "" && (
                    <p className="text-red-500 text-xs" role="alert">Describa los traumatismos</p>
                  )}
                </div>
                )}

                {currentStep === 11 && traumatismosOculares && (
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
                {currentStep === 12 && (
                <div className="space-y-2 transition-all" role="group" aria-labelledby="step-antecedentes-visuales">
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
                  {!antecedentesVisualesFamiliaresSeleccionados.includes("Ninguno") && antecedentesVisualesFamiliaresSeleccionados.length === 0 && (
                    <p className="text-red-500 text-xs" role="alert">Seleccione al menos una opción</p>
                  )}
                </div>
                )}

                {/* Antecedentes Familiares de Salud */}
                {currentStep === 13 && (
                <div className="space-y-2 transition-all" role="group" aria-labelledby="step-antecedentes-salud">
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
                  {antecedentesFamiliaresSaludSeleccionados.length === 0 && (
                    <p className="text-red-500 text-xs" role="alert">Seleccione al menos una opción</p>
                  )}
                </div>
                )}

                {/* Hábitos Visuales */}
                {currentStep === 14 && (
                <div className="space-y-2 transition-all" role="group" aria-labelledby="step-habitos">
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
                  {habitosVisualesSeleccionados.length === 0 && (
                    <p className="text-red-500 text-xs" role="alert">Seleccione al menos una opción</p>
                  )}
                </div>
                )}

                {/* Salud General */}
                {currentStep === 15 && (
                <div className="space-y-2 transition-all" role="group" aria-labelledby="step-salud-general">
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
                  {saludGeneralSeleccionados.length === 0 && (
                    <p className="text-red-500 text-xs" role="alert">Seleccione al menos una opción</p>
                  )}
                </div>
                )}

                {/* Medicamentos Actuales y Fecha de Cita en pasos separados */}
                {currentStep === 16 && (
                  <div className="space-y-2 transition-all" role="group" aria-labelledby="step-medicamentos">
                    <Label htmlFor="medicamentosActuales">Medicamentos Actuales</Label>
                    <Input
                      id="medicamentosActuales"
                      value={medicamentosActuales}
                      onChange={(e) => setMedicamentosActuales(e.target.value)}
                      placeholder="Describa los medicamentos que toma actualmente"
                    />
                  </div>
                )}

                {currentStep === 17 && (
                  <div className="space-y-2 transition-all" role="group" aria-labelledby="step-fecha-cita">
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
                )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 mt-4 sm:mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={limpiarFormulario}
                disabled={isSubmitting}
                className="w-full sm:w-auto order-3 sm:order-1 flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Limpiar datos
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  // Marcar el campo del paso como tocado si no es válido
                  if (!isStepValid(currentStep)) {
                    switch (steps[currentStep]) {
                      case 'nombre':
                        handleBlur('nombre');
                        break;
                      case 'telefono':
                        handleBlur('telefono');
                        break;
                      default:
                        break;
                    }
                    return;
                  }
                  nextStep();
                }}
                disabled={isSubmitting || currentStep >= steps.length - 1 || !isStepValid(currentStep)}
                className="w-full sm:w-auto order-2 sm:order-2 flex items-center justify-center"
              >
                Siguiente
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting || currentStep === 0}
                className="w-full sm:w-auto order-1 sm:order-3 flex items-center justify-center"
              >
                Atrás
              </Button>

              {currentStep === steps.length - 1 && (
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting || !acceptedTerms}
                  className="bg-primary text-white w-full sm:w-auto order-4 sm:order-4 flex items-center justify-center font-bold py-6"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Guardar paciente
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
        </div>
    </>
  );
}