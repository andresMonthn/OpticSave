'use client';

import PrismaticBurst from './componentes_animados/PrismaticBurst';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, LayoutDashboard } from 'lucide-react';
import { PricingTable } from '@kit/billing-gateway/marketing';
import {
  CtaButton,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  Hero,
  Pill,
  PillActionButton,
  SecondaryHero,
} from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';
import billingConfig from '~/config/billing.config';
import pathsConfig from '~/config/paths.config';
import { useEffect, useState, useRef } from 'react';
import ShinyText from './componentes_animados/ShinyText';

function MainCallToActionButton() {
  return (
    <div className={'flex space-x-4'}>
      <CtaButton>
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center space-x-0.5'}>
            <span>
              <Trans i18nKey={'common:getStarted'} />
            </span>

            <ArrowRightIcon
              className={
                'animate-in fade-in slide-in-from-left-8 h-4' +
                ' zoom-in fill-mode-both delay-1000 duration-2000'
              }
            />
          </span>
        </Link>
      </CtaButton>

      <CtaButton variant={'link'}>
        <Link href={'/contact'}>
          <Trans i18nKey={'common:contactUs'} />
        </Link>
      </CtaButton>
    </div>
  );
}

export function MyMarketing() {
  // Referencias para los elementos
  const logoRef = useRef(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Efecto para manejar el scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    // Agregar event listener
    window.addEventListener('scroll', handleScroll);

    // Limpiar event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div className="flex flex-col relative z-10 bg-transparent">
        <PrismaticBurst
          intensity={23}
          speed={2}
          distort={2}
          rayCount={0}
          animationType={'rotate3d'}
          hoverDampness={2}
          offset={{ x: 0, y: 0 }}
          fullScreen={true}
          zIndex={0}
          opacity={0.19}
          mixBlendMode={'none'}
        />


        {/* Contenedor de la imagen */}
        <div className="w-full flex items-center justify-center">
          <div
            ref={logoRef}
            className="cursor-pointer"
          >
            <Image
              src="/images/Marketing/OpticSave.png"
              alt="OptiSave Logo"
              width={200}
              height={200}
              priority
              className="w-auto h-auto"
            />
          </div>
        </div>



        {/* Resto del contenido original */}
        <div className={'mt-4 flex flex-col space-y-24 py-14'}>

          <div className={'container mx-auto'} ref={heroRef}>
            <Hero
              pill={
                <Pill label={'New'}>
                  <ShinyText text="Registrate para comenzar" speed={5} />
                  <PillActionButton asChild>
                    <Link href={'/auth/sign-up'}>
                      <ArrowRightIcon className={'h-4 w-4'} />
                    </Link>
                  </PillActionButton>
                </Pill>
              }
              title={
                <>
                  <ShinyText text="OpticSave" speed={5} />
                  <ShinyText text="gestor de opticas" speed={5} />
                </>
              }
              subtitle={
                <div className="relative">
                  <div className="">
                    <ShinyText
                      text="La web es una plataforma integral para la gestión de ópticas, diseñada para optimizar la administración de clientes, citas, inventario y ventas. Su objetivo es facilitar el trabajo diario del personal de la óptica y mejorar la experiencia de los pacientes."
                      speed={5}
                    />
                  </div>
                  {/* Espacio reservado para la imagen que se posicionará junto al texto */}
                  <div className="absolute left-0 top-0 w-12 md:w-20 opacity-0" style={{
                    opacity: scrollPosition > 100 ? 1 : 0,
                    transition: 'opacity 0.5s ease-in-out'
                  }}></div>
                </div>
              }
              cta={<MainCallToActionButton />}
              image={
                <Image
                  priority
                  className={
                    'dark:border-primary/10 rounded-xl border border-gray-200'
                  }
                  width={3558}
                  height={2222}
                  src={`/images/dashboard.webp`}
                  alt={`App Image`}
                />
              }
            />
          </div>
          <div className={'container mx-auto'}>
            <div className={'flex flex-col space-y-16 xl:space-y-32 2xl:space-y-36'}>
              <FeatureShowcase
                heading={
                  <>
                    <b className="font-medium tracking-tighter dark:text-white">
                      <ShinyText text="Esta web es una herramienta todo-en-uno para la gestión de ópticas," speed={5} />
                    </b>
                    .{' '}
                    <span className="text-muted-foreground font-normal tracking-tighter">
                      <ShinyText text="que permite a los administradores, ópticos y personal de ventas optimizar procesos, reducir errores y brindar un mejor servicio a los pacientes. Su interfaz moderna y segura facilita la administración diaria de manera eficiente." speed={5} />
                    </span>
                  </>
                }
                icon={
                  <FeatureShowcaseIconContainer>
                    <LayoutDashboard className="h-5" />
                    <span>Simple Soluciones</span>
                  </FeatureShowcaseIconContainer>
                }
              >
                {/* seccion de funcionalidades que contiene el app */}
                <FeatureGrid>
                  <FeatureCard
                    className={'relative col-span-1 overflow-hidden'}
                    label={'Beautiful Dashboard'}
                    description={`Makerkit provides a beautiful dashboard to manage your SaaS business.`}
                  ></FeatureCard>

                  <FeatureCard
                    className={'relative col-span-1 w-full overflow-hidden'}
                    label={'Authentication'}
                    description={`Makerkit provides a variety of providers to allow your users to sign in.`}
                  ></FeatureCard>

                  <FeatureCard
                    className={'relative col-span-1 overflow-hidden'}
                    label={'Multi Tenancy'}
                    description={`Multi tenant memberships for your SaaS business.`}
                  />

                  <FeatureCard
                    className={'relative col-span-1 overflow-hidden md:col-span-2'}
                    label={'Billing'}
                    description={`Makerkit supports multiple payment gateways to charge your customers.`}
                  />

                  <FeatureCard
                    className={'relative col-span-1 overflow-hidden'}
                    label={'Plugins'}
                    description={`Extend your SaaS with plugins that you can install using the CLI.`}
                  />
                </FeatureGrid>
              </FeatureShowcase>
            </div>
          </div>

          <div className={'container mx-auto'}>
            <div
              className={
                'flex flex-col items-center justify-center space-y-16 py-16'
              }
            >
              <SecondaryHero
                pill={<Pill label="Inicia"><ShinyText text="No nesesitas tarjeta de credito" speed={5} /></Pill>}
                heading={<ShinyText text="Mejor precio" speed={5} />}
                subheading={<ShinyText text="inicia un mes gratis" speed={5} />}
              />

              <div className={'w-full max-w-4xl'}>
                <PricingTable
                  config={billingConfig}
                  paths={{
                    signUp: pathsConfig.auth.signUp,
                    return: pathsConfig.app.home,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}