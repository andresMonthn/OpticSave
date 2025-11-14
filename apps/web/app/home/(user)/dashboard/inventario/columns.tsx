"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@kit/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Interfaz InventarioItem según la estructura de la tabla inventarios
export interface InventarioItem {
  id: string;
  user_id: string;
  nombre_producto: string;
  categoria: string;
  marca: string | null;
  modelo: string | null;
  cantidad: number;
  precio: number;
  descripcion: string | null;
  caducidad: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Función para formatear fecha
const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  } catch (e) {
    return dateString;
  }
};

// Función para renderizar el estado del stock con Badge
const renderStockStatus = (cantidad: number) => {
  if (cantidad === 0) {
    return <Badge variant="destructive">Sin stock</Badge>;
  } else if (cantidad <= 5) {
    return <Badge variant="secondary">Stock bajo</Badge>;
  } else {
    return <Badge variant="success">En stock</Badge>;
  }
};

export const columns: ColumnDef<InventarioItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="font-medium text-xs">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "nombre_producto",
    header: "Producto",
    cell: ({ row }) => <div className="font-medium">{row.getValue("nombre_producto")}</div>,
  },
  {
    accessorKey: "categoria",
    header: "Categoría",
    cell: ({ row }) => {
      const categoria = row.getValue("categoria") as string;
      return <div>{categoria || "-"}</div>;
    },
  },
  {
    accessorKey: "marca",
    header: "Marca",
    cell: ({ row }) => {
      const marca = row.getValue("marca") as string | null;
      return <div>{marca || "-"}</div>;
    },
  },
  {
    accessorKey: "modelo",
    header: "Modelo",
    cell: ({ row }) => {
      const modelo = row.getValue("modelo") as string | null;
      return <div>{modelo || "-"}</div>;
    },
  },
  {
    accessorKey: "cantidad",
    header: "Cantidad",
    cell: ({ row }) => {
      const rawCantidad = row.getValue("cantidad");
      const cantidad = typeof rawCantidad === 'number' ? rawCantidad : Number(rawCantidad as string) || 0;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{cantidad}</span>
          {renderStockStatus(cantidad)}
        </div>
      );
    },
  },
  {
    accessorKey: "precio",
    header: "Precio",
    cell: ({ row }) => {
      const precio = row.getValue("precio");
      const precioNumerico = typeof precio === 'number' ? precio : parseFloat(precio as string) || 0;
      return <div className="font-medium">${precioNumerico.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
    cell: ({ row }) => {
      const descripcion = row.getValue("descripcion") as string | null;
      return (
        <div className="max-w-[200px] truncate">
          {descripcion || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "caducidad",
    header: "Caducidad",
    cell: ({ row }) => {
      const cad = row.getValue("caducidad") as string | null;
      return <div>{cad || "-"}</div>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha Creación",
    cell: ({ row }) => {
      const fecha = row.getValue("created_at") as string | null;
      return <div>{formatDate(fecha)}</div>;
    },
  },
]