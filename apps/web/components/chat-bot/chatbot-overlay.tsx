"use client";

import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { ChatBot } from "~/components/chat-bot/chat-bot";

export default function ChatBotOverlay() {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let el = document.getElementById("optisave-chatbot-overlay-container");
    if (!el) {
      el = document.createElement("div");
      el.id = "optisave-chatbot-overlay-container";
      document.body.appendChild(el);
    }
    setContainer(el);
  }, []);

  if (!container) return null;
  return ReactDOM.createPortal(<ChatBot />, container);
}