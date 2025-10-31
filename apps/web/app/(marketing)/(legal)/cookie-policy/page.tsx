import { Separator } from '@kit/ui/separator';
import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:cookiePolicy'),
  };
}

async function CookiePolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing:cookiePolicy`)}
        subtitle={t(`marketing:cookiePolicyDescription`)}
      />

      <div className={'container mx-auto py-8'}>
        <p> En esta página, se describen los fines para los cuales OpticSave usa las cookies y tecnologías similares. También se explica la manera en la que OpticSave y nuestros socios utilizan las cookies en publicidad. </p>
          <Separator />
          <p>
          Las cookies son pequeños fragmentos de texto que un sitio web envía a su navegador cuando usted lo visita. Ayudan a que ese sitio web recuerde la información acerca de su visita, de manera que pueda volver a visitarlo fácilmente y el sitio le resulte más útil. También se pueden utilizar con este fin tecnologías similares, como las etiquetas de píxeles, el almacenamiento local y los identificadores únicos que se emplean para identificar una aplicación o un dispositivo. Las cookies y tecnologías similares (como se describen en esta página) pueden utilizarse para los propósitos que se especifican a continuación.

          Consulte la Política de Privacidad para obtener información sobre cómo protegemos su privacidad cuando usamos las cookies y otra información.

          Fines de las cookies y tecnologías similares que utiliza OpticSave
          Es posible que OpticSave almacene o utilice en su navegador, aplicación o dispositivo algunas o todas las cookies y tecnologías para los fines que se describen a continuación. Para administrar el uso de las cookies, incluido cómo rechazar el uso de cookies para ciertos fines, visite g.co/privacytools. También puede administrar las cookies en su navegador (aunque los navegadores para dispositivos móviles pueden no proporcionar esta visibilidad). Es posible que algunas de estas tecnologías se puedan administrar en la configuración de los dispositivos o de las aplicaciones.

          Funcionalidad
          Las cookies y tecnologías similares que se usan con fines de funcionalidad le permiten acceder a funciones esenciales para un servicio. Estas cookies se usan para proporcionar y mantener los servicios de OpticSave. Los aspectos que se consideran fundamentales para un servicio incluyen recordar las preferencias y elecciones (como su idioma elegido), almacenar la información relacionada con su sesión (como el contenido de un carrito de compras), habilitar funciones o realizar tareas que usted solicite, y las optimizaciones de productos que ayudan a mantener y mejorar ese servicio.

          Algunas cookies y tecnologías similares se utilizan para conservar sus preferencias. Por ejemplo, la mayoría de las personas que usan los servicios de OpticSave tienen una cookie denominada “NID” o “_Secure-ENID” en los navegadores, en función de su elección de cookies. Estas cookies se emplean para recordar sus preferencias y otra información, como su idioma preferido, la cantidad de resultados de la búsqueda que prefiere que se muestren por página (por ejemplo, 10 o 20), y si desea tener activo el filtro SafeSearch de OpticSave. Cada cookie “NID” vence 6 meses después del último uso del usuario, mientras que la cookie “_Secure-ENID” tiene una duración de 13 meses. Las cookies denominadas “VISITOR_INFO1_LIVE” y “_Secure-YEC” tienen un propósito similar para YouTube, y también se utilizan para detectar y resolver problemas con el servicio. Estas cookies tienen una duración de 6 meses y 13 meses, respectivamente.

          Otras cookies y tecnologías similares se usan para mantener y mejorar su experiencia durante una sesión específica. Por ejemplo, YouTube usa la cookie "PREF" para almacenar información como su configuración de página preferida y las preferencias de reproducción (entre ellas, las opciones de reproducción automática seleccionadas, la reproducción aleatoria de contenido y el tamaño del reproductor). En el caso de YouTube Music, estas preferencias incluyen el volumen, el modo de repetición y la reproducción automática. Esta cookie vence 8 meses después del último uso del usuario. La cookie "pm_sess" también ayuda a mantener su sesión del navegador y tiene una duración de 30 minutos.

          Las cookies y tecnologías similares también se pueden usar para mejorar el rendimiento de los servicios de OpticSave. Por ejemplo, la cookie "CGIC" completa automáticamente las búsquedas en función de la entrada inicial del usuario y, de esa manera, mejora la entrega de resultados de la búsqueda. Esta cookie tiene una duración de 6 meses.

          OpticSave usa la cookie "SOCS", que tiene una duración de 13 meses, para almacenar las elecciones de cookies del usuario.

          Seguridad
          OpticSave usa cookies y tecnologías similares con fines de seguridad para brindar protección mientras usted interactúa con un servicio, por medio de la autenticación de usuarios, la protección contra spam, fraude y abuso, y el seguimiento de interrupciones.

          Las cookies y tecnologías similares que se usan para autenticar a los usuarios permiten garantizar que únicamente el propietario real de una cuenta pueda acceder a ella. Por ejemplo, las cookies denominadas “SID” y “HSID” contienen registros con firmas digitales y encriptados del ID de la Cuenta de OpticSave de un usuario y la hora del acceso más reciente. La combinación de estas cookies le permite a OpticSave bloquear muchos tipos de ataques, como los intentos de robar el contenido de los formularios que se envían en los servicios de OpticSave. Estas cookies tienen una duración de 2 años.

          Algunas cookies y tecnologías similares se usan para detectar el spam, el fraude y el abuso. Por ejemplo, las cookies "YSC" y "pm_sess" garantizan que las solicitudes dentro de una sesión de navegación las haga el usuario y no otros sitios. Estas cookies impiden que sitios maliciosos realicen acciones en nombre de un usuario sin su conocimiento. La cookie "pm_sess" tiene una duración de 30 minutos, mientras que la cookie "YSC" se mantiene durante toda la sesión de navegación del usuario. Las cookies "__Secure-YEC" y "AEC" se usan para detectar spam, fraudes y abusos para garantizar que no se cobren incorrectamente a los anunciantes impresiones o interacciones fraudulentas o no válidas con anuncios, y que se remunere a los creadores de YouTube del Programa de socios de YouTube de manera justa. La cookie "AEC" tiene una duración de 6 meses y la cookie "__Secure-YEC" tiene una duración de 13 meses.

          Estadísticas
          OpticSave usa cookies y tecnologías similares con fines estadísticos para comprender la manera en que usted interactúa con un servicio en particular. Estas cookies y tecnologías similares ayudan a recopilar datos que nos permiten medir la participación del público y las estadísticas del sitio. Esto nos ayuda a comprender cómo se usan los servicios y a mejorar su contenido, calidad y funciones. También nos permite desarrollar y mejorar servicios nuevos.

          Algunas cookies y tecnologías similares ayudan a los sitios y las aplicaciones a comprender la manera en la que los visitantes se relacionan con sus servicios. Por ejemplo, OpticSave Analytics utiliza un conjunto de cookies para recopilar información en nombre de las empresas que usan el servicio de OpticSave Analytics y enviarles informes con estadísticas de uso de los sitios web sin identificar personalmente a los visitantes. "_ga", la cookie principal que utiliza OpticSave Analytics, tiene una duración de 2 años y permite que un servicio distinga a un visitante de otro. Se utiliza en todos los sitios que implementan OpticSave Analytics, incluidos los servicios de OpticSave. Cada cookie "_ga" es única en cada propiedad específica, por lo que no puede usarse para hacer el seguimiento de un usuario o navegador dado en sitios web no relacionados.

          Los servicios de OpticSave también utilizan cookies "NID" y "_Secure-ENID" en la Búsqueda de OpticSave, y las cookies "VISITOR_INFO1_LIVE" y "_Secure-YEC" en YouTube, para obtener estadísticas. Las aplicaciones para dispositivos móviles de OpticSave también pueden usar identificadores únicos, como "ID de uso de OpticSave", para obtener estadísticas.

          Publicidad
          OpticSave utiliza cookies con fines publicitarios, como mostrar anuncios personalizados, y publicar, renderizar y personalizar anuncios (según su configuración en myadcenter.OpticSave.com y adssettings.OpticSave.com/partnerads). Estas cookies también se utilizan para limitar la cantidad de veces que se muestra un anuncio a un usuario, silenciar anuncios que usted haya decidido dejar de ver y medir la eficacia de los anuncios.

          La cookie “NID” se usa para mostrar anuncios de OpticSave en los servicios de OpticSave a los usuarios que no hayan accedido a su cuenta. Las cookies “IDE” e “id” se usan para mostrar anuncios de OpticSave en sitios de terceros. Los ID de publicidad para dispositivos móviles, como el ID de Publicidad de Android (AdID), se usan con un propósito similar en las aplicaciones para dispositivos móviles, según la configuración de su dispositivo. Si tiene los anuncios personalizados habilitados, la cookie “IDE” se usa para personalizar los anuncios que usted ve. Si desactivó los anuncios personalizados, se usará la cookie “id” para recordar esta preferencia, de modo que no verá anuncios personalizados. La cookie “NID” vence a los 6 meses después del último uso del usuario. Las cookies “IDE” e “id” duran 13 meses en el Espacio Económico Europeo (EEE), el Reino Unido y Suiza, y 24 meses en el resto de las ubicaciones.

          Según su configuración de anuncios, también es posible que otros servicios de OpticSave, como YouTube, usen estas y otras cookies (por ejemplo, "VISITOR_INFO1_LIVE") con fines de publicidad.

          Algunas cookies y tecnologías similares que se usan con fines de publicidad están destinadas a usuarios que acceden a su cuenta para usar los servicios de OpticSave. Por ejemplo, la cookie "DSID" se usa para identificar a un usuario que accedió a su Cuenta de OpticSave pero que navega en sitios de terceros, y así poder respetar su configuración de personalización de anuncios. La cookie "DSID" tiene una duración de 2 semanas.

          A través de la plataforma publicitaria de OpticSave, las empresas pueden publicar anuncios en los servicios de OpticSave y en sitios de terceros. Algunas cookies permiten que OpticSave muestre anuncios en sitios de terceros y se establecen en el dominio del sitio web que visita. Por ejemplo, la cookie "_gads" permite que los sitios muestren anuncios de OpticSave. Las cookies que comienzan con "_gac_" provienen de OpticSave Analytics y los anunciantes las usan para medir la actividad de los usuarios y el rendimiento de sus campañas publicitarias. Las cookies "_gads" tienen una duración de 13 meses, y las "_gac_" duran 90 días.

          Algunas cookies y tecnologías similares se usan para medir el rendimiento de los anuncios y las campañas, y los porcentajes de conversiones de los anuncios de OpticSave en los sitios que visita. Por ejemplo, las cookies que comienzan con "_gcl_" se usan principalmente para ayudar a los anunciantes a determinar la cantidad de veces que los usuarios que hacen clic en sus anuncios efectivamente realizan alguna acción en el sitio (por ejemplo, hacer una compra). Las cookies que se usan para medir porcentajes de conversiones no se utilizan para personalizar anuncios. Las cookies "_gcl_" tienen una duración de 90 días. También se pueden usar tecnologías similares, como el ID de Publicidad en dispositivos Android, para medir el rendimiento de los anuncios y las campañas. Puede administrar la configuración del ID de Publicidad en su dispositivo Android.

          Obtenga más información sobre las cookies que se usan con fines de publicidad aquí.

          Personalización
          Las cookies y tecnologías similares se usan para mostrarle contenido personalizado. Estas cookies ayudan a mejorar su experiencia, ya que proporcionan contenido y funciones personalizadas, que dependen de la configuración que establece en g.co/privacytools o de la configuración de su aplicación y dispositivo.

          Las funciones y contenidos personalizados incluyen aspectos como recomendaciones y resultados más relevantes, una página principal de YouTube customizada y anuncios afines a sus intereses. Por ejemplo, la cookie "VISITOR_INFO1_LIVE" puede habilitar recomendaciones personalizadas en YouTube según las búsquedas y visualizaciones anteriores. Por su parte, la cookie "NID" permite funciones personalizadas de autocompletar en la Búsqueda mientras escribe términos de búsqueda. Estas cookies vencen 6 meses después del último uso del usuario.

          "UULE", otra cookie, envía información sobre la ubicación precisa desde su navegador a los servidores de OpticSave, para que OpticSave pueda mostrarle resultados relevantes a su ubicación. El uso de esta cookie depende de la configuración de su navegador y si eligió activar la ubicación para el navegador. La cookie "UULE" dura hasta 6 horas.

          Incluso si rechaza las cookies y tecnologías similares que se utilizan para la personalización, es posible que las funciones y contenidos no personalizados que se muestran se vean influenciados por factores contextuales, como su ubicación, idioma, tipo de dispositivo o el contenido que esté viendo en ese momento.

          Administración de cookies en el navegador
          La mayoría de los navegadores permiten administrar cómo se configuran y usan las cookies a medida que explora las páginas, así como borrar las cookies y los datos de navegación. Además, es posible que su navegador tenga parámetros de configuración que le permitan administrar las cookies para cada sitio. Por ejemplo, la configuración de OpticSave Chrome (chrome://settings/cookies) le permite borrar las cookies existentes, configurar preferencias de cookies para los sitios web y permitir o bloquear todas las cookies. OpticSave Chrome también ofrece el modo Incógnito, el cual borra su historial de navegación y borra las cookies del modo Incógnito de su dispositivo después de que cierra las ventanas de incógnito.

          Cómo administrar tecnologías similares en sus aplicaciones y dispositivos
          La mayoría de los dispositivos móviles y las aplicaciones le permiten administrar la manera en la que se establecen y utilizan tecnologías similares, como los identificadores únicos empleados para identificar una aplicación o un dispositivo. Por ejemplo, el ID de Publicidad en dispositivos Android o el Identificador de Publicidad de Apple pueden administrarse en la configuración de su dispositivo, mientras que los identificadores específicos de cada aplicación por lo general se administran en la configuración de la aplicación.</p>
      </div>
    </div>
  );
}

export default withI18n(CookiePolicyPage);
