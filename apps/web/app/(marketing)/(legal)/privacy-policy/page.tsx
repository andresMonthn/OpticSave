import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:privacyPolicy'),
  };
}

async function PrivacyPolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t('marketing:privacyPolicy')}
        subtitle={t('marketing:privacyPolicyDescription')}
      />

      <div className={'container mx-auto py-8 prose prose-slate max-w-none'}>
        <div className="space-y-8">
          <section id="introduccion">
            <h2 className="text-2xl font-bold mb-4">1. Introducción</h2>
            <p>
              En OpticSave, nos comprometemos a proteger su privacidad y a manejar sus datos personales con el máximo cuidado y confidencialidad.
              Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos su información cuando utiliza nuestra
              plataforma de gestión oftalmológica.
            </p>
            <p>
              Al utilizar OpticSave, usted acepta las prácticas descritas en esta política. Le recomendamos que la lea detenidamente
              para comprender cómo tratamos sus datos personales y los de sus pacientes.
            </p>
          </section>

          <section id="responsable">
            <h2 className="text-2xl font-bold mb-4">2. Responsable del Tratamiento</h2>
            <p>
              <strong>OpticSave S.L.</strong><br />
              CIF: B12345678<br />
              Dirección: Calle Innovación 123, 28001 Madrid, España<br />
              Email: privacidad@opticsave.com<br />
              Teléfono: +34 900 123 456
            </p>
            <p>
              Hemos designado un Delegado de Protección de Datos (DPO) que puede ser contactado en: dpo@opticsave.com
            </p>
          </section>

          <section id="recoleccion">
            <h2 className="text-2xl font-bold mb-4">3. Información que Recopilamos</h2>
            <p>
              Dependiendo de su relación con OpticSave, podemos recopilar diferentes tipos de información:
            </p>
            <h3 className="text-xl font-semibold mt-4 mb-2">3.1. Profesionales y Clínicas</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Información de registro: nombre, dirección de email, número de teléfono, especialidad médica.</li>
              <li>Información de la clínica: nombre, dirección, NIF/CIF, datos de contacto.</li>
              <li>Credenciales profesionales: número de colegiado, certificaciones.</li>
              <li>Información de facturación: datos bancarios, historial de pagos.</li>
              <li>Datos de uso: cómo interactúa con nuestra plataforma, frecuencia de uso, funcionalidades utilizadas.</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-4 mb-2">3.2. Datos de Pacientes</h3>
            <p>
              Como procesador de datos, almacenamos la información de pacientes que usted introduce en nuestra plataforma:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Datos identificativos: nombre, dirección, fecha de nacimiento, DNI/NIE.</li>
              <li>Información de contacto: teléfono, email.</li>
              <li>Datos de salud: historial médico, diagnósticos, prescripciones, resultados de pruebas oftalmológicas.</li>
              <li>Información de seguros médicos: compañía, número de póliza.</li>
              <li>Historial de citas y tratamientos.</li>
            </ul>
            <p className="mt-2">
              <strong>Nota importante:</strong> Usted, como profesional médico o clínica, sigue siendo el responsable del tratamiento de los datos de sus pacientes.
              OpticSave actúa como encargado del tratamiento, procesando estos datos según sus instrucciones y de acuerdo con el contrato de encargo de tratamiento.
            </p>
          </section>

          <section id="base-legal">
            <h2 className="text-2xl font-bold mb-4">4. Base Legal para el Tratamiento</h2>
            <p>
              Procesamos sus datos personales basándonos en las siguientes bases legales:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Ejecución de un contrato:</strong> El procesamiento es necesario para cumplir con nuestro contrato de servicios con usted.</li>
              <li><strong>Consentimiento:</strong> En algunos casos, procesamos datos basados en su consentimiento explícito.</li>
              <li><strong>Interés legítimo:</strong> Cuando es necesario para nuestros intereses legítimos, como mejorar nuestros servicios o prevenir fraudes.</li>
              <li><strong>Obligación legal:</strong> Cuando estamos obligados por ley a procesar ciertos datos.</li>
            </ul>
            <p className="mt-2">
              Para los datos de salud de los pacientes, la base legal es el consentimiento explícito que usted debe obtener de sus pacientes,
              junto con la necesidad de estos datos para proporcionar atención médica (ejecución de un contrato de servicios médicos).
            </p>
          </section>

          <section id="uso">
            <h2 className="text-2xl font-bold mb-4">5. Cómo Utilizamos su Información</h2>
            <h3 className="text-xl font-semibold mt-4 mb-2">5.1. Profesionales y Clínicas</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Proporcionar y mantener nuestros servicios de gestión oftalmológica.</li>
              <li>Procesar pagos y gestionar su suscripción.</li>
              <li>Enviar notificaciones relacionadas con su cuenta o cambios en nuestros servicios.</li>
              <li>Proporcionar soporte técnico y atención al cliente.</li>
              <li>Mejorar y personalizar nuestros servicios basados en su uso.</li>
              <li>Enviar comunicaciones de marketing (con su consentimiento).</li>
              <li>Cumplir con obligaciones legales y fiscales.</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-4 mb-2">5.2. Datos de Pacientes</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Almacenar y procesar datos para permitirle gestionar historiales médicos.</li>
              <li>Facilitar la programación y seguimiento de citas.</li>
              <li>Permitir la generación de prescripciones y recetas.</li>
              <li>Proporcionar herramientas de análisis y reportes anonimizados.</li>
              <li>Implementar funciones de recordatorios y seguimiento de tratamientos.</li>
            </ul>
          </section>

          <section id="proteccion">
            <h2 className="text-2xl font-bold mb-4">6. Protección de Datos</h2>
            <p>
              Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos personales:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cifrado:</strong> Todos los datos sensibles se almacenan y transmiten utilizando cifrado de extremo a extremo.</li>
              <li><strong>Control de acceso:</strong> Implementamos controles de acceso estrictos y autenticación multifactor.</li>
              <li><strong>Auditorías:</strong> Realizamos auditorías de seguridad regulares y evaluaciones de vulnerabilidades.</li>
              <li><strong>Formación:</strong> Nuestro personal recibe formación continua sobre protección de datos y seguridad.</li>
              <li><strong>Copias de seguridad:</strong> Realizamos copias de seguridad regulares para prevenir pérdidas de datos.</li>
              <li><strong>Plan de respuesta:</strong> Contamos con un plan de respuesta a incidentes de seguridad.</li>
            </ul>
          </section>

          <section id="compartir">
            <h2 className="text-2xl font-bold mb-4">7. Compartir Información</h2>
            <p>
              Podemos compartir su información con:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Proveedores de servicios:</strong> Terceros que nos ayudan a proporcionar nuestros servicios (procesamiento de pagos, almacenamiento en la nube, soporte técnico).</li>
              <li><strong>Autoridades:</strong> Cuando sea requerido por ley, orden judicial o solicitud gubernamental.</li>
              <li><strong>Socios comerciales:</strong> Con su consentimiento explícito, podemos compartir datos con socios seleccionados.</li>
            </ul>
            <p className="mt-2">
              Todos nuestros proveedores de servicios están obligados por contrato a proteger sus datos y solo pueden utilizarlos de acuerdo con nuestras instrucciones.
            </p>
          </section>

          <section id="transferencias">
            <h2 className="text-2xl font-bold mb-4">8. Transferencias Internacionales</h2>
            <p>
              Sus datos se almacenan principalmente en servidores ubicados en la Unión Europea. Sin embargo, algunos de nuestros proveedores de servicios pueden procesar datos fuera del Espacio Económico Europeo (EEE).
            </p>
            <p>
              En estos casos, nos aseguramos de que existan garantías adecuadas para proteger sus datos, como:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Decisiones de adecuación de la Comisión Europea.</li>
              <li>Cláusulas contractuales tipo aprobadas por la Comisión Europea.</li>
              <li>Normas corporativas vinculantes para transferencias dentro de un grupo empresarial.</li>
            </ul>
          </section>

          <section id="derechos">
            <h2 className="text-2xl font-bold mb-4">9. Sus Derechos</h2>
            <p>
              Bajo el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos y Garantía de Derechos Digitales (LOPDGDD), usted tiene los siguientes derechos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Acceso:</strong> Derecho a obtener confirmación sobre si estamos tratando sus datos y a acceder a ellos.</li>
              <li><strong>Rectificación:</strong> Derecho a corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> Derecho a solicitar la eliminación de sus datos cuando ya no sean necesarios.</li>
              <li><strong>Limitación:</strong> Derecho a solicitar la limitación del tratamiento de sus datos.</li>
              <li><strong>Portabilidad:</strong> Derecho a recibir sus datos en un formato estructurado y a transmitirlos a otro responsable.</li>
              <li><strong>Oposición:</strong> Derecho a oponerse al tratamiento de sus datos en determinadas circunstancias.</li>
              <li><strong>No ser objeto de decisiones automatizadas:</strong> Derecho a no ser objeto de decisiones basadas únicamente en el tratamiento automatizado.</li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos, puede contactarnos en: privacidad@opticsave.com. Responderemos a su solicitud en un plazo máximo de un mes.
            </p>
            <p>
              También tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es) si considera que el tratamiento no se ajusta a la normativa vigente.
            </p>
          </section>

          <section id="cookies">
            <h2 className="text-2xl font-bold mb-4">10. Cookies y Tecnologías Similares</h2>
            <p>
              Utilizamos cookies y tecnologías similares para mejorar su experiencia en nuestra plataforma, recordar sus preferencias y entender cómo se utiliza nuestro servicio.
            </p>
            <p>
              Tipos de cookies que utilizamos:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento básico de la plataforma.</li>
              <li><strong>Cookies de preferencias:</strong> Permiten recordar información que cambia el aspecto o comportamiento de la plataforma.</li>
              <li><strong>Cookies estadísticas:</strong> Nos ayudan a entender cómo los usuarios interactúan con la plataforma.</li>
              <li><strong>Cookies de marketing:</strong> Utilizadas para rastrear a los visitantes en las páginas web (solo con su consentimiento).</li>
            </ul>
            <p className="mt-2">
              Puede configurar su navegador para rechazar todas o algunas cookies, o para alertarle cuando las páginas web establecen o acceden a las cookies.
              Para más información, consulte nuestra Política de Cookies completa.
            </p>
          </section>

          <section id="retencion">
            <h2 className="text-2xl font-bold mb-4">11. Retención de Datos</h2>
            <p>
              Conservamos sus datos personales solo durante el tiempo necesario para los fines para los que fueron recopilados:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Datos de cuenta y facturación: Durante la vigencia de nuestra relación contractual y por un período adicional de 5 años para cumplir con obligaciones legales.</li>
              <li>Datos de pacientes: De acuerdo con los requisitos legales para historiales médicos (mínimo 5 años desde la última atención, según la Ley 41/2002).</li>
              <li>Datos de marketing: Hasta que retire su consentimiento.</li>
            </ul>
            <p className="mt-2">
              Una vez finalizado el período de retención, eliminaremos o anonimizaremos sus datos de forma segura.
            </p>
          </section>

          <section id="menores">
            <h2 className="text-2xl font-bold mb-4">12. Menores</h2>
            <p>
              Nuestros servicios están dirigidos a profesionales de la salud y no están diseñados para ser utilizados directamente por menores de 18 años.
              No recopilamos intencionadamente información personal de menores sin el consentimiento verificable de sus padres o tutores legales.
            </p>
            <p>
              Si es usted un profesional médico que trata a pacientes menores de edad, debe asegurarse de obtener el consentimiento adecuado de los padres o tutores
              antes de introducir sus datos en nuestra plataforma.
            </p>
          </section>

          <section id="cambios">
            <h2 className="text-2xl font-bold mb-4">13. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas o por otros motivos operativos, legales o regulatorios.
            </p>
            <p>
              Le notificaremos cualquier cambio material a través de un aviso destacado en nuestra plataforma o por correo electrónico antes de que el cambio entre en vigor.
              Le animamos a revisar periódicamente esta política para estar informado sobre cómo protegemos su información.
            </p>
            <p className="mt-2">
              Última actualización: 1 de octubre de 2023
            </p>
          </section>

          <section id="contacto">
            <h2 className="text-2xl font-bold mb-4">14. Contacto</h2>
            <p>
              Si tiene alguna pregunta, inquietud o solicitud relacionada con esta Política de Privacidad o el tratamiento de sus datos personales, no dude en contactarnos:
            </p>
            <p className="mt-2">
              <strong>Responsable de Privacidad</strong><br />
              Email: privacidad@opticsave.com<br />
              Teléfono: +34 900 123 456<br />
              Dirección: Calle Innovación 123, 28001 Madrid, España
            </p>
            <p className="mt-2">
              <strong>Delegado de Protección de Datos (DPO)</strong><br />
              Email: dpo@opticsave.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withI18n(PrivacyPolicyPage);
