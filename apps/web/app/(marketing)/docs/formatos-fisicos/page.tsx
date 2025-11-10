import { withI18n } from '~/lib/i18n/with-i18n';

async function FormatosFisicosPage() {
  return (
    <div className={'flex flex-1 flex-col overflow-y-auto py-5'}>
      <article className={'px-6'}>
        <section className={'flex flex-col gap-y-2.5'}>
          <h1 className={'text-foreground text-3xl font-semibold'}>
            Formatos físicos
          </h1>
          <p className={'text-muted-foreground text-lg'}>
            Plantillas imprimibles y lineamientos para documentación clínica.
          </p>
        </section>

        <div className={'prose max-w-none'}>
          <h2>Plantillas disponibles</h2>
          <ul className={'list-disc pl-6'}>
            <li>Historia clínica oftalmológica.</li>
            <li>Consentimiento informado.</li>
            <li>Orden/Receta de lentes.</li>
            <li>Resumen de atención para el paciente.</li>
          </ul>

          <h2>Personalización</h2>
          <p>
            Agrega el logotipo de tu clínica y datos de contacto. Puedes
            adaptar campos según las necesidades operativas manteniendo el
            cumplimiento normativo.
          </p>

          <h2>Impresión y formato</h2>
          <ul className={'list-disc pl-6'}>
            <li>Tamaño recomendado: A4 o carta, márgenes de 2 cm.</li>
            <li>Tipografías legibles y contraste adecuado.</li>
            <li>Firma y sello cuando aplique.</li>
          </ul>

          <h2>Uso y archivo</h2>
          <p>
            Imprime para uso presencial y digitaliza para archivar en OpticSave
            cuando requieras correlación con el expediente electrónico.
          </p>
        </div>
      </article>
    </div>
  );
}

export default withI18n(FormatosFisicosPage);