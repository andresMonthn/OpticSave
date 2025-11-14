import { describe, it, expect } from 'vitest';
import { formatDateSafe, getAppointmentStatus } from '@/app/home/(user)/dashboard/historialclinico/[id]/utils/helpers';

describe('utils/helpers', () => {
  it('formatDateSafe returns fallback for null/invalid', () => {
    expect(formatDateSafe(null as any, 'N/A')).toBe('N/A');
    expect(formatDateSafe('invalid-date', 'N/A')).toBe('N/A');
  });

  it('formatDateSafe formats valid dates', () => {
    const d = new Date('2024-01-01T00:00:00.000Z');
    const res = formatDateSafe(d, 'N/A');
    expect(typeof res).toBe('string');
    expect(res).not.toBe('N/A');
  });

  it('getAppointmentStatus returns null for empty date', () => {
    expect(getAppointmentStatus(null)).toBeNull();
  });

  it('getAppointmentStatus computes today as Pendiente', () => {
    const today = new Date();
    const iso = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const s = getAppointmentStatus(iso)!;
    expect(s.diasRestantes).toBe(0);
    expect(s.citaExpirada).toBe(false);
    expect(s.nuevoEstado).toBe('Pendiente');
  });

  it('getAppointmentStatus computes future as Programado', () => {
    const now = new Date();
    const future = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString();
    const s = getAppointmentStatus(future)!;
    expect(s.diasRestantes).toBe(2);
    expect(s.citaExpirada).toBe(false);
    expect(s.nuevoEstado).toBe('Programado');
  });

  it('getAppointmentStatus computes past as Completado', () => {
    const now = new Date();
    const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    const s = getAppointmentStatus(past)!;
    expect(s.diasRestantes).toBe(-1);
    expect(s.citaExpirada).toBe(true);
    expect(s.nuevoEstado).toBe('Completado');
  });
});