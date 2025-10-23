"use client"

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kit/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@kit/ui/dialog";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kit/ui/select";
import { Textarea } from "@kit/ui/textarea";
import { createClient } from "@supabase/supabase-js";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { HomeLayoutPageHeader } from '../../_components/home-page-header';
import { Trans } from '@kit/ui/trans';
import { PageBody } from '@kit/ui/page';
import { DataTable } from "./data-table";
import { columns, InventarioItem } from "./columns";


export default function InventarioPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [inventarioItems, setInventarioItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    nombre_producto: '',
    categoria: '',
    marca: '',
    modelo: '',
    cantidad: 0,
    precio: 0,
    descripcion: ''
  });

  const fetchInventario = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("inventarios").select("*");
      console.log(data);
      
      if (error) {
        throw error;
      }

      setInventarioItems(data || []);
    } catch (err: any) {
      console.error("Error fetching inventario:", err);
      setError(err.message || "Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventario();
  }, []);





  // Función para añadir nuevo producto
  const handleAddProduct = async () => {
    if (!newProduct.nombre_producto || !newProduct.categoria || newProduct.cantidad < 0 || newProduct.precio < 0) {
      setError('Por favor, completa todos los campos requeridos correctamente');
      return;
    }

    try {
      const { data, error } = await supabase
        .from("inventarios")
        .insert([{
          nombre_producto: newProduct.nombre_producto,
          categoria: newProduct.categoria,
          marca: newProduct.marca,
          modelo: newProduct.modelo,
          cantidad: newProduct.cantidad,
          precio: newProduct.precio,
          descripcion: newProduct.descripcion
        }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const insertedItem = data[0] as any;
        const newItem: InventarioItem = {
          id: insertedItem?.id || '',
          user_id: insertedItem?.user_id || '',
          nombre_producto: insertedItem?.nombre_producto || newProduct.nombre_producto,
          categoria: insertedItem?.categoria || newProduct.categoria,
          marca: insertedItem?.marca || newProduct.marca,
          modelo: insertedItem?.modelo || newProduct.modelo,
          cantidad: insertedItem?.cantidad || newProduct.cantidad,
          precio: insertedItem?.precio || newProduct.precio,
          descripcion: insertedItem?.descripcion || newProduct.descripcion,
          created_at: insertedItem?.created_at || new Date().toISOString(),
          updated_at: insertedItem?.updated_at || new Date().toISOString()
        };

        setInventarioItems(prev => [...prev, newItem]);
      }

      // Cerrar el diálogo y resetear el formulario
      setIsDialogOpen(false);
      setNewProduct({
        nombre_producto: '',
        categoria: '',
        marca: '',
        modelo: '',
        cantidad: 0,
        precio: 0,
        descripcion: ''
      });
      setError(null);
    } catch (err: any) {
      console.error('Error adding product:', err);
      setError(err.message || 'Error al agregar el producto');
    }
  };

  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.home'} />}
        description={<Trans i18nKey={'common:homeTabDescription'} />}
      />
      <PageBody>
        <div className="container mx-auto py-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Inventario</h1>
              <p className="text-muted-foreground">Gestiona tu inventario de productos</p>
            </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </DialogTrigger>
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
                      onChange={(e) => setNewProduct(prev => ({ ...prev, nombre_producto: e.target.value }))}
                      className="col-span-3"
                      placeholder="Nombre del producto"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="categoria" className="text-right">
                      Categoría
                    </Label>
                    <Select value={newProduct.categoria} onValueChange={(value) => setNewProduct(prev => ({ ...prev, categoria: value }))}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronica">Electrónica</SelectItem>
                        <SelectItem value="ropa">Ropa</SelectItem>
                        <SelectItem value="hogar">Hogar</SelectItem>
                        <SelectItem value="deportes">Deportes</SelectItem>
                        <SelectItem value="libros">Libros</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
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
                      onChange={(e) => setNewProduct(prev => ({ ...prev, marca: e.target.value }))}
                      className="col-span-3"
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
                      onChange={(e) => setNewProduct(prev => ({ ...prev, modelo: e.target.value }))}
                      className="col-span-3"
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
                      onChange={(e) => setNewProduct(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                      className="col-span-3"
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
                      onChange={(e) => setNewProduct(prev => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
                      className="col-span-3"
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
                      onChange={(e) => setNewProduct(prev => ({ ...prev, descripcion: e.target.value }))}
                      className="col-span-3"
                      placeholder="Descripción del producto (opcional)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddProduct}>
                    Guardar Producto
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
          <CardDescription>
            Visualiza y gestiona todos tus productos de inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <p>Cargando inventario...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-40 text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={inventarioItems}
              searchPlaceholder="Buscar productos por nombre, categoría, marca o modelo..."
            />
          )}
        </CardContent>
      </Card>
        </div>
      </PageBody>
    </>
  );
}