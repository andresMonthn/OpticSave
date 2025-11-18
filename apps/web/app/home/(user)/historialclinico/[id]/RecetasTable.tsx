"use client";
import React, { useState, useEffect } from "react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@kit/ui/table";
import { Button } from "@kit/ui/button";
import { PencilIcon, ChevronDown, AlertCircleIcon } from "lucide-react";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kit/ui/popover";
import { Checkbox } from "@kit/ui/checkbox";
import { Label } from "@kit/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";

// Helper: parseo seguro de fechas para evitar RangeError al convertir a ISO
function parseDateSafe(input: unknown): Date | null {
  if (input === null || input === undefined) return null;
  if (input instanceof Date) return isValid(input) ? input : null;
  if (typeof input === "string") {
    const str = input.trim();
    if (!str) return null;
    const d1 = new Date(str);
    if (isValid(d1)) return d1;
    try {
      const d2 = parseISO(str);
      return isValid(d2) ? d2 : null;
    } catch {
      return null;
    }
  }
  if (typeof input === "number") {
    const d = new Date(input);
    return isValid(d) ? d : null;
  }
  return null;
}

interface RecetaRelacion {
  tipo: "uso" | "final";
  ojo: "OD" | "OI";
  diagnosticoId: string;
}

interface RecetaItem {
  id: string;
  esf: number | null;
  cil: number | null;
  eje: number | null;
  add: number | null;
  fecha: string | undefined;
  user_id?: string;
  created_at?: string;
  esfera?: number | null;
  cilindro?: number | null;
  adicion?: number | null;
  observaciones?: string | null;
  relacion?: RecetaRelacion;
}

interface RecetasTableProps {
  recetas: RecetaItem[];
  showAlert: (type: "success" | "error" | "warning", title: string, message: string) => void;
  setRxData: (data: {
    diagnosticoId: string;
    rxType: "uso" | "final";
    eyeType: "OD" | "OI";
    rxId: string;
    tipo: string;
    ojo: string;
    esf: number | null;
    cil: number | null;
    eje: number | null;
    add: number | null;
    fecha: string | undefined;
  }) => void;
  setRxDialogOpen: (open: boolean) => void;
  handleDeleteRx: (id: string) => void;
  pacienteId: string;
  diagnosticoId?: string;
}

export function RecetasTable({ recetas, showAlert,  pacienteId, diagnosticoId: propDiagnosticoId }: RecetasTableProps) {
  const supabase = getSupabaseBrowserClient(); 
  // Estado para los datos de la receta en el popover
  const [editRxData, setEditRxData] = useState({
    esf: null as number | null,
    cil: null as number | null,
    eje: null as number | null,
    add: null as number | null,
    esfDisabled: false,
    cilDisabled: false,
    ejeDisabled: false,
    addDisabled: false
  });
  // Estado para la fecha de la receta en el popover
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [fechaCita, setFechaCita] = useState<string | null>(null); 
  // Estados para el contexto de la receta que se está editando
  const [diagnosticoId, setDiagnosticoId] = useState<string | undefined>(propDiagnosticoId);
  const [rxType, setRxType] = useState<'uso' | 'final'>('uso');
  const [eyeType, setEyeType] = useState<'OD' | 'OI'>('OD');
  const [rxId, setRxId] = useState<string | null>(null);
  
  // Estado para controlar el popover
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  // Estado para controlar si está cargando
  const [isLoading, setIsLoading] = useState(false);
  // Estado para almacenar el valor DIP como texto (según esquema)
  const [dipValue, setDipValue] = useState<string | null>(null);
  const [dipInput, setDipInput] = useState<string>("");
  const [isDipPopoverOpen, setIsDipPopoverOpen] = useState(false);

  // Estado de conexión para alertar modo offline
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Estado para almacenar el estado del paciente
  const [estadoPaciente, setEstadoPaciente] = useState<string | null>(null);

  // Obtener el valor DIP de la tabla diagnostico
  useEffect(() => {
    const fetchDipValue = async () => {
      // Usar pacienteId si no hay diagnosticoId
      if (!pacienteId) {
        console.log("No hay pacienteId, no se puede obtener el valor DIP");
        return;
      }
      try {
        // Primero intentamos obtener el diagnóstico por ID si está disponible
        if (diagnosticoId) {
          const { data, error } = await supabase
            .from("diagnostico" as any)
            .select("dip")
            .eq("id", diagnosticoId)
            .single();

          if (!error && data && 'dip' in data) {
            console.log("Valor DIP obtenido por diagnosticoId:", data.dip);
            const val = (data as any).dip;
            const str = val === null || val === undefined ? null : String(val);
            setDipValue(str);
            setDipInput(str ?? "");
            return;
          }
        }

        // Si no hay diagnosticoId o no se encontró, buscamos por pacienteId
        const { data, error } = await supabase
          .from("diagnostico" as any)
          .select("dip")
          .eq("paciente_id", pacienteId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (error) {
          console.log("No se encontró diagnóstico para el paciente:", pacienteId);
          return;
        }

        if (data && 'dip' in data) {
          console.log("Valor DIP obtenido por pacienteId:", data.dip);
          const val = (data as any).dip;
          const str = val === null || val === undefined ? null : String(val);
          setDipValue(str);
          setDipInput(str ?? "");
        }
      } catch (error) {
        console.error("Error al obtener valor DIP:", error);
      }
    };
    fetchDipValue();
  }, [diagnosticoId, pacienteId, supabase]);

  // Escuchar cambios de conexión para alertar modo offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showAlert('success', 'Conectado', 'Has vuelto al modo online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showAlert('warning', 'Sin conexión', 'Estás en modo offline. Los cambios se sincronizarán al reconectar.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showAlert]);

  // Obtener la fecha de cita y el estado del paciente al cargar el componente
  useEffect(() => {
    const fetchPacienteData = async () => {
      try {
        const { data, error } = await supabase
          .from("pacientes" as any)
          .select("fecha_de_cita, estado")
          .eq("id", pacienteId)
          .single();
        if (error) throw error;
        if (data && typeof data === 'object') {
          // Guardar el estado del paciente
          if ('estado' in data) {
            setEstadoPaciente((data as any).estado);
          }
          // Procesar la fecha de cita
          if ('fecha_de_cita' in data && (data as any).fecha_de_cita) {
            setFechaCita((data as any).fecha_de_cita);
            const d = parseDateSafe((data as any).fecha_de_cita);
            if (d) {
              setFecha(d.toISOString().split('T')[0]);
            } else {
              console.warn('Fecha inválida o vacía desde API.fecha_de_cita:', (data as any).fecha_de_cita);
              setFecha(new Date().toISOString().split('T')[0]);
              showAlert('warning', 'Fecha inválida', 'Fecha de cita inválida desde API, usando fecha actual.');
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener datos del paciente:", error);
      }
    };

    fetchPacienteData();
  }, [pacienteId, supabase]);


  /**
   * Carga los datos existentes de una receta desde la base de datos
   */
  const fetchExistingRxData = async () => {
    if (!openPopover) return;
    
    try {
      // Si se proporcionó un ID de receta específico, usarlo directamente
      if (rxId) {
        console.log("Usando ID de receta:", rxId);
        const { data: rxData, error: rxError } = await supabase
          .from("rx" as any)
          .select("*")
          .eq("id", rxId)
          .single();
        
        if (!rxError && rxData) {
          const typedRxData = rxData as unknown as RxData;
          setEditRxData({
            esf: typedRxData.esf === 'P' ? null : Number(typedRxData.esf),
            cil: typedRxData.cil === 'P' ? null : Number(typedRxData.cil),
            eje: typedRxData.eje === 'P' ? null : Number(typedRxData.eje),
            add: typedRxData.add === 'P' ? null : Number(typedRxData.add),
            esfDisabled: false,
            cilDisabled: false,
            ejeDisabled: false,
            addDisabled: false
          });

          // Usar la fecha de cita si está disponible, de lo contrario usar la fecha actual
          if (fechaCita) {
            const d = parseDateSafe(fechaCita);
            setFecha(d ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
          } else {
            setFecha(new Date().toISOString().split('T')[0]);
          }
          return;
        }
      }
      
      // Si no hay ID específico pero hay diagnóstico, buscar la receta correspondiente
      if (diagnosticoId) {
        // Obtener el ID de rx del diagnóstico según el tipo y ojo
        const { data: diagData, error: diagError } = await supabase
          .from("diagnostico" as any)
          .select("rx_uso_od_id, rx_uso_oi_id, rx_final_od_id, rx_final_oi_id")
          .eq("id", diagnosticoId)
          .single();
        
        if (diagError) throw diagError;
        
        if (!diagData) return;
        
        // Convertir a un tipo seguro para acceder a las propiedades
        const typedDiagData = diagData as any;
        
        // Seleccionar el ID de receta según el tipo y ojo
        let rxIdToUse = null;
        if (rxType === 'uso' && eyeType === 'OD') {
          rxIdToUse = typedDiagData.rx_uso_od_id;
        } else if (rxType === 'uso' && eyeType === 'OI') {
          rxIdToUse = typedDiagData.rx_uso_oi_id;
        } else if (rxType === 'final' && eyeType === 'OD') {
          rxIdToUse = typedDiagData.rx_final_od_id;
        } else if (rxType === 'final' && eyeType === 'OI') {
          rxIdToUse = typedDiagData.rx_final_oi_id;
        }
        
        setRxId(rxIdToUse);
        
        if (rxIdToUse) {
          // Obtener los datos de la receta
          const { data: rxData, error: rxError } = await supabase
            .from("rx" as any)
            .select("*")
            .eq("id", rxIdToUse)
            .single();
          
          if (!rxError && rxData) {
            const typedRxData = rxData as unknown as RxData;
            setEditRxData({
              esf: typedRxData.esf === 'P' || typedRxData.esf === 'N' ? null : Number(typedRxData.esf),
              cil: typedRxData.cil === 'P' || typedRxData.cil === 'N' ? null : Number(typedRxData.cil),
              eje: typedRxData.eje === 'P' || typedRxData.eje === 'N' ? null : Number(typedRxData.eje),
              add: typedRxData.add === 'P' || typedRxData.add === 'N' ? null : Number(typedRxData.add),
              esfDisabled: typedRxData.esf === 'N',
              cilDisabled: typedRxData.cil === 'N',
              ejeDisabled: typedRxData.eje === 'N',
              addDisabled: typedRxData.add === 'N'
            });
            
            // Set current date as fecha since it's not in the database
            setFecha(new Date().toISOString().split('T')[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error al cargar datos de receta:", err);
      showAlert('error', 'Error', 'No se pudieron cargar los datos de la receta');
    }
  };
  
  // Declarar todos los useEffect aquí para mantener el orden consistente
  // Efecto para cargar el valor DIP
  useEffect(() => {
    const fetchDipValue = async () => {
      if (!diagnosticoId) return;

      try {
        const { data, error } = await supabase
          .from("diagnostico" as any)
          .select("dip")
          .eq("id", diagnosticoId)
          .single();

        if (error) throw error;

        if (data && 'dip' in data) {
          const val = (data as any).dip;
          const str = val === null || val === undefined ? null : String(val);
          setDipValue(str);
          setDipInput(str ?? "");
        }
      } catch (error) {
        console.error("Error al obtener el valor DIP:", error);
      }
    };

    fetchDipValue();
  }, [diagnosticoId, supabase]);

  useEffect(() => {
    console.log("RecetaPopover - Cargando datos con:", { 
      openPopover, 
      diagnosticoId, 
      rxId,
      rxType,
      eyeType
    });
    fetchExistingRxData();
  }, [openPopover, diagnosticoId, rxId, rxType, eyeType]);

  /**
   * Guarda el valor de DIP en la base de datos
   * @param newValue Valor opcional para actualizar directamente (usado por los botones + y -)
   */
  const handleSaveDip = async (newValue?: string | React.MouseEvent<HTMLButtonElement>) => {
    // Si es un evento de clic, no usamos su valor
    const isMouseEvent = newValue && typeof newValue === 'object' && 'target' in newValue;
    
    // Determinar el valor a guardar
    const valueToSave = !isMouseEvent && newValue !== undefined ? (newValue as string) : (dipInput ?? dipValue ?? '');
    
    if (!diagnosticoId && !pacienteId) {
      showAlert('error', 'Error', 'No se encontró información del paciente o diagnóstico');
      return;
    }

    try {
      // DIP es texto según esquema; no hay validación de rango aquí

      console.log("Guardando DIP:", { valueToSave, diagnosticoId, pacienteId });

      // Primero intentamos buscar el diagnóstico por ID si está disponible
      let existingDiagId: string | null = null;
      
      if (diagnosticoId) {
        const { data, error: checkError } = await supabase
          .from("diagnostico" as any)
          .select("id")
          .eq("id", diagnosticoId)
          .maybeSingle();
          
        if (!checkError && data) {
          if (data && typeof data === 'object' && 'id' in data) {
            existingDiagId = (data as any).id;
          }
        }
      }
      
      // Si no encontramos por diagnosticoId, buscamos el diagnóstico más reciente del paciente
      if (!existingDiagId && pacienteId) {
        const { data, error: latestError } = await supabase
          .from("diagnostico" as any)
          .select("id")
          .eq("paciente_id", pacienteId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (!latestError && data) {
          if (data && typeof data === 'object' && 'id' in data) {
            existingDiagId = (data as any).id;
          }
        }
      }

      // Si encontramos un diagnóstico, lo actualizamos
      if (existingDiagId) {
        const { error } = await supabase
          .from("diagnostico" as any)
          .update({ dip: valueToSave === '' ? null : String(valueToSave) })
          .eq("id", existingDiagId);

        if (error) throw error;
        
        console.log("DIP actualizado correctamente en diagnóstico:", existingDiagId);
        showAlert('success', 'Éxito', 'Valor DIP actualizado correctamente');
      } 
      // Si no encontramos ningún diagnóstico, creamos uno nuevo
      else if (pacienteId) {
        const newDiagId = diagnosticoId || crypto.randomUUID();
        const { data, error: createError } = await supabase
          .from("diagnostico" as any)
          .insert({
            id: newDiagId,
            paciente_id: pacienteId,
            dip: valueToSave === '' ? null : String(valueToSave)
          })
          .select("id")
          .single();

        if (createError) throw createError;
        
        console.log("Nuevo diagnóstico creado con DIP:", newDiagId);
        showAlert('success', 'Éxito', 'Diagnóstico creado y valor DIP insertado correctamente');
      } else {
        throw new Error("No se pudo encontrar o crear un diagnóstico para guardar el valor DIP");
      }
      
      // Actualizamos el estado local
      setDipValue(valueToSave === '' ? null : String(valueToSave));
      setDipInput(valueToSave ?? "");
      setIsDipPopoverOpen(false);
    } catch (error: any) {
      console.error("Error al guardar el valor DIP:", error);
      showAlert('error', 'Error', error.message || 'Error al guardar el valor DIP');
    }
  };

  /**
   * Inicializa 4 registros rx con valores por defecto y los asocia al diagnóstico
   */
  const inicializarRecetas = async () => {
    try {
      setIsLoading(true);

      // Verificar si ya existen recetas
      if (recetas && recetas.length > 0) {
        showAlert("warning", "Advertencia", "Ya existen recetas para este paciente");
        setIsLoading(false);
        return;
      }

      // Obtener el user_id actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No se pudo obtener el usuario actual");
      }

      // Crear la orden_rx para vincularla al diagnóstico (con user_id del usuario actual para cumplir RLS)
      const { data: ordenRxData, error: ordenRxError } = await supabase
        .from("orden_rx" as any)
        .insert({
          user_id: user.id,
        })
        .select("id")
        .single();

      if (ordenRxError) throw ordenRxError;
      const ordenRxId = (ordenRxData as any)?.id;
      if (!ordenRxId) {
        throw new Error("No se pudo generar la orden de RX");
      }

      // Primero, crear o obtener el diagnóstico
      let diagnosticoId;

      // Obtener el diagnóstico actual o crear uno nuevo si no existe
      const { data: diagData, error: diagError } = await supabase
        .from("diagnostico" as any)
        .select("id, order_rx_id")
        .eq("paciente_id", pacienteId)
        .maybeSingle();

      if (diagError) throw diagError;

      if (diagData && 'id' in diagData) {
        // Usar el diagnóstico existente
        diagnosticoId = (diagData as any).id;

        // Asegurar que el diagnóstico tenga vinculada la orden_rx
        const currentOrderId = (diagData as any)?.order_rx_id ?? null;
        if (!currentOrderId) {
          const { error: linkOrderError } = await supabase
            .from("diagnostico" as any)
            .update({ order_rx_id: ordenRxId })
            .eq("id", diagnosticoId);
          if (linkOrderError) throw linkOrderError;
        }
      } else {
        // Crear un nuevo diagnóstico con DIP por defecto
        const { data: newDiagData, error: newDiagError } = await supabase
          .from("diagnostico" as any)
          .insert({
            paciente_id: pacienteId,
            user_id: user.id,
            dip: null, // DIP como texto, iniciar sin valor por defecto
            // Vincular la orden_rx recién creada para cumplir el FK
            order_rx_id: ordenRxId,
          })
          .select("id")
          .single();

        if (newDiagError) throw newDiagError;
        if (newDiagData && 'id' in newDiagData) {
          diagnosticoId = newDiagData.id;
        } else {
          throw new Error("No se pudo obtener el ID del diagnóstico creado");
        }
      }

      // Ahora crear los registros rx con el diagnostico_id
      const rxDefaults = {
        esf: "N",
        cil: "N",
        eje: "N",
        add: "N",
        user_id: user.id,
        paciente_id: pacienteId,
        diagnostico_id: diagnosticoId // Añadir el diagnostico_id aquí
      };

      // Insertar los 4 registros rx con sus tipos y ojos correspondientes
      // Nota: No incluimos tipo, ojo o fecha ya que no existen en el esquema de la base de datos
      const { data: rxData, error: rxError } = await supabase
        .from("rx" as any)
        .insert([
          { ...rxDefaults }, // rx_uso_od (primer registro)
          { ...rxDefaults }, // rx_uso_oi (segundo registro)
          { ...rxDefaults }, // rx_final_od (tercer registro)
          { ...rxDefaults }  // rx_final_oi (cuarto registro)
        ])
        .select();

      if (rxError) throw rxError;
      if (!rxData || rxData.length !== 4) {
        throw new Error("No se pudieron crear todos los registros rx");
      }

      // Actualizar el diagnóstico con los IDs de rx
      const { error: updateError } = await supabase
        .from("diagnostico" as any)
        .update({
          rx_uso_od_id: rxData[0] && 'id' in rxData[0] ? rxData[0].id : null,
          rx_uso_oi_id: rxData[1] && 'id' in rxData[1] ? rxData[1].id : null,
          rx_final_od_id: rxData[2] && 'id' in rxData[2] ? rxData[2].id : null,
          rx_final_oi_id: rxData[3] && 'id' in rxData[3] ? rxData[3].id : null
        })
        .eq("id", diagnosticoId);

      if (updateError) throw updateError;

      showAlert("success", "Éxito", "Se han inicializado las recetas correctamente");

      // Recargar la página para mostrar las nuevas recetas
      window.location.reload();
    } catch (error: any) {
      console.error("Error al inicializar recetas:", error);
      showAlert("error", "Error", error.message || "Error al inicializar recetas");
    } finally {
      setIsLoading(false);
    }
  };

  // Orden requerido: uso OD, uso OI, final OD, final OI
  const orderMap: Record<string, number> = {
    "uso_OD": 0,
    "uso_OI": 1,
    "final_OD": 2,
    "final_OI": 3,
  };

  const sortedRecetas = [...recetas].sort((a, b) => {
    const keyA = `${a.relacion?.tipo ?? "zzz"}_${a.relacion?.ojo ?? "ZZ"}`;
    const keyB = `${b.relacion?.tipo ?? "zzz"}_${b.relacion?.ojo ?? "ZZ"}`;
    const weightA = orderMap[keyA] ?? 999;
    const weightB = orderMap[keyB] ?? 999;
    return weightA - weightB;
  });

  // Interfaz para los datos de rx desde la base de datos
  interface RxData {
    id: string;
    tipo: string;
    ojo: string;
    esf: string | number | null;
    cil: string | number | null;
    eje: string | number | null;
    add: string | number | null;
    fecha: string | null;
    esfDisabled?: boolean;
    cilDisabled?: boolean;
    ejeDisabled?: boolean;
    addDisabled?: boolean;
  }
  // Este useEffect se ha movido al inicio del componente para mantener el orden consistente
  // Función para formatear números a dos decimales
  const formatToTwoDecimals = (value: number | null): string => {
    if (value === null) return '';
    return Number(value).toFixed(2);
  };
  /**
   * Guarda o actualiza la receta en la base de datos
   */
  const handleSaveRx = async () => {
    try {
      // Verificar si el usuario está logueado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        showAlert('error', 'Acceso denegado', 'Debe iniciar sesión para agregar recetas');
        return;
      }   
      // Datos de la receta a guardar
      const rxDataToSave = {
        esf: editRxData.esfDisabled ? 'N' : (editRxData.esf === null ? 'N' : editRxData.esf),
        // Asegurar que el cilindro sea siempre negativo
        cil: editRxData.cilDisabled ? 'N' : 
             (editRxData.cil !== null ? 
             (editRxData.cil < 0 ? editRxData.cil : -Math.abs(editRxData.cil)) : 
             'N'),
        eje: editRxData.ejeDisabled ? 'N' : (editRxData.eje === null ? 'N' : editRxData.eje),
        add: editRxData.addDisabled ? 'N' : (editRxData.add === null ? 'N' : editRxData.add),
        user_id: userData.user.id
      };     
      // Asegurarnos de tener el ID de la receta a editar
      let rxIdToUpdate = rxId;   
      // Si no tenemos el ID pero tenemos el diagnóstico, obtener el ID correspondiente
      if (!rxIdToUpdate && diagnosticoId) {
        const { data: diagData, error: diagError } = await supabase
          .from("diagnostico" as any)
          .select("rx_uso_od_id, rx_uso_oi_id, rx_final_od_id, rx_final_oi_id")
          .eq("id", diagnosticoId)
          .single();
        
        if (diagError) throw diagError;
        
        if (diagData) {
          const typedDiagData = diagData as any;
          
          if (rxType === 'uso' && eyeType === 'OD') {
            rxIdToUpdate = typedDiagData.rx_uso_od_id;
          } else if (rxType === 'uso' && eyeType === 'OI') {
            rxIdToUpdate = typedDiagData.rx_uso_oi_id;
          } else if (rxType === 'final' && eyeType === 'OD') {
            rxIdToUpdate = typedDiagData.rx_final_od_id;
          } else if (rxType === 'final' && eyeType === 'OI') {
            rxIdToUpdate = typedDiagData.rx_final_oi_id;
          }
        }
      }
      
      if (!rxIdToUpdate) {
        showAlert('error', 'Error', 'No se pudo encontrar la receta a editar');
        return;
      }
      
      // Actualizar receta existente
      const { error: updateError } = await supabase
        .from("rx" as any)
        .update(rxDataToSave)
        .eq("id", rxIdToUpdate);
      
      if (updateError) throw updateError;
      
      // Actualizar el estado local
      setRxId(rxIdToUpdate);
      
      // Notificar éxito
      console.log("Receta actualizada con ID:", rxIdToUpdate);
      showAlert('success', 'Éxito', 'Receta actualizada correctamente');
      
      // Cerrar el popover
      setOpenPopover(null);
      
      // Notificar al componente padre sobre el éxito
      if (rxIdToUpdate) {
        onSaveSuccess([rxIdToUpdate]);
      }
      
      // Recargar la página para mostrar los cambios
      window.location.reload();
      
    } catch (err: any) {
      console.error("Error al guardar receta:", err);
      showAlert('error', 'Error', err.message || "Error al guardar la receta");
    }
  };
  
  /**
   * Maneja cambios en campos numéricos con validación
   */
  const handleNumericChange = (
    value: string, 
    field: string, 
    isInteger: boolean = false
  ) => {
    const parseFunc = isInteger ? parseInt : parseFloat;
    const numValue = value && !isNaN(parseFunc(value)) ? parseFunc(value) : null;
    setEditRxData(prev => ({ ...prev, [field]: numValue }));
  };
  
  /**
   * Función para manejar el éxito al guardar
   */
  const onSaveSuccess = async (rxIds: string[]) => {
    // Recargar los datos después de guardar
    await fetchExistingRxData();
  };
  

  /**
   * Función para recargar los datos de las recetas
   */
 

  // Agrupar recetas por tipo (uso/final)
  const recetasPorTipo = sortedRecetas.reduce((acc, receta) => {
    const tipo = receta.relacion?.tipo || 'desconocido';
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(receta);
    return acc;
  }, {} as Record<string, RecetaItem[]>);

  // Obtener la fecha más reciente de todas las recetas
  const fechaMasReciente = sortedRecetas.reduce((latest, receta) => {
    if (!receta.fecha) return latest;
    const fechaReceta = new Date(receta.fecha);
    return !latest || fechaReceta > latest ? fechaReceta : latest;
  }, null as Date | null);

  const fechaFormateada = fechaMasReciente 
    ? format(fechaMasReciente, "PPP", { locale: es }) 
    : "Fecha no disponible";

  // Variable para controlar si se debe mostrar el card DIP con persistencia
  const [showDipCard, setShowDipCard] = useState(() => {
    // Recuperar el estado desde localStorage al cargar la página
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(`dipCard_${pacienteId}`);
      return savedState ? JSON.parse(savedState) : false;
    }
    return false;
  });

  // Efecto para guardar el estado en localStorage cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined' && pacienteId) {
      localStorage.setItem(`dipCard_${pacienteId}`, JSON.stringify(showDipCard));
    }
  }, [showDipCard, pacienteId]);

  // Modificar la función inicializarRecetas para mostrar el card DIP
  const handleInicializarRecetas = async () => {
    // Mostrar el card DIP y persistir el estado
    setShowDipCard(true);
    // Llamar a la función original
    await inicializarRecetas();
  };

  return (
    <div className="rounded-md border">
      {/* Mostrar el card DIP solo cuando showDipCard es true */}
      {showDipCard && (
        <div className="bg-blue-500 dark:bg-blue-700 p-6 border-b flex justify-center items-center">
          {/* Banner de modo offline dentro del card DIP */}
          {!isOnline && (
            <Alert variant="destructive" className="mb-2 w-full max-w-md">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Modo offline</AlertTitle>
              <AlertDescription>
                Sin conexión. Los cambios de DIP no se sincronizarán hasta reconectar.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col items-center">
            <span className="font-bold text-white mb-1">DIP</span>
            <span className="text-4xl font-bold text-white">
              {dipValue !== null ? `${dipValue}` : '-'}
            </span>

            <Popover open={isDipPopoverOpen} onOpenChange={setIsDipPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="secondary" size="sm" className="mt-2">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar DIP
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Distancia Interpupilar (DIP)</h4>
                    <p className="text-sm text-muted-foreground">
                      Ingrese un valor entre 0 y 100
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="dip">Valor DIP</Label>
                      <input
                        id="dip"
                        type="text"
                        className="col-span-2 h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={dipInput}
                        onChange={(e) => setDipInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={() => handleSaveDip(dipInput)} disabled={!isOnline}>
                    {isOnline ? 'Guardar' : 'Sin conexión'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Renderizar mensaje si no hay recetas */}
      {(!recetas || recetas.length === 0) && (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No hay recetas registradas</p>
          {/* Mostrar el botón solo cuando el estado del paciente sea "Pendiente" */}
          {estadoPaciente === "Pendiente" && (
            <Button
              onClick={handleInicializarRecetas}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Inicializando..." : "Inicializar Recetas"}
            </Button>
          )}
        </div>
      )}
      {/* Renderizar tablas separadas para cada tipo de receta */}
      {Object.entries(recetasPorTipo).map(([tipo, recetasDelTipo]) => (
        <div key={tipo} className="mb-4">
          <div className="bg-slate-200 dark:bg-slate-700 p-2 font-semibold text-center">
            {tipo === 'uso' ? 'Recetas de Uso' : 'Recetas Finales'}
          </div> 
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ojo</TableHead>
                  <TableHead className="hidden sm:table-cell">ESF</TableHead>
                  <TableHead className="hidden sm:table-cell">CIL</TableHead>
                  <TableHead className="hidden sm:table-cell">EJE</TableHead>
                  <TableHead className="hidden sm:table-cell">ADD</TableHead>
                  <TableHead className="sm:hidden">Valores</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recetasDelTipo.map((receta) => (
                  <TableRow key={receta.id || `rx-${receta.relacion?.tipo}-${receta.relacion?.ojo}-${receta.created_at}`}>
                    <TableCell className="font-medium">
                      {receta.relacion?.ojo === "OD" ? "Derecho" : "Izquierdo"}
                    </TableCell>
                    {/* Columnas visibles solo en pantallas medianas y grandes */}
                    <TableCell className="hidden sm:table-cell">{receta.esf !== null ? receta.esf : (receta.esf === 'N' ? 'N' : "N")}</TableCell>
                    <TableCell className="hidden sm:table-cell">{receta.cil !== null ? receta.cil : (receta.cil === 'N' ? 'N' : "N")}</TableCell>
                    <TableCell className="hidden sm:table-cell">{receta.eje !== null ? receta.eje : (receta.eje === 'N' ? 'N' : "N")}</TableCell>
                    <TableCell className="hidden sm:table-cell">{receta.add !== null ? receta.add : (receta.add === 'N' ? 'N' : "N")}</TableCell>
                    
                    {/* Columna compacta para móviles */}
                    <TableCell className="sm:hidden">
                      <div className="space-y-1 text-xs">
                        <div><span className="font-semibold">Esf:</span> {receta.esf !== null ? receta.esf : (receta.esf === 'N' ? 'N' : "N")}</div>
                        <div><span className="font-semibold">Cil:</span> {receta.cil !== null ? receta.cil : (receta.cil === 'N' ? 'N' : "N")}</div>
                        <div><span className="font-semibold">Eje:</span> {receta.eje !== null ? receta.eje : (receta.eje === 'N' ? 'N' : "N")}</div>
                        <div><span className="font-semibold">Add:</span> {receta.add !== null ? receta.add : (receta.add === 'N' ? 'N' : "N")}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Popover open={openPopover === receta.id} onOpenChange={(open) => {
                          if (open) {
                            if (!receta || !receta.relacion?.diagnosticoId) {
                              showAlert("error", "Receta inválida", "No se encontró información suficiente de la receta para editar.");
                              return;
                            }
                            
                            // Configurar los datos para el popover
                            const diagId = receta.relacion.diagnosticoId;
                            const tipoOriginal = receta.relacion.tipo;
                            const ojoOriginal = receta.relacion.ojo;
                            
                            const rxTypeValue = tipoOriginal === "uso" ? "uso" : "final" as const;
                            const eyeTypeValue = ojoOriginal === "OD" ? "OD" : "OI" as const;
                            
                            // Actualizar los estados para el popover
                            setDiagnosticoId(diagId);
                            setRxType(rxTypeValue);
                            setEyeType(eyeTypeValue);
                            setRxId(receta.id);
                            
                            // Configurar los datos iniciales
                            setEditRxData({
                              esf: receta.esf ?? null,
                              cil: receta.cil ?? null,
                              eje: receta.eje ?? null,
                              add: receta.add ?? null,
                              esfDisabled: false,
                              cilDisabled: false,
                              ejeDisabled: false,
                              addDisabled: false
                            });
                            
                            {
                              const d = parseDateSafe(receta.fecha);
                              setFecha(d ? d.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
                            }
                            setOpenPopover(receta.id);
                          } else {
                            setOpenPopover(null);
                          }
                        }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[360px] bg-white text-gray-900 border border-gray-200 shadow-xl rounded-2xl p-6 -translate-x-[50px] animate-in slide-in-from-top-5 zoom-in-95 duration-300">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium text-center text-gray-800">Recetas</h4>
                                <div className="hidden">
                                  <label htmlFor="fecha" className="text-sm">Fecha:</label>
                                  <input
                                    type="date"
                                    id="fecha"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                {/* Esfera */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label htmlFor="rx-esf" className="text-sm text-gray-700">Esfera</label>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="disableEsf"
                                        checked={editRxData.esfDisabled}
                                        onCheckedChange={(checked) => {
                                          const isChecked = checked === true;
                                          setEditRxData(prev => ({ 
                                            ...prev, 
                                            esfDisabled: isChecked, 
                                            esf: isChecked ? null : prev.esf 
                                          }));
                                        }}
                                      />
                                      <Label htmlFor="disableEsf" className="text-sm text-gray-600">N</Label>
                                    </div>
                                  </div>
                                  <input
                                    id="rx-esf"
                                    type="number"
                                    step="0.25"
                                    min="-20"
                                    max="20"
                                    value={editRxData.esf !== null ? formatToTwoDecimals(editRxData.esf) : ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      if (!isNaN(value)) {
                                        const rounded = Math.round(value * 4) / 4;
                                        if (rounded <= 20 && rounded >= -20) {
                                          const formattedValue = Number(rounded).toFixed(2);
                                          handleNumericChange(formattedValue, 'esf');
                                        }
                                      } else {
                                        handleNumericChange(e.target.value, 'esf');
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === '.') {
                                        e.preventDefault();
                                        setEditRxData(prev => ({ ...prev, esf: 0.00 }));
                                      }
                                    }}
                                    className="w-full h-11 bg-white border border-gray-300 rounded-xl px-3 text-sm placeholder:text-gray-400"
                                    placeholder="Esfera"
                                    disabled={editRxData.esfDisabled}
                                  />
                                </div>
                                {/* Cilindro */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label htmlFor="rx-cil" className="text-sm text-gray-700">Cilindro</label>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="disableCil"
                                        checked={editRxData.cilDisabled}
                                        onCheckedChange={(checked) => {
                                          const isChecked = checked === true;
                                          setEditRxData(prev => ({ 
                                            ...prev, 
                                            cilDisabled: isChecked, 
                                            cil: isChecked ? null : prev.cil 
                                          }));
                                        }}
                                      />
                                      <Label htmlFor="disableCil" className="text-sm text-gray-600">N</Label>
                                    </div>
                                  </div>
                                  <input
                                    id="rx-cil"
                                    type="number"
                                    step="0.25"
                                    max="0"
                                    min="-20"
                                    value={editRxData.cil !== null ? formatToTwoDecimals(editRxData.cil) : ''}
                                    onChange={(e) => {
                                      let value = parseFloat(e.target.value);
                                      if (!isNaN(value)) {
                                        const rounded = Math.round(value * 4) / 4;
                                        const negativeValue = Math.min(rounded, 0);
                                        const limitedValue = Math.max(negativeValue, -20);
                                        handleNumericChange(limitedValue.toString(), 'cil');
                                      } else {
                                        let textValue = e.target.value;
                                        if (textValue && !textValue.startsWith('-') && textValue !== '-') {
                                          textValue = '-' + textValue;
                                        }
                                        handleNumericChange(textValue, 'cil');
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === '.') {
                                        e.preventDefault();
                                        setEditRxData(prev => ({ ...prev, cil: -0.00 }));
                                      }
                                    }}
                                    className="w-full h-11 bg-white border border-gray-300 rounded-xl px-3 text-sm placeholder:text-gray-400"
                                    placeholder="-Cilindro"
                                    disabled={editRxData.cilDisabled}
                                  />
                                </div>
                                {/* Eje */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label htmlFor="rx-eje" className="text-sm text-gray-700">Eje</label>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="disableEje"
                                        checked={editRxData.ejeDisabled}
                                        onCheckedChange={(checked) => {
                                          const isChecked = checked === true;
                                          setEditRxData(prev => ({ 
                                            ...prev, 
                                            ejeDisabled: isChecked, 
                                            eje: isChecked ? null : prev.eje 
                                          }));
                                        }}
                                      />
                                      <Label htmlFor="disableEje" className="text-sm text-gray-600">N</Label>
                                    </div>
                                  </div>
                                  <input
                                    id="rx-eje"
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="20"
                                    value={editRxData.eje !== null ? formatToTwoDecimals(editRxData.eje) : ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      if (!isNaN(value)) {
                                        const rounded = Math.round(value * 4) / 4;
                                        if (rounded <= 20 && rounded >= 0) {
                                          const formattedValue = Number(rounded).toFixed(2);
                                          handleNumericChange(formattedValue, 'eje');
                                        }
                                      } else {
                                        handleNumericChange(e.target.value, 'eje');
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === '.') {
                                        e.preventDefault();
                                        setEditRxData(prev => ({ ...prev, eje: 0.00 }));
                                      }
                                    }}
                                    className="w-full h-11 bg-white border border-gray-300 rounded-xl px-3 text-sm placeholder:text-gray-400"
                                    placeholder="Eje"
                                    disabled={editRxData.ejeDisabled}
                                  />
                                </div>
                                {/* Adición */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label htmlFor="rx-add" className="text-sm text-gray-700">Adición</label>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="disableAdd"
                                        checked={editRxData.addDisabled}
                                        onCheckedChange={(checked) => {
                                          const isChecked = checked === true;
                                          setEditRxData(prev => ({ 
                                            ...prev, 
                                            addDisabled: isChecked, 
                                            add: isChecked ? null : prev.add 
                                          }));
                                        }}
                                      />
                                      <Label htmlFor="disableAdd" className="text-sm text-gray-600">N</Label>
                                    </div>
                                  </div>
                                  <input
                                    id="rx-add"
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    max="20"
                                    value={editRxData.add !== null ? formatToTwoDecimals(editRxData.add) : ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      if (!isNaN(value)) {
                                        const rounded = Math.round(value * 4) / 4;
                                        if (rounded <= 20 && rounded >= 0) {
                                          const formattedValue = Number(rounded).toFixed(2);
                                          handleNumericChange(formattedValue, 'add');
                                        }
                                      } else {
                                        handleNumericChange(e.target.value, 'add');
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === '.') {
                                        e.preventDefault();
                                        setEditRxData(prev => ({ ...prev, add: 0.00 }));
                                      }
                                    }}
                                    className="w-full h-11 bg-white border border-gray-300 rounded-xl px-3 text-sm placeholder:text-gray-400"
                                    placeholder="Adición"
                                    disabled={editRxData.addDisabled}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                onClick={handleSaveRx}
                                variant="outline"
                                className="mx-auto rounded-full w-12 h-12 p-0 border-2 border-gray-800 hover:bg-gray-100"
                              >
                                <ChevronDown className="h-6 w-6 text-gray-900" />
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {sortedRecetas.some((r) => r.observaciones) && (
        <div className="p-4 border-t">
          <h4 className="font-medium mb-2">Observaciones</h4>
          <div className="space-y-2">
            {sortedRecetas.filter((r) => r.observaciones).map((r) => (
              <div key={`obs-${r.id}`} className="text-sm">
                <span className="font-medium">
                  {r.relacion?.tipo === "uso" ? "Uso" : "Final"} -
                  {r.relacion?.ojo === "OD" ? "Derecho" : "Izquierdo"}:
                </span>{" "}
                {r.observaciones}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}