"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  Row,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kit/ui/table"
import { Button } from "@kit/ui/button"
import { Input } from "@kit/ui/input"
import { useState, useRef, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kit/ui/dropdown-menu"
import { toast } from "@kit/ui/sonner"
import { Copy, FileText, MoreVertical, Eye, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kit/ui/dialog"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  onRowClick?: (id: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  // Filtrar columnas para móvil (solo nombre y fecha)
  const getVisibleColumns = () => {
    if (isMobile) {
      return columns.filter(col => {
        const key = 'accessorKey' in col ? col.accessorKey as string : ''
        return key === 'nombre' || key === 'fecha_de_cita'
      })
    }
    return columns
  }

  const table = useReactTable({
    data,
    columns: getVisibleColumns(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  // Manejar toque largo en móvil
  const handleRowTouch = (row: any) => {
    if (isMobile) {
      setSelectedRow(row.original)
      setMenuOpen(true)
    } else if (onRowClick) {
      onRowClick((row.original as any).id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder={isMobile ? "Buscar paciente..." : searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="transition-all duration-200">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
                {isMobile && <TableHead className="w-10"></TableHead>}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`transition-all duration-200 ${isMobile ? "touch-manipulation" : "cursor-pointer hover:bg-muted/50"}`}
                  onClick={() => !isMobile && onRowClick && onRowClick((row.original as any).id)}
                  onTouchStart={() => handleRowTouch(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="transition-all duration-200">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  {isMobile && (
                    <TableCell className="p-0 w-10">
                      <Dialog open={menuOpen && selectedRow?.id === (row.original as any).id} onOpenChange={(open) => !open && setMenuOpen(false)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRow(row.original)
                              setMenuOpen(true)
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md animate-in slide-in-from-bottom-10 duration-300">
                          <DialogHeader>
                            <DialogTitle>Opciones para {(row.original as any).nombre}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <Button 
                              variant="default" 
                              className="w-full justify-start"
                              onClick={() => {
                                const pacienteId = (row.original as any).id;
                                router.push(`/home/dashboard/historialclinico/${pacienteId}`);
                                setMenuOpen(false);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver historial clínico completo
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full justify-start"
                              onClick={() => {
                                navigator.clipboard.writeText((row.original as any).id);
                                toast("ID copiado", {
                                  description: "El ID del paciente ha sido copiado al portapapeles"
                                });
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar ID del paciente
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isMobile ? 3 : columns.length} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="text-sm text-muted-foreground">
          Total: {table.getFilteredRowModel().rows.length} paciente(s)
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}