"use client";

import { useEffect, useState, useRef } from "react";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { useParams, useRouter } from "next/navigation";
import { format, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
// Constante para ajuste de zona horaria en días (para corregir el problema de fechas)
const AJUSTE_ZONA_HORARIA = 0; // No necesitamos ajuste al usar parseISO correctamente
import { ArrowLeft, Calendar as CalendarIcon, Phone, MapPin, Mail, User, Clock, FileText, Plus, Pencil, Trash2, CheckCircle2Icon, AlertCircleIcon, XCircleIcon, Edit, X, PencilIcon } from "lucide-react";
import { Calendar } from "@kit/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogOverlay,
    DialogClose,
} from "@kit/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@kit/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@kit/ui/alert-dialog";
import { Button } from "@kit/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@kit/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";
import { Badge } from "@kit/ui/badge";
import { Separator } from "@kit/ui/separator";
import { TeamAccountLayoutPageHeader } from '../../../../[account]/_components/team-account-layout-page-header';
import { Trans } from '@kit/ui/trans';
import { DiagnosticoForm } from "./DiagnosticoForm";
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { RecetasTable } from "./RecetasTable";
import { PrintButtons } from "./PrintButtons";


// Interfaces
interface Paciente {
    id: string;
    nombre: string;
    apellido: string;
    edad: number | null;
    sexo: string | null;
    telefono: string | null;
    email: string | null;
    domicilio: string | null;
    fecha_de_cita: string | null;
    motivo_consulta: string | null;
    estado: string | null;
    created_at: string | null;
}

interface Diagnostico {
    id: string;
    paciente_id: string;
    user_id: string;
    fecha_diagnostico: string;
    tipo_diagnostico: string | null;
    diagnostico: string | null;
    tratamiento_refraactivo: string | null;
    tratamiento: string | null;
    observaciones: string | null;
    proxima_visita: string | null;
    vb_salud_ocular: boolean;
    created_at: string;
    rx_uso_od_id?: string | null;
    rx_uso_oi_id?: string | null;
    rx_final_od_id?: string | null;
    rx_final_oi_id?: string | null;
}

// Tipos fuertes para Recetas
type RxType = 'uso' | 'final';
type EyeType = 'OD' | 'OI';
interface Relacion {
    tipo: RxType;
    ojo: EyeType;
    diagnosticoId: string;
}

interface Rx {
    id: string;
    tipo: RxType;
    ojo: EyeType;
    esf: number | null;
    cil: number | null;
    eje: number | null;
    add: number | null;
    fecha: string;
    user_id: string;
    created_at: string;
    // Alias para visualización (no duplicados)
    esfera?: number | null; // Alias de esf
    cilindro?: number | null; // Alias de cil
    adicion?: number | null; // Alias de add
    // Propiedades adicionales
    altura?: number | null;
    observaciones?: string | null;
    // Relación con el diagnóstico
    relacion?: Relacion;
}

export default function PacienteDetalle() {
    const params = useParams();
    const router = useRouter();
    const pacienteId = params.id as string;
    const account = params.account as string;
    const supabase = getSupabaseBrowserClient();
    
    // Referencia para el audio del clic
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [paciente, setPaciente] = useState<Paciente | null>(null);
    const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
    const [recetas, setRecetas] = useState<Rx[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Paciente>>({});
    const [user, setUser] = useState<any>(null);
    const [deleteDiagnosticoId, setDeleteDiagnosticoId] = useState<string | null>(null);
    const [editDiagnosticoData, setEditDiagnosticoData] = useState<Partial<Diagnostico>>({});
    const [editDiagnosticoDialogOpen, setEditDiagnosticoDialogOpen] = useState(false);
    const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
    const [citaExpirada, setCitaExpirada] = useState(false);

    // Estado para el modal de recetas
    const [rxDialogOpen, setRxDialogOpen] = useState(false);
    const [deleteRxId, setDeleteRxId] = useState<string | null>(null);

    const [rxData, setRxData] = useState({
        diagnosticoId: '',
        rxType: 'uso' as 'uso' | 'final',
        eyeType: 'OD' as 'OD' | 'OI',
        rxId: '',
        esf: null as number | null,
        cil: null as number | null,
        eje: null as number | null,
        add: null as number | null,
        fecha: new Date().toISOString().split('T')[0],
        // Campos adicionales para compatibilidad con código existente
        tipo: 'Uso',
        ojo: 'Derecho'
    });
    const [editRxData, setEditRxData] = useState<Rx | null>(null);
    
    /**
     * Busca el ID de receta en un diagnóstico según el tipo y ojo
     * @param diagnosticoId ID del diagnóstico
     * @param rxType Tipo de receta ('uso' o 'final')
     * @param eyeType Tipo de ojo ('OD' u 'OI')
     * @returns Promise con el ID de la receta o null si no se encuentra
     */
    const findRxIdInDiagnostico = async (diagnosticoId: string, rxType: RxType, eyeType: EyeType): Promise<string | null> => {
        try {
            const { data, error } = await supabase
                .from("diagnostico" as any)
                .select("rx_uso_od_id, rx_uso_oi_id, rx_final_od_id, rx_final_oi_id")
                .eq("id", diagnosticoId)
                .single();
            
            if (error) {
                console.error("Error al buscar receta:", error);
                return null;
            }
            
            if (!data) return null;
            
            const typedData = (data as unknown as DiagnosticoRxIds) || { rx_uso_od_id: null, rx_uso_oi_id: null, rx_final_od_id: null, rx_final_oi_id: null };
            
            // Determinar qué campo usar según tipo y ojo
            let fieldName: keyof DiagnosticoRxIds;
            if (rxType === 'uso' && eyeType === 'OD') fieldName = 'rx_uso_od_id';
            else if (rxType === 'uso' && eyeType === 'OI') fieldName = 'rx_uso_oi_id';
            else if (rxType === 'final' && eyeType === 'OD') fieldName = 'rx_final_od_id';
            else fieldName = 'rx_final_oi_id';
            
            console.log("Buscando receta en diagnóstico:", {
                diagnosticoId,
                rxType,
                eyeType,
                fieldName,
                foundId: typedData[fieldName]
            });
            
            return typedData[fieldName] || null;
        } catch (error) {
            console.error("Error al buscar receta:", error);
            return null;
        }
    };

    // Estado para las alertas y eliminación de recetas
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
    
    // Función para manejar el éxito al guardar una receta
    const handleRxSaveSuccess = (rxIds: string[]) => {
        // Actualizar la lista de recetas
        fetchRx();
        // Cerrar el modal
        setRxDialogOpen(false);
        // Mostrar alerta de éxito
        showAlert('success', 'Receta guardada', 'La receta ha sido guardada exitosamente');
    };
    
    // Escuchar eventos personalizados para actualizar las recetas y el estado del paciente
    useEffect(() => {
        const handleRecetasUpdated = (event: any) => {
            if (event.detail) {
                setRecetas(event.detail);
            }
        };
        
        const handlePacienteEstadoActualizado = (event: any) => {
            if (event.detail && event.detail.pacienteId === pacienteId) {
                setPaciente(prev => prev ? { ...prev, estado: event.detail.nuevoEstado } : null);
            }
        };
        
        // Agregar los listeners para los eventos personalizados
        window.addEventListener('recetasUpdated', handleRecetasUpdated);
        window.addEventListener('pacienteEstadoActualizado', handlePacienteEstadoActualizado);
        
        // Limpiar los listeners cuando el componente se desmonte
        return () => {
            window.removeEventListener('recetasUpdated', handleRecetasUpdated);
            window.removeEventListener('pacienteEstadoActualizado', handlePacienteEstadoActualizado);
        };
    }, [pacienteId]);

    // Función para obtener las recetas del paciente
    const fetchRx = async () => {
        try {
            // Obtener los diagnósticos del paciente para extraer los IDs de recetas
            const { data: diagData, error: diagError } = await supabase
                .from("diagnostico" as any)
                .select("*")
                .eq("paciente_id", pacienteId);
            
            if (diagError) throw diagError;
            
            if (diagData && Array.isArray(diagData) && diagData.length > 0) {
                // Convertir a tipo Diagnostico para acceder a las propiedades de forma segura
                const diagnosticos = diagData as unknown as Diagnostico[];
                
                // Crear un mapa para relacionar cada receta con su tipo y ojo
                const recetasMap: Record<string, { tipo: string, ojo: string, diagnosticoId: string }> = {};
                
                // Extraer todos los IDs de recetas de los diagnósticos y guardar su relación
                diagnosticos.forEach(diag => {
                    if (diag.rx_uso_od_id) {
                        recetasMap[diag.rx_uso_od_id] = { tipo: 'uso', ojo: 'OD', diagnosticoId: diag.id };
                    }
                    if (diag.rx_uso_oi_id) {
                        recetasMap[diag.rx_uso_oi_id] = { tipo: 'uso', ojo: 'OI', diagnosticoId: diag.id };
                    }
                    if (diag.rx_final_od_id) {
                        recetasMap[diag.rx_final_od_id] = { tipo: 'final', ojo: 'OD', diagnosticoId: diag.id };
                    }
                    if (diag.rx_final_oi_id) {
                        recetasMap[diag.rx_final_oi_id] = { tipo: 'final', ojo: 'OI', diagnosticoId: diag.id };
                    }
                });
                
                const rxIds = Object.keys(recetasMap);
                
                if (rxIds.length > 0) {
                    // Obtener las recetas usando los IDs
                    const { data: rxData, error: rxError } = await supabase
                        .from("rx" as any)
                        .select("*")
                        .in("id", rxIds);
                    
                    if (rxError) throw rxError;
                    
                    if (rxData && Array.isArray(rxData)) {
                        // Enriquecer los datos de recetas con la información de relación
                        const recetasEnriquecidas = (rxData as unknown as Rx[]).map(rx => {
                            const relacion = recetasMap[rx.id];
                            return {
                                ...rx,
                                relacion: relacion ? {
                                    tipo: relacion.tipo,
                                    ojo: relacion.ojo,
                                    diagnosticoId: relacion.diagnosticoId
                                } : undefined
                            };
                        });
                        
                        setRecetas(recetasEnriquecidas as any);
                    } else {
                        setRecetas([]);
                    }
                } else {
                    setRecetas([]);
                }
            } else {
                setRecetas([]);
            }
        } catch (err: any) {
            console.error("Error fetching rx:", err);
            setError(err.message || "Error al cargar las recetas");
            showAlert('error', 'Error', err.message || "Error al cargar las recetas");
        }
    };

    // Función para verificar el estado de la cita y calcular días restantes
    const verificarEstadoCita = (fechaCita: string | null) => {
        if (!fechaCita) return;
        
        // Crear fecha actual sin tiempo y en zona horaria local
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        // Usar parseISO para manejar correctamente la fecha
        let fechaCitaObj;
        try {
            // Asegurarse de que la fecha esté en formato ISO (YYYY-MM-DD)
            fechaCitaObj = parseISO(fechaCita);
            fechaCitaObj.setHours(0, 0, 0, 0);
        } catch (error) {
            console.error("Error al parsear la fecha:", error);
            return;
        }
        
        // Calcular días restantes
        const diferenciaTiempo = fechaCitaObj.getTime() - hoy.getTime();
        const diasRestantesCalc = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)) - 1; // Restando 1 día para que empate lógicamente con el día seleccionado
        
        setDiasRestantes(diasRestantesCalc);
        
        // Verificar si la cita ya pasó
        if (diasRestantesCalc < 0) {
            setCitaExpirada(true);
            // Actualizar estado del paciente a 'expirada' si ya pasó la fecha
            actualizarEstadoPaciente('expirada');
        } else {
            setCitaExpirada(false);
        }
    };
    
    // Función para actualizar el estado del paciente
    const actualizarEstadoPaciente = async (nuevoEstado: string) => {
        if (!paciente || paciente.estado === nuevoEstado) return;
        
        try {
            const { error } = await supabase
                .from("pacientes" as any)
                .update({ estado: nuevoEstado })
                .eq("id", pacienteId);
                
            if (error) throw error;
            
            // Actualizar el estado local
            setPaciente(prev => prev ? { ...prev, estado: nuevoEstado } : null);
            
        } catch (err: any) {
            console.error("Error al actualizar estado del paciente:", err);
            showAlert('error', 'Error', err.message || "Error al actualizar el estado del paciente");
        }
    };

    useEffect(() => {
        // Verificar si el usuario está logueado
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };

        checkUser();
        fetchPaciente();
        fetchDiagnosticos();
        fetchRx();
    }, [pacienteId]);
    
    // Efecto para verificar el estado de la cita cuando se carga el paciente
    useEffect(() => {
        if (paciente && paciente.fecha_de_cita) {
            verificarEstadoCita(paciente.fecha_de_cita);
        }
    }, [paciente]);
    
    // Efecto para agregar animación hover a todos los botones (sin sonido)
    useEffect(() => {
        // Sonido deshabilitado: no inicializamos ningún audio
        audioRef.current = null;
        
        // Función para aplicar efectos a los botones
        const applyButtonEffects = () => {
            const buttons = document.querySelectorAll('button');
            
            buttons.forEach(button => {
                // Evitar duplicar event listeners
                button.removeEventListener('mouseenter', handleMouseEnter);
                button.removeEventListener('mouseleave', handleMouseLeave);
                button.removeEventListener('click', handleClick);
                
                // Agregar event listeners
                button.addEventListener('mouseenter', handleMouseEnter);
                button.addEventListener('mouseleave', handleMouseLeave);
                button.addEventListener('click', handleClick);
                
                // Asegurar que el botón tenga transition
                button.style.transition = 'transform 0.2s ease';
            });
        };
        
        // Funciones de manejo de eventos
        function handleMouseEnter(e: Event) {
            const button = e.currentTarget as HTMLButtonElement;
            button.style.transform = 'scale(1.05)';
        }
        
        function handleMouseLeave(e: Event) {
            const button = e.currentTarget as HTMLButtonElement;
            button.style.transform = 'scale(1)';
        }
        
        function handleClick() {
            // Sonido deshabilitado: no reproducir audio
        }
        
        // Aplicar efectos inicialmente
        applyButtonEffects();
        
        // Configurar MutationObserver para detectar nuevos botones
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            const element = node as Element;
                            if (element.tagName === 'BUTTON' || element.querySelector('button')) {
                                shouldUpdate = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldUpdate) {
                applyButtonEffects();
            }
        });
        
        // Iniciar observación
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        // Limpieza al desmontar
        return () => {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                button.removeEventListener('mouseenter', handleMouseEnter);
                button.removeEventListener('mouseleave', handleMouseLeave);
                button.removeEventListener('click', handleClick);
            });
            observer.disconnect();
        };
    }, []);

    const fetchPaciente = async () => {
        try {
            // Usar aserciones de tipo para evitar errores de TypeScript
            const { data, error } = await supabase
                .from("pacientes" as any)
                .select("*")
                .eq("id", pacienteId)
                .single();

            if (error) {
                throw error;
            }

            // Convertir explícitamente a unknown primero para evitar errores de TypeScript
            setPaciente(data as unknown as Paciente);
        } catch (err: any) {
            console.error("Error fetching paciente:", err);
            setError(err.message || "Error al cargar los datos del paciente");
            showAlert('error', 'Error', err.message || "Error al cargar los datos del paciente");
        } finally {
            setLoading(false);
        }
    };

    const fetchDiagnosticos = async () => {
        try {
            // Usar aserciones de tipo para evitar errores de TypeScript
            const { data, error } = await supabase
                .from("diagnostico" as any)
                .select("*")
                .eq("paciente_id", pacienteId)
                .order("fecha_diagnostico", { ascending: false });

            if (error) {
                throw error;
            }

            // Convertir explícitamente a unknown primero para evitar errores de TypeScript
            setDiagnosticos(data as unknown as Diagnostico[]);
        } catch (err: any) {
            console.error("Error fetching diagnosticos:", err);
            setError(err.message || "Error al cargar los diagnósticos");
            showAlert('error', 'Error', err.message || "Error al cargar los diagnósticos");
        }
    };

    const handleNuevoDiagnostico = () => {
        // Verificar si el usuario está logueado
        if (!user) {
            showAlert('error', 'Acceso denegado', 'Debe iniciar sesión para agregar diagnósticos');
            return;
        }
        
        // Verificar si la cita ya expiró
        if (citaExpirada) {
            showAlert('error', 'Cita expirada', 'No se pueden agregar diagnósticos a citas pasadas');
            return;
        }
        
        // Verificar si aún no es el día de la cita
        if (diasRestantes !== null && diasRestantes > 0) {
            showAlert('error', 'Cita pendiente', `No se pueden agregar diagnósticos antes de la fecha de cita. Faltan ${diasRestantes} días.`);
            return;
        }
        
        // Verificar si la fecha de cita es igual a la fecha actual
        if (paciente?.fecha_de_cita) {
            // Normalizar la fecha de cita para evitar problemas de zona horaria
            const fechaCitaStr = paciente.fecha_de_cita || '';
            // Verificar si la cadena existe antes de usar includes
            const fechaPartes = fechaCitaStr && typeof fechaCitaStr === 'string' && fechaCitaStr.includes('T') ?
                (fechaCitaStr.split('T')[0]?.split('-') || []) :
                (typeof fechaCitaStr === 'string' ? fechaCitaStr.split('-') : []);
            if (!fechaPartes || !Array.isArray(fechaPartes) || !fechaPartes.length || fechaPartes.length !== 3) return; // Validación para evitar errores
            
            // Usar valores predeterminados para evitar undefined
            const parte0 = fechaPartes[0] || "0";
            const parte1 = fechaPartes[1] || "0";
            const parte2 = fechaPartes[2] || "0";
            
            const año = parseInt(parte0);
            const mes = parseInt(parte1) - 1; // Los meses en JavaScript son 0-11
            const día = parseInt(parte2);
            
            // Crear objeto de fecha con esos componentes en zona horaria local
            let fechaCita = new Date(año, mes, día);
            // Ya no necesitamos ajuste de zona horaria
            fechaCita.setHours(0, 0, 0, 0);
            
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            
            // Eliminamos esta validación para permitir crear diagnósticos en cualquier día
            // La validación de diasRestantes ya se encarga de verificar si la cita es futura
            // if (fechaCita.getTime() !== hoy.getTime()) {
            //     showAlert('error', 'Fecha incorrecta', 'Solo se pueden crear recetas en la fecha programada para la cita');
            //     return;
            // }
        }
        
        setDialogOpen(true);
    };

    const handleEditDiagnostico = (diagnosticoId: string) => {
        // Verificar si el usuario está logueado
        if (!user) {
            showAlert('error', 'Acceso denegado', 'Debe iniciar sesión para editar diagnósticos');
            return;
        }

        // Buscar el diagnóstico seleccionado
        const diagnosticoToEdit = diagnosticos.find(d => d.id === diagnosticoId);
        if (diagnosticoToEdit) {
            setEditDiagnosticoData(diagnosticoToEdit);
            setEditDiagnosticoDialogOpen(true);
        } else {
            showAlert('error', 'Error', 'No se encontró el diagnóstico para editar');
        }
    };

    const handleSaveEditedDiagnostico = async () => {
        try {
            if (!editDiagnosticoData.id) return;

            // Verificar si el usuario está logueado
            if (!user) {
                showAlert('error', 'Acceso denegado', 'Debe iniciar sesión para editar diagnósticos');
                return;
            }

            // Preparar los datos para actualizar
            const diagnosticoActualizado = {
                ...editDiagnosticoData,
                fecha_diagnostico: editDiagnosticoData.fecha_diagnostico || new Date().toISOString().split('T')[0],
                tipo_diagnostico: editDiagnosticoData.tipo_diagnostico,
                diagnostico: editDiagnosticoData.diagnostico,
                tratamiento_refraactivo: editDiagnosticoData.tratamiento_refraactivo,
                tratamiento: editDiagnosticoData.tratamiento,
                observaciones: editDiagnosticoData.observaciones,
                proxima_visita: editDiagnosticoData.proxima_visita
                    ? addDays(parseISO(editDiagnosticoData.proxima_visita), 1).toISOString().split('T')[0]
                    : null,
                vb_salud_ocular: editDiagnosticoData.vb_salud_ocular,
                // La propiedad dip ya no se usa
                updated_at: new Date().toISOString()
            };

            // Eliminar campos que no deben actualizarse
            delete diagnosticoActualizado.user_id; // No actualizamos el usuario que creó el diagnóstico
            delete diagnosticoActualizado.paciente_id; // No actualizamos el paciente
            delete diagnosticoActualizado.created_at; // No actualizamos la fecha de creación

            // Eliminar campos UUID que son referencias a otras tablas si no se están modificando
            const diagnosticoActualizadoAny = diagnosticoActualizado as any;
            ['rx_uso_od_id', 'rx_uso_oi_id', 'rx_final_od_id', 'rx_final_oi_id'].forEach(field => {
                if (!diagnosticoActualizadoAny[field]) {
                    delete diagnosticoActualizadoAny[field];
                }
            });

            const { error } = await supabase
                .from("diagnostico" as any)
                .update(diagnosticoActualizado)
                .eq("id", editDiagnosticoData.id);

            if (error) throw error;

            showAlert('success', 'Diagnóstico actualizado', 'El diagnóstico ha sido actualizado correctamente');
            fetchDiagnosticos(); // Recargar los diagnósticos
            setEditDiagnosticoDialogOpen(false);
        } catch (err: any) {
            console.error("Error al actualizar diagnóstico:", err);
            showAlert('error', 'Error', err.message || "Error al actualizar el diagnóstico");
        }
    };

    // Función para guardar la receta
    const handleSaveRx = async () => {
        try {
            // Verificar si el usuario está logueado
            if (!user) {
                showAlert('error', 'Acceso denegado', 'Debe iniciar sesión para agregar recetas');
                return;
            }

            // Preparar los datos para guardar
            const rxDataToSave = {
                tipo: rxData.tipo,
                ojo: rxData.ojo,
                esf: rxData.esf,
                cil: rxData.cil,
                eje: rxData.eje,
                add: rxData.add,
                fecha: rxData.fecha,
                user_id: user.id
            };

            // Guardar en la base de datos
            const { data, error } = await supabase
                .from("rx" as any)
                .insert(rxDataToSave)
                .select();

            if (error) throw error;

            // Actualizar el diagnóstico con la referencia a la receta
            if (data && data.length > 0 && data[0] && 'id' in data[0]) {
                const rxId = data[0].id;

                // Obtener el diagnóstico actual
                const { data: diagData, error: diagError } = await supabase
                    .from("diagnostico" as any)
                    .select("*")
                    .eq("paciente_id", pacienteId)
                    .order("created_at", { ascending: false })
                    .limit(1);

                if (diagError) throw diagError;

                if (diagData && diagData.length > 0 && diagData[0] && 'id' in diagData[0]) {
                    const diagId = diagData[0].id || '';
                    
                    // Determinar el campo correcto según el tipo y ojo seleccionados
                    let updateField = '';
                    
                    // Si es tipo 'uso' y ojo 'OI' (izquierdo)
                    if (rxData.tipo === 'uso' && rxData.ojo === 'OI') {
                        updateField = 'rx_uso_oi_id';
                    }
                    // Si es tipo 'uso' y ojo 'OD' (derecho)
                    else if (rxData.tipo === 'uso' && rxData.ojo === 'OD') {
                        updateField = 'rx_uso_od_id';
                    }
                    // Si es tipo 'final' y ojo 'OI' (izquierdo)
                    else if (rxData.tipo === 'final' && rxData.ojo === 'OI') {
                        updateField = 'rx_final_oi_id';
                    }
                    // Si es tipo 'final' y ojo 'OD' (derecho)
                    else if (rxData.tipo === 'final' && rxData.ojo === 'OD') {
                        updateField = 'rx_final_od_id';
                    }

                    // Actualizar el diagnóstico con la referencia a la receta
                    const updateData = {} as any;
                    updateData[updateField] = rxId;

                    const { error: updateError } = await supabase
                        .from("diagnostico" as any)
                        .update(updateData)
                        .eq("id", diagId);

                    if (updateError) throw updateError;
                }
            }

            showAlert('success', 'Receta guardada', 'La receta ha sido guardada correctamente');
            setRxDialogOpen(false);

            // Resetear el formulario
            setRxData({
                diagnosticoId: '',
                rxType: 'uso',
                eyeType: 'OD',
                rxId: '',
                esf: null,
                cil: null,
                eje: null,
                add: null,
                fecha: new Date().toISOString().split('T')[0],
                tipo: 'uso',
                ojo: 'OD'
            });

            // Recargar los diagnósticos para mostrar la nueva receta
            fetchDiagnosticos();
        } catch (err: any) {
            console.error("Error al guardar receta:", err);
            showAlert('error', 'Error', err.message || "Error al guardar la receta");
        }
    };

    const handleDeleteDiagnostico = (diagnosticoId: string) => {
        // Verificar si el usuario está logueado
        if (!user) {
            showAlert('error', 'Acceso denegado', 'Debe iniciar sesión para eliminar diagnósticos');
            return;
        }
        setDeleteDiagnosticoId(diagnosticoId);
    };

    // Interfaz para controlar y solucionar errores de tipado
    interface DiagnosticoRxIds {
        rx_uso_od_id: string | null;
        rx_uso_oi_id: string | null;
        rx_final_od_id: string | null;
        rx_final_oi_id: string | null;
    }

    const confirmDeleteDiagnostico = async () => {
        if (!deleteDiagnosticoId) return;

        try {
            // Primero obtenemos el diagnóstico para identificar las recetas referenciadas
            const { data, error: getDiagError } = await supabase
                .from("diagnostico" as any)
                .select("rx_uso_od_id, rx_uso_oi_id, rx_final_od_id, rx_final_oi_id")
                .eq("id", deleteDiagnosticoId)
                .single();

            if (getDiagError) throw getDiagError;
            
            // Verificamos si data es un error antes de la conversión
            if ('error' in data) {
                throw new Error(`Error al obtener datos del diagnóstico: ${JSON.stringify(data)}`);
            }
            
            // Aseguramos que los datos tengan el tipo correcto
            const diagnosticoData = data as unknown as DiagnosticoRxIds;

            // Recopilamos los IDs de recetas a eliminar (filtrando los nulos)
            const rxIdsToDelete = [
                diagnosticoData.rx_uso_od_id,
                diagnosticoData.rx_uso_oi_id,
                diagnosticoData.rx_final_od_id,
                diagnosticoData.rx_final_oi_id
            ].filter(id => id !== null);

            // Eliminamos las recetas referenciadas si existen
            if (rxIdsToDelete.length > 0) {
                const { error: rxError } = await supabase
                    .from("rx" as any)
                    .delete()
                    .in("id", rxIdsToDelete);

                if (rxError) throw rxError;
            }

            // Nota: No es necesario eliminar recetas por diagnostico_id ya que esta columna no existe en la tabla rx
            // La eliminación de recetas relacionadas ya se maneja con los IDs específicos arriba

            // Finalmente eliminamos el diagnóstico
            const { error } = await supabase
                .from("diagnostico" as any)
                .delete()
                .eq("id", deleteDiagnosticoId);

            if (error) throw error;

            showAlert('success', 'Diagnóstico eliminado', 'El diagnóstico y sus recetas asociadas han sido eliminados correctamente');
            fetchDiagnosticos(); // Recargar los diagnósticos
            fetchRx(); // Recargar las recetas
        } catch (err: any) {
            console.error("Error al eliminar diagnóstico:", err);
            
            // Interfaz de control y solución de errores
            let errorMessage = 'Error al eliminar el diagnóstico';
            let errorTitle = 'Error';
            
            if (err.code) {
                switch (err.code) {
                    case '23503': // Error de clave foránea
                        errorMessage = 'No se puede eliminar el diagnóstico porque tiene datos relacionados';
                        errorTitle = 'Error de relación';
                        break;
                    case '42P01': // Tabla no existe
                        errorMessage = 'Error en la estructura de la base de datos';
                        errorTitle = 'Error de estructura';
                        break;
                    case '42703': // Columna no existe
                        errorMessage = 'Error en la estructura de la tabla';
                        errorTitle = 'Error de estructura';
                        break;
                    case '23505': // Violación de unicidad
                        errorMessage = 'Conflicto con datos existentes';
                        errorTitle = 'Error de datos';
                        break;
                    default:
                        errorMessage = `Error (${err.code}): ${err.message || 'Error desconocido'}`;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            showAlert('error', errorTitle, errorMessage);
        } finally {
            setDeleteDiagnosticoId(null);
        }
    };
    
    // Función para eliminar una receta
    const handleDeleteRx = (rxId?: string) => {
        // Verificar si el usuario está logueado
        if (!user) {
            showAlert('error', 'Acceso denegado', 'Debe iniciar sesión para eliminar recetas');
            return;
        }
        // Validar que el ID de la receta sea válido
        if (!rxId) {
            showAlert('error', 'ID de receta inválido', 'No se pudo determinar la receta a eliminar');
            return;
        }
        setDeleteRxId(rxId);
    };
    
    // Función para confirmar la eliminación de una receta
    const confirmDeleteRx = async () => {
        if (!deleteRxId) return;

        try {
            // Primero, encontrar la receta para obtener su relación con el diagnóstico
            const recetaToDelete = recetas.find(r => r.id === deleteRxId);
            
            if (recetaToDelete?.relacion) {
                // Determinar qué campo actualizar en el diagnóstico
                const { tipo, ojo, diagnosticoId } = recetaToDelete.relacion;
                let fieldToUpdate = '';
                
                if (tipo === 'uso' && ojo === 'OD') fieldToUpdate = 'rx_uso_od_id';
                else if (tipo === 'uso' && ojo === 'OI') fieldToUpdate = 'rx_uso_oi_id';
                else if (tipo === 'final' && ojo === 'OD') fieldToUpdate = 'rx_final_od_id';
                else if (tipo === 'final' && ojo === 'OI') fieldToUpdate = 'rx_final_oi_id';
                
                // Actualizar el diagnóstico para eliminar la referencia a la receta
                if (fieldToUpdate && diagnosticoId) {
                    const updateData = {} as any;
                    updateData[fieldToUpdate] = null;
                    
                    const { error: updateError } = await supabase
                        .from("diagnostico" as any)
                        .update(updateData)
                        .eq("id", diagnosticoId);
                    
                    if (updateError) throw updateError;
                }
            }
            
            // Eliminar la receta
            const { error } = await supabase
                .from("rx" as any)
                .delete()
                .eq("id", deleteRxId);

            if (error) throw error;

            showAlert('success', 'Receta eliminada', 'La receta ha sido eliminada correctamente');
            fetchRx(); // Recargar las recetas
        } catch (err: any) {
            console.error("Error al eliminar receta:", err);
            showAlert('error', 'Error', err.message || "Error al eliminar la receta");
        } finally {
            setDeleteRxId(null);
        }
    };

    const handleDiagnosticoSaved = (success: boolean, errorMessage?: string) => {
        if (success) {
            fetchDiagnosticos(); // Recargar los diagnósticos
            showAlert('success', 'Diagnóstico guardado', 'El diagnóstico se ha guardado correctamente');
        } else if (errorMessage) {
            setError(errorMessage);
            showAlert('error', 'Error', errorMessage);
        }
    };

    const handleEditPaciente = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Verificar si el usuario está logueado
            if (!user) {
                showAlert('error', 'Acceso denegado', 'Debe iniciar sesión para editar pacientes');
                setLoading(false);
                return;
            }

            // Asegurarse de que todos los campos tengan el formato correcto
            const pacienteActualizado = {
                ...editForm,
                edad: editForm.edad ? Number(editForm.edad) : null,
            };

            console.log("Datos a actualizar:", pacienteActualizado);

            const { error, data } = await supabase
                .from("pacientes" as any)
                .update(pacienteActualizado)
                .eq("id", pacienteId)
                .select();

            if (error) throw error;

            console.log('Paciente actualizado correctamente:', data);

            // Recargar los datos del paciente
            await fetchPaciente();
            setEditDialogOpen(false);

            // Mostrar notificación de éxito
            showAlert('success', 'Actualización exitosa', 'Paciente actualizado correctamente');
        } catch (err: any) {
            console.error("Error al actualizar paciente:", err);
            setError(err.message || "Error al actualizar el paciente");
            showAlert('error', 'Error', err.message || "Error al actualizar el paciente");
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePaciente = async () => {
        try {
            setLoading(true);

            // Verificar si el usuario está logueado
            if (!user) {
                showAlert('error', 'Acceso denegado', 'Debe iniciar sesión para eliminar pacientes');
                setLoading(false);
                return;
            }
            
            // Mostrar diálogo de confirmación con resumen de datos
            setDeleteDialogOpen(true);
            setLoading(false);
            return;
        } catch (err: any) {
            console.error("Error al preparar eliminación:", err);
            showAlert('error', 'Error', err.message || "Error al preparar la eliminación");
            setLoading(false);
        }
    };
    
    // Función para confirmar y ejecutar la eliminación del paciente
    const confirmarEliminacionPaciente = async () => {
        try {
            setLoading(true);
            
            const { error } = await supabase
                .from("pacientes" as any)
                .delete()
                .eq("id", pacienteId);

            if (error) throw error;

            // Cerrar el diálogo de confirmación
            setDeleteDialogOpen(false);
            
            showAlert('success', 'Paciente eliminado', 'El paciente y todos sus registros asociados han sido eliminados correctamente');

            // Redirigir después de mostrar la alerta (con un pequeño retraso para que se vea la alerta)
            setTimeout(() => {
                router.push(`/home/dashboard/view`);
            }, 1000);
        } catch (err: any) {
            console.error("Error al eliminar paciente:", err);
            setError(err.message || "Error al eliminar el paciente");
            showAlert('error', 'Error', err.message || "Error al eliminar el paciente");
            setLoading(false);
        } finally {
            // Asegurar que el diálogo se cierre en caso de error
            if (loading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (paciente && editDialogOpen) {
            setEditForm({
                nombre: paciente.nombre,
                apellido: paciente.apellido,
                edad: paciente.edad,
                sexo: paciente.sexo,
                telefono: paciente.telefono,
                email: paciente.email,
                domicilio: paciente.domicilio,
                motivo_consulta: paciente.motivo_consulta,
                fecha_de_cita: paciente.fecha_de_cita
            });
        }
    }, [editDialogOpen, paciente]);

    if (loading) return <div className="flex justify-center p-8"><p>Cargando información del paciente...</p></div>;
    if (error) return <div className="bg-destructive/20 p-4 rounded-md"><p>Error: {error}</p></div>;
    if (!paciente) return <div className="bg-destructive/20 p-4 rounded-md"><p>No se encontró el paciente</p></div>;

    return (
        <div className="space-y-6 mx-[45px]">
            {/* Componente de alerta */}
            {alertInfo.show && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md animate-in fade-in slide-in-from-top-5">
                    <Alert
                        className="bg-white text-gray-700 shadow-lg"
                    >
                        {alertInfo.type === 'success' && <CheckCircle2Icon className="h-4 w-4" />}
                        {alertInfo.type === 'warning' && <AlertCircleIcon className="h-4 w-4" />}
                        {alertInfo.type === 'error' && <XCircleIcon className="h-4 w-4" />}
                        <AlertTitle className="text-gray-800">{alertInfo.title}</AlertTitle>
                        <AlertDescription className="text-gray-700">{alertInfo.message}</AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Modal para editar diagnóstico */}
            <Dialog open={editDiagnosticoDialogOpen} onOpenChange={setEditDiagnosticoDialogOpen}>
                <DialogOverlay className="fixed inset-0 backdrop-blur-sm bg-black/0.1" />
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar Diagnóstico</DialogTitle>
                        <DialogDescription>
                            Modifique los datos del diagnóstico y guarde los cambios.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="fecha_diagnostico" className="text-right">
                                Fecha de diagnóstico
                            </label>
                            <input
                                type="date"
                                id="fecha_diagnostico"
                                className="col-span-3 p-2 border rounded"
                                value={editDiagnosticoData.fecha_diagnostico || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setEditDiagnosticoData({ ...editDiagnosticoData, fecha_diagnostico: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="tipo_diagnostico" className="text-right">
                                Tipo de diagnóstico
                            </label>
                            <input
                                id="tipo_diagnostico"
                                className="col-span-3 p-2 border rounded"
                                value={editDiagnosticoData.tipo_diagnostico || ''}
                                onChange={(e) => setEditDiagnosticoData({ ...editDiagnosticoData, tipo_diagnostico: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="diagnostico" className="text-right">
                                Diagnóstico
                            </label>
                            <textarea
                                id="diagnostico"
                                className="col-span-3 p-2 border rounded"
                                value={editDiagnosticoData.diagnostico || ''}
                                onChange={(e) => setEditDiagnosticoData({ ...editDiagnosticoData, diagnostico: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="tratamiento_refraactivo" className="text-right">
                                Tratamiento refractivo
                            </label>
                            <textarea
                                id="tratamiento_refraactivo"
                                className="col-span-3 p-2 border rounded"
                                value={editDiagnosticoData.tratamiento_refraactivo || ''}
                                onChange={(e) => setEditDiagnosticoData({ ...editDiagnosticoData, tratamiento_refraactivo: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="tratamiento" className="text-right">
                                Tratamiento
                            </label>
                            <textarea
                                id="tratamiento"
                                className="col-span-3 p-2 border rounded"
                                value={editDiagnosticoData.tratamiento || ''}
                                onChange={(e) => setEditDiagnosticoData({ ...editDiagnosticoData, tratamiento: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="observaciones" className="text-right">
                                Observaciones
                            </label>
                            <textarea
                                id="observaciones"
                                className="col-span-3 p-2 border rounded"
                                value={editDiagnosticoData.observaciones || ''}
                                onChange={(e) => setEditDiagnosticoData({ ...editDiagnosticoData, observaciones: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="proxima_visita" className="text-right">
                                Próxima visita
                            </label>
                            <input
                                type="date"
                                id="proxima_visita"
                                className="col-span-3 p-2 border rounded"
                                value={editDiagnosticoData.proxima_visita || ''}
                                onChange={(e) => setEditDiagnosticoData({ ...editDiagnosticoData, proxima_visita: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="dip" className="text-right">
                                DIP (mm)
                            </label>
                            {/* Campo DIP eliminado ya que no se usa más */}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="vb_salud_ocular" className="text-right">
                                VB Salud Ocular
                            </label>
                            <input
                                type="checkbox"
                                id="vb_salud_ocular"
                                checked={editDiagnosticoData.vb_salud_ocular || false}
                                onChange={(e) => setEditDiagnosticoData({ ...editDiagnosticoData, vb_salud_ocular: e.target.checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDiagnosticoDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveEditedDiagnostico}>
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <TeamAccountLayoutPageHeader
                account={account}
                title={<Trans i18nKey={'common:routes.historialClinico'} />}
                description={''}
            />

            {/* Botón para volver */}
            <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => router.push(`/home/dashboard/view`)}
            >
                <ArrowLeft className="h-4 w-4" /> Volver a la lista de pacientes
            </Button>

            {/* Información del paciente */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{paciente.nombre} {paciente.apellido}</CardTitle>
                            <CardDescription>
                                {paciente.edad && `${paciente.edad} años`} {paciente.sexo && `• ${paciente.sexo}`}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Badge variant={paciente.estado === "Activo" ? "success" : paciente.estado === "Pendiente" ? "warning" : "default"}>
                                {paciente.estado || "Sin estado"}
                            </Badge>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditDialogOpen(true)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDeleteDialogOpen(true)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{paciente.telefono || "No disponible"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{paciente.domicilio || "No disponible"}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    {paciente.fecha_de_cita
                                        ? format(new Date(paciente.fecha_de_cita), "PPP", { locale: es })
                                        : "Sin fecha de cita"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">                         
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>Motivo de consulta: {paciente.motivo_consulta || "No especificado"}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card para mostrar los días restantes para la cita */}
            {diasRestantes !== null && diasRestantes > 0 && (
                <Card className="mt-4 border-2 border-blue-400 bg-blue-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-blue-700">Próxima Cita</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-blue-800 font-medium">
                            El paciente tiene su cita programada en <span className="font-bold text-xl">{diasRestantes}</span> {diasRestantes === 1 ? 'día' : 'días'}.
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                            No se podrá registrar diagnósticos hasta el día de la cita.
                        </p>
                    </CardContent>
                </Card>
            )}
            
            {/* Mensaje de cita expirada */}
            {citaExpirada && (
                <Card className="mt-4 border-2 border-red-400 bg-red-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-red-700">Cita Expirada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-800">
                            La fecha de consulta del paciente ya ha pasado. El estado ha sido actualizado a 'expirada'.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Tabs para historial clínico */}
            <Tabs defaultValue="diagnosticos" className="w-full">
                <TabsList>
                    <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
                    <TabsTrigger value="recetas">Recetas</TabsTrigger>
                </TabsList>
                <TabsContent value="diagnosticos" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Historial de diagnósticos</h3>
                        {diagnosticos.length === 0 && (
                            <Button onClick={handleNuevoDiagnostico} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Nuevo diagnóstico
                            </Button>
                        )}
                    </div>

                    {diagnosticos.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                No hay diagnósticos registrados para este paciente.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {diagnosticos.map((diagnostico) => (
                                <Card key={diagnostico.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {diagnostico.tipo_diagnostico || "Diagnóstico"}
                                                </CardTitle>
                                                <CardDescription>
                                                    {format(new Date(diagnostico.fecha_diagnostico), "PPP", { locale: es })}
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEditDiagnostico(diagnostico.id)}>
                                                    <Pencil className="h-4 w-4 mr-1" /> Editar
                                                </Button>

                                                <AlertDialog open={deleteDiagnosticoId === diagnostico.id} onOpenChange={(open) => !open && setDeleteDiagnosticoId(null)}>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteDiagnostico(diagnostico.id)}>
                                                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Está seguro de eliminar este diagnóstico?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                <p className="mb-2">Esta acción no se puede deshacer. El diagnóstico será eliminado permanentemente.</p>
                                                                <p className="font-semibold text-destructive">ADVERTENCIA: También se eliminarán todas las recetas asociadas a este diagnóstico, incluyendo:</p>
                                                                <ul className="list-disc pl-5 mt-2 text-destructive">
                                                                    <li>Recetas de uso (OD y OI)</li>
                                                                    <li>Recetas finales (OD y OI)</li>
                                                                    <li>Cualquier otra receta vinculada a este diagnóstico</li>
                                                                </ul>
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={confirmDeleteDiagnostico}>
                                                                Eliminar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>

                                                <Badge variant={diagnostico.vb_salud_ocular ? "success" : "default"}>
                                                    {diagnostico.vb_salud_ocular ? "VB Salud Ocular" : "Sin VB"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <div className="space-y-4">
                                            {diagnostico.diagnostico && (
                                                <div>
                                                    <h4 className="font-medium mb-1">Diagnóstico</h4>
                                                    <p className="text-sm">{diagnostico.diagnostico}</p>
                                                </div>
                                            )}

                                            {diagnostico.tratamiento_refraactivo && (
                                                <div>
                                                    <h4 className="font-medium mb-1">Tratamiento refractivo</h4>
                                                    <p className="text-sm">{diagnostico.tratamiento_refraactivo}</p>
                                                </div>
                                            )}

                                            {diagnostico.tratamiento && (
                                                <div>
                                                    <h4 className="font-medium mb-1">Tratamiento</h4>
                                                    <p className="text-sm">{diagnostico.tratamiento}</p>
                                                </div>
                                            )}

                                            {diagnostico.observaciones && (
                                                <div>
                                                    <h4 className="font-medium mb-1">Observaciones</h4>
                                                    <p className="text-sm">{diagnostico.observaciones}</p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                {/* Información de DIP eliminada ya que no se usa más */}

                                                {diagnostico.proxima_visita && (
                                                    <div>
                                                        <span className="text-muted-foreground">Próxima visita:</span> {format(new Date(diagnostico.proxima_visita), "PPP", { locale: es })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="recetas" className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Recetas</h3>                  
                    </div>                 
                    <RecetasTable
                      pacienteId={pacienteId}
                      recetas={recetas}
                      showAlert={showAlert}
                      setRxData={setRxData}
                      setRxDialogOpen={setRxDialogOpen}
                      handleDeleteRx={handleDeleteRx}
                    />
                </TabsContent>
            </Tabs>

            {/* Formulario de diagnóstico */}
            <DiagnosticoForm
                pacienteId={pacienteId}
                userId="user_id" // Aquí deberías pasar el ID del usuario actual
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSaved={handleDiagnosticoSaved}
            />


            {/* Modal para agregar recetas */}

            {/* Modal para editar paciente */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogOverlay className="fixed inset-0 backdrop-blur-sm bg-black/0.1" />
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Editar paciente</DialogTitle>
                        <DialogDescription>
                            Modifica la información del paciente y guarda los cambios.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditPaciente}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="nombre" className="text-sm font-medium">Nombre</label>
                                    <input
                                        id="nombre"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={editForm.nombre || ''}
                                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="apellido" className="text-sm font-medium">Apellido</label>
                                    <input
                                        id="apellido"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={editForm.apellido || ''}
                                        onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="edad" className="text-sm font-medium">Edad</label>
                                    <input
                                        id="edad"
                                        type="number"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={editForm.edad || ''}
                                        onChange={(e) => setEditForm({ ...editForm, edad: e.target.value ? parseInt(e.target.value) : null })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="sexo" className="text-sm font-medium">Sexo</label>
                                    <select
                                        id="sexo"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={editForm.sexo || ''}
                                        onChange={(e) => setEditForm({ ...editForm, sexo: e.target.value })}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="telefono" className="text-sm font-medium">Teléfono</label>
                                <input
                                    id="telefono"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editForm.telefono || ''}
                                    onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="domicilio" className="text-sm font-medium">Domicilio</label>
                                <input
                                    id="domicilio"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editForm.domicilio || ''}
                                    onChange={(e) => setEditForm({ ...editForm, domicilio: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="motivo_consulta" className="text-sm font-medium">Motivo de consulta</label>
                                <textarea
                                    id="motivo_consulta"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editForm.motivo_consulta || ''}
                                    onChange={(e) => setEditForm({ ...editForm, motivo_consulta: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="fecha_de_cita" className="text-sm font-medium">Fecha de cita</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="fecha_de_cita"
                                            variant="outline"
                                            className={`w-full justify-start text-left font-normal ${!editForm.fecha_de_cita && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {editForm.fecha_de_cita ? (
                                                format(new Date(editForm.fecha_de_cita), "PPP", { locale: es })
                                            ) : (
                                                <span>Seleccionar fecha</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={editForm.fecha_de_cita ? new Date(editForm.fecha_de_cita) : undefined}
                                            onSelect={(date: Date | undefined) => {
                                                if (date) {
                                                    // Agregar un día a la fecha seleccionada para corregir el desfase
                                                    // Establecer hora a mediodía para evitar problemas de zona horaria
                                                    const selectedDate = new Date(date);
                                                    selectedDate.setDate(selectedDate.getDate() + 1); // Agregar un día
                                                    selectedDate.setHours(12, 0, 0, 0);
                                                    const formattedDate = format(selectedDate, "yyyy-MM-dd");
                                                    setEditForm({ ...editForm, fecha_de_cita: formattedDate });
                                                }
                                            }}
                                            initialFocus
                                            locale={es}
                                            modifiersStyles={{
                                                hover: { backgroundColor: 'transparent' } // Eliminar el efecto hover
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Guardando..." : "Guardar cambios"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal para eliminar paciente */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-red-600">Confirmar eliminación de paciente</DialogTitle>
                        <DialogDescription className="space-y-4 pt-4">
                            <div className="text-red-600 font-semibold">
                                ¡ATENCIÓN! Esta acción no se puede deshacer. Se eliminarán permanentemente el paciente y todos sus datos asociados.
                            </div>
                            
                            <div className="border p-4 rounded-md bg-gray-50">
                                <h3 className="font-bold text-lg mb-2">Resumen de datos del paciente:</h3>
                                {paciente && (
                                    <div className="space-y-2">
                                        <p><span className="font-semibold">Nombre completo:</span> {paciente.nombre} {paciente.apellido}</p>
                                        <p><span className="font-semibold">Edad:</span> {paciente.edad || 'No especificada'}</p>
                                        <p><span className="font-semibold">Teléfono:</span> {paciente.telefono || 'No especificado'}</p>
                                        <p><span className="font-semibold">Email:</span> {paciente.email || 'No especificado'}</p>
                                        <p><span className="font-semibold">Fecha de cita:</span> {paciente.fecha_de_cita ? format(new Date(paciente.fecha_de_cita), "PPP", { locale: es }) : 'No especificada'}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="border p-4 rounded-md bg-yellow-50 text-yellow-800">
                                <h3 className="font-bold mb-2">¡Advertencia de eliminación en cascada!</h3>
                                <p>Al eliminar este paciente también se eliminarán:</p>
                                <ul className="list-disc pl-5 mt-2">
                                    <li><span className="font-semibold">{diagnosticos.length}</span> diagnósticos asociados</li>
                                    <li><span className="font-semibold">{recetas.length}</span> recetas asociadas</li>
                                    <li>Todas las referencias en otras tablas que dependan de este paciente</li>
                                </ul>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="button" variant="destructive" onClick={confirmarEliminacionPaciente} disabled={loading}>
                            {loading ? "Eliminando..." : "Confirmar eliminación"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diálogo de confirmación para eliminar receta */}
            <AlertDialog open={deleteRxId !== null} onOpenChange={(open) => !open && setDeleteRxId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de eliminar esta receta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La receta será eliminada permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteRx}>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Componente de botones de impresión */}
            <PrintButtons pacienteId={params.id as string} />
        </div>
    );
}