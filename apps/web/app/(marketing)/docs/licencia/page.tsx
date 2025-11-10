import { withI18n } from '~/lib/i18n/with-i18n';
import { Separator } from '@kit/ui/separator';
import { CheckCircle } from 'lucide-react';

async function LicenciaPage() {
  return (
    <div className={'flex flex-col py-5'}>
      <article className={'px-6'}>
        <section className={'flex flex-col gap-y-2.5'}>
          <h1 className={'text-foreground text-3xl font-semibold'}>
            Obtención de licencia
          </h1>
          <p className={'text-muted-foreground text-lg'}>
            Guía estructurada para <strong>adquirir</strong>, <strong>activar</strong>, <strong>renovar</strong> y <strong>administrar</strong> tu licencia.
          </p>
        </section>

        <div className={'prose max-w-none'}>
          <h2 id={'resumen'} className={'scroll-mt-24'}>Resumen y alcance</h2>
          <p>
            Esta guía cubre la <strong>selección de plan</strong>, el proceso de <strong>compra</strong>, la <strong>activación por dispositivo</strong>, la <strong>administración continua</strong> y la <strong>resolución de incidencias</strong>.
          </p>
          <Separator className={'my-6'} />

          <h2 id={'requisitos'} className={'scroll-mt-24'}>Checklist de requisitos</h2>
          <ul className={'list-none space-y-2 pl-0'}>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span><strong>Cuenta verificada</strong> en OpticSave.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span><strong>Datos de facturación</strong> completos y actualizados.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span><strong>Método de pago</strong> habilitado.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span><strong>Conexión estable</strong> y navegador actualizado.</span>
            </li>
          </ul>
          <Separator className={'my-6'} />

          <h2 id={'seleccionar-plan'} className={'scroll-mt-24'}>Seleccionar plan</h2>
          <h3 className={'mt-2'}>Criterios de elección</h3>
          <ul className={'list-none space-y-2 pl-0'}>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Evalúa el <strong>volumen de pacientes</strong> y <strong>tamaño del equipo</strong>.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Define el <strong>ciclo de facturación</strong> (<em>mensual</em> o <em>anual</em>).</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Revisa <strong>límites</strong> y <strong>características</strong> incluidas en cada plan.</span>
            </li>
          </ul>
          <Separator className={'my-6'} />

          <h2 id={'compra-activacion'} className={'scroll-mt-24'}>Compra y activación</h2>
          <h3 className={'mt-2'}>Pasos</h3>
          <ol className={'list-decimal pl-6 space-y-1'}>
            <li>Ingresa a <strong>Licencias</strong> desde tu cuenta.</li>
            <li>Selecciona el <strong>plan</strong> y confirma <strong>datos de facturación</strong>.</li>
            <li>Realiza el <strong>pago</strong> y guarda el <strong>comprobante</strong>.</li>
            <li>Activación automática: asigna la licencia al <strong>dispositivo</strong> en <strong>Configuración</strong>.</li>
          </ol>
          <Separator className={'my-6'} />

          <h2 id={'administracion'} className={'scroll-mt-24'}>Administración continua</h2>
          <h3 className={'mt-2'}>Tareas habituales</h3>
          <ul className={'list-none space-y-2 pl-0'}>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Consultar <strong>estado</strong> y <strong>fecha de expiración</strong> en la app.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Cambiar <strong>plan</strong> o <strong>ciclo</strong> según necesidades.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Transferir la licencia entre <strong>dispositivos</strong> cuando sea necesario.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span>Actualizar <strong>método de pago</strong> y <strong>datos de facturación</strong>.</span>
            </li>
          </ul>
          <Separator className={'my-6'} />

          <h2 id={'renovacion'} className={'scroll-mt-24'}>Renovación y recordatorios</h2>
          <p>
            La renovación ocurre al final del ciclo. Enviamos <strong>recordatorios previos</strong> y puedes <strong>modificar método de pago</strong> o <strong>plan</strong> en cualquier momento.
          </p>
          <Separator className={'my-6'} />

          <h2 id={'incidencias'} className={'scroll-mt-24'}>Resolución de incidencias</h2>
          <h3 className={'mt-2'}>Casos comunes</h3>
          <ul className={'list-none space-y-2 pl-0'}>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span><strong>Activación fallida</strong>: revisa conexión y vuelve a intentar.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span><strong>Pago rechazado</strong>: verifica la tarjeta o cambia método.</span>
            </li>
            <li className={'flex items-start gap-2'}>
              <CheckCircle className={'size-4 text-green-600 mt-[2px]'} />
              <span><strong>Dispositivo no reconocido</strong>: reasigna desde <strong>Configuración</strong>.</span>
            </li>
          </ul>
          <Separator className={'my-6'} />

          <h2 id={'faq'} className={'scroll-mt-24'}>FAQ de licencia</h2>
          <h3>¿Puedo cambiar de plan en cualquier momento?</h3>
          <p>
            Sí, puedes <strong>escalar</strong> o <strong>reducir</strong> tu plan y el ajuste se prorratea según tu ciclo actual.
          </p>
          <h3>¿Cómo transfiero mi licencia a otro equipo?</h3>
          <p>
            Desde <strong>Configuración &gt; Licencia</strong>, libera el dispositivo actual y asigna la licencia al nuevo equipo.
          </p>
          <h3>¿Qué ocurre si no se procesa la renovación?</h3>
          <p>
            Te notificamos y mantenemos un <strong>período de gracia</strong> corto para que actualices el método de pago sin perder acceso.
          </p>
        </div>
      </article>
    </div>
  );
}

export default withI18n(LicenciaPage);