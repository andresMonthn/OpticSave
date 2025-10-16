import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SitePageHeader } from '../../_components/site-page-header';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();
  return {
    title: t('marketing:documentation') + ' - Registro de Cambios',
  };
};

async function ChangelogPage() {
  return (
    <div className={'flex flex-col gap-y-6 xl:gap-y-10'}>
      <SitePageHeader
        title="Registro de Cambios"
        subtitle="Listado detallado de actualizaciones con fechas"
      />

      <div className={'flex flex-col items-center'}>
        <div className={'container mx-auto max-w-5xl'}>
          <div className="space-y-8">
            <ChangelogItem 
              version="v1.2.0" 
              date="15 de Octubre, 2023"
              changes={[
                "Nueva interfaz de usuario para la gestión de pacientes",
                "Mejoras en el rendimiento del sistema",
                "Corrección de errores en el módulo de reportes"
              ]}
            />
            <ChangelogItem 
              version="v1.1.0" 
              date="20 de Septiembre, 2023"
              changes={[
                "Integración con Google Calendar",
                "Nuevo sistema de notificaciones",
                "Mejoras en la seguridad"
              ]}
            />
            <ChangelogItem 
              version="v1.0.0" 
              date="1 de Septiembre, 2023"
              changes={[
                "Lanzamiento inicial de OpticSave",
                "Módulo de gestión de pacientes",
                "Sistema de reportes básico",
                "Interfaz de usuario responsive"
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangelogItem({ 
  version, 
  date, 
  changes 
}: { 
  version: string; 
  date: string; 
  changes: string[] 
}) {
  return (
    <div className="border-b pb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">{version}</h3>
        <span className="text-gray-500">{date}</span>
      </div>
      <ul className="list-disc pl-5 space-y-2">
        {changes.map((change, index) => (
          <li key={index} className="text-gray-700">{change}</li>
        ))}
      </ul>
    </div>
  );
}

export default withI18n(ChangelogPage);