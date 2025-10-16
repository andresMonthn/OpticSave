import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SitePageHeader } from '../../_components/site-page-header';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:documentation') + ' - Casos de Éxito',
  };
};

async function SuccessStoriesPage() {
  return (
    <div className={'flex flex-col gap-y-6 xl:gap-y-10'}>
      <SitePageHeader
        title="Casos de Éxito"
        subtitle="Ejemplos prácticos que demuestren el valor del producto"
      />

      <div className={'flex flex-col items-center'}>
        <div className={'container mx-auto max-w-5xl'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StoryItem 
              title="Clínica X redujo un 40% el tiempo de atención" 
              description="Descubre cómo esta clínica optimizó sus procesos con OpticSave"
              href="/docs/success-stories/clinic-x"
            />
            <StoryItem 
              title="Cómo OpticSave automatiza los recordatorios de cita" 
              description="Caso de estudio sobre la automatización de recordatorios"
              href="/docs/success-stories/appointment-reminders"
            />
            <StoryItem 
              title="Integración con calendarios y envío automático de informes" 
              description="Implementación exitosa de integración con calendarios"
              href="/docs/success-stories/calendar-integration"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryItem({ title, description, href }: { title: string; description: string; href: string }) {
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

export default withI18n(SuccessStoriesPage);