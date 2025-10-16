import React from 'react';
import Link from 'next/link';
import { SitePageHeader } from '../../_components/site-page-header';

interface DocItem {
  title: string;
  description: string;
  href: string;
}

interface DocSectionProps {
  title: string;
  subtitle: string;
  items?: DocItem[];
}

export function DocSection({ title, subtitle, items = [] }: DocSectionProps) {
  return (
    <div className={'flex flex-col gap-y-6 xl:gap-y-10'}>
      <SitePageHeader
        title={title}
        subtitle={subtitle}
      />

      <div className={'flex flex-col items-center'}>
        <div className={'container mx-auto max-w-5xl'}>
          {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item, index) => (
                <DocItem
                  key={index}
                  title={item.title}
                  description={item.description}
                  href={item.href}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-gray-600">Contenido en desarrollo</p>
              <Link href="/docs" className="text-blue-600 hover:underline mt-4 inline-block">
                Volver a documentación
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocItem({ title, description, href }: DocItem) {
  return (
    <Link 
      href={href}
      className="block p-6 border rounded-lg hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
}