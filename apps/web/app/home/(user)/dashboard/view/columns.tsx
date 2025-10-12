"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@kit/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Interfaz Paciente según la estructura de la tabla
export interface Paciente {
  id: string;
  user_id: string;
  nombre: string;
  apellido: string;
  edad: number | null;
  sexo: string | null;
  domicilio: string | null;
  motivo_consulta: string | null;
  diagnostico_id: string | null;
  telefono: string | null;
  fecha_de_cita: string | null;
  created_at: string | null;
  updated_at: string | null;
  estado: string | null;
}

// Función para formatear fecha
export const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  } catch (e) {
    return dateString;
  }
};

// Función para renderizar el estado con Badge
export const renderEstado = (estado: string | null) => {
  if (!estado) return <Badge variant="outline">Sin estado</Badge>;
  
  switch (estado.toLowerCase()) {
    case "pendiente":
      return <Badge variant="secondary">{estado}</Badge>;
    case "completado":
      return <Badge variant="success">{estado}</Badge>;
    case "cancelado":
      return <Badge variant="destructive">{estado}</Badge>;
    default:
      return <Badge>{estado}</Badge>;
  }
};

export const columns: ColumnDef<Paciente>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
    cell: ({ row }) => <div className="font-medium">{row.getValue("nombre")}</div>,
  },
  {
    accessorKey: "apellido",
    header: "Apellido",
  },
  {
    accessorKey: "edad",
    header: "Edad",
    cell: ({ row }) => {
      const edad = row.getValue("edad");
      return <div>{edad !== null && edad !== undefined ? String(edad) : "-"}</div>;
    },
  },
  {
    accessorKey: "sexo",
    header: "Sexo",
    cell: ({ row }) => {
      const sexo = row.getValue("sexo");
      return <div>{sexo !== null && sexo !== undefined ? String(sexo) : "-"}</div>;
    },
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => {
      const telefono = row.getValue("telefono");
      return <div>{telefono !== null && telefono !== undefined ? String(telefono) : "-"}</div>;
    },
  },
  {
    accessorKey: "motivo_consulta",
    header: "Motivo",
    cell: ({ row }) => {
      const motivo = row.getValue("motivo_consulta");
      return <div className="max-w-[200px] truncate">{motivo !== null && motivo !== undefined ? String(motivo) : "-"}</div>;
    },
  },
  {
    accessorKey: "fecha_de_cita",
    header: "Fecha Cita",
    cell: ({ row }) => {
      const fecha = row.getValue("fecha_de_cita") as string | null;
      return <div>{formatDate(fecha)}</div>;
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string | null;
      return renderEstado(estado);
    },
  },
]