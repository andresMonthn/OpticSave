import React from 'react';
import { SitePageHeader } from '../../_components/site-page-header';

export function HelpCenter() {
  return (
    <div className="container mx-auto max-w-5xl py-8">
      <SitePageHeader 
        title="Centro de Ayuda" 
        subtitle="Contenido diseñado exclusivamente para usuarios finales" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <HelpItem 
          title="Inicio rápido" 
          description="Guía para comenzar a usar OpticSave rápidamente"
          href="/docs/help-center/quick-start"
        />
        <HelpItem 
          title="Gestión de pacientes" 
          description="Aprende a gestionar la información de tus pacientes"
          href="/docs/help-center/patient-management"
        />
        <HelpItem 
          title="Diagnósticos y reportes" 
          description="Cómo crear y gestionar diagnósticos y reportes"
          href="/docs/help-center/reports"
        />
        <HelpItem 
          title="Notificaciones" 
          description="Configura y gestiona las notificaciones del sistema"
          href="/docs/help-center/notifications"
        />
        <HelpItem 
          title="Planes y facturación" 
          description="Información sobre planes, precios y facturación"
          href="/docs/help-center/billing"
        />
      </div>
    </div>
  );
}

function HelpItem({ title, description, href }: { title: string; description: string; href: string }) {
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