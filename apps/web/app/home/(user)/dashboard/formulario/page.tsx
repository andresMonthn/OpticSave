"use client";

import { useState, useEffect } from "react";
import { createClient, Session } from "@supabase/supabase-js";

// Inicializa Supabase
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

export default function Formulario() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState<number | "">("");
  const [sexo, setSexo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [motivo, setMotivo] = useState("");
  const [dip, setDip] = useState<number | "">("");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Escucha cambios de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch pacientes solo si hay sesión
  useEffect(() => {
    if (session) fetchPacientes();
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert("Error al iniciar sesión: " + error.message);
    else setSession(data.session);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const fetchPacientes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("pacientes").select("*");
    if (error) console.error("Error fetching pacientes:", error);
    else setPacientes(data as Paciente[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("pacientes").insert([
      {
        nombre,
        edad: edad === "" ? null : edad,
        sexo: sexo || null,
        telefono: telefono || null,
        motivo_consulta: motivo || null,
        dip: dip === "" ? null : dip,
      },
    ]);
    if (error) alert("Error al crear paciente: " + error.message);
    else {
      alert("Paciente creado!");
      setNombre("");
      setEdad("");
      setSexo("");
      setTelefono("");
      setMotivo("");
      setDip("");
      fetchPacientes();
    }
  };

  if (!session) {
    // Mostrar login si no hay sesión
    return (
      <div className="max-w-md mx-auto p-6 mt-12 border rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Inicia sesión</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="border p-2 w-full rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 w-full rounded"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // Mostrar formulario de pacientes si hay sesión
  return (
    <div className="max-w-lg mx-auto p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Pacientes</h2>
       
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-4 border p-4 rounded">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="number"
          placeholder="Edad"
          value={edad}
          onChange={(e) => setEdad(e.target.value === "" ? "" : Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Sexo"
          value={sexo}
          onChange={(e) => setSexo(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <textarea
          placeholder="Motivo de consulta"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="number"
          placeholder="DIP"
          value={dip}
          onChange={(e) => setDip(e.target.value === "" ? "" : Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
        <button type="submit" className="bg-green-600 text-white p-2 w-full rounded">
          Crear Paciente
        </button>
      </form>

      {/* Tabla de pacientes */}
     
      
    </div>
  );
}
 