# Componente de Calendario Responsivo

Este componente proporciona una visualización de calendario adaptable que cambia automáticamente entre una vista móvil optimizada y una vista de escritorio completa según el tamaño de la pantalla.

## Características

- **Detección automática de dispositivo**: Cambia entre vistas móvil y escritorio basado en el ancho de la pantalla (768px como punto de quiebre)
- **Diseño optimizado para móvil**: Interfaz simplificada con mejor visualización en pantallas pequeñas
- **Manejo de estados**: Gestión de estados de carga, error y datos
- **Conexión con Supabase**: Obtiene datos de pacientes directamente de la base de datos

## Uso

```tsx
// Importar el componente
import ResponsiveCalendar from './components/ResponsiveCalendar';

// Uso básico
<ResponsiveCalendar />

// Uso con renderizado condicional manual
{isMobile ? (
  <ResponsiveCalendar />
) : (
  <OtroComponente />
)}
```

## Estructura del componente

El componente está estructurado de la siguiente manera:

1. **Hook de detección de viewport**: Utiliza `useMediaQuery` para detectar el tamaño de pantalla
2. **Fetch de datos**: Conecta con Supabase para obtener información de pacientes
3. **Renderizado condicional**: 
   - Vista móvil: Diseño simplificado con meses apilados verticalmente
   - Vista escritorio: Calendario completo con todas las funcionalidades

## Personalización

El componente puede ser personalizado mediante props (futuras implementaciones):

```tsx
<ResponsiveCalendar 
  initialDate={new Date()} 
  onDateSelect={(date) => console.log(date)}
  onAppointmentClick={(appointment) => console.log(appointment)}
/>
```

## Pruebas

El componente ha sido probado en los siguientes tamaños de pantalla:
- Móvil: 375px (iPhone SE)
- Tablet: 768px (iPad Mini)
- Escritorio: 1440px (Laptop estándar)

## Mantenimiento

Para modificar el diseño móvil, editar la sección correspondiente en `ResponsiveCalendar.tsx`. Para cambiar el punto de quiebre, ajustar la consulta de medios en el hook `useMediaQuery`.