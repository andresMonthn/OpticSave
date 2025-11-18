"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter } from "@kit/ui/card";
import { Button } from "@kit/ui/button";
import appConfig from "~/config/app.config";
import pathsConfig from "~/config/paths.config";

type Candidate = { id: string; nombre: string };

function normalize(text: string) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function answerFor(query: string) {
  const q = normalize(query);
  const intent = intentFor(q);
  const kb: Record<string, string> = {
    hola:
      "Hola. ¿En qué puedo ayudarte?",
    ayuda:
      "Funciones disponibles: pacientes, diagnósticos, recetas, órdenes RX, citas, calendario y dashboard. Puedes pedirme acciones como abrir historial o programar visita.",
    paciente:
      "Para pacientes: abre el listado en Home/View, busca por nombre o ID y entra al historial clínico para editar, imprimir o programar próxima visita.",
    pacientes:
      "Listado de pacientes: usa Home/View. Desde la tabla puedes abrir el historial, copiar ID y exportar CSV.",
    diagnostico:
      "Diagnóstico: crea o edita en el historial clínico del paciente. El diagnóstico reciente puede vincular una orden RX para imprimir.",
    diagnostico2:
      "Para diagnósticos: selecciona el paciente, añade evaluación, tratamiento y observaciones; DIP y RX final quedan disponibles para orden RX.",
    receta:
      "Recetas: se gestionan dentro del diagnóstico; puedes editar parámetros ESF, CIL, EJE y ADD por ojo y luego imprimir la orden RX.",
    recetas:
      "Recetas: consulta y edita las fórmulas de uso y final; asegúrate de tener RX final para impresión.",
    orden:
      "Orden RX: se actualiza desde el diálogo de imprimir. Usa material, tratamiento, tipo de lente y montura; se guarda en orden_rx usando el order_rx_id del diagnóstico.",
    ordenrx:
      "Impresión Orden RX: abre el diálogo desde el historial del paciente, ajusta parámetros y se actualiza la orden existente; luego imprime.",
    cita:
      "Citas: programa próxima visita desde el detalle del paciente; se actualiza proxima_visita en diagnóstico y fecha_de_cita en paciente.",
    citas:
      "Citas: consulta y programa en la vista del paciente; también puedes revisar estados en Home/View y el dashboard.",
    calendario:
      "Calendario: programa y gestiona citas; si deseas reprogramar, actualiza la próxima visita y la fecha de cita del paciente.",
    dashboard:
      "Dashboard: resumen de pacientes activos, citas pendientes y diagnósticos; acceso rápido a las funciones principales.",
    perfil:
      "Perfil: actualiza información y preferencias; revisa seguridad y sesión para evitar errores de RLS o autenticación.",
    buscar:
      "Búsqueda: usa el campo en Home/View para filtrar por nombre o exporta CSV para revisión.",
    exportar:
      "Exportar: desde Home/View usa la opción de exportar CSV para análisis o respaldo.",
    imprimir:
      "Imprimir: la orden RX se imprime desde el historial del paciente tras ajustar parámetros.",
    inventario:
      "Inventario: registra materiales, existencias y bajas; revisa movimientos y control administrativo.",
    qr:
      "Registro por QR: utiliza la sección QR para alta rápida del paciente escaneando código.",
    crearpaciente:
      "Crear paciente: completa el formulario con datos básicos y clínicos; se notifica en el Dashboard.",
    view:
      "Vista de pacientes: consulta, edita, elimina y exporta; abre historial clínico desde la tabla.",
  };
  const keys = Object.keys(kb);
  for (const k of keys) {
    const target = normalize(k);
    if (q.includes(target)) return kb[k];
  }
  if (intent === "hacer_receta") {
    return "Para crear una receta: abre Home/View y el historial del paciente; entra al diagnóstico reciente; ajusta ESF, CIL, EJE y ADD por cada ojo; guarda el diagnóstico; si necesitas entregar lentes, abre Imprimir Orden RX y confirma material, tratamiento, tipo de lente y montura; imprime la orden.";
  }
  if (intent === "crear_paciente") {
    return "Para crear un paciente: abre la sección Crear Paciente; completa nombre, edad, teléfono y datos clínicos si aplica; guarda; el paciente quedará disponible en Home/View y aparecerá en el Dashboard.";
  }
  if (intent === "qr_paciente") {
    return "Para registrar por QR: abre Registro por QR; escanea el código del paciente; verifica y completa los datos; guarda; podrás ver al paciente en Home/View y abrir su historial.";
  }
  if (intent === "orden_rx") {
    return "Para imprimir Orden RX: abre el historial del paciente; desde el diagnóstico reciente usa Imprimir Orden RX; ajusta material, tratamiento, tipo de lente y montura; guarda y procede a imprimir.";
  }
  if (q.includes("rx") || q.includes("orden")) return kb["ordenrx"];
  if (q.includes("diagnost") || q.includes("dip")) return kb["diagnostico2"];
  if (q.includes("pacient")) return kb["pacientes"];
  if (q.includes("cita") || q.includes("agenda")) return kb["citas"];
  return "Estoy listo. Indica tu consulta u orden.";
}

function buildSuggestions(query: string): string[] {
  const q = normalize(query);
  const s: string[] = [];
  if (q.includes("orden") || q.includes("rx")) {
    s.push("Abre el historial y usa Imprimir Orden RX.");
    s.push("Verifica que el diagnóstico reciente tenga order_rx_id.");
  }
  if (q.includes("diagnost")) {
    s.push("Edita DIP y RX final antes de imprimir.");
    s.push("Guarda observaciones y tratamiento.");
  }
  if (q.includes("pacient")) {
    s.push("Usa Home/View para buscar y abrir historial.");
    s.push("Exporta CSV si necesitas revisión masiva.");
  }
  if (q.includes("cita") || q.includes("agenda")) {
    s.push("Programa próxima visita en el detalle del paciente.");
    s.push("Actualiza estado del paciente a Completado al finalizar.");
  }
  if (!s.length) {
    s.push("Indica si necesitas pacientes, diagnósticos, recetas u órdenes RX.");
    s.push("Puedo guiarte para abrir historial o programar citas.");
  }
  return s;
}

function needsGuidance(query: string): boolean {
  const q = normalize(query);
  if (!q || q.trim().length === 0) return false;
  if (q.includes("ayuda") || q.includes("help")) return true;
  if (q.includes("como") || q.includes("cómo")) return true;
  if (q.includes("donde") || q.includes("dónde")) return true;
  if (q.includes("no encuentro") || q.includes("no se") || q.includes("no sé")) return true;
  if (q.includes("abrir") || q.includes("abre") || q.includes("navegar") || q.includes("ir a")) return true;
  if (q.includes("ver") && (q.includes("pacient") || q.includes("agenda") || q.includes("dashboard"))) return true;
  return false;
}

function intentFor(q: string): string | null {
  const hasComo = q.includes("como") || q.includes("cómo");
  if ((hasComo || q.includes("hacer")) && q.includes("recet")) return "hacer_receta";
  if ((hasComo || q.includes("crear")) && q.includes("pacient")) return "crear_paciente";
  if ((hasComo || q.includes("pasar")) && q.includes("qr")) return "qr_paciente";
  if ((hasComo || q.includes("imprimir")) && (q.includes("orden") || q.includes("rx"))) return "orden_rx";
  return null;
}

export function FallbackAnswer({
  query,
  candidates,
  onOpenPaciente,
}: {
  query: string;
  candidates?: Candidate[];
  onOpenPaciente?: (id: string) => void;
}) {
  const [localCandidates, setLocalCandidates] = useState<Candidate[] | undefined>(undefined);
  const showGuidance = useMemo(() => needsGuidance(query), [query]);
  const tips = useMemo(() => (showGuidance ? buildSuggestions(query) : []), [query, showGuidance]);
  const text = useMemo(() => answerFor(query), [query]);
  useEffect(() => {
    try {
      if (!candidates || candidates.length === 0) {
        const raw = localStorage.getItem("optisave.prefillPaciente.accum");
        const parsed = raw ? JSON.parse(raw) : {};
        const arr = Array.isArray(parsed?.search_candidates)
          ? parsed.search_candidates.map((c: any) => ({ id: String(c.id), nombre: String(c.nombre) }))
          : [];
        if (arr.length) setLocalCandidates(arr);
      }
    } catch {}
  }, [candidates]);
  return (
    <Card className="border border-border">
      <CardHeader className="py-2 px-3">
        <div className="font-medium">Asistente local</div>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-2">
        {!appConfig.production && (
          <div className="text-sm">He detectado problemas de conexión. Respuesta generada localmente.</div>
        )}
        <div className="text-sm">{text}</div>
        {tips.length > 0 && (
          <div className="space-y-1">
            {tips.map((t, i) => (
              <div key={i} className="text-sm">• {t}</div>
            ))}
          </div>
        )}
        {showGuidance && (
          <div className="mt-2 space-y-2">
            {buildLinks(query).map((l, i) => (
              <div key={i} className="text-sm">
                <Link className="underline" href={l.url}>{l.label}</Link>
              </div>
            ))}
          </div>
        )}
        {Array.isArray(candidates) && candidates.length > 0 && (
          <div className="mt-2 space-y-2">
            {candidates.map((c) => (
              <Card key={c.id} className="border border-border">
                <CardHeader className="py-2 px-3">{c.nombre}</CardHeader>
                <CardFooter className="py-2 px-3 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenPaciente && onOpenPaciente(c.id)}
                  >
                    Abrir historial
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        {(!candidates || !candidates.length) && Array.isArray(localCandidates) && localCandidates.length > 0 && (
          <div className="mt-2 space-y-2">
            {localCandidates.map((c) => (
              <Card key={c.id} className="border border-border">
                <CardHeader className="py-2 px-3">{c.nombre}</CardHeader>
                <CardFooter className="py-2 px-3 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenPaciente && onOpenPaciente(c.id)}
                  >
                    Abrir historial
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function makeFallbackAnswer(query: string, candidates?: Candidate[], onOpenPaciente?: (id: string) => void) {
  return <FallbackAnswer query={query} candidates={candidates} onOpenPaciente={onOpenPaciente} />;
}
function absolute(path: string) {
  try {
    return new URL(path, appConfig.url).toString();
  } catch {
    return path;
  }
}

function buildLinks(query: string): Array<{ label: string; url: string }> {
  const q = normalize(query);
  const out: Array<{ label: string; url: string }> = [];
  const add = (label: string, path: string) => out.push({ label, url: absolute(path) });
  if (q.includes("pacient") || q.includes("view") || q.includes("historial")) {
    add("Ver pacientes", pathsConfig.app.pacientes);
  }
  if (q.includes("crear") && q.includes("pacient")) {
    add("Crear paciente", pathsConfig.app.crearpaciente);
  }
  if (q.includes("cita") || q.includes("agenda") || q.includes("calendario")) {
    add("Abrir agenda", pathsConfig.app.agenda);
  }
  if (q.includes("inventario") || q.includes("material")) {
    add("Inventario", pathsConfig.app.inventario);
  }
  if (q.includes("qr")) {
    add("Registro por QR", pathsConfig.app.qr);
  }
  if (q.includes("dashboard") || q.includes("inicio") || q.includes("home")) {
    add("Dashboard", pathsConfig.app.home);
  }
  if (!out.length) {
    add("Ver pacientes", pathsConfig.app.pacientes);
    add("Abrir agenda", pathsConfig.app.agenda);
    add("Crear paciente", pathsConfig.app.crearpaciente);
  }
  return out;
}