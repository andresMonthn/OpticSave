import { withI18n } from '~/lib/i18n/with-i18n';
import { Separator } from '@kit/ui/separator';
import { CheckCircle } from 'lucide-react';
import CsvImportAnimation from './_components/csv-import-animation';

function BrowserIcons() {
  return (
    <div className={'mt-2 flex items-center gap-3'}>
      <img
        src={'https://cdn.simpleicons.org/googlechrome'}
        alt={'Google Chrome'}
        width={20}
        height={20}
        className={'h-5 w-5'}
        loading={'lazy'}
      />
      <img
        src={'https://cdn.simpleicons.org/firefoxbrowser'}
        alt={'Mozilla Firefox'}
        width={20}
        height={20}
        className={'h-5 w-5'}
        loading={'lazy'}
      />
      <img
        src={'https://cdn.simpleicons.org/safari'}
        alt={'Apple Safari'}
        width={20}
        height={20}
        className={'h-5 w-5'}
        loading={'lazy'}
      />
    </div>
  );
}

async function IniciandoAppPage() {
  return (
    <div className={'flex flex-1 flex-col py-5'}>
      <article className={'px-6'}>
        <section className={'flex flex-col gap-y-2.5'}>
          <h1 className={'text-foreground text-3xl font-semibold'}>
            Iniciando en la app
          </h1>
          <p className={'text-muted-foreground text-lg pt-2'}>
            Guía de primeros pasos para poner en marcha OpticSave en tu clínica.
          </p>
        </section>

        <div className={'prose max-w-none'}>
          <h2 id={'requisitos-previos'} className={'scroll-mt-24'}>Requisitos previos</h2>
          <ul className={'list-none space-y-2 pl-0'}>
            <li className={'flex items-start gap-2 mt-6'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>debes de tener una Cuenta registrada y verificada.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Licencia activa o en modo prueba por 30 dias* </span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600'} />
              <span>
                Navegador actualizado y conexión estable se recomendacion minima de 10mb de datos. se recomienda usar
                Chrome, Firefox o Safari, opera en sus versiones mas estables. (disponibilidad de regiones)
              </span>
            </li>
            <div className={'flex items-center w-full gap-2'}>
                <BrowserIcons />
              </div>
          </ul>
          <Separator className={'my-6'} />

          <h2 id={'crear-y-verificar-tu-cuenta'} className={'scroll-mt-24'}>Crear y verificar tu cuenta</h2>
          <ol className={'list-decimal pl-6 space-y-1 mt-6'}>
            <li>Regístrate con tu correo valido (o bien puedes ingresar apartir de una cuenta google (mas seguro) tu cuenta no estara mas segura</li>
            <li>Verifica el correo y completa tus datos. JWT mapeado a tu cuenta.</li>
          </ol>
          <Separator className={'my-6'} />

          <h2 id={'asistente-de-configuracion-inicial'} className={'scroll-mt-24'}>Asistente de configuración inicial</h2>
          <ul className={'list-none space-y-2 pl-0 mt-6'}>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Datos de la clínica: nombre, dirección y contacto. al momento de comenzar OpticSave te pedira un pequeño registro del negocio para el formato de cotizaciones imprimibles</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Horarios y agenda: configuración de turnos.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600'} />
              <span>Equipo: perfiles del personal y permisos.</span>
            </li>
          </ul>
          <Separator className={'my-6'} />

          <h2 id={'importar-pacientes'} className={'scroll-mt-24'}>Importar pacientes</h2>
          <p>
            si alguna vez llevastes registros en hojas de calculo como excel o google sheets puedes importarlos facilmente en OpticSave.
            Puedes cargar pacientes manualmente o importar desde un archivo CSV
            con los campos estándar de OpticSave.
          </p>
          <CsvImportAnimation />
          <p>
          registro online de pacientes, comodidad para ti y tus pacientes
          </p>
          <Separator className={'my-6'} />

          <h2 id={'navegacion-basica'} className={'scroll-mt-24'}>Navegación</h2>
          <ul className={'list-none space-y-2 pl-0'}>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Panel principal que muestra el estado general de los pacientes y acceso rápido a las diferentes secciones mediante el sidebar de navegación..</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Módulo para búsqueda, consulta de historiales clínicos y automatización del registro y seguimiento de pacientes..</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Herramienta para la creación y gestión de citas, asegurando una administración eficiente de los turnos y evitando pérdidas de agenda. (nunca más perderás un turno).</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Sección que concentra los historiales clínicos de los pacientes atendidos, facilitando la consulta y análisis de información médica.</span>
            </li>
             <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Espacio dedicado al levantamiento y gestión de cotizaciones para el armado de lentes, optimizando el proceso de venta y atención personalizada.</span>
            </li>
          </ul>
          <Separator className={'my-6'} />

          <h2 id={'seguridad-y-privacidad'} className={'scroll-mt-24'}>Seguridad y privacidad</h2>
          <p>
            Configura roles y permisos, habilita la verificación en dos pasos y
            respeta las políticas de protección de datos de tu país.
          </p>
          <Separator className={'my-6'} />
        </div>
      </article>
    </div>
  );
}

export default withI18n(IniciandoAppPage);