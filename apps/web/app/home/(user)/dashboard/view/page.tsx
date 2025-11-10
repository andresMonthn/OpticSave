
"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Button } from "@kit/ui/button";
import { useParams, useRouter } from 'next/navigation';
import { Checkbox } from "@kit/ui/checkbox";
import { Label } from "@kit/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@kit/ui/popover";
import { Settings, Sheet, Upload, X } from "lucide-react";
import { Trans } from '@kit/ui/trans';
import { HomeLayoutPageHeader } from '../../../(user)/_components/home-page-header';
import { PageBody } from '@kit/ui/page';
import { columns, Paciente } from "./columns";
import { DataTable } from "./data-table";
import { renderEstado, formatDate } from "./columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@kit/ui/dialog";
import ImportView from "./import";

// Función para determinar el estado basado en la fecha de cita (PROGRAMADO/PENDIENTE/EXPIRADO)
const determinarEstado = (fechaCita: string | null): string => {
  if (!fechaCita) return 'PENDIENTE';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaCitaObj = new Date(fechaCita);
  fechaCitaObj.setHours(0, 0, 0, 0);

  if (fechaCitaObj.getTime() === hoy.getTime()) {
    return 'PENDIENTE';
  } else if (fechaCitaObj.getTime() > hoy.getTime()) {
    return 'PROGRAMADO';
  } else {
    return 'EXPIRADO';
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
  const [importOpen, setImportOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    nombre: true,
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

      // Actualizar en BD los estados desincronizados (validación automática en render)
      const updates = pacientesActualizados
        .filter((pOriginal, idx) => {
          const original = (data as any[])[idx];
          return original && pOriginal.estado && original.estado !== pOriginal.estado;
        })
        .map((p) => supabase.from('pacientes' as any).update({ estado: p.estado }).eq('id', p.id));

      if (updates.length > 0) {
        await Promise.allSettled(updates);
      }
      
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
        const nameA = (a.nombre || '').toLowerCase();
        const nameB = (b.nombre || '').toLowerCase();
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

  const handleExportCSV = () => {
    const visibleColumnKeys = Object.entries(visibleColumns)
      .filter(([, isVisible]) => isVisible)
      .map(([key]) => key);

    const header = visibleColumnKeys.join(',') + '\n';

    const rows = sortedPacientes.map(paciente => {
      return visibleColumnKeys.map(key => {
        const value = paciente[key as keyof Paciente];
        // Formatear y escapar valores para CSV
        if (value === null || value === undefined) return '';
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',');
    }).join('\n');

    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `pacientes_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <HomeLayoutPageHeader
         title={<Trans i18nKey={'common:routes.home'} />}
         description={<Trans i18nKey={'common:homeTabDescription'} />}
      />
      <PageBody>
        <div className="space-y-6 mx-2 sm:mx-4 md:mx-[45px]">
          {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => {
              setSortField("nombre");
              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            }}
          >
            Nombre {sortField === "nombre" && (sortDirection === "asc" ? "↑" : "↓")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => {
              setSortField("created_at");
              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            }}
          >
            Fecha {sortField === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("table")}
            className={`text-xs sm:text-sm ${viewMode === "table" ? "bg-primary/10" : ""}`}
          >
            Tabla
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("cards")}
            className={`text-xs sm:text-sm ${viewMode === "cards" ? "bg-primary/10" : ""}`}
          >
            Tarjetas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPacientes}
            className="text-xs sm:text-sm"
          >
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm flex items-center gap-2"
            onClick={handleExportCSV}
          >
            <Sheet className="h-3 w-3 sm:h-4 sm:w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm flex items-center gap-2"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
            Importar
          </Button>
          
          {/* Selector de campos */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="sm:inline">Campos</span>
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
                      <Label htmlFor={`column-${column}`} className="capitalize text-sm">
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
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <DataTable
            columns={columns.filter(col => 'accessorKey' in col && visibleColumns[col.accessorKey as string])}
            data={sortedPacientes}
            searchPlaceholder="Buscar paciente..."
            onRowClick={handleRowClick}
          />
        </div>
      )}

      {/* Cards individuales por paciente */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {sortedPacientes.map((p) => (
            <Card 
              key={p.id} 
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRowClick(p.id)}
            >
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base sm:text-lg line-clamp-1">{p.nombre}</CardTitle>
                  <EstadoCell estado={p.estado} />
                </div>
              </CardHeader>
              <CardContent className="pt-1 sm:pt-2 px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm">
                  <div className="text-muted-foreground">Edad:</div>
                  <div>{p.edad ?? "-"}</div>

                  <div className="text-muted-foreground">Sexo:</div>
                  <div>{p.sexo ?? "-"}</div>

                  <div className="text-muted-foreground">Teléfono:</div>
                  <div className="truncate">{p.telefono ?? "-"}</div>

                  <div className="text-muted-foreground">Domicilio:</div>
                  <div className="truncate max-w-[120px] sm:max-w-[150px]">{p.domicilio ?? "-"}</div>

                  <div className="text-muted-foreground">Fecha cita:</div>
                  <div><FechaCitaCell fecha={p.fecha_de_cita} /></div>

                  <div className="col-span-2 text-muted-foreground mt-1">Motivo consulta:</div>
                  <div className="col-span-2 line-clamp-2">{p.motivo_consulta ?? "-"}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      </PageBody>
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-xl p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <DialogTitle className="text-sm font-medium">Importar pacientes</DialogTitle>
          </div>
          <div className="p-4 max-h-[75vh] overflow-auto">
            <ImportView />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

