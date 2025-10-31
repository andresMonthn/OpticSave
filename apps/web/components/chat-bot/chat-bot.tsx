"use client";

import { useState, useRef, useEffect } from "react";
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
  text: string;
  sender: "user" | "bot";
};

export function ChatBot() {


  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "¡Hola! Soy el asistente virtual de OptisaveAI. ¿En qué puedo ayudarte?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const handleSendMessage = () => {
    if (input.trim() === "") return;
    
    // Añadir mensaje del usuario
    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: "user"
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // Simular tiempo de respuesta del bot
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: findBestResponse(input),
        sender: "bot"
      };
      
      setMessages(prev => [...prev, botResponse]);
    }, 500);
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
        <Button style={{zIndex: 1000}}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 shadow-lg"
        >
          <MessageCircle />
        </Button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 w-80 h-96 shadow-lg flex flex-col"
        style={{zIndex: 1000}}>
          <CardHeader className="p-3 border-b flex justify-between items-center">
            <h3 className="font-medium">Asistente OptisaveAI</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
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