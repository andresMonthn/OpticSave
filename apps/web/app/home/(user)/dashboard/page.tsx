"use client";

import Link from "next/link";
import { Button } from "@kit/ui/button";

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-8">
      {/* Título */}
      <h1 className="text-3xl font-bold mb-8">OpticSave</h1>

      {/* Buscador */}
      <div className="mb-8 w-full max-w-md">
        <input
          type="text"
          placeholder="Buscar pacientes o registros..."
          className="w-full border rounded-lg p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Botones principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-4xl">
        <Link href="home/dashboard/formulario">
          <Button className="w-full h-24   text-lg font-semibold rounded-lg shadow-md ">
            Crear Paciente
          </Button>
        </Link>

        <Link href="home/dashboard/view">
         <Button className="w-full h-24   text-lg font-semibold rounded-lg shadow-md ">
            Ver Pacientes
          </Button>
        </Link>

        <Link href="home/dashboard/delete">
        <Button className="w-full h-24   text-lg font-semibold rounded-lg shadow-md ">
            Eliminar Paciente
          </Button>
        </Link>

        <Link href="home/dashboard/agenda">
         <Button className="w-full h-24   text-lg font-semibold rounded-lg shadow-md ">
            Ver Agenda
          </Button>
        </Link>

        <Link href="home/dashboard/update">
         <Button className="w-full h-24   text-lg font-semibold rounded-lg shadow-md ">
            Actualizar Estado
          </Button>
        </Link>

        <Link href="home/dashboard/inventario">
        <Button className="w-full h-24   text-lg font-semibold rounded-lg shadow-md ">
            Inventario
          </Button>
        </Link>
      </div>
    </div>
  );
}

