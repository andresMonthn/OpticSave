"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Badge } from "@kit/ui/badge";
import { InventarioItem } from "../columns";
import { Package } from "lucide-react";

export function InventoryTotalCard({ items }: { items: InventarioItem[] }) {
  const total = items
    .filter((item) => !String(item.id).startsWith("local-"))
    .reduce((acc, item) => {
    const cantidad = typeof item.cantidad === "number" ? item.cantidad : Number(item.cantidad) || 0;
    const precio = typeof item.precio === "number" ? item.precio : Number(item.precio) || 0;
    return acc + cantidad * precio;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Total del inventario
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">${total.toFixed(2)}</div>
          <Badge variant="secondary">Valor real</Badge>
        </div>
      </CardContent>
    </Card>
  );
}