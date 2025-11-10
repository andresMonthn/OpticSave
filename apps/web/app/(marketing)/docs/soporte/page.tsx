import { withI18n } from '~/lib/i18n/with-i18n';

async function SoportePage() {
  return (
    <div className={'flex flex-1 flex-col py-5'}>
      <article className={'px-6'}>
        <section className={'flex flex-col gap-y-2.5'}>
          <h1 className={'text-foreground text-3xl font-semibold'}>Soporte</h1>
          <p className={'text-muted-foreground text-lg'}>
            Canales de ayuda, tiempos de respuesta y guías de resolución.
          </p>
        </section>

        <div className={'prose max-w-none'}>
          <h2>Canales de soporte</h2>
          <ul className={'list-disc pl-6'}>
            <li>Centro de ayuda con artículos y tutoriales.</li>
            <li>Correo técnico: tiempo de respuesta dentro de horario laboral.</li>
            <li>Chat dentro de la app para dudas operativas.</li>
          </ul>

          <h2>Prioridades y tiempos</h2>
          <ul className={'list-disc pl-6'}>
            <li>Crítico (P1): caída del sistema. Respuesta inmediata.</li>
            <li>Alto (P2): funcionalidades clave afectadas. Respuesta rápida.</li>
            <li>Medio/Bajo (P3): consultas y mejoras. Respuesta programada.</li>
          </ul>

          <h2>Cómo abrir un ticket</h2>
          <ol className={'list-decimal pl-6'}>
            <li>Describe el problema y los pasos para reproducirlo.</li>
            <li>Agrega capturas y la hora aproximada del evento.</li>
            <li>Incluye navegador, usuario y página afectada.</li>
          </ol>

          <h2>Incidencias comunes</h2>
          <ul className={'list-disc pl-6'}>
            <li>Acceso: restablece contraseña y verifica correo.</li>
            <li>Licencia: revisa estado y método de pago.</li>
            <li>Sincronización: verifica conexión y vuelve a intentar.</li>
            <li>Subida de archivos: comprueba formato y tamaño.</li>
          </ul>

          <h2>Escalamiento</h2>
          <p>
            Si el impacto es crítico, escalamos a ingeniería y mantenemos
            comunicación hasta la resolución.
          </p>
        </div>
      </article>
    </div>
  );
}

export default withI18n(SoportePage);