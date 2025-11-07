import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pathsConfig from "../../../config/paths.config";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

// Configuración de Ollama
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3:latest";

// Prompt que guía al asistente. Incluye formatos de respuesta y la Guía oficial del sistema.
const SYSTEM_PROMPT = `
Eres el asistente virtual de OpticSave. Debes conocer y usar la siguiente guía oficial del sistema para ayudar al usuario. Responde SIEMPRE con JSON válido en español usando los formatos definidos.

Formatos admitidos:

1) Para CREAR PACIENTE:
{
  "accion": "crear",
  "tipo": "paciente",
  "datos": {
    "nombre": "",
    "edad": "",
    "sexo": "",
    "domicilio": "",
    "motivo_consulta": "",
    "diagnostico_id": "",
    "telefono": "",
    "fecha_de_cita": "",
    "estado": "",
    "fecha_nacimiento": "",
    "ocupacion": "",
    "sintomas_visuales": "",
    "ultimo_examen_visual": "",
    "uso_lentes": "",
    "tipos_de_lentes": "",
    "tiempo_de_uso_lentes": "",
    "cirujias": "",
    "traumatismos_oculares": "",
    "nombre_traumatismos_oculares": "",
    "antecedentes_visuales_familiares": "",
    "antecedente_familiar_salud": "",
    "habitos_visuales": "",
    "salud_general": "",
    "medicamento_actual": "",
    "mensaje": "Si faltan datos, pregunta específicamente por los campos faltantes."
  }
}

2) Para NAVEGAR a un módulo/ruta del sistema:
{
  "accion": "navegar",
  "tipo": "ruta",
  "datos": {
    "destino": "dashboard|view|crearpaciente|agenda|inventario|examenes|recetas|perfil|usuarios_admin",
    "mensaje": "(opcional, breve guía de lo que verá)"
  }
}

3) Para RESPONDER consultas generales (guía/ayuda/explicaciones):
{
  "accion": "responder",
  "tipo": "texto",
  "datos": { "mensaje": "..." }
}

  4) Para BUSCAR PACIENTE por nombre:
  {
    "accion": "buscar",
    "tipo": "paciente",
    "datos": { "nombre": "texto a buscar" }
  }

5) Para CONSULTAR datos de la BD (resúmenes/listados):
{
  "accion": "consultar",
  "tipo": "pacientes|estadisticas",
  "datos": { "filtros": "(opcional)" }
}

Políticas de extracción y formato:
- Extrae tantos campos como puedas de las frases del usuario.
- Campos booleanos ("uso_lentes", "cirujias", "traumatismos_oculares") deben ser true/false.
- "tipos_de_lentes" puede ser texto (lista separada por comas).
- "fecha_nacimiento" y "fecha_de_cita" pueden ser texto; si el usuario dice "hoy", usa "hoy".
- Si el usuario dice “crear con lo disponible” o quiere continuar, procede aunque falten datos.
- No inventes funcionalidades fuera de los módulos descritos; prioriza navegación y guía.
 - No inventes funcionalidades fuera de los módulos descritos; prioriza navegación y guía.
 - Cuando el usuario pida consultar la BD, usa 'consultar' con 'tipo' apropiado.

Conocimiento del sistema (Guía de Flujo y Uso de OpticSave):
1. Descripción general:
- OpticSave es una plataforma integral para gestión clínica de consultorios ópticos.
- Optimiza registro/control de pacientes, gestión de inventario y análisis estadístico.
- Entorno seguro con autenticación Google OAuth 2.0.

2. Acceso y autenticación:
- Inicio de sesión con cuenta Google (OAuth 2.0).
- Acceso desde cualquier dispositivo con internet; redirección al Dashboard principal tras autenticación.

3. Módulos principales:
3.1 Dashboard general:
- Vista analítica: total de pacientes, atendidos/por atender, por mes, estados (activo/inactivo/pendiente).
- Gráficas y conteos dinámicos en tiempo real.
- Buscador inteligente con coincidencia instantánea.

3.2 Gestión de pacientes:
- Formulario de registro completo y dinámico; soporte de registro por código QR.
- Al crear un paciente: notificación automática en el Dashboard, alta en BD central.
- Consultar/editar/eliminar/exportar (PDF/Excel); filtros selectivos y ordenamiento dinámico.

3.3 Agenda y control de citas:
- Visualiza citas pendientes, vencidas y próximas; estado (confirmada, cancelada, atendida, etc.).
- Indicadores visuales para control interno; facilita organización temporal y seguimiento.

3.4 Exámenes y recetas:
- Realización de exámenes clínicos y recetas RX editables.
- Imprimir/exportar resultados; generar órdenes de envío para anteojos.
- Especificar materiales, tipos de lente y acabados; historial clínico centralizado.

3.5 Inventario y control de activos:
- Registro y actualización de productos/materiales; bajas sin restricciones.
- Control de existencias y activos; reportes exportables para control administrativo.

3.6 Asistente virtual (Chatbot OpticSave):
- Guía registro de nuevos pacientes, ayuda en programación de citas y resuelve dudas.
- Soporte interno inteligente para experiencia del usuario clínico.

4. Seguridad y tecnología:
- Autenticación segura Google OAuth 2.0.
- Protección de datos sensibles; control de acceso por sesión única (no se guardan contraseñas).
- Infraestructura web accesible desde navegadores compatibles.

5. Flujo general del usuario:
- Login con Google; acceso a Dashboard con estadísticas y accesos rápidos.
- Registro de pacientes (manual o QR); visualización automática del nuevo paciente.
- Gestión de citas y seguimiento de estados; exámenes y emisión de recetas.
- Control de inventario y materiales; uso del Chatbot para asistencia/automatización.

6. Resultados esperados:
- Mejora de eficiencia operativa; reducción de errores en registro/control.
- Trazabilidad completa de citas, exámenes e inventarios; UX optimizada con soporte automatizado.

Ejemplos rápidos:
Usuario: "Registrar a Hugo Anaya de 34 años con lentes de armazón y cita hoy. Tel 555-123-4567"
Respuesta:
{
  "accion": "crear",
  "tipo": "paciente",
  "datos": {
    "nombre": "Hugo Anaya",
    "edad": "34",
    "uso_lentes": "true",
    "tipos_de_lentes": "armazón",
    "fecha_de_cita": "hoy",
    "telefono": "5551234567",
    "mensaje": "¿Deseas indicar sexo, ocupación, domicilio y fecha de nacimiento?"
  }
}

Usuario: "Llévame al calendario de citas"
Respuesta:
{
  "accion": "navegar",
  "tipo": "ruta",
  "datos": { "destino": "calendario", "mensaje": "Abrir agenda y controlar citas." }
}

Usuario: "¿Qué funcionalidades tiene OpticSave?"
Respuesta:
{
  "accion": "responder",
  "tipo": "texto",
  "datos": { "mensaje": "OpticSave integra gestión de pacientes, citas, exámenes/recetas e inventario, con autenticación segura Google OAuth 2.0 y dashboard analítico." }
}
`;


export async function POST(req: Request) {
  try {
    // Leer cuerpo y soportar campos adicionales para estado conversacional
    const body = await req.json();
    const prompt: string | undefined = body?.prompt;
    const prefill: any = body?.prefill;
    const reset: boolean = !!body?.reset; // opcional: permitir reset explícito
    const sessionId: string | undefined = body?.sessionId; // reservado para futuro uso

    if (!prompt) {
      return NextResponse.json(
        { error: "No se recibió ningún mensaje." },
        { status: 400 }
      );
    }

    // Capa de pre-almacenamiento (cookie) para mantener datos entre turnos
    const COOKIE_NAME = "optisave_chat_prefill";
    const cookieStore = await cookies();
    const shouldResetCookie =
      reset || /\b(limpiar|reiniciar|borrar|cancelar)\b/i.test(String(prompt));
    // La eliminación/actualización de cookies se aplicará en el objeto Response al retornar

    let cookiePrefill: any = {};
    const rawCookie = cookieStore.get(COOKIE_NAME)?.value;
    if (rawCookie) {
      try {
        cookiePrefill = JSON.parse(rawCookie);
      } catch {
        cookiePrefill = {};
      }
    }

    // Consulta a Ollama
    const composed = `${SYSTEM_PROMPT}\n\nUsuario: ${prompt}\nAsistente:`;
    const ollamaResp = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: composed,
        stream: false,
      }),
    });

    if (!ollamaResp.ok) {
      const text = await safeReadText(ollamaResp);
      return NextResponse.json(
        { error: "Error al conectar con Ollama.", details: text?.slice(0, 400) ?? null },
        { status: 502 }
      );
    }

    const ollamaData = await ollamaResp.json();
    const responseText = ollamaData?.response ?? "";

    let action: any;
    try {
      action = JSON.parse(responseText);
    } catch {
      // Si el modelo no devolvió JSON válido
      return NextResponse.json({
        response:
          "No se pudo interpretar la solicitud. Intenta formularla de nuevo.",
      });
    }

    const accion = String(action.accion || "").toLowerCase();
    const tipo = String(action.tipo || "").toLowerCase();
    const datos = action.datos || {};
    // Fusionar: cookie prefill + prefill del cliente + nuevos datos del modelo
    const datosMerged = { ...(cookiePrefill || {}), ...(prefill || {}), ...(datos || {}) };

    // Normalizar datos y detectar faltantes
    const datosNorm = normalizePaciente(datosMerged);
    const missing = getMissingFields(datosNorm);
    const present = Object.keys(datosNorm).filter((k) => !!valuePresent(datosNorm[k]));

    // Si el usuario indica continuar a pesar de faltantes
    const forceProceed = /crear\s+con\s+lo\s+disponible|continuar|proceder/i.test(prompt);

    // Delegar creación a la página específica, con prefill
    if (accion === "crear" && tipo === "paciente") {
      // Si falta nombre (único NOT NULL en la tabla), pedirlo primero
      if (!valuePresent(datosNorm.nombre) && !forceProceed) {
        const res = NextResponse.json({
          response:
            "Para registrar al paciente necesito el nombre completo. ¿Cuál es?",
          next: { action: "ask", missing_fields: ["nombre"], prefill: datosNorm },
        });
        if (shouldResetCookie) {
          res.cookies.delete(COOKIE_NAME);
        } else {
          res.cookies.set(COOKIE_NAME, JSON.stringify(datosNorm), {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 60 * 12,
          });
        }
        return res;
      }

      // Preguntar por campos importantes si hay demasiados faltantes
      const importantMissing = missing.filter((f) => IMPORTANT_FIELDS.includes(f));
      const shouldAskMore = !forceProceed && (importantMissing.length >= 2 || missing.length >= 5);

      if (shouldAskMore) {
        const msg = buildAskMessage(present, importantMissing, missing);
        const res = NextResponse.json({
          response: msg,
          next: { action: "ask", missing_fields: missing, prefill: datosNorm },
        });
        if (shouldResetCookie) {
          res.cookies.delete(COOKIE_NAME);
        } else {
          res.cookies.set(COOKIE_NAME, JSON.stringify(datosNorm), {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 60 * 12,
          });
        }
        return res;
      }

      // En caso contrario, navegar y prellenar (se pueden completar faltantes en la UI)
      const res = NextResponse.json({
        response:
          "Te llevo al formulario para completar los datos y guardar al paciente.",
        next: {
          action: "navigate",
          url: "/home/dashboard/crearpaciente",
          prefill: datosNorm,
        },
      });
      if (shouldResetCookie) {
        res.cookies.delete(COOKIE_NAME);
      } else {
        res.cookies.set(COOKIE_NAME, JSON.stringify(datosNorm), {
          path: "/",
          httpOnly: true,
          maxAge: 60 * 60 * 12,
        });
      }
      return res;
    }

    // Navegación a módulos del sistema
    if (accion === "navegar" && tipo === "ruta") {
      const destino = String(datos?.destino || "").toLowerCase();
      const url = getRouteUrl(destino);
      if (url) {
        const res = NextResponse.json({
          response: `corresto te dirigo a '${destino}'`,
          next: { action: "navigate", url },
        });
        if (shouldResetCookie) {
          res.cookies.delete(COOKIE_NAME);
        } else {
          res.cookies.set(COOKIE_NAME, JSON.stringify(datosNorm), {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 60 * 12,
          });
        }
        return res;
      }
      return NextResponse.json({ response: "No reconozco esa ruta del sistema." });
    }

    // Búsqueda de pacientes por nombre
    if (accion === "buscar" && tipo === "paciente") {
      const termRaw = String(datosMerged?.nombre ?? "").trim();
      if (!termRaw) {
        return NextResponse.json({
          response:
            "¿Cuál es el nombre (o parte del nombre) del paciente que deseas buscar?",
          next: { action: "ask" }
        });
      }

      const client = getSupabaseServerClient();
      const { data: userData } = await client.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        return NextResponse.json({
          response: "Debes iniciar sesión para buscar pacientes."
        });
      }

      // Buscar pacientes del usuario autenticado cuyo nombre contenga el término
      const { data: pacientes, error: pacientesError } = await client
        .from("pacientes" as any)
        .select("id, nombre, edad, telefono, estado, created_at")
        .eq("user_id", userId)
        .ilike("nombre", `%${termRaw}%`)
        .order("created_at", { ascending: false });

      if (pacientesError) {
        return NextResponse.json({
          response:
            "Error al buscar pacientes. Por favor, intenta de nuevo más tarde.",
          details: pacientesError.message?.slice(0, 300) ?? null,
        });
      }

      const list = Array.isArray(pacientes) ? (pacientes as any[]) : [];
      if (list.length === 0) {
        return NextResponse.json({
          response: `No encontré coincidencias para "${termRaw}".`
        });
      }

      // Si hay 1 coincidencia, navegamos directamente al historial clínico
      if (list.length === 1) {
        const p = list[0];
        const url = `/home/dashboard/historialclinico/${p.id}`;
        return NextResponse.json({
          response: `Encontré un paciente: ${safeJoin([p.nombre, p.edad ? `${p.edad} años` : null, p.telefono])}. Te llevo a su historial clínico.`,
          next: { action: "navigate", url }
        });
      }

      // Varias coincidencias: mostramos listado con enlaces reales y pedimos precisión
      const formatted = list.slice(0, 8).map((p: any, idx: number) => {
        const url = `/home/dashboard/historialclinico/${p.id}`;
        const meta = safeJoin([p.edad ? `${p.edad} años` : null, p.telefono, p.estado]);
        return `${idx + 1}) ${p.nombre}${meta ? ` — ${meta}` : ""}\n   Ver historial: ${url}`;
      });

      const tail = list.length > 8
        ? `\n… y ${list.length - 8} más.`
        : "";

      const message = [
        `Encontré ${list.length} coincidencias para "${termRaw}":`,
        formatted.join("\n\n"),
        tail,
        "\nIndica el número o el nombre exacto para ir a su historial.",
      ].filter(Boolean).join("\n\n");

      return NextResponse.json({
        response: message,
        next: {
          action: "ask",
          prefill: {
            search_candidates: list.slice(0, 8).map((p: any) => ({ id: p.id, nombre: p.nombre })),
            search_term: termRaw,
          },
        },
      });
    }

    // Consultas a la BD (resúmenes, listados)
    if (accion === "consultar") {
      const client = getSupabaseServerClient();
      const { data: userData } = await client.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        return NextResponse.json({ response: "Debes iniciar sesión para consultar datos." });
      }

      // Consultar listado reciente de pacientes
      if (tipo === "pacientes") {
        // Totales
        const { count: totalCount } = await client
          .from("pacientes" as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);

        // Últimos pacientes (hasta 10)
        const { data: recientes, error: recientesError } = await client
          .from("pacientes" as any)
          .select("id, nombre, estado, edad, telefono, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (recientesError) {
          return NextResponse.json({
            response: "Error al consultar pacientes.",
            details: recientesError.message?.slice(0, 300) ?? null,
          });
        }

        const lines = (recientes || []).map((p: any, idx: number) => {
          const meta = safeJoin([p.estado, p.edad ? `${p.edad} años` : null, p.telefono]);
          const url = `/home/dashboard/historialclinico/${p.id}`;
          return `${idx + 1}) ${p.nombre}${meta ? ` — ${meta}` : ""}\n   Ver historial: ${url}`;
        });

        const message = [
          `Total de pacientes: ${typeof totalCount === "number" ? totalCount : "(desconocido)"}.`,
          "Últimos registrados:",
          lines.join("\n\n"),
          "\nPuedes indicar el número o nombre exacto para abrir su historial.",
        ].filter(Boolean).join("\n\n");

        return NextResponse.json({
          response: message,
          next: {
            action: "ask",
            prefill: {
              search_candidates: (recientes || []).map((p: any) => ({ id: p.id, nombre: p.nombre })),
            },
          },
        });
      }

      // Consultar estadísticas de pacientes por estado
      if (tipo === "estadisticas") {
        const estados = ["activo", "inactivo", "pendiente"];
        const counts: Record<string, number> = {};

        // Total general
        const { count: totalCount } = await client
          .from("pacientes" as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);

        for (const e of estados) {
          const { count } = await client
            .from("pacientes" as any)
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("estado", e);
          counts[e] = typeof count === "number" ? count : 0;
        }

        const message = [
          `Pacientes totales: ${typeof totalCount === "number" ? totalCount : 0}.`,
          `Activos: ${counts.activo ?? 0}.`,
          `Inactivos: ${counts.inactivo ?? 0}.`,
          `Pendientes: ${counts.pendiente ?? 0}.`,
        ].join("\n");

        return NextResponse.json({ response: message });
      }

      // Tipos no soportados aún
      return NextResponse.json({
        response: "Puedo consultar pacientes y sus estadísticas. ¿Qué necesitas?",
        next: { action: "ask" },
      });
    }

    // Respuestas normales
    if (accion === "responder") {
      return NextResponse.json({
        response: datos?.mensaje ?? "Solicitud procesada.",
      });
    }

    return NextResponse.json({
      response: "No se reconoció la acción del asistente.",
      raw: action,
    });
  } catch (err: any) {
    console.error("Error en /api/chat:", err);
    return NextResponse.json(
      { error: "Error interno.", details: err.message },
      { status: 500 }
    );
  }
}

async function safeReadText(res: Response) {
  try {
    return await res.text();
  } catch {
    return null;
  }
}

// --- Utilidades de normalización y consulta ---
const PATIENT_FIELDS = [
  "nombre",
  "edad",
  "sexo",
  "domicilio",
  "motivo_consulta",
  "diagnostico_id",
  "telefono",
  "fecha_de_cita",
  "estado",
  "fecha_nacimiento",
  "ocupacion",
  "sintomas_visuales",
  "ultimo_examen_visual",
  "uso_lentes",
  "tipos_de_lentes",
  "tiempo_de_uso_lentes",
  "cirujias",
  "traumatismos_oculares",
  "nombre_traumatismos_oculares",
  "antecedentes_visuales_familiares",
  "antecedente_familiar_salud",
  "habitos_visuales",
  "salud_general",
  "medicamento_actual",
];

const IMPORTANT_FIELDS = [
  "telefono",
  "fecha_de_cita",
  "sexo",
  "fecha_nacimiento",
  "domicilio",
  "ocupacion",
];

const ROUTE_MAP: Record<string, string> = {
  // Basadas en apps/web/config/paths.config.ts
  dashboard: pathsConfig.app.home, // página principal
  pacientes: pathsConfig.app.pacientes, // '/home/dashboard/view'
  view: pathsConfig.app.pacientes, // alias directo
  crearpaciente: pathsConfig.app.crearpaciente, // '/home/dashboard/crearpaciente'
  agenda: pathsConfig.app.agenda, // '/home/dashboard/agenda'
  inventario: pathsConfig.app.inventario, // '/home/dashboard/inventario'
  qr: pathsConfig.app.qr, // '/home/dashboard/qr'
  // Rutas no definidas explícitamente en paths.config, mantenemos compatibilidad si existen
  examenes: "/home/examenes",
  recetas: "/home/recetas",
  perfil: "/home/perfil",
  usuarios_admin: "/home/admin/usuarios",
};

function normalizePaciente(input: any) {
  const out: any = {};
  for (const k of PATIENT_FIELDS) {
    const v = input?.[k];
    if (v === undefined || v === null) {
      out[k] = "";
      continue;
    }
    switch (k) {
      case "edad": {
        const n = Number(String(v).replace(/[^0-9.-]/g, ""));
        out[k] = Number.isFinite(n) ? String(n) : "";
        break;
      }
      case "telefono": {
        out[k] = String(v).replace(/\D/g, "");
        break;
      }
      case "uso_lentes":
      case "cirujias":
      case "traumatismos_oculares": {
        out[k] = parseTruthy(v) ? "true" : "false";
        break;
      }
      case "tipos_de_lentes": {
        // Acepta arreglo o texto con comas; consolidar como texto
        if (Array.isArray(v)) {
          out[k] = v.map((s: any) => String(s).trim()).filter(Boolean).join(", ");
        } else {
          out[k] = String(v);
        }
        break;
      }
      case "fecha_nacimiento":
      case "fecha_de_cita": {
        // Mantener texto; si el usuario dice "hoy", conservar "hoy"
        out[k] = String(v);
        break;
      }
      default: {
        out[k] = String(v);
      }
    }
  }
  return out;
}

function getMissingFields(datos: any) {
  return PATIENT_FIELDS.filter((f) => !valuePresent(datos?.[f]));
}

function valuePresent(v: any) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim();
  return s.length > 0 && s.toLowerCase() !== "false"; // false como texto indica valor explícito
}

function parseTruthy(val: any): boolean {
  if (typeof val === "boolean") return val;
  const s = String(val).trim().toLowerCase();
  return ["true", "1", "si", "sí", "yes", "verdadero"].includes(s);
}

function buildAskMessage(present: string[], importantMissing: string[], missing: string[]) {
  const presentStr = present.length ? `Tengo: ${present.join(", ")}.` : "Tengo datos parciales.";
  const impStr = importantMissing.length ? `Faltan campos importantes: ${importantMissing.join(", ")}.` : "";
  const missStr = missing.length ? `También faltan: ${missing.join(", ")}.` : "";
  const tail = "¿Puedes proporcionarlos? Si prefieres continuar, di: 'crear con lo disponible'.";
  return [presentStr, impStr, missStr, tail].filter(Boolean).join(" ");
}

function getRouteUrl(key: string): string | null {
  if (ROUTE_MAP[key]) return ROUTE_MAP[key];
  // Alias comunes
  const aliases: Record<string, string> = {
    // Alineación de alias con paths.config
    calendario: "agenda",
    calendario_citas: "agenda",
    pacientes_nuevo: "crearpaciente",
    crear_paciente: "crearpaciente",
    admin_usuarios: "usuarios_admin",
  };
  const alias = aliases[key];
  if (alias && ROUTE_MAP[alias]) return ROUTE_MAP[alias];
  return null;
}

function safeJoin(items: Array<string | null | undefined>): string {
  return items.filter((x) => !!String(x || "").trim()).join(" • ");
}
