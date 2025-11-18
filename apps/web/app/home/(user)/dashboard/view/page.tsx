import { redirect } from "next/navigation";

export default function LegacyViewRedirect() {
  // Redirección server-side desde la ruta antigua a la nueva ruta de pacientes
  redirect("/home/view");
}