import { SidebarProvider } from '@kit/ui/shadcn-sidebar';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';

// local imports
import { DocsNavigation } from './_components/docs-navigation';
import { Cms } from '@kit/cms';

async function DocsLayout({ children }: React.PropsWithChildren) {
  const { resolvedLanguage } = await createI18nServerInstance();
  
  // Añadir las nuevas secciones de documentación
  const customSections: Cms.ContentItem[] = [
    {
      id: 'conocenos',
      title: 'Conócenos',
      label: 'Conócenos',
      description: 'Información sobre la empresa y el producto',
      url: '/docs/conocenos',
      slug: 'conocenos',
      status: 'published',
      order: 10,
      parentId: undefined,
      content: '',
      publishedAt: new Date().toISOString(),
      categories: [],
      tags: [],
      children: [],
      collapsible: false,
      collapsed: false,
      image: ''
    },
    {
      id: 'licencia',
      title: 'Obtención de licencia',
      label: 'Obtención de licencia',
      description: 'Cómo adquirir y gestionar tu licencia',
      url: '/docs/licencia',
      slug: 'licencia',
      status: 'published',
      order: 20,
      parentId: undefined,
      content: '',
      publishedAt: new Date().toISOString(),
      categories: [],
      tags: [],
      children: [],
      collapsible: false,
      collapsed: false,
      image: ''
    },
    {
      id: 'iniciando-app',
      title: 'Iniciando en la app',
      label: 'Iniciando en la app',
      description: 'Primeros pasos dentro de la aplicación',
      url: '/docs/iniciando-app',
      slug: 'iniciando-app',
      status: 'published',
      order: 30,
      parentId: undefined,
      content: '',
      publishedAt: new Date().toISOString(),
      categories: [],
      tags: [],
      children: [
        {
          id: 'iniciando-app-requisitos-previos',
          title: 'Requisitos previos',
          label: 'Requisitos previos',
          description: 'Checklist de requisitos para comenzar',
          url: '/docs/iniciando-app#requisitos-previos',
          slug: 'iniciando-app#requisitos-previos',
          status: 'published',
          order: 10,
          parentId: 'iniciando-app',
          content: '',
          publishedAt: new Date().toISOString(),
          categories: [],
          tags: [],
          children: [],
          collapsible: false,
          collapsed: false,
          image: ''
        },
        {
          id: 'iniciando-app-crear-verificar',
          title: 'Crear y verificar tu cuenta',
          label: 'Crear y verificar tu cuenta',
          description: 'Pasos para registro y verificación',
          url: '/docs/iniciando-app#crear-y-verificar-tu-cuenta',
          slug: 'iniciando-app#crear-y-verificar-tu-cuenta',
          status: 'published',
          order: 20,
          parentId: 'iniciando-app',
          content: '',
          publishedAt: new Date().toISOString(),
          categories: [],
          tags: [],
          children: [],
          collapsible: false,
          collapsed: false,
          image: ''
        },
        {
          id: 'iniciando-app-configuracion-inicial',
          title: 'Configuración inicial',
          label: 'Configuración inicial',
          description: 'Asistente y parámetros iniciales de la clínica',
          url: '/docs/iniciando-app#asistente-de-configuracion-inicial',
          slug: 'iniciando-app#asistente-de-configuracion-inicial',
          status: 'published',
          order: 30,
          parentId: 'iniciando-app',
          content: '',
          publishedAt: new Date().toISOString(),
          categories: [],
          tags: [],
          children: [],
          collapsible: false,
          collapsed: false,
          image: ''
        },
        {
          id: 'iniciando-app-importar-pacientes',
          title: 'Importar pacientes',
          label: 'Importar pacientes',
          description: 'Carga manual o importación desde CSV',
          url: '/docs/iniciando-app#importar-pacientes',
          slug: 'iniciando-app#importar-pacientes',
          status: 'published',
          order: 40,
          parentId: 'iniciando-app',
          content: '',
          publishedAt: new Date().toISOString(),
          categories: [],
          tags: [],
          children: [],
          collapsible: false,
          collapsed: false,
          image: ''
        },
        {
          id: 'iniciando-app-navegacion-basica',
          title: 'Navegación básica',
          label: 'Navegación básica',
          description: 'Recorrido por inicio, pacientes, agenda y reportes',
          url: '/docs/iniciando-app#navegacion-basica',
          slug: 'iniciando-app#navegacion-basica',
          status: 'published',
          order: 50,
          parentId: 'iniciando-app',
          content: '',
          publishedAt: new Date().toISOString(),
          categories: [],
          tags: [],
          children: [],
          collapsible: false,
          collapsed: false,
          image: ''
        },
        {
          id: 'iniciando-app-seguridad-privacidad',
          title: 'Seguridad y privacidad',
          label: 'Seguridad y privacidad',
          description: 'Roles, permisos y cumplimiento de protección de datos',
          url: '/docs/iniciando-app#seguridad-y-privacidad',
          slug: 'iniciando-app#seguridad-y-privacidad',
          status: 'published',
          order: 60,
          parentId: 'iniciando-app',
          content: '',
          publishedAt: new Date().toISOString(),
          categories: [],
          tags: [],
          children: [],
          collapsible: false,
          collapsed: false,
          image: ''
        },
        {
          id: 'iniciando-app-buenas-practicas',
          title: 'Buenas prácticas',
          label: 'Buenas prácticas',
          description: 'Recomendaciones para uso eficiente y seguro',
          url: '/docs/iniciando-app#buenas-practicas',
          slug: 'iniciando-app#buenas-practicas',
          status: 'published',
          order: 70,
          parentId: 'iniciando-app',
          content: '',
          publishedAt: new Date().toISOString(),
          categories: [],
          tags: [],
          children: [],
          collapsible: false,
          collapsed: false,
          image: ''
        }
      ],
      collapsible: true,
      collapsed: false,
      image: ''
    },
    {
      id: 'conociendo-ai-opticsave',
      title: 'Conociendo AI OpticSave',
      label: 'Conociendo AI OpticSave',
      description: 'Características y capacidades de la IA de OpticSave',
      url: '/docs/conociendo-ai-opticsave',
      slug: 'conociendo-ai-opticsave',
      status: 'published',
      order: 40,
      parentId: undefined,
      content: '',
      publishedAt: new Date().toISOString(),
      categories: [],
      tags: [],
      children: [],
      collapsible: false,
      collapsed: false,
      image: ''
    },
    {
      id: 'formatos-fisicos',
      title: 'Formatos físicos',
      label: 'Formatos físicos',
      description: 'Plantillas y documentos para uso en clínica',
      url: '/docs/formatos-fisicos',
      slug: 'formatos-fisicos',
      status: 'published',
      order: 50,
      parentId: undefined,
      content: '',
      publishedAt: new Date().toISOString(),
      categories: [],
      tags: [],
      children: [],
      collapsible: false,
      collapsed: false,
      image: ''
    },
    {
      id: 'soporte',
      title: 'Soporte',
      label: 'Soporte',
      description: 'Ayuda y soporte técnico',
      url: '/docs/soporte',
      slug: 'soporte',
      status: 'published',
      order: 60,
      parentId: undefined,
      content: '',
      publishedAt: new Date().toISOString(),
      categories: [],
      tags: [],
      children: [],
      collapsible: false,
      collapsed: false,
      image: ''
    }
  ];
  
  // Navegación inicial definida por proyecto
  const completeTree = customSections;

  return (
    <SidebarProvider
      style={{ '--sidebar-width': '18em' } as React.CSSProperties}
      className={'min-h-[calc(100vh-72px)] lg:container'}>
      <DocsNavigation pages={completeTree} />
      {children}
    </SidebarProvider>
  );
}

export default DocsLayout;
