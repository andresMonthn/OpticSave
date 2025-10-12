"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@kit/ui/table";
import { Button } from "@kit/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@kit/ui/tooltip";
import { PencilIcon } from "lucide-react";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kit/ui/popover";
import { Checkbox } from "@kit/ui/checkbox";
import { Label } from "@kit/ui/label";

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
}

export function RecetasTable({ recetas, showAlert, setRxData, setRxDialogOpen, handleDeleteRx, pacienteId }: RecetasTableProps) {
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
  
  // Estados para el contexto de la receta que se está editando
  const [diagnosticoId, setDiagnosticoId] = useState<string | undefined>(undefined);
  const [rxType, setRxType] = useState<'uso' | 'final'>('uso');
  const [eyeType, setEyeType] = useState<'OD' | 'OI'>('OD');
  const [rxId, setRxId] = useState<string | null>(null);
  
  // Estado para controlar el popover
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  
  if (!recetas || recetas.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No hay recetas registradas</p>
      </div>
    );
  }

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
          
          if (typedRxData.fecha) {
            setFecha(typedRxData.fecha);
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
            
            if (typedRxData.fecha) {
              setFecha(typedRxData.fecha);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error al cargar datos de receta:", err);
      showAlert('error', 'Error', 'No se pudieron cargar los datos de la receta');
    }
  };
  
  // Cargar datos existentes cuando se abre el popover, cambia el diagnóstico o el ID de receta
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
        tipo: rxType,
        ojo: eyeType,
        esf: editRxData.esfDisabled ? 'N' : (editRxData.esf === null ? 'N' : editRxData.esf),
        // Asegurar que el cilindro sea siempre negativo
        cil: editRxData.cilDisabled ? 'N' : 
             (editRxData.cil !== null ? 
             (editRxData.cil < 0 ? editRxData.cil : -Math.abs(editRxData.cil)) : 
             'N'),
        eje: editRxData.ejeDisabled ? 'N' : (editRxData.eje === null ? 'N' : editRxData.eje),
        add: editRxData.addDisabled ? 'N' : (editRxData.add === null ? 'N' : editRxData.add),
        fecha: fecha,
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

  return (
    <div className="rounded-md border">
      {/* Mostrar la fecha como un label en la parte superior */}
      <div className="bg-slate-100 dark:bg-slate-800 p-3 text-center border-b">
        <span className="font-medium">Recetas creadas el: </span>
        <span>{fechaFormateada}</span>
      </div>

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
                            
                            setFecha(receta.fecha ?? new Date().toISOString().split("T")[0]);
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
                          <PopoverContent className="w-80 bg-[#0f172a] text-white border-gray-700 -translate-x-[50px] animate-in slide-in-from-top-5 zoom-in-95 duration-300">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium">Receta Médica</h4>
                                <div className="flex items-center space-x-2">
                                  <label htmlFor="fecha" className="text-sm">Fecha:</label>
                                  <input
                                    type="date"
                                    id="fecha"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className="bg-[#1e293b] border border-gray-600 rounded px-2 py-1 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <div className="grid grid-cols-3 items-center gap-2">
                                  <label htmlFor="rx-esf" className="text-sm">Esfera</label>
                                  <div className="col-span-2 flex">
                                    <input
                                      id="rx-esf"
                                      type="number"
                                      step="0.25"
                                      min="-20"
                                      max="20"
                                      value={editRxData.esf !== null ? formatToTwoDecimals(editRxData.esf) : ''}
                                      onChange={(e) => {
                                        // Validar que el valor sea un múltiplo de 0.25
                                        const value = parseFloat(e.target.value);
                                        if (!isNaN(value)) {
                                          // Redondear al 0.25 más cercano
                                          const rounded = Math.round(value * 4) / 4;
                                          // Limitar entre -20 y 20
                                          if (rounded <= 20 && rounded >= -20) {
                                            // Formatear para mostrar siempre 2 decimales
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
                                      className="flex-1 bg-[#1e293b] border border-gray-600 rounded-l px-2 py-1 text-sm"
                                      placeholder="Esfera"
                                      disabled={editRxData.esfDisabled}
                                    />
                                    <div className="flex flex-col">
                                      <button 
                                        type="button" 
                                        className="bg-[#334155] border border-gray-600 rounded-tr px-2 text-xs h-[14px]"
                                        onClick={() => {
                                          const currentValue = editRxData.esf !== null ? editRxData.esf : 0;
                                          if (currentValue < 20) {
                                            // Incrementar en 0.25 y formatear con 2 decimales
                                            const newValue = Math.min(20, currentValue + 0.25);
                                            setEditRxData(prev => ({ ...prev, esf: Number(newValue.toFixed(2)) }));
                                          }
                                        }}
                                        disabled={editRxData.esfDisabled}
                                      >▲</button>
                                      <button 
                                        type="button" 
                                        className="bg-[#334155] border border-gray-600 rounded-br px-2 text-xs h-[14px]"
                                        onClick={() => {
                                          const currentValue = editRxData.esf !== null ? editRxData.esf : 0;
                                          if (currentValue > -20) {
                                            // Decrementar en 0.25 y formatear con 2 decimales
                                            const newValue = Math.max(-20, currentValue - 0.25);
                                            setEditRxData(prev => ({ ...prev, esf: Number(newValue.toFixed(2)) }));
                                          }
                                        }}
                                        disabled={editRxData.cilDisabled}
                                      >▼</button>
                                    </div>
                                  </div>
                                  
                                  {/* Checkbox para inhabilitar ESF */}
                                  <div className="flex items-center space-x-2 mt-2">
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
                                    <Label htmlFor="disableEsf" className="text-sm text-white">N</Label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-2">
                                  <label htmlFor="rx-cil" className="text-sm">Cilindro</label>
                                  <div className="col-span-2 flex">
                                    <input
                                      id="rx-cil"
                                      type="number"
                                      step="0.25"
                                      max="0"
                                      min="-20"
                                      value={editRxData.cil !== null ? formatToTwoDecimals(editRxData.cil) : ''}
                                      onChange={(e) => {
                                        // Asegurar que el valor sea negativo y múltiplo de 0.25
                                        let value = parseFloat(e.target.value);
                                        if (!isNaN(value)) {
                                          // Redondear al 0.25 más cercano
                                          const rounded = Math.round(value * 4) / 4;
                                          // Asegurar que sea negativo o cero
                                          const negativeValue = Math.min(rounded, 0);
                                          // Asegurar que no sea menor que -20
                                          const limitedValue = Math.max(negativeValue, -20);
                                          handleNumericChange(limitedValue.toString(), 'cil');
                                        } else {
                                          // Asegurar que el valor sea negativo
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
                                      className="flex-1 bg-[#1e293b] border border-gray-600 rounded-l px-2 py-1 text-sm"
                                      placeholder="-Cilindro"
                                      disabled={editRxData.cilDisabled}
                                    />
                                    <div className="flex flex-col">
                                      <button 
                                        type="button" 
                                        className="bg-[#334155] border border-gray-600 rounded-tr px-2 text-xs h-[14px]"
                                        onClick={() => {
                                          const currentValue = editRxData.cil !== null ? editRxData.cil : 0;
                                          if (currentValue < 0) {
                                            // Incrementar hacia cero en pasos de 0.25
                                            const newValue = Math.min(currentValue + 0.25, 0);
                                            setEditRxData(prev => ({ ...prev, cil: Number(newValue.toFixed(2)) }));
                                          }
                                        }}
                                        disabled={editRxData.cilDisabled}
                                      >▲</button>
                                      <button 
                                        type="button" 
                                        className="bg-[#334155] border border-gray-600 rounded-br px-2 text-xs h-[14px]"
                                        onClick={() => {
                                          const currentValue = editRxData.cil !== null ? editRxData.cil : 0;
                                          if (currentValue > -20) {
                                            // Decrementar en pasos de 0.25 hasta -20
                                            const newValue = Math.max(currentValue - 0.25, -20);
                                            setEditRxData(prev => ({ ...prev, cil: Number(newValue.toFixed(2)) }));
                                          }
                                        }}
                                        disabled={editRxData.esfDisabled}
                                      >▼</button>
                                    </div>
                                  </div>
                                  
                                  {/* Checkbox para inhabilitar CIL */}
                                  <div className="flex items-center space-x-2 mt-2">
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
                                    <Label htmlFor="disableCil" className="text-sm text-white">N</Label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-2">
                                  <label htmlFor="rx-eje" className="text-sm">Eje</label>
                                  <div className="col-span-2 flex">
                                    <input
                                      id="rx-eje"
                                      type="number"
                                      step="0.25"
                                      min="0"
                                      max="20"
                                      value={editRxData.eje !== null ? formatToTwoDecimals(editRxData.eje) : ''}
                                      onChange={(e) => {
                                        // Validar que el valor sea un múltiplo de 0.25
                                        const value = parseFloat(e.target.value);
                                        if (!isNaN(value)) {
                                          // Redondear al 0.25 más cercano
                                          const rounded = Math.round(value * 4) / 4;
                                          // Limitar entre 0 y 20
                                          if (rounded <= 20 && rounded >= 0) {
                                            // Formatear para mostrar siempre 2 decimales
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
                                      className="flex-1 bg-[#1e293b] border border-gray-600 rounded-l px-2 py-1 text-sm"
                                      placeholder="Eje"
                                      disabled={editRxData.ejeDisabled}
                                    />
                                    <div className="flex flex-col">
                                      <button 
                                        type="button" 
                                        className="bg-[#334155] border border-gray-600 rounded-tr px-2 text-xs h-[14px]"
                                        onClick={() => {
                                          const currentValue = editRxData.eje !== null ? editRxData.eje : 0;
                                          if (currentValue < 20) {
                                            // Incrementar en 0.25 y formatear con 2 decimales
                                            const newValue = Math.min(20, currentValue + 0.25);
                                            setEditRxData(prev => ({ ...prev, eje: Number(newValue.toFixed(2)) }));
                                          }
                                        }}
                                        disabled={editRxData.ejeDisabled}
                                      >▲</button>
                                      <button 
                                        type="button" 
                                        className="bg-[#334155] border border-gray-600 rounded-br px-2 text-xs h-[14px]"
                                        onClick={() => {
                                          const currentValue = editRxData.eje !== null ? editRxData.eje : 0;
                                          if (currentValue > 0) {
                                            // Decrementar en 0.25 y formatear con 2 decimales
                                            const newValue = Math.max(0, currentValue - 0.25);
                                            setEditRxData(prev => ({ ...prev, eje: Number(newValue.toFixed(2)) }));
                                          }
                                        }}
                                        disabled={editRxData.ejeDisabled}
                                      >▼</button>
                                    </div>
                                  </div>
                                  
                                  {/* Checkbox para inhabilitar EJE */}
                                  <div className="flex items-center space-x-2 mt-2">
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
                                    <Label htmlFor="disableEje" className="text-sm text-white">N</Label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-2">
                                  <label htmlFor="rx-add" className="text-sm">Adición</label>
                                  <div className="col-span-2 flex">
                                    <input
                                      id="rx-add"
                                      type="number"
                                      step="0.25"
                                      min="0"
                                      max="20"
                                      value={editRxData.add !== null ? formatToTwoDecimals(editRxData.add) : ''}
                                      onChange={(e) => {
                                        // Validar que el valor sea un múltiplo de 0.25
                                        const value = parseFloat(e.target.value);
                                        if (!isNaN(value)) {
                                          // Redondear al 0.25 más cercano
                                          const rounded = Math.round(value * 4) / 4;
                                          // Limitar entre 0 y 20
                                          if (rounded <= 20 && rounded >= 0) {
                                            // Formatear para mostrar siempre 2 decimales
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
                                      className="flex-1 bg-[#1e293b] border border-gray-600 rounded-l px-2 py-1 text-sm"
                                      placeholder="Adición"
                                      disabled={editRxData.addDisabled}
                                    />
                                    <div className="flex flex-col">
                                      <button 
                                        type="button" 
                                        className="bg-[#334155] border border-gray-600 rounded-tr px-2 text-xs h-[14px]"
                                        onClick={() => {
                                          const currentValue = editRxData.add !== null ? editRxData.add : 0;
                                          if (currentValue < 20) {
                                            // Incrementar en 0.25 y formatear con 2 decimales
                                            const newValue = Math.min(20, currentValue + 0.25);
                                            setEditRxData(prev => ({ ...prev, add: Number(newValue.toFixed(2)) }));
                                          }
                                        }}
                                        disabled={editRxData.addDisabled}
                                      >▲</button>
                                      <button 
                                        type="button" 
                                        className="bg-[#334155] border border-gray-600 rounded-br px-2 text-xs h-[14px]"
                                        onClick={() => {
                                          const currentValue = editRxData.add !== null ? editRxData.add : 0;
                                          if (currentValue > 0) {
                                            // Decrementar en 0.25 y formatear con 2 decimales
                                            const newValue = Math.max(0, currentValue - 0.25);
                                            setEditRxData(prev => ({ ...prev, add: Number(newValue.toFixed(2)) }));
                                          }
                                        }}
                                        disabled={editRxData.addDisabled}
                                      >▼</button>
                                    </div>
                                  </div>
                                  
                                  {/* Checkbox para inhabilitar ADD */}
                                  <div className="flex items-center space-x-2 mt-2">
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
                                    <Label htmlFor="disableAdd" className="text-sm text-white">N</Label>
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                onClick={handleSaveRx}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Guardar
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