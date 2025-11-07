"use client";

import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { ChatBot } from "~/components/chat-bot/chat-bot";

export default function ChatBotOverlay() {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Crea (o reutiliza) un contenedor global en el body para evitar issues de stacking/transform
    let el = document.getElementById("optisave-chatbot-overlay-container");
    if (!el) {
      el = document.createElement("div");
      el.id = "optisave-chatbot-overlay-container";
      document.body.appendChild(el);
    }
    containerRef.current = el;
  }, []);

  if (!containerRef.current) return null;
  return ReactDOM.createPortal(<ChatBot />, containerRef.current);
}