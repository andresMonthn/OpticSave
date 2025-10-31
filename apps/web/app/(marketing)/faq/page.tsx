import Link from 'next/link';

import { ArrowRight, ChevronDown } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:faq'),
  };
};

async function FAQPage() {
  const { t } = await createI18nServerInstance();

  // Preguntas frecuentes relacionadas con OpticSave
  const faqItems = [
    {
      question: t('marketing:faq.general.trial', '¿Ofrecen una prueba gratuita de OpticSave?'),
      answer: t('marketing:faq.general.trialAnswer', 'Sí, ofrecemos una prueba gratuita de 14 días de OpticSave. Puedes cancelar en cualquier momento durante el período de prueba y no se te cobrará.'),
    },
    {
      question: t('marketing:faq.general.cancel', '¿Puedo cancelar mi suscripción a OpticSave?'),
      answer: t('marketing:faq.general.cancelAnswer', 'Puedes cancelar tu suscripción en cualquier momento. Puedes hacerlo desde la configuración de tu cuenta en https://opticsave.vercel.app/account/billing.'),
    },
    {
      question: t('marketing:faq.general.invoices', '¿Dónde puedo encontrar mis facturas de OpticSave?'),
      answer: t('marketing:faq.general.invoicesAnswer', 'Puedes encontrar tus facturas en la configuración de tu cuenta en https://opticsave.vercel.app/account/billing/invoices.'),
    },
    {
      question: t('marketing:faq.general.payment', '¿Qué métodos de pago acepta OpticSave?'),
      answer: t('marketing:faq.general.paymentAnswer', 'Aceptamos todas las tarjetas de crédito principales y PayPal. Puedes gestionar tus métodos de pago en https://opticsave.vercel.app/account/billing/payment-methods.'),
    },
    {
      question: t('marketing:faq.general.upgrade', '¿Puedo actualizar o degradar mi plan de OpticSave?'),
      answer: t('marketing:faq.general.upgradeAnswer', 'Sí, puedes actualizar o degradar tu plan en cualquier momento. Puedes hacerlo desde la configuración de tu cuenta en https://opticsave.vercel.app/account/billing.'),
    },
    {
      question: t('marketing:faq.general.nonprofit', '¿OpticSave ofrece descuentos para clínicas oftalmológicas sin fines de lucro?'),
      answer: t('marketing:faq.general.nonprofitAnswer', 'Sí, ofrecemos un descuento del 50% para organizaciones sin fines de lucro. Por favor, contáctanos para obtener más información en https://opticsave.vercel.app/contact.'),
    },
    {
      question: t('marketing:faq.technical.dataExport', '¿Cómo puedo exportar los datos de mis pacientes en OpticSave?'),
      answer: t('marketing:faq.technical.dataExportAnswer', 'Puedes exportar los datos de tus pacientes desde el panel de control en https://opticsave.vercel.app/home/dashboard/export. Ofrecemos formatos CSV y PDF para la exportación de datos.'),
    },
    {
      question: t('marketing:faq.technical.security', '¿Cómo protege OpticSave los datos de mis pacientes?'),
      answer: t('marketing:faq.technical.securityAnswer', 'OpticSave utiliza cifrado de extremo a extremo y sigue las mejores prácticas de seguridad para proteger los datos de tus pacientes. Cumplimos con todas las regulaciones de protección de datos aplicables. Puedes leer más sobre nuestra política de seguridad en https://opticsave.vercel.app/security.'),
    },
    {
      question: t('marketing:faq.features.appointments', '¿Cómo gestiono las citas de mis pacientes en OpticSave?'),
      answer: t('marketing:faq.features.appointmentsAnswer', 'OpticSave te permite gestionar fácilmente las citas de tus pacientes. Puedes crear, editar y cancelar citas desde el calendario en https://opticsave.vercel.app/home/appointments. También puedes configurar recordatorios automáticos para tus pacientes.'),
    },
    {
      question: t('marketing:faq.features.prescriptions', '¿Puedo generar recetas y prescripciones en OpticSave?'),
      answer: t('marketing:faq.features.prescriptionsAnswer', 'Sí, OpticSave te permite generar recetas y prescripciones digitales para tus pacientes. Puedes crear, editar y enviar prescripciones desde https://opticsave.vercel.app/home/prescriptions.'),
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => {
      return {
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      };
    }),
  };

  return (
    <>
      <script
        key={'ld:json'}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className={'flex flex-col space-y-4 xl:space-y-8'}>
        <SitePageHeader
          title={t('marketing:faq')}
          subtitle={t('marketing:faqSubtitle')}
        />

        <div className={'container flex flex-col space-y-8 pb-16'}>
          <div className="flex w-full max-w-xl flex-col">
            {faqItems.map((item, index) => {
              return <FaqItem key={index} item={item} />;
            })}
          </div>

          <div>
            <Button asChild variant={'outline'}>
              <Link href={'/contact'}>
                <span>
                  <Trans i18nKey={'marketing:contactFaq'} />
                </span>

                <ArrowRight className={'ml-2 w-4'} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default withI18n(FAQPage);

function FaqItem({
  item,
}: React.PropsWithChildren<{
  item: {
    question: string;
    answer: string;
  };
}>) {
  return (
    <details className={'group border-b px-2 py-4 last:border-b-transparent'}>
      <summary
        className={
          'flex items-center justify-between hover:cursor-pointer hover:underline'
        }
      >
        <h2
          className={
            'hover:underline-none cursor-pointer font-sans font-medium'
          }
        >
          <Trans i18nKey={item.question} defaults={item.question} />
        </h2>

        <div>
          <ChevronDown
            className={'h-5 transition duration-300 group-open:-rotate-180'}
          />
        </div>
      </summary>

      <div className={'text-muted-foreground flex flex-col gap-y-3 py-1'}>
        <Trans i18nKey={item.answer} defaults={item.answer} />
      </div>
    </details>
  );
}
