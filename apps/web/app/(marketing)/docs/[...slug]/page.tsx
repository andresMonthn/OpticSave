import { cache } from 'react';
import { notFound } from 'next/navigation';
import { ContentRenderer, createCmsClient } from '@kit/cms';
import { withI18n } from '~/lib/i18n/with-i18n';
// local imports

const getPageBySlug = cache(pageLoader);

interface DocumentationPageProps {
  params: Promise<{ slug: string[] }>;
}

async function pageLoader(slug: string) {
  try {
    const client = await createCmsClient();

    return await client.getContentItemBySlug({
      slug,
      collection: 'documentation',
    });
  } catch (error) {
    // In producción, Next oculta el mensaje exacto de errores de Server Components.
    // Si el CMS lanza, devolvemos null para manejar con notFound() y evitar romper el SSR.
    return null;
  }
}

export const generateMetadata = async ({ params }: DocumentationPageProps) => {
  try {
    const slug = (await params).slug.join('/');
    const page = await getPageBySlug(slug);

    if (!page) {
      // Fallback seguro cuando no hay contenido
      return { title: 'Documentación', description: undefined };
    }

    const { title, description } = page;

    return {
      title,
      description,
    };
  } catch {
    // No romper metadata en prod si algo falla
    return { title: 'Documentación', description: undefined };
  }
};

async function DocumentationPage({ params }: DocumentationPageProps) {
  const slug = (await params).slug.join('/');
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const description = page?.description ?? '';

  return (
    <div className={'flex flex-col py-5'}>
      <article className={'px-6'}>
        <section className={'flex flex-col gap-y-2.5'}>
          <h1 className={'text-foreground text-3xl font-semibold'}>
            {page.title}
          </h1>

          {description && (
            <h2 className={'text-muted-foreground text-lg'}>{description}</h2>
          )}
        </section>

        <div className={'markdoc'}>
          <ContentRenderer content={page.content} />
        </div>
      </article>
    </div>
  );
}

export default withI18n(DocumentationPage);
