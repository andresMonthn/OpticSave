"use client";

import { useState } from "react";
import { Button } from "@kit/ui/button";
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
} from "@kit/ui/dialog";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import { createClient } from "@supabase/supabase-js";
import { Eclipse, Kayak, Plus, LoaderCircle } from 'lucide-react';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);

type RxUsoFormProps = {
    pacienteId: string;
    userId: string;
    table?: string;
    onSaved?: () => void;
    trigger: React.ReactNode;
};

export function RxUsoDialog({ pacienteId, userId, onSaved, trigger }: RxUsoFormProps) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        esf: "",
        cil: "",
        eje: "",
        add: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from("rx_uso").insert([
            {
                esf: form.esf,
                cil: form.cil,
                eje: form.eje,
                add: form.add,
                paciente_id: pacienteId,
                user_id: userId,
            },
        ]);

        setLoading(false);

        if (error) {
            alert("❌ Error al guardar: " + error.message);
        } else {
            setForm({ esf: "", cil: "", eje: "", add: "" });
            onSaved?.();
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>

            <DialogOverlay className="fixed inset-0 backdrop-blur-lg" />

            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Agregar RX de Uso</DialogTitle>
                        <DialogDescription>
                            Completa los campos para registrar una nueva receta de uso.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="flex gap-3 items-center">
                            <Eclipse className={"h-3 w-3"} />
                            <Label htmlFor="esf">  Esfera </Label>
                        </div>
                        <Input
                            id="esf"
                            name="esf"
                            value={form.esf}
                            onChange={handleChange}
                        />

                        <div className="flex gap-3 items-center">
                            <LoaderCircle className={"h-3 w-3"} />
                            <Label htmlFor="cil">Cilindro</Label>
                        </div>
                        <Input
                            id="cil"
                            name="cil"
                            value={form.cil}
                            onChange={handleChange}
                        />

                        <div className="flex gap-3 items-center">
                            <Kayak className={"h-3 w-3"} />
                            <Label htmlFor="eje">Eje</Label>
                        </div>
                        <Input
                            id="eje"
                            name="eje"
                            value={form.eje}
                            onChange={handleChange}
                        />

                        <div className="flex gap-3 items-center">
                            <Plus className={"h-3 w-3"} />
                            <Label htmlFor="add">Add</Label>
                        </div>
                        <Input
                            id="add"
                            name="add"
                            value={form.add}
                            onChange={handleChange}
                        />

                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
