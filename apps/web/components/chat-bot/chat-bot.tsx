"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@kit/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@kit/ui/card";
import { Input } from "@kit/ui/input";
import { MessageCircle, Send, X } from "lucide-react";

// Base de conocimiento para respuestas predefinidas
const knowledgeBase = {
  "hola": "¡Hola! Soy el asistente virtual de OptisaveAI. Estoy aquí para ayudarte con información sobre pacientes, diagnósticos, citas y uso general de la plataforma. ¿En qué puedo asistirte hoy?",

  "ayuda": "Puedo ayudarte con varias funciones de OptisaveAI:\n\n• Gestión de pacientes: búsqueda, registro y actualización\n• Diagnósticos: creación y consulta\n• Citas: programación y seguimiento\n• Estadísticas: resumen de actividad\n• Navegación: acceso a diferentes secciones\n\n¿Sobre qué área necesitas más información?",

  "gracias": "¡De nada! Estoy aquí para ayudarte. Si necesitas asistencia adicional, no dudes en preguntar.",

  "paciente": "Para gestionar pacientes tienes varias opciones:\n\n• Ver todos los pacientes: Visita el dashboard principal en https://opticsave.vercel.app/home/dashboard\n• Buscar un paciente: Usa el buscador en la parte superior de cualquier página\n• Registrar nuevo paciente: Accede a https://opticsave.vercel.app/home/pacientes/nuevo\n• Ver historial clínico: Selecciona un paciente y haz clic en 'Ver historial'",

  "pacientes": "Para gestionar pacientes tienes varias opciones:\n\n• Ver todos los pacientes: Visita el dashboard principal en https://opticsave.vercel.app/home/dashboard\n• Buscar un paciente: Usa el buscador en la parte superior de cualquier página\n• Registrar nuevo paciente: Accede a https://opticsave.vercel.app/home/pacientes/nuevo\n• Ver historial clínico: Selecciona un paciente y haz clic en 'Ver historial'",

  "diagnóstico": "Para gestionar diagnósticos:\n\n• Crear nuevo diagnóstico: Selecciona un paciente y haz clic en 'Crear diagnóstico'\n• Ver diagnósticos existentes: Accede al historial clínico del paciente en https://opticsave.vercel.app/home/historialclinico/[id]\n• Actualizar diagnóstico: Selecciona el diagnóstico específico y haz clic en 'Editar'\n• Imprimir diagnóstico: Usa la opción 'Imprimir' en la vista detallada del diagnóstico",

  "diagnostico": "Para gestionar diagnósticos:\n\n• Crear nuevo diagnóstico: Selecciona un paciente y haz clic en 'Crear diagnóstico'\n• Ver diagnósticos existentes: Accede al historial clínico del paciente en https://opticsave.vercel.app/home/historialclinico/[id]\n• Actualizar diagnóstico: Selecciona el diagnóstico específico y haz clic en 'Editar'\n• Imprimir diagnóstico: Usa la opción 'Imprimir' en la vista detallada del diagnóstico",

  "cita": "Para gestionar citas:\n\n• Ver calendario: Accede a https://opticsave.vercel.app/home/calendario\n• Agendar nueva cita: Selecciona día y hora disponible en el calendario\n• Reprogramar cita: Selecciona la cita existente y elige 'Reprogramar'\n• Cancelar cita: Selecciona la cita y haz clic en 'Cancelar'\n• Ver citas pendientes: Consulta el panel de citas en el dashboard principal",

  "citas": "Para gestionar citas:\n\n• Ver calendario: Accede a https://opticsave.vercel.app/home/calendario\n• Agendar nueva cita: Selecciona día y hora disponible en el calendario\n• Reprogramar cita: Selecciona la cita existente y elige 'Reprogramar'\n• Cancelar cita: Selecciona la cita y haz clic en 'Cancelar'\n• Ver citas pendientes: Consulta el panel de citas en el dashboard principal",

  "dashboard": "El dashboard principal te ofrece una visión general de la actividad de la clínica. Puedes acceder a él en https://opticsave.vercel.app/home/dashboard. Desde aquí podrás ver:\n\n• Resumen de pacientes activos\n• Citas pendientes\n• Estadísticas de diagnósticos\n• Acceso rápido a todas las funciones principales",

  "estadísticas": "Las estadísticas de la clínica están disponibles en el dashboard principal en https://opticsave.vercel.app/home/dashboard. Aquí encontrarás información sobre:\n\n• Total de pacientes registrados\n• Citas programadas y completadas\n• Diagnósticos realizados\n• Tendencias de actividad\n\nPara estadísticas más detalladas, consulta la sección de reportes.",

  "estadisticas": "Las estadísticas de la clínica están disponibles en el dashboard principal en https://opticsave.vercel.app/home/dashboard. Aquí encontrarás información sobre:\n\n• Total de pacientes registrados\n• Citas programadas y completadas\n• Diagnósticos realizados\n• Tendencias de actividad\n\nPara estadísticas más detalladas, consulta la sección de reportes.",

  "contacto": "Para contactar con soporte técnico:\n\n• Email: soporte@optisave.com\n• Teléfono: +52 (55) 1234-5678\n• Chat en vivo: Disponible en horario laboral (L-V, 9:00-18:00)\n• Formulario de contacto: https://opticsave.vercel.app/contacto",

  "receta": "Para gestionar recetas oftalmológicas:\n\n• Crear nueva receta: Durante la creación de un diagnóstico\n• Ver recetas existentes: En el historial clínico del paciente\n• Imprimir receta: Selecciona la receta y haz clic en 'Imprimir'\n• Actualizar receta: Edita el diagnóstico correspondiente",

  "recetas": "Para gestionar recetas oftalmológicas:\n\n• Crear nueva receta: Durante la creación de un diagnóstico\n• Ver recetas existentes: En el historial clínico del paciente\n• Imprimir receta: Selecciona la receta y haz clic en 'Imprimir'\n• Actualizar receta: Edita el diagnóstico correspondiente",

  "usuario": "Para gestionar tu cuenta de usuario:\n\n• Ver perfil: Accede a https://opticsave.vercel.app/home/perfil\n• Cambiar contraseña: En la sección de perfil, opción 'Seguridad'\n• Actualizar información: Edita los campos en la sección de perfil\n• Preferencias: Configura tus preferencias de notificaciones y visualización",

  "usuarios": "Para gestionar usuarios del sistema (solo administradores):\n\n• Ver todos los usuarios: Accede a https://opticsave.vercel.app/home/admin/usuarios\n• Crear nuevo usuario: Haz clic en 'Añadir usuario'\n• Editar permisos: Selecciona un usuario y modifica sus roles\n• Desactivar usuario: Opción disponible en el menú de acciones de cada usuario",

  "default": "Lo siento, no tengo información específica sobre eso. Puedes consultar nuestra documentación completa en https://opticsave.vercel.app/docs o contactar con soporte técnico en soporte@optisave.com. ¿Puedo ayudarte con algo más?"
};

// Tipo para los mensajes
type Message = {
  id: number;
  text?: string;
  sender: "user" | "bot";
  candidates?: { id: string; nombre: string }[];
};

export function ChatBot() {

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "¡Hola! Soy el asistente virtual de OptisaveAI. ¿En qué puedo ayudarte?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Función para encontrar la mejor respuesta basada en palabras clave
  const findBestResponse = (query: string) => {
    const normalizedQuery = query.toLowerCase().trim();

    // Buscar coincidencia exacta primero
    for (const [key, response] of Object.entries(knowledgeBase)) {
      if (normalizedQuery.includes(key)) {
        return response;
      }
    }

    // Si no hay coincidencia, devolver respuesta por defecto
    return knowledgeBase.default;
  };

  // Función para manejar el envío de mensajes
  // ...
  const handleSendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: "user",
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Llamar a tu endpoint /api/chat
    try {
      // Enviar prompt junto con prefill acumulado para que el servidor lo integre
      let accum: any = {};
      try {
        accum = JSON.parse(localStorage.getItem("optisave.prefillPaciente.accum") || "{}");
      } catch {}

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, prefill: accum }),
      });

      if (!res.ok) {
        const errorMessage: Message = {
          id: messages.length + 2,
          text: "El asistente no pudo procesar la solicitud.",
          sender: "bot",
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      const data = await res.json();

      const botResponse: Message = {
        id: messages.length + 2,
        text: data.response || data.error || "Error en respuesta del asistente.",
        sender: "bot",
      };

      const nextCandidates: { id: string; nombre: string }[] | undefined = Array.isArray(data?.next?.prefill?.search_candidates)
        ? data.next.prefill.search_candidates.map((c: any) => ({ id: String(c.id), nombre: String(c.nombre) }))
        : undefined;

      // Agregar respuesta y, si existen candidatos, un mensaje extra con tarjetas
      setMessages(prev => {
        const base = [...prev, botResponse];
        if (nextCandidates && nextCandidates.length > 0) {
          base.push({
            id: (botResponse.id || messages.length + 2) + 1,
            sender: "bot",
            candidates: nextCandidates,
          });
        }
        return base;
      });

      // Gestionar acciones del asistente
      // 1) Navegar: guardamos prefill final y limpiamos acumulado
      if (data?.next?.action === "navigate" && typeof data?.next?.url === "string") {
        try {
          const prefill = data?.next?.prefill ?? {};
          localStorage.setItem("optisave.prefillPaciente", JSON.stringify(prefill));
          localStorage.removeItem("optisave.prefillPaciente.accum");
        } catch (e) {
          console.warn("No se pudo guardar prefill en localStorage:", e);
        }
        router.push(data.next.url);
        return;
      }

      // 2) Preguntar: acumulamos prefill parcial para el siguiente turno
      if (data?.next?.action === "ask") {
        try {
          const partial = data?.next?.prefill ?? {};
          const old = JSON.parse(localStorage.getItem("optisave.prefillPaciente.accum") || "{}");
          const merged = { ...(old || {}), ...(partial || {}) };
          localStorage.setItem("optisave.prefillPaciente.accum", JSON.stringify(merged));
        } catch (e) {
          console.warn("No se pudo acumular prefill parcial:", e);
        }
      }
    } catch (err) {
      console.error("Error en conexión:", err);
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "Error al conectar con el asistente.",
        sender: "bot",
      };
      setMessages(prev => [...prev, errorMessage]);
    }

  };


  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Manejar envío con Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Botón flotante para abrir el chat */}
      {!isOpen && (
        <Button style={{ zIndex: 2147483647 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 sm:bottom-4 right-4 rounded-full w-12 h-12 p-0 shadow-lg"
        >
          <MessageCircle />
        </Button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <Card className="fixed bottom-20 sm:bottom-4 right-4 shadow-lg flex flex-col border border-border w-96 h-[32rem]"
          style={{ zIndex: 2147483647 }}>
          <CardHeader className="p-3 border-b flex justify-between items-center shadow-lg">
            <h3 className="font-medium">Asistente OptisaveAI</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3 ">
            {messages.map((message) => {
              // Renderizar tarjetas clicables para candidatos de pacientes
              if (message.sender === "bot" && Array.isArray(message.candidates) && message.candidates.length > 0) {
                return (
                  <div key={message.id} className="flex justify-start w-full">
                    <div className="flex flex-col gap-2 w-full">
                      {message.candidates.map((c) => (
                        <Card key={c.id} className="border border-border hover:bg-accent/20 cursor-pointer"
                          onClick={() => router.push(`/home/dashboard/historialclinico/${c.id}`)}
                        >
                          <CardHeader className="py-2 px-3">
                            <div className="font-medium">{c.nombre}</div>
                          </CardHeader>
                          <CardFooter className="py-2 px-3 pt-0">
                            <Button variant="outline" size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/home/dashboard/historialclinico/${c.id}`);
                              }}
                            >
                              Abrir historial
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              }

              // Mensaje normal (burbuja)
              return (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                      }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="p-3 pt-0">
            <div className="flex w-full gap-2">
              <Input
                placeholder="Escribe tu pregunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}