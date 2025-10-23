/**
 * This is a sample billing configuration file. You should copy this file to `billing.config.ts` and then replace
 * the configuration with your own billing provider and products.
 */
import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

// The billing provider to use. This should be set in the environment variables
// and should match the provider in the database. We also add it here so we can validate
// your configuration against the selected provider at build time.
const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

export default createBillingSchema({
  // also update config.billing_provider in the DB to match the selected
  provider,
  // products configuration
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
              id: 'price_1NNwYHI1i3VnbZTqI2UzaHIe',
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
              id: 'starter-yearly',
              name: 'Base',
              cost: 299.99,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: ['Gestion citas y pacientes', 'Programa dedicado', 'Acceso a nuestra Agenda' , 'inventarios', 'levantamiento de requisiciones', 'Soporte 24/7'],
    },

    // producto Pro
    // {
    //   id: 'pro',
    //   name: 'Pro',
    //   badge: `Popular`,
    //   highlighted: true,
    //   description: 'The perfect plan for professionals',
    //   currency: 'USD',
    //   plans: [
    //     {
    //       name: 'Pro Monthly',
    //       id: 'pro-monthly',
    //       paymentType: 'recurring',
    //       interval: 'month',
    //       lineItems: [
    //         {
    //           id: 'price_1PGOAVI1i3VnbZTqc69xaypm',
    //           name: 'Base',
    //           cost: 19.99,
    //           type: 'flat',
    //         },
    //       ],
    //     },
    //     {
    //       name: 'Pro Yearly',
    //       id: 'pro-yearly',
    //       paymentType: 'recurring',
    //       interval: 'year',
    //       lineItems: [
    //         {
    //           id: 'price_pro_yearly',
    //           name: 'Base',
    //           cost: 199.99,
    //           type: 'flat',
    //         },
    //       ],
    //     },
    //   ],
    //   features: [
    //     'Feature 1',
    //     'Feature 2',
    //     'Feature 3',
    //     'Feature 4',
    //     'Feature 5',
    //   ],
    // },

    // // producto Enterprise
    // {
    //   id: 'enterprise',
    //   name: 'Enterprise',
    //   description: 'The perfect plan for enterprises',
    //   currency: 'USD',
    //   plans: [
    //     {
    //       name: 'Enterprise Monthly',
    //       id: 'enterprise-monthly',
    //       paymentType: 'recurring',
    //       interval: 'month',
    //       lineItems: [
    //         {
    //           id: 'price_enterprise-monthly',
    //           name: 'Base',
    //           cost: 29.99,
    //           type: 'flat',
    //         },
    //       ],
    //     },
    //     {
    //       name: 'Enterprise Yearly',
    //       id: 'enterprise-yearly',
    //       paymentType: 'recurring',
    //       interval: 'year',
    //       lineItems: [
    //         {
    //           id: 'price_enterprise_yearly',
    //           name: 'Base',
    //           cost: 299.9,
    //           type: 'flat',
    //         },
    //       ],
    //     },
    //   ],
    //   features: [
    //     'Feature 1',
    //     'Feature 2',
    //     'Feature 3',
    //     'Feature 4',
    //     'Feature 5',
    //     'Feature 6',
    //     'Feature 7',
    //   ],
    // },
  ],
});
