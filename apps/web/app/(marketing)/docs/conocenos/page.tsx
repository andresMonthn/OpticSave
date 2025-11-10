
import { Separator } from '@kit/ui/separator';
import { withI18n } from '~/lib/i18n/with-i18n';
async function ConocenosPage() {
  return (
    <div className={'flex flex-col py-5'}>
      <article className={'px-6'}>
        <section className={'flex flex-col gap-y-2.5'}>
          <h1 className={'text-foreground text-3xl font-semibold'}>Conócenos</h1>
          <p className={'text-muted-foreground text-lg'}>
            OpticSave es el primer producto de <strong>Atomlogic</strong> su principal mision es llevar la 
            optimización de recursos optica a un nivel superior atravez de automatizacion y llevarla mas alla de un simple CRUD
          </p>
          <Separator className={'my-4'} />
          <p className={'text-muted-foreground text-lg'}>
            Nuestro producto se enfoca en automatizar procesos manuales, mejorar la eficiencia y reducir costos operativos en entornos empresariales, darle una solucion integral a clinicas optomitrista grandes y medianas. que el usuario contenga la informacion de sus pacientes segura y al alcance de sus manos en cualquier momento que lo nesesite, gestionar las citas en tiempo real, y acelerar los procesos.
          </p>
        </section>
      </article>
    </div>
  );
}

export default withI18n(ConocenosPage);