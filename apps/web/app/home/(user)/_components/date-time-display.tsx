"use client";

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// Componente de reloj digital que se actualiza cada segundo
export const DigitalClock = () => {
  const [time, setTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar con la hora actual
    try {
      setTime(new Date());
    } catch (err) {
      setError('Error al obtener la hora del sistema');
      console.error('Error al obtener la hora:', err);
    }

    // Actualizar cada segundo
    const intervalId = setInterval(() => {
      try {
        setTime(new Date());
      } catch (err) {
        setError('Error al actualizar la hora');
        console.error('Error al actualizar la hora:', err);
        clearInterval(intervalId);
      }
    }, 1000);

    // Limpiar intervalo al desmontar
    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return <span className="text-gray-500">{error}</span>;
  }

  if (!time) {
    return <span>Cargando...</span>;
  }

  // Formatear la hora con horas, minutos y segundos
  const formattedTime = time.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <span className="font-mono text-base tabular-nums">{formattedTime}</span>
  );
};

// Componente de fecha estilizado según la imagen de referencia
export const DateDisplay = () => {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  
  useEffect(() => {
    try {
      setCurrentDate(new Date());
    } catch (err) {
      console.error('Error al obtener la fecha:', err);
    }
  }, []);

  if (!currentDate) {
    return <div>Cargando fecha...</div>;
  }

  const day = currentDate.getDate();
  const month = currentDate.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
  const year = currentDate.getFullYear();
  const weekday = currentDate.toLocaleString('es-ES', { weekday: 'long' });
  
  return (
    <div className="flex flex-col items-center justify-center bg-red-500 text-white rounded-md shadow-md w-15 h-17">
      <div className="text-2xs capitalize">{weekday}</div>
      <div className="text-2xl font-bold">{day}</div>
      <div className="text-2xs uppercase">{month} {year}</div>
    </div>
  );
};

// Componente contenedor que combina fecha y hora
export const DateTimeDisplay = () => {
  return (
    <div className="flex items-center gap-4" style={{height: "50%"}}>
      <DateDisplay />
      <div className="px-4 py-2 rounded-md flex items-center">
        <Clock className="h-4 w-4 mr-2 text-gray-600" />
        <DigitalClock />
      </div>
    </div>
  );
};