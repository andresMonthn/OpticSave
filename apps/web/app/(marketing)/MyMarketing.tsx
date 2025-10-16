'use client';

import PrismaticBurst from './componentes_animados/PrismaticBurst';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useEffect, useState, useRef, useCallback } from 'react';
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
  const [currentSlide, setCurrentSlide] = useState(0);

  // Total de imágenes en el carrusel
  const totalSlides = 7;

  // Funciones para controlar el carrusel
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  // Cambio automático de diapositivas
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Cambiar cada 5 segundos

    return () => clearInterval(interval);
  }, [nextSlide]);

  // Efecto para manejar el scroll con optimización de rendimiento
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollPosition(window.scrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    // Agregar event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

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
                  <Trans i18nKey="marketing:heroTitle">
                    <ShinyText text="marketing:heroTitle" speed={5} />
                  </Trans>
                </>
              }
              subtitle={
                <div className="relative">
                  <div className="">
                    <Trans i18nKey="marketing:heroSubtitle">
                      <ShinyText text="marketing:heroSubtitle" speed={5} />
                    </Trans>
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
                <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-primary/10">
                  {/* Carrusel de imágenes */}
                  <div className="relative w-full h-[500px]">
                    {[
                      "/images/Marketing/Captura de pantalla 2025-10-12 114242.png",
                      "/images/Marketing/Captura de pantalla 2025-10-12 114253.png",
                      "/images/Marketing/Captura de pantalla 2025-10-12 114305.png",
                      "/images/Marketing/Captura de pantalla 2025-10-12 114311.png",
                      "/images/Marketing/Captura de pantalla 2025-10-12 114324.png",
                      "/images/Marketing/Captura de pantalla 2025-10-12 114330.png",
                      "/images/Marketing/Captura de pantalla 2025-10-12 114356.png"
                    ].map((src, index) => (
                      <div
                        key={index}
                        className="absolute inset-0 transition-opacity duration-500 ease-in-out"
                        style={{
                          opacity: index === currentSlide ? 1 : 0,
                          zIndex: index === currentSlide ? 10 : 0
                        }}
                      >
                        <Image
                          priority={index === 0}
                          className="w-full h-full object-contain"
                          width={1200}
                          height={800}
                          src={src}
                          alt={`Captura de pantalla de la aplicación ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Controles del carrusel */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 z-20 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-800 dark:text-white" />
                  </button>

                  <button
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 z-20 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-800 dark:text-white" />
                  </button>

                  {/* Indicadores */}
                  <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center space-x-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-2 w-2 rounded-full transition-all ${index === currentSlide
                            ? 'bg-white w-4'
                            : 'bg-white/50 hover:bg-white/80'
                          }`}
                        aria-label={`Ir a la imagen ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
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
                    <span>Simples Soluciones</span>
                  </FeatureShowcaseIconContainer>
                }
              >
                {/* seccion de funcionalidades que contiene el app */}
                <FeatureGrid className="hover:-translate-y-1 transition-transform duration-300 ease-in-out">
                  <FeatureCard
                    className={'relative col-span-1 overflow-hidden hover:scale-105 transition-transform duration-300'}
                    label={'Interfaz de Usuario Intuitiva'}
                    description={`Diseño moderno y accesible que facilita la navegación y el uso diario, adaptado específicamente para profesionales de ópticas.`}
                  >
                  </FeatureCard>

                  <FeatureCard
                    className={'relative col-span-1 w-full overflow-hidden hover:scale-105 transition-transform duration-300'}
                    label={'Gestión de Agenda'}
                    description={`Sistema completo para administrar citas, recordatorios automáticos y seguimiento de pacientes, optimizando el flujo de trabajo diario.`}
                  ></FeatureCard>

                  <FeatureCard
                    className={'relative col-span-1 overflow-hidden hover:scale-105 transition-transform duration-300'}
                    label={'Levantamiento de Pedidos'}
                    description={`Proceso simplificado para crear, rastrear y gestionar pedidos de productos ópticos, desde la solicitud inicial hasta la entrega final.`}
                  />

                  <FeatureCard
                    className={'relative col-span-1 overflow-hidden md:col-span-2 hover:scale-105 transition-transform duration-300'}
                    label={'Seguridad para el Usuario'}
                    description={`Protección avanzada de datos personales y médicos, cumpliendo con normativas de privacidad y garantizando la confidencialidad de la información sensible.`}
                  />

                  <FeatureCard
                    className={'relative col-span-1 overflow-hidden hover:scale-105 transition-transform duration-300'}
                    label={'Reportes y Análisis'}
                    description={`Herramientas analíticas para visualizar tendencias de ventas, comportamiento de clientes y rendimiento del negocio.`}
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