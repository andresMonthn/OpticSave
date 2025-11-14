"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, Suspense } from "react";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { useParams, useRouter } from "next/navigation";
import { format, addDays, parseISO, isValid, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Briefcase, Calendar as CalendarIcon, CalendarCheck, Eye, Phone, MapPin, FileText, Pencil, Trash2, CheckCircle2Icon, AlertCircleIcon, XCircleIcon, Edit, X, PencilIcon } from "lucide-react";
    import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
 
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
import { Calendar } from "@kit/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@kit/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";
import { Badge } from "@kit/ui/badge";
import { Separator } from "@kit/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@kit/ui/accordion";
import { TeamAccountLayoutPageHeader } from '../../../../[account]/_components/team-account-layout-page-header';
import { Trans } from '@kit/ui/trans';
import { Paciente, Diagnostico, Rx } from '@/app/home/(user)/dashboard/historialclinico/[id]/types';
import { formatDateSafe } from '@/app/home/(user)/dashboard/historialclinico/[id]/utils/helpers';
import { useAlerts } from '@/app/home/(user)/dashboard/historialclinico/[id]/hooks/useAlerts';
import { usePaciente } from '@/app/home/(user)/dashboard/historialclinico/[id]/hooks/usePaciente';
import { useRecetas } from '@/app/home/(user)/dashboard/historialclinico/[id]/hooks/useRecetas';
// Importar componentes con dynamic para evitar errores de carga
const DiagnosticoForm = dynamic(() => import("./DiagnosticoForm").then(mod => ({ default: mod.DiagnosticoForm })), {
    ssr: false,
    loading: () => <div>Cargando formulario...</div>
});
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
const RecetasTable = dynamic(() => import("./RecetasTable").then(mod => ({ default: mod.RecetasTable })), {
    ssr: false,
    loading: () => <div>Cargando tabla de recetas...</div>
});
const PrintButtons = dynamic(() => import("./PrintButtons").then(mod => ({ default: mod.PrintButtons })), {
    ssr: false,
    loading: () => <div>Cargando opciones de impresión...</div>
});
const ProximaVisitaSelector = dynamic(() => import("./ProximaVisitaSelector").then(mod => ({ default: mod.ProximaVisitaSelector })), {
    ssr: false,
    loading: () => <div>Cargando selector de próxima visita...</div>
});


// Tipos y entidades extraídos a './types'

export default function PacienteDetalle() {
    const params = useParams();
    const router = useRouter();
    const pacienteId = params.id as string;
    const account = params.account as string;
    const supabase = getSupabaseBrowserClient();

        const { alertInfo, showAlert } = useAlerts();
        const { paciente, loading, error, diasRestantes, citaExpirada, refetch: fetchPaciente, verificarEstadoCita, setPaciente, setError } = usePaciente(supabase, pacienteId);
        const { recetas, refetch: fetchRx, setRecetas } = useRecetas(supabase, pacienteId);
        const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
        const [dialogOpen, setDialogOpen] = useState(false);
        const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [alertDialogOpen, setAlertDialogOpen] = useState(false);
        const [user, setUser] = useState<any>(null);
        const [editForm, setEditForm] = useState<Partial<Paciente>>({});
        const [editDialogOpen, setEditDialogOpen] = useState(false);
        const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
        const [isLoading, setIsLoading] = useState(false);
        const [deleteDiagnosticoId, setDeleteDiagnosticoId] = useState<string | null>(null);
        const [editDiagnosticoData, setEditDiagnosticoData] = useState<Partial<Diagnostico>>({});
        const [editDiagnosticoDialogOpen, setEditDiagnosticoDialogOpen] = useState(false);

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
        // Flag para evitar múltiples actualizaciones de estado completado
        const estadoCompletoMarcadoRef = useRef(false);
    


        // Estado para las alertas y eliminación de recetas
        // Alertas gestionadas por useAlerts

        // Formateo de fechas provisto por helpers
    
        // Validación simple del formulario de edición
        const isEditFormValid = () => {
            const nombre = (editForm.nombre ?? '').trim();
            const motivo = (editForm.motivo_consulta ?? '').trim();
            if (!nombre) return false;
            if (!motivo) return false;
            return true;
        };

        // Guardar cambios de paciente
        const handleEditPaciente = async () => {
            try {
                if (!isEditFormValid()) {
                    showAlert('warning', 'Formulario inválido', 'Revisa los campos obligatorios.');
                    return;
                }
                setIsSubmittingEdit(true);

                const updateData: any = {};
                if (editForm.nombre !== undefined) updateData.nombre = String(editForm.nombre).trim();
                if (editForm.edad !== undefined) updateData.edad = editForm.edad === null ? null : Number(editForm.edad);
                if (editForm.sexo !== undefined) updateData.sexo = String(editForm.sexo || '').trim();
                if (editForm.telefono !== undefined) updateData.telefono = String(editForm.telefono || '').trim();
                if (editForm.domicilio !== undefined) updateData.domicilio = String(editForm.domicilio || '').trim();
                if (editForm.ocupacion !== undefined) updateData.ocupacion = String(editForm.ocupacion || '').trim();
                if (editForm.motivo_consulta !== undefined) updateData.motivo_consulta = String(editForm.motivo_consulta || '').trim();
                if (editForm.fecha_nacimiento !== undefined) {
                    const val = editForm.fecha_nacimiento as any;
                    updateData.fecha_nacimiento = val ? (val instanceof Date ? val.toISOString() : new Date(String(val)).toISOString()) : null;
                }

                const { error } = await supabase
                    .from('pacientes' as any)
                    .update(updateData)
                    .eq('id', pacienteId);

                if (error) throw error;

                showAlert('success', 'Paciente actualizado', 'Los datos del paciente se han actualizado correctamente puede que nesesites actualizar para poder ver los cambios reflejados');
                await fetchPaciente();
                // Forzar refresco de la ruta para asegurar revalidación y render
                router.refresh();
                
                
                setEditDialogOpen(false);
            } catch (err: any) {
                console.error('Error al actualizar paciente:', err);
                showAlert('error', 'Error', err.message || 'Error al actualizar el paciente');
            } finally {
                setIsSubmittingEdit(false);
            }
        };

        // Función para manejar el éxito al guardar una receta
        const handleRxSaveSuccess = (rxIds: string[]) => {
            // Actualizar la lista de recetas
            fetchRx();
            // Cerrar el modal
            setRxDialogOpen(false);
            // Mostrar alerta de éxito
            showAlert('success', 'Receta guardada', 'La receta ha sido guardada exitosamente ');
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
        const fetchRxWrapper = async () => {
            try {
                await fetchRx();
            } catch (err: any) {
                console.error('Error fetching rx:', err);
                setError(err.message || 'Error al cargar las recetas');
                showAlert('error', 'Error', err.message || 'Error al cargar las recetas');
            }
        };

        // Función para verificar el estado de la cita y calcular días restantes
        const verificarEstadoCitaWrapper = (fechaCita: string | null) => {
            const status = fechaCita;
            if (!status) {
                showAlert('warning', 'Fecha inválida', 'La fecha de cita no tiene un formato válido');
                return;
            }
            verificarEstadoCita(fechaCita);
        };
    
        // Función para actualizar el estado del paciente
        // Actualización de estado gestionada por usePaciente

        useEffect(() => {
            // Verificar si el usuario está logueado
            const checkUser = async () => {
                const { data } = await supabase.auth.getUser();
                setUser(data.user);
            };

            checkUser();
            fetchPaciente();
            // Se eliminó la llamada a fetchDiagnosticos para evitar solicitudes innecesarias
            fetchRx();
        }, [pacienteId]);
    
        // Efecto para verificar el estado de la cita cuando se carga el paciente
        useEffect(() => {
            if (paciente && paciente.fecha_de_cita) {
                verificarEstadoCitaWrapper(paciente.fecha_de_cita);
            }
        }, [paciente]);

        // Verificar "estado completado" cuando:
        // 1) Existe al menos una receta (rx) cuyo id_paciente coincide con el paciente actual
        // 2) La fecha de la cita fue ayer
        useEffect(() => {
            const marcarCompletadoSiAplica = async () => {
                try {
                    if (!paciente || !paciente.fecha_de_cita) return;
                    if (estadoCompletoMarcadoRef.current) return;

                    const fechaCita = parseISO(String(paciente.fecha_de_cita));
                    if (!isValid(fechaCita)) return;

                    const ayer = addDays(new Date(), -1);
                    // Comparar solo por día/mes/año
                    const fueAyer = isSameDay(
                        new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate()),
                        new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate())
                    );

                    const tieneRxDelPaciente = Array.isArray(recetas)
                        && recetas.some((rx: any) => {
                            const rxPacienteId = (rx?.id_paciente ?? rx?.paciente_id ?? rx?.pacienteId);
                            return String(rxPacienteId) === String(pacienteId);
                        });

                    if (fueAyer && tieneRxDelPaciente && paciente.estado !== 'completado') {
                        const { error: updateError } = await supabase
                            .from('pacientes' as any)
                            .update({ estado: 'completado' })
                            .eq('id', pacienteId);

                        if (updateError) {
                            console.error('Error actualizando estado a completado:', updateError);
                            return;
                        }

                        estadoCompletoMarcadoRef.current = true;
                        // Actualizar estado local y notificar
                        setPaciente(prev => prev ? { ...prev, estado: 'completado' } : prev);
                        window.dispatchEvent(new CustomEvent('pacienteEstadoActualizado', {
                            detail: { pacienteId, nuevoEstado: 'completado' }
                        }));
                    }
                } catch (err) {
                    console.error('Error verificando estado completado:', err);
                }
            };

            marcarCompletadoSiAplica();
        }, [paciente, recetas, pacienteId, supabase]);

        // Suscripción en tiempo real para auto-refrescar al detectar cambios del paciente
        useEffect(() => {
            const channel = (supabase as any)
                .channel(`paciente-${pacienteId}-updates`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'pacientes', filter: `id=eq.${pacienteId}` },
                    async (_payload: any) => {
                        try {
                            await fetchPaciente();
                            router.refresh();
                        } catch (err) {
                            console.error('Error auto-refrescando paciente:', err);
                        }
                    }
                )
                .subscribe();

            return () => {
                try {
                    (supabase as any).removeChannel(channel);
                } catch {}
            };
        }, [pacienteId, supabase]);
    
        // Efecto para agregar animación hover a todos los botones (sin sonido)
        useEffect(() => {
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

        // fetchPaciente provisto por usePaciente

        // Se eliminó la función fetchDiagnosticos para evitar solicitudes innecesarias a la API

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
                // Se eliminó la llamada a fetchDiagnosticos
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

                // Se eliminó la recarga de diagnósticos
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
                // Se eliminó la recarga de diagnósticos
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
                // Se eliminó la recarga de diagnósticos
                showAlert('success', 'Diagnóstico guardado', 'El diagnóstico se ha guardado correctamente');
            } else if (errorMessage) {
                setError(errorMessage);
                showAlert('error', 'Error', errorMessage);
            }
        };

        // Función de edición eliminada por no ser utilizada

        const handleDeletePaciente = async () => {
            try {
                setIsLoading(true);

                // Verificar si el usuario está logueado
                if (!user) {
                    showAlert('error', 'Acceso denegado', 'Debe iniciar sesión para eliminar pacientes');
                    setIsLoading(false);
                    return;
                }
            
                // Mostrar diálogo de confirmación con resumen de datos
                setDeleteDialogOpen(true);
                setIsLoading(false);
                return;
            } catch (err: any) {
                console.error("Error al preparar eliminación:", err);
                showAlert('error', 'Error', err.message || "Error al preparar la eliminación");
                setIsLoading(false);
            }
        };
    
        // Función para confirmar y ejecutar la eliminación del paciente
        const confirmarEliminacionPaciente = async () => {
            try {
                setIsLoading(true);
                
                // Primero eliminar los registros relacionados en la tabla rx
                const { error: rxError } = await supabase
                    .from("rx" as any)
                    .delete()
                    .eq("paciente_id", pacienteId);
                
                if (rxError) throw rxError;
                
                // Luego eliminar los registros relacionados en la tabla diagnostico
                const { error: diagError } = await supabase
                    .from("diagnostico" as any)
                    .delete()
                    .eq("paciente_id", pacienteId);
                
                if (diagError) throw diagError;
                
                // Finalmente eliminar el paciente
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
                setIsLoading(false);
            } finally {
                // Asegurar que el diálogo se cierre en caso de error
                if (isLoading) {
                    setIsLoading(false);
                }
            }
        };



        if (loading) return <div className="flex justify-center p-8"><p>Cargando información del paciente...</p></div>;
        if (error) return <div className="bg-destructive/20 p-4 rounded-md"><p>Error: {error}</p></div>;
        if (!paciente) return <div className="bg-destructive/20 p-4 rounded-md"><p>No se encontró el paciente</p></div>;

        return (
            <div className="space-y-6 mx-[45px] pt-4 sm:pt-8">
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
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-2xl truncate">{paciente.nombre}</CardTitle>
                                <CardDescription className="truncate">
                                    {paciente.edad && `${paciente.edad} años`} {paciente.sexo && `• ${paciente.sexo}`}
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                                <Badge
                                    variant={
                                        paciente?.estado?.toLowerCase() === 'completado' ? 'success'
                                        : paciente?.estado?.toLowerCase() === 'pendiente' ? 'warning'
                                        : paciente?.estado?.toLowerCase() === 'programado' ? 'secondary'
                                        : paciente?.estado?.toLowerCase() === 'activo' ? 'success'
                                        : 'default'
                                    }
                                >
                                    {paciente?.estado || 'Sin estado'}
                                </Badge>
                                {/* Botón de edición siempre visible */}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        setEditForm({
                                            nombre: paciente.nombre || '',
                                            edad: paciente.edad ?? null,
                                            sexo: paciente.sexo || '',
                                            telefono: paciente.telefono || '',
                                            domicilio: paciente.domicilio || '',
                                            fecha_nacimiento: paciente.fecha_nacimiento || '',
                                            ocupacion: paciente.ocupacion || '',
                                            motivo_consulta: paciente.motivo_consulta || ''
                                        });
                                        setAlertDialogOpen(true);
                                    }}
                                >
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
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <span>Ocupación: {paciente.ocupacion || "No disponible"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span>Síntomas visuales: {paciente.sintomas_visuales || "No disponible"}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {formatDateSafe(paciente.fecha_de_cita, "Sin fecha de cita")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span>Fecha de nacimiento: {formatDateSafe(paciente.fecha_nacimiento as any, "No disponible")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span>Motivo de consulta: {paciente.motivo_consulta || "No especificado"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                                    <span>Último examen visual: {paciente.ultimo_examen_visual || "No disponible"}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card para mostrar el estado de la cita */}
                {paciente && paciente.fecha_de_cita && (
                    <>
                        {/* Estado "Programado" - Mostrar cuando la fecha es futura */}
                        {diasRestantes !== null && diasRestantes > 0 && (
                            <Card className="mt-4 border-2 border-blue-400 bg-blue-50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg text-blue-700">Programado (Faltan {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'})</CardTitle>
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
                        
                        {/* Estado "Completado" - Mostrar cuando la fecha es pasada */}
                        {diasRestantes !== null && diasRestantes < 0 && (
                            <Card className="mt-4 border-2 border-red-400 bg-red-50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg text-red-700">Completado</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-red-800" style={{ color: "#FF0000" }}>
                                        La fecha de consulta del paciente ya ha pasado.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Estado "Pendiente" - No mostrar nada cuando la fecha es hoy */}
                        {/* Si diasRestantes === 0, no se muestra ningún componente */}
                    </>
                )}

                {/* Información adicional del paciente */}
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-lg">Información adicional del paciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="lentes">
                                <AccordionTrigger className="text-md font-semibold">Información de lentes</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 pl-2 pt-2">
                                        <p><span className="font-medium">Uso de lentes:</span> {paciente.uso_lentes ? "Sí" : "No"}</p>
                                        <p><span className="font-medium">Tipos de lentes:</span> {paciente.tipos_de_lentes || "No especificado"}</p>
                                        <p><span className="font-medium">Tiempo de uso:</span> {paciente.tiempo_de_uso_lentes || "No especificado"}</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        
                            <AccordionItem value="antecedentes-medicos">
                                <AccordionTrigger className="text-md font-semibold">Antecedentes médicos</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 pl-2 pt-2">
                                        <p><span className="font-medium">Cirugías:</span> {paciente.cirujias || "No especificado"}</p>
                                        <p><span className="font-medium">Traumatismos oculares:</span> {paciente.traumatismos_oculares ? "Sí" : "No"}</p>
                                        {paciente.traumatismos_oculares && (
                                            <p><span className="font-medium">Detalles de traumatismos:</span> {paciente.nombre_traumatismos_oculares || "No especificado"}</p>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        
                            <AccordionItem value="antecedentes-familiares">
                                <AccordionTrigger className="text-md font-semibold">Antecedentes familiares</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 pl-2 pt-2">
                                        <p><span className="font-medium">Antecedentes visuales:</span> {paciente.antecedentes_visuales_familiares || "No especificado"}</p>
                                        <p><span className="font-medium">Antecedentes de salud:</span> {paciente.antecedente_familiar_salud || "No especificado"}</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        
                            <AccordionItem value="salud-general">
                                <AccordionTrigger className="text-md font-semibold">Salud general</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-2 pl-2 pt-2">
                                        <p><span className="font-medium">Hábitos visuales:</span> {paciente.habitos_visuales || "No especificado"}</p>
                                        <p><span className="font-medium">Estado de salud:</span> {paciente.salud_general || "No especificado"}</p>
                                        <p><span className="font-medium">Medicamentos actuales:</span> {paciente.medicamento_actual || "No especificado"}</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>

                {/* Recetas del paciente (solo si estado = Pendiente) */}
                {paciente?.estado && paciente.estado.toLowerCase() === 'pendiente' && (
                    <div className="w-full mt-6">
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
                    </div>
                )}

                {/* Formulario de diagnóstico */}
                <DiagnosticoForm
                    pacienteId={pacienteId}
                    userId="user_id" // Aquí deberías pasar el ID del usuario actual
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    onSaved={handleDiagnosticoSaved}
                />


                {/* Modal para agregar recetas */}

                {/* AlertDialog de advertencia */}
                <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Advertencia</AlertDialogTitle>
                            <AlertDialogDescription>
                                Está a punto de modificar información muy importante del paciente. 
                                Esta acción podría afectar los registros médicos del paciente.
                                ¿Está seguro que desea continuar?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                                setAlertDialogOpen(false);
                                setEditDialogOpen(true);
                            }}>
                                Continuar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Dialog de edición de paciente */}
                <Dialog open={editDialogOpen} onOpenChange={(open) => {
                    setEditDialogOpen(open);
                    if (!open) {
                        setEditForm({});
                    }
                }}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Editar Paciente</DialogTitle>
                            <DialogDescription>
                                Modifica los datos y guarda para actualizar el registro.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="nombre" className="text-right font-medium">Nombre</label>
                                <input
                                    id="nombre"
                                    type="text"
                                    className="col-span-3 p-2 border rounded"
                                    value={editForm.nombre || ''}
                                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="edad" className="text-right font-medium">Edad</label>
                                <input
                                    id="edad"
                                    type="number"
                                    className="col-span-3 p-2 border rounded"
                                    value={editForm.edad ?? ''}
                                    onChange={(e) => setEditForm({ ...editForm, edad: e.target.value ? Number(e.target.value) : null })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="sexo" className="text-right font-medium">Sexo</label>
                                <select
                                    id="sexo"
                                    className="col-span-3 p-2 border rounded"
                                    value={editForm.sexo || ''}
                                    onChange={(e) => setEditForm({ ...editForm, sexo: e.target.value })}
                                >
                                    <option value="">Selecciona</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="telefono" className="text-right font-medium">Teléfono</label>
                                <input
                                    id="telefono"
                                    type="text"
                                    className="col-span-3 p-2 border rounded"
                                    value={editForm.telefono || ''}
                                    onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="domicilio" className="text-right font-medium">Domicilio</label>
                                <input
                                    id="domicilio"
                                    type="text"
                                    className="col-span-3 p-2 border rounded"
                                    value={editForm.domicilio || ''}
                                    onChange={(e) => setEditForm({ ...editForm, domicilio: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="fecha_nacimiento" className="text-right font-medium">Fecha de nacimiento</label>
                                <input
                                    id="fecha_nacimiento"
                                    type="date"
                                    className="col-span-3 p-2 border rounded"
                                    value={editForm.fecha_nacimiento ? String(editForm.fecha_nacimiento).split('T')[0] : ''}
                                    onChange={(e) => setEditForm({ ...editForm, fecha_nacimiento: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                />
                            </div>




                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="ocupacion" className="text-right font-medium">Ocupación</label>
                                <input
                                    id="ocupacion"
                                    type="text"
                                    className="col-span-3 p-2 border rounded"
                                    value={editForm.ocupacion || ''}
                                    onChange={(e) => setEditForm({ ...editForm, ocupacion: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="motivo_consulta" className="text-right font-medium">Motivo de la consulta</label>
                                <input
                                    id="motivo_consulta"
                                    type="text"
                                    className="col-span-3 p-2 border rounded"
                                    value={editForm.motivo_consulta || ''}
                                    onChange={(e) => setEditForm({ ...editForm, motivo_consulta: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleEditPaciente} disabled={isSubmittingEdit || !isEditFormValid()}>
                                {isSubmittingEdit ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </DialogFooter>
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
                                            <p><span className="font-semibold">Nombre:</span> {paciente.nombre}</p>
                                            <p><span className="font-semibold">Edad:</span> {paciente.edad || 'No especificada'}</p>
                                            <p><span className="font-semibold">Fecha de nacimiento:</span> {formatDateSafe(paciente.fecha_nacimiento as any, 'No especificada')}</p>
                                            <p><span className="font-semibold">Teléfono:</span> {paciente.telefono || 'No especificado'}</p>
                                            <p><span className="font-semibold">Fecha de cita:</span> {formatDateSafe(paciente.fecha_de_cita, 'No especificada')}</p>
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
            
                {/* Selector de próxima visita (Programado/Expirado/Pendiente/Completado) */}
                {paciente?.estado && ['programado', 'expirado', 'pendiente', 'completado'].includes(paciente.estado.toLowerCase()) && (
                    <Card className="mt-6 mb-8">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {(() => {
                                    const e = paciente?.estado?.toLowerCase() || '';
                                    if (e === 'completado') return 'Próxima visita';
                                    if (e === 'pendiente') return 'Modifica la fecha de la cita';
                                    if (e === 'programado' || e === 'expirado') return 'Re-agendar cita';
                                    return 'Próxima visita';
                                })()}
                            </CardTitle>
                            <CardDescription>Selecciona o modifica la fecha de la cita</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProximaVisitaSelector 
                                pacienteId={pacienteId}
                                estado={paciente?.estado || ''}
                                onSuccess={() => {
                                    // Recargar los datos del paciente y diagnósticos
                                    fetchPaciente();
                                    showAlert('success', 'Próxima visita programada', 'Se ha programado correctamente la próxima visita del paciente');
                                }}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Componente de botones de impresión */}
                <PrintButtons pacienteId={params.id as string} />
            </div>
        );
    }
