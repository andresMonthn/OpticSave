import { describe, it, expect } from 'vitest';
import { validateTelefono, isStepValidCtx } from '../utils/validation';

describe('validateTelefono', () => {
  it('permite vacío', () => {
    expect(validateTelefono('')).toBeNull();
  });
  it('rechaza menos de 10 dígitos', () => {
    expect(validateTelefono('123')).toBe("El teléfono debe tener exactamente 10 dígitos");
  });
  it('rechaza más de 10 dígitos', () => {
    expect(validateTelefono('12345678901')).toBe("El teléfono debe tener exactamente 10 dígitos");
  });
  it('acepta exactamente 10 dígitos', () => {
    expect(validateTelefono('1234567890')).toBeNull();
  });
});

describe('isStepValidCtx', () => {
  const steps = [
    'nombre','fecha_nacimiento','edad','telefono','sexo','domicilio','motivo_consulta','ocupacion','ultimo_examen_visual','sintomas_visuales','uso_lentes','cirugias_y_traumatismos','antecedentes_visuales_familiares','antecedentes_familiares_salud','habitos_visuales','salud_general','medicamento_actual','fecha_de_cita'
  ];
  const baseCtx = {
    nombre: 'Juan',
    fechaNacimiento: new Date(),
    telefono: '',
    sexo: 'M',
    domicilio: 'Calle',
    domicilioCompleto: false,
    domicilioFields: { calle: '', numero: '', interior: '', colonia: '' },
    motivoConsulta: 'Control',
    motivoConsultaOtro: '',
    ocupacion: '',
    sintomasVisualesSeleccionados: ['Visión borrosa'],
    usaLentes: false,
    tipoLentesSeleccionados: [],
    tiempoUsoLentes: '',
    cirugiasOculares: false,
    traumatismosOculares: false,
    traumatismosDetalle: '',
    antecedentesVisualesFamiliaresSeleccionados: ['Miopía'],
    antecedentesVisualesFamiliaresOtros: '',
    antecedentesFamiliaresSaludSeleccionados: ['Diabetes'],
    habitosVisualesSeleccionados: ['Pantallas prolongadas'],
    saludGeneralSeleccionados: ['Dolor de cabeza'],
  };

  it('valida nombre', () => {
    expect(isStepValidCtx(steps, 0, { ...baseCtx, nombre: '' })).toBe(false);
    expect(isStepValidCtx(steps, 0, baseCtx)).toBe(true);
  });

  it('valida teléfono 10 dígitos o vacío', () => {
    expect(isStepValidCtx(steps, 3, { ...baseCtx, telefono: '1234567890' })).toBe(true);
    expect(isStepValidCtx(steps, 3, { ...baseCtx, telefono: '123' })).toBe(false);
  });
});