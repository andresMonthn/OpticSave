"use client"

import { useState } from "react"
import { Button } from "@kit/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
} from "@kit/ui/dialog"
import { Input } from "@kit/ui/input"
import { Label } from "@kit/ui/label"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);

type DxDialogProps = {
  table: string;
  userId: string;
  pacienteId: string;
  trigger: React.ReactNode;
  onSaved: () => void;
};

export function DxDialog({ pacienteId, trigger }: DxDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    refractivo: "",
    vb: "",
    salud_ocular: "",
    tratamiento_observaciones: "",
  
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.from("dx").insert([
      {
        paciente_id: pacienteId.toString(),
        refractivo: formData.refractivo,
        vb: formData.vb,
        salud_ocular: formData.salud_ocular,
        tratamiento_observaciones: formData.tratamiento_observaciones,
        
      },
    ])

   if (error) {
      alert("❌ Error al guardar: " + error.message)
    } else {
      alert("✅ Diagnóstico guardado")
      setFormData({
        refractivo: "",
        vb: "",
        salud_ocular: "",
        tratamiento_observaciones: "",
        
      })
      // 👇 aquí sí podemos usar onSaved porque lo destructuramos de props
      setOpen(false)
    }
  }

  const fecha  = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      


      <DialogOverlay className="fixed inset-0  backdrop-blur-lg" />

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar Diagnóstico</DialogTitle>
            <DialogDescription>
              Completa los campos para registrar un nuevo diagnóstico.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="refractivo">Refractivo</Label>
              <Input
                id="refractivo"
                name="refractivo"
                value={formData.refractivo}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="vb">VB</Label>
              <Input
                id="vb"
                name="vb"
                value={formData.vb}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="salud_ocular">Salud Ocular</Label>
              <Input
                id="salud_ocular"
                name="salud_ocular"
                value={formData.salud_ocular}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="tratamiento_observaciones">
                Tratamiento / Observaciones
              </Label>
              <Input
                id="tratamiento_observaciones"
                name="tratamiento_observaciones"
                value={formData.tratamiento_observaciones}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="fecha">Este diagnostico se esta elaborando {fecha}</Label>
            
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
