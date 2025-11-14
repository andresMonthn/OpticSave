"use client"

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kit/ui/card";
import { getSupabaseBrowserClient } from "@kit/supabase/browser-client";
import { Plus, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { HomeLayoutPageHeader } from '../../_components/home-page-header';
import { Trans } from '@kit/ui/trans';
import { PageBody } from '@kit/ui/page';
import { DataTable } from "./data-table";
import { columns, InventarioItem } from "./columns";
import { AddProductDialog } from "./components/AddProductDialog";
import { EditProductDialog } from "./components/EditProductDialog";
import { InventoryTotalCard } from "./components/InventoryTotalCard";
import { ClientOnly } from "./components/ClientOnly";
import { useOffline } from "../../_lib/offline/useOffline";
import { useInventariosDB } from "../../_lib/offline/useDB";
import { Badge } from "@kit/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@kit/ui/tooltip";
// Se elimina el diálogo de confirmación offline para centralizar el aviso en OfflineWrapper


export default function InventarioPage() {
  const supabase = getSupabaseBrowserClient();
  const { isOnline, offlineAccepted, setOfflineAccepted, promptOffline, syncing, lastSyncAt } = useOffline({ autoPrompt: false });
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
  // Se elimina el estado de diálogo offline; el aviso se gestiona globalmente
  // Validaciones y operaciones se harán al recibir datos del diálogo

  useEffect(() => { setMounted(true); }, []);

  // Hook de DB para CRUD unificado y Dexie
  const inventariosDB = useInventariosDB({ userId: userId ?? "", isOnline, offlineAccepted });

  // Resolver userId desde Supabase (online) o localStorage (offline)
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
          // Al estar online, no se muestra aviso offline
        } else {
          const cached = typeof window !== "undefined" ? localStorage.getItem("optisave_user_id") : null;
          if (cached) setUserId(cached);
          // El aviso offline se gestiona globalmente en OfflineWrapper
        }
      } catch (e) {
        // Ignorar errores de red al desconectarse
      }
    })();
  }, [isOnline, supabase, offlineAccepted]);

  // Función: normalizar objetos a InventarioItem y mantener índice local
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

  // Sembrar/actualizar Dexie desde remoto cuando online (sin perder pendientes)
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

    // Por cada registro remoto, upsert en Dexie por id
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

  // Cargar datos según estado online/offline
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (isOnline && userId) {
          await seedDexieFromRemote(userId);
          const list = await inventariosDB.list();
          const filtered = list.filter(it => it.user_id === userId);
          // Al estar online, oculta elementos creados sólo offline (sin id remoto)
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
      if (!userId) {
        setError("No se pudo determinar el usuario. Inicia sesión para continuar.");
        return;
      }

      const localId = await inventariosDB.add({
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

      // Refrescar lista desde Dexie para reflejar id remoto si se asignó
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
      if (!userId || !selectedItem) {
        setError("No se pudo determinar el usuario o el elemento a editar.");
        return;
      }
      const idStr = selectedItem.id;
      const localId = idStr.startsWith("local-") ? Number(idStr.replace("local-", "")) : localIndexById[idStr];
      if (typeof localId !== "number") {
        setError("No se encontró el registro local para editar.");
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
      const filtered = list.filter(it => it.user_id === userId);
      const visible = isOnline ? filtered.filter((it: any) => Boolean(it.id)) : filtered;
      setInventarioItems(toInventarioItems(visible));
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
      if (!userId) {
        setError("No se pudo determinar el usuario para eliminar el producto");
        return;
      }
      const localId = id.startsWith("local-") ? Number(id.replace("local-", "")) : localIndexById[id];
      if (typeof localId !== "number") {
        setError("No se encontró el registro local para eliminar.");
        return;
      }
      await inventariosDB.remove(localId);
      const list = await inventariosDB.list();
      const filtered = list.filter(it => it.user_id === userId);
      const visible = isOnline ? filtered.filter((it: any) => Boolean(it.id)) : filtered;
      setInventarioItems(toInventarioItems(visible));
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Error al eliminar el producto');
    }
  };

  return (
    <>
      {/* Aviso offline centralizado por OfflineWrapper; se elimina diálogo local */}
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
            <ClientOnly>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Agregar producto"
                      onClick={() => setIsAddOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Agregar producto</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </ClientOnly>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <ClientOnly>
              {!isOnline && (
                <Badge variant="secondary">Offline</Badge>
              )}
              {syncing && (
                <Badge variant="success">Sincronizando cambios…</Badge>
              )}
              {/* El botón para abrir el diálogo offline se elimina; control global en OfflineWrapper */}
              {lastSyncAt && (
                <span className="text-xs text-muted-foreground">
                  Última sincronización: {new Date(lastSyncAt).toLocaleString()}
                </span>
              )}
            </ClientOnly>
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