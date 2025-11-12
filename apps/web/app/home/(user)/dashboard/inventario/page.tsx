"use client"

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kit/ui/card";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kit/ui/select";
import { Textarea } from "@kit/ui/textarea";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { HomeLayoutPageHeader } from '../../_components/home-page-header';
import { Trans } from '@kit/ui/trans';
import { PageBody } from '@kit/ui/page';
import { DataTable } from "./data-table";
import { columns, InventarioItem } from "./columns";
import { AddProductDialog } from "./components/AddProductDialog";
import { EditProductDialog } from "./components/EditProductDialog";
import { InventoryTotalCard } from "./components/InventoryTotalCard";


export default function InventarioPage() {
  const supabase = getSupabaseBrowserClient();
  const categoriasOptica = [
    "Lentes oftálmicos",
    "Lentes de contacto",
    "Armazones",
    "Accesorios",
    "Soluciones y líquidos",
    "Medicamentos",
    "Equipos e instrumental",
    "Servicios y reparaciones",
    "Otros",
  ];
  const [inventarioItems, setInventarioItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);
  // Validaciones y operaciones se harán al recibir datos del diálogo

  const fetchInventario = async () => {
    setLoading(true);
    try {
      const { data: auth, error: userError } = await supabase.auth.getUser();
      if (userError || !auth?.user) {
        throw new Error("Debes iniciar sesión para ver el inventario");
      }

      const { data, error } = await supabase
        .from("inventarios" as any)
        .select("*")
        .eq("user_id", auth.user.id);
      console.log(data);
      
      if (error) {
        throw error;
      }
      // Normalizar tipos (cantidad y precio vienen como texto en la BD)
      const normalized = (data as any[]).map((item) => ({
        ...item,
        cantidad: typeof item.cantidad === 'number' ? item.cantidad : Number(item.cantidad) || 0,
        precio: typeof item.precio === 'number' ? item.precio : Number(item.precio) || 0,
      }));
      setInventarioItems(normalized as any);
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





  // Añadir nuevo producto (desde diálogo)
  const handleAddSubmit = async (newProduct: {
    nombre_producto: string; categoria: string; marca: string; modelo: string; cantidad: string; precio: string; descripcion: string;
  }) => {
    if (!newProduct.nombre_producto || !newProduct.categoria) {
      setError('Por favor, completa los campos de nombre y categoría');
      return;
    }

    const cantidadNum = Number(newProduct.cantidad);
    const precioNum = Number(newProduct.precio);

    if (Number.isNaN(cantidadNum) || cantidadNum < 0 || Number.isNaN(precioNum) || precioNum < 0) {
      setError('Cantidad y precio deben ser numéricos y mayores o iguales a 0');
      return;
    }

    if (!categoriasOptica.includes(newProduct.categoria)) {
      setError('Selecciona una categoría válida de óptica');
      return;
    }

    try {
      const { data: auth, error: userError } = await supabase.auth.getUser();
      if (userError || !auth?.user) {
        setError("Debes iniciar sesión para agregar productos");
        return;
      }

      const { data, error } = await supabase
        .from("inventarios" as any)
        .insert([{ 
          user_id: auth.user.id,
          nombre_producto: newProduct.nombre_producto,
          categoria: newProduct.categoria,
          marca: newProduct.marca,
          modelo: newProduct.modelo,
          cantidad: cantidadNum,
          precio: precioNum,
          descripcion: newProduct.descripcion
        }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const insertedItem = data[0] as any;
        const newItem: InventarioItem = {
          id: insertedItem?.id || '',
          user_id: insertedItem?.user_id || auth.user.id,
          nombre_producto: insertedItem?.nombre_producto || newProduct.nombre_producto,
          categoria: insertedItem?.categoria || newProduct.categoria,
          marca: insertedItem?.marca || newProduct.marca,
          modelo: insertedItem?.modelo || newProduct.modelo,
          cantidad: typeof insertedItem?.cantidad === 'number' ? insertedItem?.cantidad : cantidadNum,
          precio: typeof insertedItem?.precio === 'number' ? insertedItem?.precio : precioNum,
          descripcion: insertedItem?.descripcion || newProduct.descripcion,
          created_at: insertedItem?.created_at || new Date().toISOString(),
          updated_at: null
        };
        setInventarioItems(prev => [...prev, newItem]);
      }

      setIsAddOpen(false);
      setError(null);
    } catch (err: any) {
      console.error('Error adding product:', err);
      setError(err.message || 'Error al agregar el producto');
    }
  };

  // Editar producto (desde diálogo)
  const handleEditSubmit = async (updates: {
    nombre_producto: string; categoria: string; marca: string; modelo: string; cantidad: string; precio: string; descripcion: string;
  }) => {
    if (!selectedItem) return;
    const cantidadNum = Number(updates.cantidad);
    const precioNum = Number(updates.precio);
    if (Number.isNaN(cantidadNum) || cantidadNum < 0 || Number.isNaN(precioNum) || precioNum < 0) {
      setError('Cantidad y precio deben ser numéricos y mayores o iguales a 0');
      return;
    }
    if (!categoriasOptica.includes(updates.categoria)) {
      setError('Selecciona una categoría válida de óptica');
      return;
    }
    try {
      const { data: auth, error: userError } = await supabase.auth.getUser();
      if (userError || !auth?.user) {
        setError("Debes iniciar sesión para editar productos");
        return;
      }
      const { data, error } = await supabase
        .from("inventarios" as any)
        .update({
          nombre_producto: updates.nombre_producto,
          categoria: updates.categoria,
          marca: updates.marca,
          modelo: updates.modelo,
          cantidad: cantidadNum,
          precio: precioNum,
          descripcion: updates.descripcion,
        })
        .eq("id", selectedItem.id)
        .eq("user_id", auth.user.id)
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        const updated = data[0] as any;
        setInventarioItems(prev => prev.map(it => it.id === selectedItem.id ? {
          ...it,
          nombre_producto: updated?.nombre_producto ?? updates.nombre_producto,
          categoria: updated?.categoria ?? updates.categoria,
          marca: updated?.marca ?? updates.marca,
          modelo: updated?.modelo ?? updates.modelo,
          cantidad: typeof updated?.cantidad === 'number' ? updated?.cantidad : cantidadNum,
          precio: typeof updated?.precio === 'number' ? updated?.precio : precioNum,
          descripcion: updated?.descripcion ?? updates.descripcion,
          updated_at: null,
        } : it));
      }
      setIsEditOpen(false);
      setSelectedItem(null);
      setError(null);
    } catch (err: any) {
      console.error('Error editing product:', err);
      setError(err.message || 'Error al editar el producto');
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (id: string) => {
    try {
      const { data: auth, error: userError } = await supabase.auth.getUser();
      if (userError || !auth?.user) {
        setError("Debes iniciar sesión para eliminar productos");
        return;
      }
      const { error } = await supabase
        .from("inventarios" as any)
        .delete()
        .eq("id", id)
        .eq("user_id", auth.user.id);
      if (error) throw error;
      setInventarioItems(prev => prev.filter(it => it.id !== id));
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Error al eliminar el producto');
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
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </div>

          <AddProductDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            categoriasOptica={categoriasOptica}
            onSubmit={handleAddSubmit}
          />

          <EditProductDialog
            open={isEditOpen}
            onOpenChange={(open) => {
              setIsEditOpen(open);
              if (!open) setSelectedItem(null);
            }}
            categoriasOptica={categoriasOptica}
            item={selectedItem}
            onSubmit={handleEditSubmit}
          />

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
            <>
              <div className="mb-6">
                <InventoryTotalCard items={inventarioItems} />
              </div>
              <DataTable
                columns={columns}
                data={inventarioItems}
                searchPlaceholder="Buscar productos por nombre, categoría, marca o modelo..."
                onEdit={(item) => { setSelectedItem(item as InventarioItem); setIsEditOpen(true); }}
                onDelete={(id) => handleDeleteProduct(id as any)}
              />
            </>
          )}
        </CardContent>
      </Card>
        </div>
      </PageBody>
    </>
  );
}