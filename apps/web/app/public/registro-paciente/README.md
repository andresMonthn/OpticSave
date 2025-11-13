# Registro de Paciente – Arquitectura Modular

Este módulo refactoriza `page.tsx` aplicando principios de Clean Code y separación de preocupaciones.

## Estructura

```
registro-paciente/
  components/
    ThemeButton.tsx
    SuccessMessage.tsx
  services/
    citas.ts
  utils/
    validation.ts
    styles.ts
  types/
    types.ts
  __tests__/
    validation.test.ts
  README.md
```

## Interfaces

- `types/types.ts` expone `Paciente`, `DomicilioCompleto`, `CitaInfo`.

## Utilidades

- `utils/validation.ts`: `validateTelefono`, `isStepValidCtx(steps, stepIndex, ctx)`.
- `utils/styles.ts`: `injectStylesOnce(id, styles)` para evitar duplicaciones bajo HMR.

## Servicios

- `services/citas.ts`: `getCitasInfoByUserId(supabase, userId)` retorna `CitaInfo[]`.

## Componentes

- `ThemeButton`: componente presentacional para cambio de tema (requiere `mounted`, `currentTheme`, `onToggle`).
- `SuccessMessage`: componente presentacional para mensaje de éxito (`onClose`).

## Import/Export

Los módulos están diseñados con contratos claros y sin efectos secundarios. `page.tsx` importa funciones/componentes y mantiene el estado local.

## Pruebas

- `__tests__/validation.test.ts` valida utilidades clave con Vitest.

## Notas de compatibilidad

- Se preservan las funcionalidades existentes. El UI permanece idéntico.
- Los nombres y estados de `page.tsx` se conservan; sólo se delegan cálculos.