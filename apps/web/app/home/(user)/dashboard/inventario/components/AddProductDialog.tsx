"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@kit/ui/dialog";
import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kit/ui/select";
import { Textarea } from "@kit/ui/textarea";
import { Plus } from "lucide-react";

interface NewProduct {
  nombre_producto: string;
  categoria: string;
  marca: string;
  modelo: string;
  cantidad: string;
  precio: string;
  descripcion: string;
}

export function AddProductDialog({
  open,
  onOpenChange,
  categoriasOptica,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriasOptica: string[];
  onSubmit: (product: NewProduct) => void;
}) {
  const [newProduct, setNewProduct] = React.useState<NewProduct>({
    nombre_producto: "",
    categoria: "",
    marca: "",
    modelo: "",
    cantidad: "",
    precio: "",
    descripcion: "",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Producto</DialogTitle>
          <DialogDescription>
            Completa la información del nuevo producto para añadirlo al inventario.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nombre_producto" className="text-right">
              Nombre
            </Label>
            <Input
              id="nombre_producto"
              value={newProduct.nombre_producto}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, nombre_producto: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder="Nombre del producto"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="categoria" className="text-right">
              Categoría
            </Label>
            <Select value={newProduct.categoria} onValueChange={(value) => setNewProduct((prev) => ({ ...prev, categoria: value }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona una categoría de óptica" />
              </SelectTrigger>
              <SelectContent>
                {categoriasOptica.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="marca" className="text-right">
              Marca
            </Label>
            <Input
              id="marca"
              value={newProduct.marca}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, marca: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder="Marca del producto (opcional)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modelo" className="text-right">
              Modelo
            </Label>
            <Input
              id="modelo"
              value={newProduct.modelo}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, modelo: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder="Modelo del producto (opcional)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cantidad" className="text-right">
              Cantidad
            </Label>
            <Input
              id="cantidad"
              type="number"
              value={newProduct.cantidad}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, cantidad: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="precio" className="text-right">
              Precio
            </Label>
            <Input
              id="precio"
              type="number"
              step="0.01"
              value={newProduct.precio}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, precio: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="descripcion" className="text-right">
              Descripción
            </Label>
            <Textarea
              id="descripcion"
              value={newProduct.descripcion}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, descripcion: e.target.value }))}
              className="col-span-3"
              autoComplete="off"
              placeholder="Descripción del producto (opcional)"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSubmit(newProduct)}>
            <Plus className="mr-2 h-4 w-4" />
            Guardar Producto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import * as React from "react";