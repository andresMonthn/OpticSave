// Funciones de validación y lógica de pasos desacopladas de la UI

export function validateTelefono(value: string): string | null {
  if (value && (value.length < 10 || value.length > 10)) {
    return "El teléfono debe tener exactamente 10 dígitos";
  }
  return null;
}

// Contexto mínimo necesario para validar cada paso
export interface StepValidationContext {
  nombre: string;
  fechaNacimiento?: Date | undefined;
  telefono: string;
  sexo: string;
  domicilio: string;
  domicilioCompleto: boolean;
  domicilioFields: { calle: string; numero: string; interior: string; colonia: string };
  motivoConsulta: string;
  motivoConsultaOtro: string;
  ocupacion: string;
  sintomasVisualesSeleccionados: string[];
  usaLentes: boolean;
  tipoLentesSeleccionados: string[];
  tiempoUsoLentes: string;
  cirugiasOculares: boolean;
  traumatismosOculares: boolean;
  traumatismosDetalle: string;
  antecedentesVisualesFamiliaresSeleccionados: string[];
  antecedentesVisualesFamiliaresOtros: string;
  antecedentesFamiliaresSaludSeleccionados: string[];
  habitosVisualesSeleccionados: string[];
  saludGeneralSeleccionados: string[];
}

// Valida un paso dado los nombres declarados en `steps`
export function isStepValidCtx(steps: string[], stepIndex: number, ctx: StepValidationContext): boolean {
  const stepName = steps[stepIndex];
  switch (stepName) {
    case 'nombre':
      return ctx.nombre.trim() !== "";
    case 'fecha_nacimiento':
      return !!ctx.fechaNacimiento;
    case 'edad':
      return true; // derivado de fecha de nacimiento, no requiere input
    case 'telefono': {
      return ctx.telefono === "" || validateTelefono(ctx.telefono) === null;
    }
    case 'sexo':
      return ctx.sexo.trim() !== "";
    case 'domicilio': {
      if (!ctx.domicilioCompleto) {
        return ctx.domicilio.trim() !== "";
      }
      return (
        ctx.domicilioFields.calle.trim() !== "" &&
        ctx.domicilioFields.numero.trim() !== "" &&
        ctx.domicilioFields.colonia.trim() !== ""
      );
    }
    case 'motivo_consulta': {
      const baseOk = ctx.motivoConsulta.trim() !== "";
      const otroOk = ctx.motivoConsulta !== 'Otro' || ctx.motivoConsultaOtro.trim() !== "";
      return baseOk && otroOk;
    }
    case 'ocupacion':
      return true;
    case 'ultimo_examen_visual':
      return true;
    case 'sintomas_visuales':
      return ctx.sintomasVisualesSeleccionados.length > 0;
    case 'uso_lentes':
      return !ctx.usaLentes || (ctx.tipoLentesSeleccionados.length > 0 && ctx.tiempoUsoLentes.trim() !== "");
    case 'cirugias_y_traumatismos':
      return !ctx.traumatismosOculares || ctx.traumatismosDetalle.trim() !== "";
    case 'antecedentes_visuales_familiares': {
      if (ctx.antecedentesVisualesFamiliaresSeleccionados.includes('Ninguno')) return true;
      const ok = ctx.antecedentesVisualesFamiliaresSeleccionados.length > 0;
      const otrosOk = !ctx.antecedentesVisualesFamiliaresSeleccionados.includes('Otros') || ctx.antecedentesVisualesFamiliaresOtros.trim() !== "";
      return ok && otrosOk;
    }
    case 'antecedentes_familiares_salud':
      return ctx.antecedentesFamiliaresSaludSeleccionados.length > 0;
    case 'habitos_visuales':
      return ctx.habitosVisualesSeleccionados.length > 0;
    case 'salud_general':
      return ctx.saludGeneralSeleccionados.length > 0;
    case 'medicamento_actual':
      return true;
    case 'fecha_de_cita':
      return true;
    default:
      return true;
  }
}