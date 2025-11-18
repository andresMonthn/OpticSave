"use client"

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kit/ui/card";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { HomeLayoutPageHeader } from '../_components/home-page-header';
import { Trans } from '@kit/ui/trans';
import { PageBody } from '@kit/ui/page';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { DataTable } from "./data-table";
import { columns, InventarioItem } from "./columns";
import { AddProductDialog } from "./components/AddProductDialog";
import { EditProductDialog } from "./components/EditProductDialog";
import { InventoryTotalCard } from "./components/InventoryTotalCard";
import { ClientOnly } from "./components/ClientOnly";
import { useOffline } from "../_lib/offline/useOffline";
import { useInventariosDB } from "../_lib/offline/useDB";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@kit/ui/tooltip";

export default function InventarioPage() {
  const supabase = getSupabaseBrowserClient();
  const { isOnline, offlineAccepted } = useOffline({ autoPrompt: false });
  const [userId, setUserId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
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
  const [localIndexById, setLocalIndexById] = useState<Record<string, number>>({});

  useEffect(() => { setMounted(true); }, []);

  const inventariosDB = useInventariosDB({ userId: userId ?? "", isOnline, offlineAccepted });

  useEffect(() => {
    (async () => {
      try {
        if (isOnline) {
          const { data: auth } = await supabase.auth.getUser();
          if (auth?.user?.id) {
            setUserId(auth.user.id);
            try { localStorage.setItem("optisave_user_id", auth.user.id); } catch {}
          } else {
            setUserId(null);
          }
        } else {
          const cached = typeof window !== "undefined" ? localStorage.getItem("optisave_user_id") : null;
          if (cached) setUserId(cached);
        }
      } catch (e) {
        // Ignorar errores de red
      }
    })();
  }, [isOnline, supabase, offlineAccepted]);

  const toInventarioItems = useMemo(() => {
    return (list: any[]) => {
      const nextIndex: Record<string, number> = {};
      const out: InventarioItem[] = list.map((it: any) => {
        const idStr = it.id ? String(it.id) : `local-${it.localId}`;
        if (typeof it.localId === "number") nextIndex[idStr] = it.localId;
        return {
          id: idStr,
          user_id: it.user_id ?? userId ?? "",
          nombre_producto: it.nombre_producto ?? "",
          categoria: it.categoria ?? "",
          marca: it.marca ?? null,
          modelo: it.modelo ?? null,
          cantidad: typeof it.cantidad === 'number' ? it.cantidad : Number(it.cantidad) || 0,
          precio: typeof it.precio === 'number' ? it.precio : Number(it.precio) || 0,
          descripcion: it.descripcion ?? null,
          caducidad: it.caducidad ?? null,
          created_at: it.created_at ?? null,
          updated_at: it.updated_at ?? null,
        };
      });
      setLocalIndexById(nextIndex);
      return out;
    };
  }, [userId]);

  const seedDexieFromRemote = async (uid: string) => {
    const { data, error } = await supabase
      .from("inventarios" as any)
      .select("*")
      .eq("user_id", uid);
    if (error) throw error;
    const remote = (data as any[]).map((item) => ({
      ...item,
      cantidad: typeof item.cantidad === 'number' ? item.cantidad : Number(item.cantidad) || 0,
      precio: typeof item.precio === 'number' ? item.precio : Number(item.precio) || 0,
      _status: "synced",
    }));

    for (const r of remote) {
      const found = await inventariosDB.db.inventarios.where({ id: r.id, user_id: uid }).first();
      if (found) {
        await inventariosDB.db.inventarios.update(found.localId!, {
          nombre_producto: r.nombre_producto ?? null,
          categoria: r.categoria ?? null,
          marca: r.marca ?? null,
          modelo: r.modelo ?? null,
          cantidad: r.cantidad ?? 0,
          precio: r.precio ?? 0,
          descripcion: r.descripcion ?? null,
          caducidad: r.caducidad ?? null,
          created_at: r.created_at ?? null,
          updated_at: r.updated_at ?? null,
          _status: "synced",
        });
      } else {
        await inventariosDB.db.inventarios.add({
          id: r.id,
          user_id: uid,
          nombre_producto: r.nombre_producto ?? null,
          categoria: r.categoria ?? null,
          marca: r.marca ?? null,
          modelo: r.modelo ?? null,
          cantidad: r.cantidad ?? 0,
          precio: r.precio ?? 0,
          descripcion: r.descripcion ?? null,
          caducidad: r.caducidad ?? null,
          created_at: r.created_at ?? null,
          updated_at: r.updated_at ?? null,
          _status: "synced",
        });
      }
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (isOnline && userId) {
          await seedDexieFromRemote(userId);
          const list = await inventariosDB.list();
          const filtered = list.filter(it => it.user_id === userId);
          const visible = filtered.filter((it: any) => Boolean(it.id));
          setInventarioItems(toInventarioItems(visible));
        } else if (!isOnline && offlineAccepted) {
          const list = await inventariosDB.list();
          const filtered = userId ? list.filter(it => it.user_id === userId) : list;
          setInventarioItems(toInventarioItems(filtered));
        } else if (!isOnline && !offlineAccepted) {
          setError("Sin conexión. Acepta modo offline para seguir trabajando.");
          setInventarioItems([]);
        }
      } catch (err: any) {
        console.error("Error al cargar inventario:", err);
        setError(err.message || "Error al cargar el inventario");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOnline, offlineAccepted, userId]);

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
      if (!userId) {
        setError("No se pudo determinar el usuario. Inicia sesión para continuar.");
        return;
      }

      await inventariosDB.add({
        user_id: userId,
        nombre_producto: newProduct.nombre_producto,
        categoria: newProduct.categoria,
        marca: newProduct.marca || null,
        modelo: newProduct.modelo || null,
        cantidad: cantidadNum,
        precio: precioNum,
        descripcion: newProduct.descripcion || null,
        caducidad: null,
      } as any);

      const list = await inventariosDB.list();
      const filtered = list.filter(it => it.user_id === userId);
      const visible = isOnline ? filtered.filter((it: any) => Boolean(it.id)) : filtered;
      setInventarioItems(toInventarioItems(visible));
      setIsAddOpen(false);
      setError(null);
    } catch (err: any) {
      console.error('Error adding product:', err);
      setError(err.message || 'Error al agregar el producto');
    }
  };

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
      const localId = localIndexById[selectedItem.id];
      if (typeof localId !== 'number') {
        setError('No se pudo localizar el registro local para editar.');
        return;
      }

      await inventariosDB.update(localId, {
        nombre_producto: updates.nombre_producto,
        categoria: updates.categoria,
        marca: updates.marca || null,
        modelo: updates.modelo || null,
        cantidad: cantidadNum,
        precio: precioNum,
        descripcion: updates.descripcion || null,
      } as any);

      const list = await inventariosDB.list();
      const filtered = userId ? list.filter(it => it.user_id === userId) : list;
      const visible = isOnline ? filtered.filter((it: any) => Boolean(it.id)) : filtered;
      setInventarioItems(toInventarioItems(visible));
      setIsEditOpen(false);
      setSelectedItem(null);
      setError(null);
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message || 'Error al actualizar el producto');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const localId = localIndexById[id];
      if (typeof localId !== 'number') {
        setError('No se pudo localizar el registro local para eliminar.');
        return;
      }
      await inventariosDB.remove(localId);
      const list = await inventariosDB.list();
      const filtered = userId ? list.filter(it => it.user_id === userId) : list;
      const visible = isOnline ? filtered.filter((it: any) => Boolean(it.id)) : filtered;
      setInventarioItems(toInventarioItems(visible));
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Error al eliminar el producto');
    }
  };

  const handleRowClick = (id: string) => {
    const found = inventarioItems.find((it) => String(it.id) === String(id));
    if (!found) return;
    setSelectedItem(found);
    setIsEditOpen(true);
  };

  return (
    <PageBody>
      <HomeLayoutPageHeader
        title={
          <Trans i18nKey={'common:labels.inventory'} defaults={'Inventario'} />
        }
        description={
          <Trans i18nKey={'common:descriptions.inventory'} defaults={'Gestiona tus productos y stock.'} />
        }
      />
      <AppBreadcrumbs values={{ current: 'Inventario' }} />
      <Card>
        <CardHeader>
          <CardTitle>Inventario</CardTitle>
          <CardDescription>Gestiona tus productos y stock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="text-red-600">{error}</div>
            )}
            <ClientOnly>
              <InventoryTotalCard items={inventarioItems} />
            </ClientOnly>
            <div className="flex items-center justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => setIsAddOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Agregar producto
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Agregar nuevo producto</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <ClientOnly>
              <DataTable
                columns={columns}
                data={inventarioItems}
                onRowClick={handleRowClick}
                onEdit={(it) => handleRowClick((it as any).id)}
                onDelete={handleDelete}
              />
            </ClientOnly>
          </div>
        </CardContent>
      </Card>

      <AddProductDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        categoriasOptica={categoriasOptica}
        onSubmit={handleAddSubmit}
      />

      <EditProductDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        categoriasOptica={categoriasOptica}
        item={selectedItem}
        onSubmit={handleEditSubmit}
      />
    </PageBody>
  );
}