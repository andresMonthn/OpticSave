"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { format, isBefore, isToday, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, BadgeCheckIcon, Brush, RulerIcon, CheckCircle, Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";

import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Textarea } from "@kit/ui/textarea";
import { Label } from "@kit/ui/label";
import { Switch } from "@kit/ui/switch";
import { Spinner } from "@kit/ui/spinner";
import { Badge } from "@kit/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from "@kit/ui/dialog";
import { Calendar } from "@kit/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kit/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@kit/ui/command";
import { cn } from "@kit/ui/utils";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase1 = createClient(supabaseUrl, supabaseKey);
const supabase = getSupabaseBrowserClient();

// Importamos el archivo JSON directamente
import arbolDiagnosticoData from './arboldiagnostico.json';

// Definición de interfaces para el árbol de diagnóstico
interface DiagnosticoItem {
  tipo_diagnostico: string;
  diagnostico: string;
  tratamientos: string[];
}

interface DiagnosticoFormProps {
  pacienteId: string;
  userId: string;
  open: boolean;
  onClose: () => void;
  onSaved: (success: boolean, errorMessage?: string) => void;
}

interface DiagnosticoData {
  paciente_id: string;
  user_id: string;
  fecha_diagnostico: string;
  tipo_diagnostico: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
  proxima_visita: string | null;
  vb_salud_ocular: boolean;
  dip: number | null;
}

export function DiagnosticoForm({ pacienteId, userId, open, onClose, onSaved }: DiagnosticoFormProps) {
  const [tipoDiagnostico, setTipoDiagnostico] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [diagnosticosSeleccionados, setDiagnosticosSeleccionados] = useState<string[]>([]);
  const [tratamiento, setTratamiento] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [proximaVisita, setProximaVisita] = useState<Date>(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [dip, setDip] = useState<string>("");
  const [vbSaludOcular, setVbSaludOcular] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [showDiagnosticoPopover, setShowDiagnosticoPopover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Procesamos el JSON para obtener los datos necesarios
  const tiposDiagnostico = useMemo(() => {
    const tipos = new Set<string>();
    (arbolDiagnosticoData as DiagnosticoItem[]).forEach(item => {
      tipos.add(item.tipo_diagnostico);
    });
    return Array.from(tipos);
  }, []);
  
  // Filtramos los diagnósticos disponibles según el tipo seleccionado
  const diagnosticosDisponibles = useMemo(() => {
    if (!tipoDiagnostico) return [];
    
    return (arbolDiagnosticoData as DiagnosticoItem[])
      .filter(item => item.tipo_diagnostico === tipoDiagnostico)
      .map(item => item.diagnostico);
  }, [tipoDiagnostico]);
  
  // Filtramos los tratamientos disponibles según el diagnóstico seleccionado
  const tratamientosDisponibles = useMemo(() => {
    if (!tipoDiagnostico || !diagnostico) return [];
    
    const item = (arbolDiagnosticoData as DiagnosticoItem[]).find(
      item => item.tipo_diagnostico === tipoDiagnostico && item.diagnostico === diagnostico
    );
    
    return item ? item.tratamientos : [];
  }, [tipoDiagnostico, diagnostico]);
  
  // Actualizamos campos cuando cambia el tipo de diagnóstico
  useEffect(() => {
    // Limpiamos campos
    setDiagnostico("");
    setTratamiento("");
  }, [tipoDiagnostico]);
  
  // Actualizamos tratamiento cuando cambia el diagnóstico
  useEffect(() => {
    setTratamiento("");
    
    // Si es Error refractivo y hay un diagnóstico específico, sugerimos tratamiento
    if (tipoDiagnostico === "Error refractivo" && diagnostico) {
      // Buscamos tratamientos sugeridos en el árbol de diagnóstico
      const item = (arbolDiagnosticoData as DiagnosticoItem[]).find(
        item => item.tipo_diagnostico === tipoDiagnostico && item.diagnostico === diagnostico
      );
      
      // Si encontramos tratamientos, seleccionamos el primero como sugerencia
        if (item && item.tratamientos && item.tratamientos.length > 0) {
          const primerTratamiento = item.tratamientos[0];
          if (primerTratamiento) {
            setTratamiento(primerTratamiento);
          }
        }
    }
  }, [diagnostico, tipoDiagnostico]);

  const validateField = (field: string, value: any) => {
    setErrors((prev) => ({
      ...prev,
      [field]: !value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Obtenemos el usuario logueado directamente
      const { data } = await supabase.auth.getUser();
      // Aseguramos que userId siempre sea un string
      const userId = data.user?.id || "";
      
      // Usamos siempre la fecha actual para el diagnóstico
      const fechaActual = new Date();
      const fechaStr = fechaActual.toISOString().split("T")[0];
      
      // Concatenamos los diagnósticos seleccionados con el diagnóstico principal si existe
      let diagnosticoFinal = diagnostico;
      
      // Si hay diagnósticos seleccionados, los concatenamos
      if (diagnosticosSeleccionados.length > 0) {
        // Si ya hay un diagnóstico principal y también hay seleccionados, los combinamos
        if (diagnostico && diagnostico.trim() !== "") {
          diagnosticoFinal = [diagnostico, ...diagnosticosSeleccionados].join(", ");
        } else {
          // Si no hay diagnóstico principal, usamos solo los seleccionados
          diagnosticoFinal = diagnosticosSeleccionados.join(", ");
        }
      }
      
      // 1. Crear las cuatro recetas con valores por defecto
      const rxDefaults = {
        esf: 'N',
        cil: 'N',
        eje: 'N',
        add: 'N',
        fecha: fechaStr || new Date().toISOString().split("T")[0], // Aseguramos que fecha nunca sea undefined
        user_id: userId
      };
      
      // Crear receta de uso OD
      const { data: rxUsoOD, error: errorUsoOD } = await supabase
        .from("rx" as any)
        .insert([{ ...rxDefaults, tipo: "uso", ojo: "OD" }] as any)
        .select("id")
        .single();
      
      if (errorUsoOD) throw new Error("Error al crear receta de uso OD: " + errorUsoOD.message);
      
      // Crear receta de uso OI
      const { data: rxUsoOI, error: errorUsoOI } = await supabase
        .from("rx" as any)
        .insert([{ ...rxDefaults, tipo: "uso", ojo: "OI" }] as any)
        .select("id")
        .single();
      
      if (errorUsoOI) throw new Error("Error al crear receta de uso OI: " + errorUsoOI.message);
      
      // Crear receta final OD
      const { data: rxFinalOD, error: errorFinalOD } = await supabase
        .from("rx" as any)
        .insert([{ ...rxDefaults, tipo: "final", ojo: "OD" }] as any)
        .select("id")
        .single();
      
      if (errorFinalOD) throw new Error("Error al crear receta final OD: " + errorFinalOD.message);
      
      // Crear receta final OI
      const { data: rxFinalOI, error: errorFinalOI } = await supabase
        .from("rx" as any)
        .insert([{ ...rxDefaults, tipo: "final", ojo: "OI" }] as any)
        .select("id")
        .single();
      
      if (errorFinalOI) throw new Error("Error al crear receta final OI: " + errorFinalOI.message);
      
      // 2. Aseguramos que todos los campos tengan valores válidos para la base de datos
      const diagnosticoData: DiagnosticoData & { 
        rx_uso_od_id: string | null, 
        rx_uso_oi_id: string | null, 
        rx_final_od_id: string | null, 
        rx_final_oi_id: string | null 
      } = {
        paciente_id: pacienteId,
        user_id: userId,
        fecha_diagnostico: fechaStr || '',
        tipo_diagnostico: tipoDiagnostico || null,
        diagnostico: diagnosticoFinal || null,
        tratamiento: tratamiento || null,
        observaciones: observaciones || null,
        proxima_visita: addDays(proximaVisita, 1).toISOString().split("T")[0] || null,
        vb_salud_ocular: vbSaludOcular,
        dip: dip ? parseInt(dip, 10) : null,
        // Añadimos los IDs de las recetas creadas
        rx_uso_od_id: rxUsoOD && 'id' in rxUsoOD ? String(rxUsoOD.id) : null,
        rx_uso_oi_id: rxUsoOI && 'id' in rxUsoOI ? String(rxUsoOI.id) : null,
        rx_final_od_id: rxFinalOD && 'id' in rxFinalOD ? String(rxFinalOD.id) : null,
        rx_final_oi_id: rxFinalOI && 'id' in rxFinalOI ? String(rxFinalOI.id) : null
      };
    
      // 3. Enviamos los datos del diagnóstico con las referencias a las recetas
      const { error } = await supabase
        .from("diagnostico" as any)
        .insert([diagnosticoData]);
    
      if (error) {
        throw new Error("Error al guardar diagnóstico: " + error.message);
      }
      
      // Notificar al componente padre del éxito
      onSaved(true);
      onClose();
      resetForm();
    } catch (err: any) {
      console.error(err);
      // Notificar al componente padre del error
      onSaved(false, err.message || "Error al guardar diagnóstico");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTipoDiagnostico("");
    setDiagnostico("");
    setTratamiento("");
    setObservaciones("");
    setProximaVisita(new Date());
    setDip("");
    setVbSaludOcular(false);
    setErrors({});
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogOverlay className="bg-white/05 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-[600px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Agregar Diagnóstico</DialogTitle>
            <DialogDescription>
              Complete los campos del diagnóstico. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Fecha diagnóstico */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="fechaDiagnostico" className="font-medium">
                  Fecha del diagnóstico *
                </Label>
                <div className="flex">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={true}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(), "PPP", { locale: es })}
                  </Button>
                </div>
                {errors.fechaDiagnostico && (
                  <span className="text-red-500 text-xs">Campo requerido</span>
                )}
              </div>

              {/* DIP */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="dip" className="font-medium">Distancia Interpupilar (mm)</Label>
                <div className="flex">
                  <Input
                    id="dip"
                    type="number"
                    value={dip}
                    onChange={(e) => setDip(e.target.value)}
                    className="w-full"
                    placeholder="Ej: 62"
                    min="0"
                    max="100"
                    step="1"
                  />
                  <RulerIcon className="ml-2 h-4 w-4 self-center text-gray-500" />
                </div>
              </div>

              {/* Tipo de diagnóstico */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="tipoDiagnostico" className="font-medium">Tipo de diagnóstico</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !tipoDiagnostico && "text-muted-foreground"
                      )}
                    >
                      {tipoDiagnostico || "Seleccione tipo de diagnóstico"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar tipo de diagnóstico..." 
                        className="h-9"
                        onValueChange={(value) => {
                          if (!tiposDiagnostico.includes(value) && value.trim() !== "") {
                            setTipoDiagnostico(value);
                          }
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-2 px-4 text-sm">
                            No se encontraron resultados. Presione Enter para agregar.
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {tiposDiagnostico.map((tipo) => (
                            <CommandItem
                              key={tipo}
                              value={tipo}
                              onSelect={(value) => {
                                setTipoDiagnostico(value);
                                // Ya no se autocompleta el tratamiento refractivo
                                
                              }}
                            >
                              {tipo}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  tipoDiagnostico === tipo ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* VB Salud Ocular */}
              <div className="flex flex-col space-y-2">
                <Label className="font-medium">VB Salud Ocular</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={vbSaludOcular}
                    onCheckedChange={setVbSaludOcular}
                    id="vb-salud-ocular"
                  />
                  <Label htmlFor="vb-salud-ocular" className="text-sm">
                    {vbSaludOcular ? "Sí" : "No"}
                  </Label>
                  {vbSaludOcular && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>

              {/* Diagnóstico */}
              <div className="flex flex-col space-y-2 sm:col-span-2">
                <Label htmlFor="diagnostico" className="font-medium">Diagnóstico</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !diagnostico && "text-muted-foreground"
                        )}
                        disabled={diagnosticosDisponibles.length === 0 && !tipoDiagnostico}
                      >
                        {diagnostico || "Seleccione diagnóstico"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar diagnóstico..." 
                          className="h-9"
                          onValueChange={(value) => {
                            if (!diagnosticosDisponibles.includes(value) && value.trim() !== "") {
                              setDiagnostico(value);
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="py-2 px-4 text-sm">
                              No se encontraron resultados. Presione Enter para agregar.
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {diagnosticosDisponibles.map((diag) => (
                              <CommandItem
                                key={diag}
                                value={diag}
                                onSelect={(value) => {
                                  setDiagnostico(value);
                                }}
                              >
                                {diag}
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    diagnostico === diag ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-0">
                      <Command>
                        <CommandInput placeholder="Agregar diagnóstico..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron resultados</CommandEmpty>
                          <CommandGroup heading="Diagnósticos comunes">
                            <CommandItem
                              onSelect={() => {
                                if (!diagnosticosSeleccionados.includes("Miopía")) {
                                  setDiagnosticosSeleccionados([...diagnosticosSeleccionados, "Miopía"]);
                                }
                              }}
                            >
                              Miopía
                            </CommandItem>
                            <CommandItem
                              onSelect={() => {
                                if (!diagnosticosSeleccionados.includes("Astigmatismo")) {
                                  setDiagnosticosSeleccionados([...diagnosticosSeleccionados, "Astigmatismo"]);
                                }
                              }}
                            >
                              Astigmatismo
                            </CommandItem>
                          </CommandGroup>
                          <CommandGroup heading="Agregar actual">
                            <CommandItem
                              onSelect={() => {
                                if (diagnostico.trim() !== "" && !diagnosticosSeleccionados.includes(diagnostico)) {
                                  setDiagnosticosSeleccionados([...diagnosticosSeleccionados, diagnostico]);
                                  setDiagnostico(""); // Limpiar el campo después de agregar
                                }
                              }}
                            >
                              {diagnostico.trim() !== "" ? `Agregar "${diagnostico}"` : "Seleccione un diagnóstico primero"}
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Mostrar diagnósticos seleccionados como badges */}
                {diagnosticosSeleccionados.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {diagnosticosSeleccionados.map((diag, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {diag}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => {
                            const nuevosSeleccionados = [...diagnosticosSeleccionados];
                            nuevosSeleccionados.splice(index, 1);
                            setDiagnosticosSeleccionados(nuevosSeleccionados);
                          }}
                        >
                          <span className="sr-only">Eliminar</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3 w-3"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>



              {/* Tratamiento */}
              <div className="flex flex-col space-y-2 sm:col-span-2">
                <Label htmlFor="tratamiento" className="font-medium">Tratamiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !tratamiento && "text-muted-foreground"
                      )}
                      disabled={tratamientosDisponibles.length === 0 && !diagnostico}
                    >
                      {tratamiento || "Seleccione tratamiento"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar tratamiento..." 
                        className="h-9"
                        onValueChange={(value) => {
                          if (!tratamientosDisponibles.includes(value) && value.trim() !== "") {
                            setTratamiento(value);
                          }
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-2 px-4 text-sm">
                            No se encontraron resultados. Presione Enter para agregar.
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {tratamientosDisponibles.map((trat) => (
                            <CommandItem
                              key={trat}
                              value={trat}
                              onSelect={(value) => {
                                setTratamiento(value);
                              }}
                            >
                              {trat}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  tratamiento === trat ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Observaciones */}
              <div className="flex flex-col space-y-2 sm:col-span-2">
                <Label htmlFor="observaciones" className="font-medium">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Agregue observaciones adicionales"
                />
              </div>

              {/* Próxima visita */}
              <div className="flex flex-col space-y-2">
                <Label htmlFor="proximaVisita" className="font-medium">Próxima visita</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!proximaVisita && "text-muted-foreground"
                        }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {proximaVisita ? (
                        format(proximaVisita, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={proximaVisita}
                      onSelect={(date) => {
                        if (date) {
                          // Agregar un día a la fecha seleccionada para corregir el desfase
                          const newDate = new Date(date);
                          newDate.setDate(newDate.getDate() + 1);
                          setProximaVisita(newDate);
                        }
                      }}
                      initialFocus
                      locale={es}
                      required={false}
                      modifiersStyles={{
                        hover: { backgroundColor: 'transparent' } // Eliminar el efecto hover
                      }}
                      disabled={(date) => {
                        // Deshabilitar fechas anteriores o iguales a hoy
                        return isBefore(date, addDays(new Date(), 1)) || isToday(date);
                      }}
                      classNames={{
                        day_today: "bg-muted text-muted-foreground",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_selected: "bg-green-500 text-primary-foreground hover:bg-green-500 hover:text-primary-foreground focus:bg-green-500 focus:text-primary-foreground",
                        day_range_middle: "bg-green-100 text-green-900",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-green-100 hover:text-green-900 focus:bg-green-100 focus:text-green-900"
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-6 pt-4 border-t">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4" /> Guardando...
                  </>
                ) : (
                  <>
                    <BadgeCheckIcon className="w-4 h-4" /> Guardar
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Brush className="w-4 h-4" /> Limpiar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
