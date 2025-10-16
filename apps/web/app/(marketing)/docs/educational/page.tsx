import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { DocSection } from '../componentes_documentos/doc-section';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:documentation') + ' - Material Educativo',
  };
};

async function EducationalPage() {
  const items = [
    {
      title: "Guías sobre gestión clínica eficiente",
      description: "Aprende las mejores prácticas para gestionar tu clínica",
      href: "/docs/educational/clinic-management"
    },
    {
      title: "Buenas prácticas en diagnóstico visual digital",
      description: "Optimiza tus diagnósticos con herramientas digitales",
      href: "/docs/educational/digital-diagnosis"
    },
    {
      title: "Artículos sobre la evolución tecnológica en optometría",
      description: "Mantente al día con las últimas tendencias tecnológicas",
      href: "/docs/educational/tech-evolution"
    }
  ];

  return (
    <DocSection
      title="Material Educativo"
      subtitle="Recursos que posicionen la marca como líder"
      items={items}
    />
  );
}

export default withI18n(EducationalPage);