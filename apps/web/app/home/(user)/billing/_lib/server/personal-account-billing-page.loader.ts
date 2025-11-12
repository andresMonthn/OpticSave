'use server';

import 'server-only';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createAccountsApi } from '@kit/accounts/api';

/**
 * @name loadPersonalAccountBillingPageData
 * @description Carga información básica del cliente en el gateway de pagos.
 * En esta implementación mínima, solo obtiene el `customerId`
 * desde Supabase (si existe) para mostrar el estado de facturación.
 */
// Tipos amplios para evitar errores de TS en consumidores
export type BillingSubscription = any;
export type BillingOrder = any;

export async function loadPersonalAccountBillingPageData(
  userId: string,
): Promise<[
  BillingSubscription | undefined,
  BillingOrder | undefined,
  string | undefined,
]> {
  const client = getSupabaseServerClient();
  const api = createAccountsApi(client);

  try {
    const customerId = await api.getCustomerId(userId);

    // En tu caso no existen suscripciones ni órdenes persistentes,
    // por lo tanto devolvemos undefined en esas posiciones.
    return [undefined, undefined, customerId];
  } catch (error) {
    console.error('Error loading billing page data:', error);
    return [undefined, undefined, undefined];
  }
}
