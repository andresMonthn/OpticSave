"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Badge } from "@kit/ui/badge";
import { InventarioItem } from "../columns";

export function InventoryTotalCard({ items }: { items: InventarioItem[] }) {
  const total = items.reduce((acc, item) => {
    const cantidad = typeof item.cantidad === "number" ? item.cantidad : Number(item.cantidad) || 0;
    const precio = typeof item.precio === "number" ? item.precio : Number(item.precio) || 0;
    return acc + cantidad * precio;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total del inventario</CardTitle>
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