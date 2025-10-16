import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { SitePageHeader } from '../_components/site-page-header';
import { DocsCards } from './_components/docs-cards';
import { DocsCard } from './_components/docs-card';
import { getDocs } from './_lib/server/docs.loader';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:documentation'),
  };
};

async function DocsPage() {
  const { t, resolvedLanguage } = await createI18nServerInstance();
  const items = await getDocs(resolvedLanguage);

  // Filter out any docs that have a parentId, as these are children of other docs
  const cards = items.filter((item) => !item.parentId);

  // Estructura de documentación optimizada
  const docSections = [
    {
      title: "Centro de Ayuda",
      subtitle: "Contenido diseñado exclusivamente para usuarios finales",
      link: { url: "/docs/help-center" },
      items: [
        { title: "Inicio rápido", url: "/docs/help-center/quick-start" },
        { title: "Gestión de pacientes", url: "/docs/help-center/patient-management" },
        { title: "Diagnósticos y reportes", url: "/docs/help-center/reports" },
        { title: "Notificaciones", url: "/docs/help-center/notifications" },
        { title: "Planes y facturación", url: "/docs/help-center/billing" }
      ]
    },
    {
      title: "Casos de Éxito",
      subtitle: "Ejemplos prácticos que demuestren el valor del producto",
      link: { url: "/docs/success-stories" },
      items: [
        { title: "Clínica X redujo un 40% el tiempo de atención", url: "/docs/success-stories/clinic-x" },
        { title: "Cómo OpticSave automatiza los recordatorios de cita", url: "/docs/success-stories/appointment-reminders" },
        { title: "Integración con calendarios y envío automático de informes", url: "/docs/success-stories/calendar-integration" }
      ]
    },
    {
      title: "Material Educativo",
      subtitle: "Recursos que posicionen la marca como líder",
      link: { url: "/docs/educational" },
      items: [
        { title: "Guías sobre gestión clínica eficiente", url: "/docs/educational/clinic-management" },
        { title: "Buenas prácticas en diagnóstico visual digital", url: "/docs/educational/digital-diagnosis" },
        { title: "Artículos sobre la evolución tecnológica en optometría", url: "/docs/educational/tech-evolution" }
      ]
    },
    {
      title: "Recursos Descargables",
      subtitle: "Materiales útiles para optimizar tu experiencia",
      link: { url: "/docs/resources" },
      items: [
        { title: "Manual de usuario en formato PDF", url: "/docs/resources/user-manual" },
        { title: "Checklist para clínicas en proceso de migración digital", url: "/docs/resources/migration-checklist" },
        { title: "Plantillas personalizables", url: "/docs/resources/templates" }
      ]
    },
    {
      title: "Registro de Cambios",
      subtitle: "Listado detallado de actualizaciones con fechas",
      link: { url: "/docs/changelog" }
    },
    {
      title: "Centro de Soporte y Contacto",
      subtitle: "Base de conocimientos con sistema de búsqueda",
      link: { url: "/docs/support" }
    }
  ];

  // Convertir docSections a formato compatible con DocsCards
  const customCards = docSections.map((section, index) => ({
    title: section.title,
    label: section.title,
    url: section.link.url,
    description: section.subtitle,
    content: {},
    publishedAt: new Date().toISOString(),
    image: undefined,
    status: 'published' as const,
    slug: section.link.url.replace('/docs/', ''),
    categories: [],
    tags: [],
    order: index,
    children: [],
    parentId: undefined,
    id: `custom-${index}`,
    collapsible: false,
    collapsed: false
  }));

  return (
    <div className={'flex flex-col gap-y-6 xl:gap-y-10'}>
      <SitePageHeader
        title={t('marketing:documentation')}
        subtitle={t('marketing:documentationSubtitle')}
      />

      <div className={'flex flex-col items-center'}>
        <div className={'container mx-auto max-w-5xl'}>
          {/* Usar siempre nuestras secciones personalizadas */}
          <DocsCards cards={customCards} />
        </div>
      </div>
    </div>
  );
}

export default withI18n(DocsPage);
