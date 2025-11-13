// Utilidad para inyectar estilos una sola vez (idempotente)
export function injectStylesOnce(id: string, styles: string): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(id);
  if (existing) return;
  const styleSheet = document.createElement('style');
  styleSheet.id = id;
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}