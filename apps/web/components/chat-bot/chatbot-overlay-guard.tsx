"use client";

import { usePathname } from "next/navigation";
import ChatBotOverlay from "~/components/chat-bot/chatbot-overlay";

export default function ChatBotOverlayGuard() {
  const pathname = usePathname();
  // Renderiza el ChatBot solo bajo rutas de /home
  const show = typeof pathname === "string" && pathname.startsWith("/home");
  return show ? <ChatBotOverlay /> : null;
}