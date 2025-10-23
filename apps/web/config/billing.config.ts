/**
 * Configuración de facturación para OptisaveApp
 */
import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

// El proveedor de facturación a utilizar. Debe coincidir con el proveedor en la base de datos.
const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

export default createBillingSchema({
  // también actualizar config.billing_provider en la BD para que coincida con el seleccionado
  provider,
  // configuración de productos
  products: [
  //producto standar
    {
      id: 'standard',
      name: 'Standard',
      description: 'Para clínicas pequeñas, consultorios y asociados',
      currency: 'USD',
      badge: `OpticSave`,
      plans: [
        {
          name: 'Standar Monthly',
          id: 'price_1SJGBBRujkGald9OzyUBzzBc',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_1SJGBBRujkGald9OzyUBzzBc',
              name: 'Standard',
              cost: 25.00,
              type: 'flat' as const,
            },
          ],
        },
        {
          name: 'Starter Yearly',
          id: 'price_1SJGFsRujkGald9OK0srSHIc',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_1SJGFsRujkGald9OK0srSHIc',
              name: 'Base',
              cost: 299.99,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: ['Gestion citas y pacientes', 'Programa dedicado', 'Acceso a nuestra Agenda' , 'inventarios', 'levantamiento de requisiciones', 'Soporte 24/7'],
    },
  ],
});
