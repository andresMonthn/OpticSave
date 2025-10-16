import { SidebarProvider } from '@kit/ui/shadcn-sidebar';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';

// local imports
import { DocsNavigation } from './_components/docs-navigation';
import { getDocs } from './_lib/server/docs.loader';
import { buildDocumentationTree } from './_lib/utils';
import { Cms } from '@kit/cms';

async function DocsLayout({ children }: React.PropsWithChildren) {
  const { resolvedLanguage } = await createI18nServerInstance();
  const docs = await getDocs(resolvedLanguage);
  const tree = buildDocumentationTree(docs);
  
  // Añadir las nuevas secciones de documentación
  const customSections: Cms.ContentItem[] = [
    {
      id: 'help-center',
      title: 'Centro de Ayuda',
      label: 'Centro de Ayuda',
      description: 'Contenido diseñado exclusivamente para usuarios finales',
      url: '/docs/help-center',
      slug: 'help-center',
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
      id: 'success-stories',
      title: 'Casos de Éxito',
      label: 'Casos de Éxito',
      description: 'Ejemplos prácticos que demuestren el valor del producto',
      url: '/docs/success-stories',
      slug: 'success-stories',
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
      id: 'educational',
      title: 'Recursos Educativos',
      label: 'Recursos Educativos',
      description: 'Material educativo para usuarios',
      url: '/docs/educational',
      slug: 'educational',
      status: 'published',
      order: 30,
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
      id: 'resources',
      title: 'Recursos Descargables',
      label: 'Recursos Descargables',
      description: 'Recursos y materiales descargables',
      url: '/docs/resources',
      slug: 'resources',
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
      id: 'changelog',
      title: 'Historial de Cambios',
      label: 'Historial de Cambios',
      description: 'Registro de actualizaciones y cambios',
      url: '/docs/changelog',
      slug: 'changelog',
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
      id: 'support',
      title: 'Soporte',
      label: 'Soporte',
      description: 'Ayuda y soporte técnico',
      url: '/docs/support',
      slug: 'support',
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
  
  // Combinar el árbol existente con las nuevas secciones
  const completeTree = [...tree, ...customSections];

  return (
    <SidebarProvider
      style={{ '--sidebar-width': '18em' } as React.CSSProperties}
      className={'h-[calc(100vh-72px)] overflow-y-hidden lg:container'}
    >
      <DocsNavigation pages={completeTree} />

      {children}
    </SidebarProvider>
  );
}

export default DocsLayout;
