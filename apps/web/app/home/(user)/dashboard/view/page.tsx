
"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Button } from "@kit/ui/button";
import { useParams, useRouter } from 'next/navigation';
import { Checkbox } from "@kit/ui/checkbox";
import { Label } from "@kit/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@kit/ui/popover";
import { Settings } from "lucide-react";
import { Trans } from 'react-i18next';
import { columns, Paciente } from "./columns";
import { DataTable } from "./data-table";
import { renderEstado, formatDate } from "./columns";

// Función para determinar el estado basado en la fecha de cita
const determinarEstado = (fechaCita: string | null): string => {
  if (!fechaCita) return 'pendiente';
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Resetear la hora para comparar solo fechas
  
  const fechaCitaObj = new Date(fechaCita);
  fechaCitaObj.setHours(0, 0, 0, 0);
  
  if (fechaCitaObj.getTime() === hoy.getTime()) {
    return 'activa';
  } else if (fechaCitaObj.getTime() < hoy.getTime()) {
    return 'expirada';
  } else {
    return 'pendiente';
  }
};

function EstadoCell({ estado }: { estado: string | null }) {
  return renderEstado(estado);
}

function FechaCitaCell({ fecha }: { fecha: string | null }) {
  return <div>{formatDate(fecha)}</div>;
}

export default function View() {
  // Todos los hooks primero, en orden consistente
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"nombre" | "created_at">("nombre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    nombre: true,
    apellido: true,
    edad: true,
    sexo: true,
    telefono: true,
    domicilio: true,
    motivo_consulta: true,
    estado: true,
    fecha_de_cita: true,
    created_at: false
  });
  const router = useRouter();
  const params = useParams();
  
  // Variables derivadas de hooks (no son hooks)
  const account = params.account as string;
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    fetchPacientes();
  }, []);

  // La función checkUser ha sido eliminada ya que no es necesaria

  const fetchPacientes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usar type assertion para evitar errores de tipado con la tabla pacientes
      const { data, error } = await supabase
        .from('pacientes' as unknown as any)
        .select('*');

      if (error) {
        throw error;
      }

      // Actualizar el estado de cada paciente según la fecha de cita
      const pacientesActualizados = data ? (data as unknown as Paciente[]).map(paciente => ({
        ...paciente,
        estado: determinarEstado(paciente.fecha_de_cita)
      })) : [];
      
      setPacientes(pacientesActualizados);
    } catch (err: any) {
      console.error("Error fetching pacientes:", err);
      setError(err.message || "Error al cargar los pacientes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><p>Cargando pacientes...</p></div>;
  if (error) return <div className="bg-destructive/20 p-4 rounded-md"><p>Error: {error}</p></div>;

  // Función para ordenar los pacientes
  const sortPacientes = () => {
    const sortedData = [...pacientes].sort((a, b) => {
      if (sortField === "nombre") {
        // Safely handle null or undefined values
        const nameA = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
        const nameB = `${b.nombre || ''} ${b.apellido || ''}`.toLowerCase();
        return sortDirection === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else {
        // Ordenar por fecha de creación con manejo seguro de valores nulos
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
    });
    return sortedData;
  };

  // Mover useParams al inicio junto con los otros hooks
  const sortedPacientes = sortPacientes();
  
  // Función para manejar el clic en una fila
  const handleRowClick = (pacienteId: string) => {
    // Validar que el ID no sea nulo, indefinido o cero
    if (!pacienteId || pacienteId === '0') {
      console.error('ID de paciente inválido:', pacienteId);
      return;
    }
    
    console.log('Redirigiendo al paciente con ID:', pacienteId);
    router.push(`/home/dashboard/historialclinico/${pacienteId}`);
  };

  return (
    <div className="space-y-6 mx-[45px]">
      {/* Barra de herramientas */}
      <div className="flex justify-between items-center py-4">
        <div>
          <h1 className="text-2xl font-bold"><Trans i18nKey={'common:routes.dashboard'} /></h1>
          <div className="text-sm text-gray-500">Dashboard / Pacientes</div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSortField("nombre");
              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            }}
          >
            Ordenar por Nombre {sortField === "nombre" && (sortDirection === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSortField("created_at");
              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            }}
          >
            Ordenar por Fecha de Creación {sortField === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("table")}
            className={viewMode === "table" ? "bg-primary/10" : ""}
          >
            Tabla
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("cards")}
            className={viewMode === "cards" ? "bg-primary/10" : ""}
          >
            Tarjetas
          </Button>
          <Button variant="outline" size="sm" onClick={fetchPacientes}>
            Actualizar
          </Button>
          
          {/* Selector de campos */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Campos
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <h4 className="font-medium">Seleccionar campos</h4>
                <div className="grid gap-2">
                  {Object.keys(visibleColumns).map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`column-${column}`} 
                        checked={visibleColumns[column]}
                        onCheckedChange={(checked) => {
                          setVisibleColumns({
                            ...visibleColumns,
                            [column]: !!checked
                          });
                        }}
                      />
                      <Label htmlFor={`column-${column}`} className="capitalize">
                        {column.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* DataTable de pacientes */}
      {viewMode === "table" && (
        <DataTable
          columns={columns.filter(col => 'accessorKey' in col && visibleColumns[col.accessorKey as string])}
          data={sortedPacientes}
          searchPlaceholder="Buscar por nombre, apellido, motivo o estado..."
          onRowClick={handleRowClick}
        />
      )}

      {/* Cards individuales por paciente */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPacientes.map((p) => (
            <Card 
              key={p.id} 
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRowClick(p.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{p.nombre} {p.apellido}</CardTitle>
                  <EstadoCell estado={p.estado} />
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Edad:</div>
                  <div>{p.edad ?? "-"}</div>

                  <div className="text-muted-foreground">Sexo:</div>
                  <div>{p.sexo ?? "-"}</div>

                  <div className="text-muted-foreground">Teléfono:</div>
                  <div>{p.telefono ?? "-"}</div>

                  <div className="text-muted-foreground">Domicilio:</div>
                  <div className="truncate max-w-[150px]">{p.domicilio ?? "-"}</div>

                  <div className="text-muted-foreground">Fecha cita:</div>
                  <div><FechaCitaCell fecha={p.fecha_de_cita} /></div>

                  <div className="col-span-2 text-muted-foreground">Motivo consulta:</div>
                  <div className="col-span-2">{p.motivo_consulta ?? "-"}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

