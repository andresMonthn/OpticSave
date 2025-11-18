'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

// Definimos el tipo Paciente para asegurar consistencia
export interface Paciente {
  id: string;
  user_id: string;
  nombre: string;
  apellido: string;
  edad: number | null;
  sexo: string | null;
  domicilio: string | null;
  motivo_consulta: string | null;
  telefono: string | null;
  fecha_de_cita: string | null;
  created_at: string;
  updated_at: string;
}

// Definimos el tipo Inventario
export interface Inventario {
  id: string;
  user_id: string;
  producto: string;
  categoria: string;
  marca: string | null;
  modelo: string | null;
  cantidad: number | null;
  precio: number | null;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPacientesAction() {
  try {
    // Obtener el cliente de Supabase autenticado del servidor
    const supabase = getSupabaseServerClient();
    
    // Verificar la sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: "No hay sesión activa",
        data: null
      };
    }
    
    // Obtener el ID del usuario de la sesión
    const userId = session.user.id;
    
    // Primero verificamos si el usuario está logueado consultando la tabla accounts
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('primary_owner_user_id', userId)
      .eq('is_personal_account', true)
      .single();
    
    if (accountError) {
      console.error("Error al verificar la cuenta del usuario:", accountError);
      return {
        success: false,
        error: "No se pudo verificar la cuenta del usuario",
        data: null
      };
    }
    
    // Si llegamos aquí, el usuario está autenticado, ahora obtenemos sus pacientes
    // Usamos any para evitar el error de tipo con la tabla 'pacientes'
    const { data, error } = await (supabase as any)
      .from('pacientes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error al obtener pacientes:", error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
    
    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error("Error en la acción del servidor:", err);
    return {
      success: false,
      error: err.message,
      data: null
    };
  }
}

export async function getInventariosAction() {
  try {
    // Obtener el cliente de Supabase autenticado del servidor
    const supabase = getSupabaseServerClient();
    
    // Verificar la sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: "No hay sesión activa",
        data: null
      };
    }
    
    // Obtener el ID del usuario de la sesión
    const userId = session.user.id;
    
    // Primero verificamos si el usuario está logueado consultando la tabla accounts
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('primary_owner_user_id', userId)
      .eq('is_personal_account', true)
      .single();
    
    if (accountError) {
      console.error("Error al verificar la cuenta del usuario:", accountError);
      return {
        success: false,
        error: "No se pudo verificar la cuenta del usuario",
        data: null
      };
    }
    
    // Si llegamos aquí, el usuario está autenticado, ahora obtenemos sus inventarios
    // Usamos any para evitar el error de tipo con la tabla 'inventarios'
    const { data, error } = await (supabase as any)
      .from('inventarios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error al obtener inventarios:", error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
    
    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error("Error en la acción del servidor:", err);
    return {
      success: false,
      error: err.message,
      data: null
    };
  }
}