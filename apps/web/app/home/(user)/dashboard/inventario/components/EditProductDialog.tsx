"use client"

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@kit/ui/dialog";
import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kit/ui/select";
import { Textarea } from "@kit/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@kit/ui/tooltip";
import { InventarioItem } from "../columns";
import { PencilLine, Tag, Shapes, Badge, Box, Hash, DollarSign, FileText, X, Check } from "lucide-react";

interface EditableProduct {
  nombre_producto: string;
  categoria: string;
  marca: string;
  modelo: string;
  cantidad: string;
  precio: string;
  descripcion: string;
}

export function EditProductDialog({
  open,
  onOpenChange,
  categoriasOptica,
  item,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriasOptica: string[];
  item: InventarioItem | null;
  onSubmit: (updates: EditableProduct) => void;
}) {
  const [form, setForm] = React.useState<EditableProduct>({
    nombre_producto: "",
    categoria: "",
    marca: "",
    modelo: "",
    cantidad: "",
    precio: "",
    descripcion: "",
  });

  React.useEffect(() => {
    if (item) {
      setForm({
        nombre_producto: item.nombre_producto || "",
        categoria: item.categoria || "",
        marca: item.marca || "",
        modelo: item.modelo || "",
        cantidad: String(item.cantidad ?? ""),
        precio: String(item.precio ?? ""),
        descripcion: item.descripcion || "",
      });
    }
  }, [item]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[480px]">
        <TooltipProvider>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <PencilLine className="h-5 w-5 text-primary" aria-label="Editar producto" />
              </TooltipTrigger>
              <TooltipContent>Editar producto</TooltipContent>
            </Tooltip>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Tag className="h-4 w-4 justify-self-end" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Nombre</TooltipContent>
            </Tooltip>
            <Input
              id="nombre_producto"
              aria-label="Nombre"
              value={form.nombre_producto}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre_producto: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder=""
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Shapes className="h-4 w-4 justify-self-end" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Categoría</TooltipContent>
            </Tooltip>
            <Select value={form.categoria} onValueChange={(value) => setForm((prev) => ({ ...prev, categoria: value }))}>
              <SelectTrigger className="col-span-3 w-auto sm:w-full" aria-label="Categoría">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent className="min-w-[12rem]">
                {categoriasOptica.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="h-4 w-4 justify-self-end" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Marca</TooltipContent>
            </Tooltip>
            <Input
              id="marca"
              aria-label="Marca"
              value={form.marca}
              onChange={(e) => setForm((prev) => ({ ...prev, marca: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder=""
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Box className="h-4 w-4 justify-self-end" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Modelo</TooltipContent>
            </Tooltip>
            <Input
              id="modelo"
              aria-label="Modelo"
              value={form.modelo}
              onChange={(e) => setForm((prev) => ({ ...prev, modelo: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder=""
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Hash className="h-4 w-4 justify-self-end" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Cantidad</TooltipContent>
            </Tooltip>
            <Input
              id="cantidad"
              aria-label="Cantidad"
              type="number"
              value={form.cantidad}
              onChange={(e) => setForm((prev) => ({ ...prev, cantidad: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder=""
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <DollarSign className="h-4 w-4 justify-self-end" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Precio</TooltipContent>
            </Tooltip>
            <Input
              id="precio"
              aria-label="Precio"
              type="number"
              step="0.01"
              value={form.precio}
              onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder=""
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <FileText className="h-4 w-4 justify-self-end" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Descripción</TooltipContent>
            </Tooltip>
            <Textarea
              id="descripcion"
              aria-label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder=""
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => onOpenChange(false)} aria-label="Cancelar">
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cancelar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={() => onSubmit(form)} aria-label="Guardar cambios">
                <Check className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Guardar</TooltipContent>
          </Tooltip>
        </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}