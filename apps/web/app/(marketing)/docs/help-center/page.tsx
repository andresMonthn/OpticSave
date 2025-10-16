import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SitePageHeader } from '../../_components/site-page-header';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:documentation') + ' - Centro de Ayuda',
  };
};

async function HelpCenterPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div className={'flex flex-col gap-y-6 xl:gap-y-10'}>
      <SitePageHeader
        title="Centro de Ayuda"
        subtitle="Contenido diseñado exclusivamente para usuarios finales"
      />

      <div className={'flex flex-col items-center'}>
        <div className={'container mx-auto max-w-5xl'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HelpItem 
              title="Inicio rápido" 
              description="Guía para comenzar a usar OpticSave rápidamente"
              href="/docs/help-center/quick-start"
            />
            <HelpItem 
              title="Gestión de pacientes" 
              description="Aprende a gestionar la información de tus pacientes"
              href="/docs/help-center/patient-management"
            />
            <HelpItem 
              title="Diagnósticos y reportes" 
              description="Cómo crear y gestionar diagnósticos y reportes"
              href="/docs/help-center/reports"
            />
            <HelpItem 
              title="Notificaciones" 
              description="Configura y gestiona las notificaciones del sistema"
              href="/docs/help-center/notifications"
            />
            <HelpItem 
              title="Planes y facturación" 
              description="Información sobre planes, precios y facturación"
              href="/docs/help-center/billing"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpItem({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a 
      href={href}
      className="block p-6 border rounded-lg hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </a>
  );
}

export default withI18n(HelpCenterPage);