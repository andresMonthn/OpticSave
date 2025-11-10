import { withI18n } from '~/lib/i18n/with-i18n';

async function ConociendoAIPage() {
  return (
    <div className={'flex flex-col py-5'}>
      <article className={'px-6'}>
        <section className={'flex flex-col gap-y-2.5'}>
          <h1 className={'text-foreground text-3xl font-semibold'}>
            Conociendo AI OpticSave
          </h1>
          <p className={'text-muted-foreground text-lg'}>
            Características y capacidades de la IA de OpticSave.
          </p>
        </section>

        <div className={'prose max-w-none'}>
          <ul>
            <li>
             OptiAi incluye chatbot ayuda las 24 hrs (preguntale tus dudas sobre la app)
            </li>
            <li>
              Navega sobre la aplicacion y descubre todas sus funcionalidades
            </li>
            <li>
              OpticAi busqueda de pacientes y visualizacion de historial
            </li>
            <li>
              OptiAi automatiza tus registro de pacientes en un solo promt
            </li>
          </ul>
        </div>
      </article>
    </div>
  );
}

export default withI18n(ConociendoAIPage);