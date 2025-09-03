"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Importa los UI components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@kit/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

// Configura Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Interfaz Paciente
interface Paciente {
  paciente_id: number;
  nombre: string;
  edad: number | null;
  sexo: string | null;
  telefono: string | null;
  motivo_consulta: string | null;
  dip: number | null;
}

export default function View() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("pacientes").select("*");
    if (error) console.error("Error fetching pacientes:", error);
    else setPacientes(data as Paciente[]);
    setLoading(false);
  };

  if (loading) return <p>Cargando pacientes...</p>;
  if (pacientes.length === 0) return <p>No hay pacientes registrados.</p>;

  return (
    <div className="space-y-6">
      {/* Tabla de pacientes */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Edad</TableHead>
            <TableHead>Sexo</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>DIP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pacientes.map((p) => (
            <TableRow key={p.paciente_id}>
              <TableCell>{p.paciente_id}</TableCell>
              <TableCell>{p.nombre}</TableCell>
              <TableCell>{p.edad ?? "-"}</TableCell>
              <TableCell>{p.sexo ?? "-"}</TableCell>
              <TableCell>{p.telefono ?? "-"}</TableCell>
              <TableCell>{p.motivo_consulta ?? "-"}</TableCell>
              <TableCell>{p.dip ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Cards individuales por paciente */}
      {pacientes.map((p) => (
        <Card key={p.paciente_id}>
          <CardHeader>
            <CardTitle>{p.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>ID: {p.paciente_id}</p>
            <p>Edad: {p.edad ?? "-"}</p>
            <p>Sexo: {p.sexo ?? "-"}</p>
            <p>Teléfono: {p.telefono ?? "-"}</p>
            <p>Motivo: {p.motivo_consulta ?? "-"}</p>
            <p>DIP: {p.dip ?? "-"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

