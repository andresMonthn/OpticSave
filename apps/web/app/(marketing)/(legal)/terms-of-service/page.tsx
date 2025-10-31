import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:termsOfService'),
  };
}

async function TermsOfServicePage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing:termsOfService`)}
        subtitle={t(`marketing:termsOfServiceDescription`)}
      />

      <div className={'container mx-auto py-8 prose prose-slate max-w-none'}>
        <div className="space-y-8">
          <section id="introduccion">
            <h2 className="text-2xl font-bold mb-4">1. Introducción</h2>
            <p>
              Bienvenido a OpticSave, una plataforma de gestión oftalmológica diseñada para profesionales del sector. 
              Al acceder o utilizar nuestra aplicación, usted acepta estar legalmente vinculado por estos Términos de Servicio. 
              Si no está de acuerdo con alguna parte de estos términos, no podrá acceder o utilizar nuestros servicios.
            </p>
            <p>
              Estos términos se aplican a todos los usuarios de OpticSave, incluyendo administradores, profesionales médicos, 
              personal administrativo y cualquier otro usuario autorizado a acceder a la plataforma.
            </p>
          </section>

          <section id="uso-permitido">
            <h2 className="text-2xl font-bold mb-4">2. Uso Permitido de la Aplicación</h2>
            <p>
              OpticSave otorga a los usuarios una licencia limitada, no exclusiva, no transferible y revocable para:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Acceder y utilizar la aplicación para la gestión de consultas oftalmológicas.</li>
              <li>Registrar y gestionar datos de pacientes con su consentimiento explícito.</li>
              <li>Programar y administrar citas médicas.</li>
              <li>Generar y almacenar recetas y prescripciones médicas.</li>
              <li>Gestionar facturación y pagos relacionados con servicios oftalmológicos.</li>
              <li>Utilizar las herramientas de análisis y reportes disponibles según su nivel de suscripción.</li>
              <li>Acceder a recursos educativos y de formación proporcionados por la plataforma.</li>
            </ol>
            <p className="mt-4">
              El uso de OpticSave está sujeto a la adquisición de una suscripción válida y al cumplimiento continuo de estos términos.
            </p>
          </section>

          <section id="restricciones">
            <h2 className="text-2xl font-bold mb-4">3. Restricciones y Prohibiciones</h2>
            <p>
              Al utilizar OpticSave, usted acepta NO:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Utilizar la aplicación para fines distintos a la gestión oftalmológica profesional.</li>
              <li>Compartir sus credenciales de acceso con terceros no autorizados.</li>
              <li>Intentar acceder a datos de pacientes sin su consentimiento explícito.</li>
              <li>Realizar ingeniería inversa, descompilar o desensamblar cualquier parte del software.</li>
              <li>Eludir, deshabilitar o interferir con las características de seguridad de la plataforma.</li>
              <li>Utilizar la aplicación para almacenar o transmitir virus, malware o cualquier código malicioso.</li>
              <li>Utilizar la aplicación para actividades ilegales o no éticas.</li>
              <li>Infringir los derechos de propiedad intelectual de OpticSave o de terceros.</li>
              <li>Utilizar la plataforma para enviar comunicaciones no solicitadas o spam.</li>
              <li>Revender, alquilar o transferir su acceso a la aplicación sin autorización expresa.</li>
            </ol>
          </section>

          <section id="privacidad">
            <h2 className="text-2xl font-bold mb-4">4. Política de Privacidad y Manejo de Datos</h2>
            <p>
              OpticSave se compromete a proteger la privacidad y seguridad de todos los datos procesados a través de nuestra plataforma:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Todos los datos de pacientes se almacenan de forma cifrada y segura.</li>
              <li>Cumplimos con todas las regulaciones aplicables de protección de datos, incluyendo RGPD y LOPD-GDD.</li>
              <li>No compartimos información de pacientes con terceros sin consentimiento explícito.</li>
              <li>Implementamos medidas técnicas y organizativas para garantizar la seguridad de los datos.</li>
              <li>Mantenemos registros de auditoría de todos los accesos a información sensible.</li>
              <li>Permitimos a los pacientes ejercer sus derechos de acceso, rectificación, cancelación y oposición.</li>
              <li>Notificamos cualquier brecha de seguridad según lo exigido por la ley aplicable.</li>
            </ol>
            <p className="mt-4">
              Para más detalles, consulte nuestra Política de Privacidad completa disponible en nuestra plataforma.
            </p>
          </section>

          <section id="responsabilidades">
            <h2 className="text-2xl font-bold mb-4">5. Responsabilidades del Usuario</h2>
            <p>
              Como usuario de OpticSave, usted es responsable de:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
              <li>Obtener el consentimiento informado de los pacientes antes de registrar sus datos.</li>
              <li>Asegurar que toda la información ingresada sea precisa y esté actualizada.</li>
              <li>Cumplir con todas las leyes y regulaciones aplicables a la práctica oftalmológica.</li>
              <li>Realizar copias de seguridad regulares de datos críticos según las mejores prácticas.</li>
              <li>Reportar inmediatamente cualquier uso no autorizado o brecha de seguridad.</li>
              <li>Capacitar adecuadamente a su personal en el uso correcto de la plataforma.</li>
              <li>Mantener actualizado el software y sistemas que utilicen para acceder a OpticSave.</li>
            </ol>
          </section>

          <section id="terminacion">
            <h2 className="text-2xl font-bold mb-4">6. Condiciones de Terminación de Cuenta</h2>
            <p>
              OpticSave se reserva el derecho de suspender o terminar su acceso a la plataforma:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Por incumplimiento de estos Términos de Servicio.</li>
              <li>Por falta de pago de las tarifas de suscripción aplicables.</li>
              <li>Por uso fraudulento o abusivo de la plataforma.</li>
              <li>Por solicitud de autoridades legales o regulatorias.</li>
              <li>Por inactividad prolongada de la cuenta (superior a 12 meses).</li>
            </ol>
            <p className="mt-4">
              En caso de terminación:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Se le proporcionará un período de gracia de 30 días para exportar sus datos.</li>
              <li>Después del período de gracia, sus datos serán anonimizados o eliminados según la legislación aplicable.</li>
              <li>No se realizarán reembolsos por períodos de suscripción no utilizados, salvo que la ley aplicable lo exija.</li>
            </ol>
          </section>

          <section id="propiedad-intelectual">
            <h2 className="text-2xl font-bold mb-4">7. Derechos de Propiedad Intelectual</h2>
            <p>
              Todos los derechos de propiedad intelectual relacionados con OpticSave son propiedad exclusiva de nuestra empresa:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>El software, código, diseño, logotipos, marcas comerciales y contenido son propiedad de OpticSave.</li>
              <li>No se concede ningún derecho de propiedad intelectual más allá del uso limitado especificado en estos términos.</li>
              <li>Los usuarios mantienen la propiedad de los datos que ingresan en la plataforma.</li>
              <li>Cualquier sugerencia o feedback proporcionado puede ser utilizado por OpticSave sin compensación adicional.</li>
              <li>Está prohibida la reproducción, modificación o distribución no autorizada de cualquier parte de la plataforma.</li>
            </ol>
          </section>

          <section id="limitaciones">
            <h2 className="text-2xl font-bold mb-4">8. Limitaciones de Responsabilidad</h2>
            <p>
              En la máxima medida permitida por la ley:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>OpticSave proporciona la plataforma "tal cual" y "según disponibilidad" sin garantías de ningún tipo.</li>
              <li>No garantizamos que la plataforma esté libre de errores o disponible de forma ininterrumpida.</li>
              <li>No somos responsables de decisiones médicas tomadas basadas en la información proporcionada por la plataforma.</li>
              <li>Nuestra responsabilidad total por cualquier reclamación no excederá el monto pagado por su suscripción en los últimos 12 meses.</li>
              <li>No somos responsables de daños indirectos, incidentales, especiales o consecuentes.</li>
              <li>No somos responsables de pérdidas de datos resultantes de fallos técnicos fuera de nuestro control razonable.</li>
            </ol>
            <p className="mt-4">
              Algunas jurisdicciones no permiten la exclusión de ciertas garantías o la limitación de responsabilidad, por lo que algunas de las limitaciones anteriores pueden no aplicarse en su caso.
            </p>
          </section>

          <section id="jurisdiccion">
            <h2 className="text-2xl font-bold mb-4">9. Jurisdicción Aplicable y Resolución de Disputas</h2>
            <p>
              Estos Términos de Servicio se rigen por las leyes de España, sin consideración a sus disposiciones sobre conflictos de leyes.
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Cualquier disputa relacionada con estos términos se resolverá primero mediante negociación de buena fe.</li>
              <li>Si la negociación no resuelve la disputa en un plazo de 30 días, ambas partes acuerdan someterse a mediación.</li>
              <li>Si la mediación no tiene éxito, la disputa se someterá a los tribunales de Madrid, España.</li>
              <li>Renunciamos mutuamente a cualquier derecho a un juicio con jurado.</li>
              <li>Cualquier acción legal debe iniciarse dentro de un año después de que surja la causa de la acción.</li>
            </ol>
          </section>

          <section id="modificaciones">
            <h2 className="text-2xl font-bold mb-4">10. Modificaciones a los Términos</h2>
            <p>
              OpticSave se reserva el derecho de modificar estos Términos de Servicio en cualquier momento:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Las modificaciones entrarán en vigor inmediatamente después de su publicación en la plataforma.</li>
              <li>Se notificarán los cambios sustanciales a través de la plataforma o por correo electrónico.</li>
              <li>El uso continuado de la plataforma después de cualquier modificación constituye la aceptación de los nuevos términos.</li>
            </ol>
            <p className="mt-4">
              Última actualización: 1 de octubre de 2023
            </p>
          </section>

          <section id="contacto">
            <h2 className="text-2xl font-bold mb-4">11. Contacto</h2>
            <p>
              Si tiene alguna pregunta sobre estos Términos de Servicio, puede contactarnos en:
            </p>
            <p className="mt-2">
              Email: andres.777.monthana@gmail.com<br />
              Teléfono: +52 449 345 6789<br />
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withI18n(TermsOfServicePage);
