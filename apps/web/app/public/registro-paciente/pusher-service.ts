// Servicio para manejar las notificaciones Pusher
import Pusher from 'pusher-js';
// Función para enviar notificación a través de Pusher
export const enviarNotificacionPusher = (pacienteData: any, accountId?: string) => {
  try {
    // Inicializar Pusher con las credenciales del .env.development
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'us2',
      forceTLS: true
    });

    // Construir el payload con datos relevantes del paciente
    const payload = {
      paciente: {
        nombre: pacienteData.nombre,
        edad: pacienteData.edad,
        telefono: pacienteData.telefono,
        motivo_consulta: pacienteData.motivo_consulta,
        fecha_de_cita: pacienteData.fecha_de_cita
      },
      account_id: accountId,
      timestamp: new Date().toISOString()
    };

    // Enviar la notificación al canal 'pacientes' con el evento 'nuevo-registro'
    const channel = pusher.subscribe('pacientes-channel');
    channel.trigger('nuevo-registro', payload);
    console.log('Notificación Pusher enviada correctamente');
    return true;
  } catch (error) {
    console.error('Error al enviar notificación Pusher:', error);
    return false;
  }
};