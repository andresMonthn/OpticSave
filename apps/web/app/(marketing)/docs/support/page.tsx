import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { SitePageHeader } from '../../_components/site-page-header';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();
  return {
    title: t('marketing:documentation') + ' - Centro de Soporte',
  };
};

async function SupportPage() {
  return (
    <div className={'flex flex-col gap-y-6 xl:gap-y-10'}>
      <SitePageHeader
        title="Centro de Soporte y Contacto"
        subtitle="Base de conocimientos con sistema de búsqueda"
      />

      <div className={'flex flex-col items-center'}>
        <div className={'container mx-auto max-w-5xl'}>
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar en la base de conocimientos..."
                className="w-full p-4 pr-12 border rounded-lg"
              />
              <button className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <SupportCategory 
              title="Preguntas Frecuentes" 
              description="Respuestas a las preguntas más comunes"
              icon="❓"
            />
            <SupportCategory 
              title="Guías de Uso" 
              description="Tutoriales paso a paso para usar OpticSave"
              icon="📚"
            />
            <SupportCategory 
              title="Solución de Problemas" 
              description="Ayuda para resolver problemas comunes"
              icon="🔧"
            />
            <SupportCategory 
              title="Actualizaciones" 
              description="Información sobre las últimas actualizaciones"
              icon="🔄"
            />
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">¿No encuentras lo que buscas?</h3>
            <p className="mb-4">Nuestro equipo de soporte está disponible para ayudarte.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/contact" className="bg-blue-600 text-white px-6 py-3 rounded-lg text-center hover:bg-blue-700 transition-colors">
                Contactar Soporte
              </a>
              <a href="mailto:soporte@opticsave.com" className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg text-center hover:bg-blue-50 transition-colors">
                Enviar Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportCategory({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string; 
  icon: string;
}) {
  return (
    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default withI18n(SupportPage);