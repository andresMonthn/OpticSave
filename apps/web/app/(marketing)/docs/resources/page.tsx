import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { DocSection } from '../componentes_documentos/doc-section';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();
  return {
    title: t('marketing:documentation') + ' - Recursos Descargables',
  };
};

async function ResourcesPage() {
  const items = [
    {
      title: "Manual de usuario en formato PDF",
      description: "Descarga el manual completo de OpticSave",
      href: "/docs/resources/user-manual"
    },
    {
      title: "Checklist para clínicas en proceso de migración digital",
      description: "Guía paso a paso para migrar a un sistema digital",
      href: "/docs/resources/migration-checklist"
    },
    {
      title: "Plantillas personalizables",
      description: "Plantillas para informes y documentación clínica",
      href: "/docs/resources/templates"
    }
  ];

  return (
    <DocSection
      title="Recursos Descargables"
      subtitle="Materiales útiles para optimizar tu experiencia"
      items={items}
    />
  );
}

export default withI18n(ResourcesPage);