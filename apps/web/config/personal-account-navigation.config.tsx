import { Search, CreditCard, Home, User, UserPlus, Package, Calendar, ClipboardCheck } from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import featureFlagsConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: 'common:routes.application',
    children: [
      {
        label: 'common:routes.home',
        path: pathsConfig.app.home,
        Icon: <Home className={iconClasses} />,
        end: true,
      },
      {
        label: 'Crear Paciente',
        path: pathsConfig.app.crearpaciente,
        Icon: <UserPlus className={iconClasses} />,
        end: true,
      },
            {
        label: 'Buscar Paciente',
        path: pathsConfig.app.creardiagnostico,
        Icon: <Search className={iconClasses} />,
        end: true,
      },
      {
        label: 'Inventario',
        path: pathsConfig.app.inventario,
        Icon: <Package className={iconClasses} />,
        end: true,
      },
      {
        label: 'Agenda',
        path: pathsConfig.app.agenda,
        Icon: <Calendar className={iconClasses} />,
        end: true,
      },
      {
        label: 'Ver Pacientes',
        path: pathsConfig.app.pacientes,
        Icon: <User className={iconClasses} />,
        end: true,
      },
    ],
  },
  {
    label: 'common:routes.settings',
    children: [
      {
        label: 'common:routes.profile',
        path: pathsConfig.app.personalAccountSettings,
        Icon: <User className={iconClasses} />,
      },
      featureFlagsConfig.enablePersonalAccountBilling
        ? {
            label: 'common:routes.billing',
            path: pathsConfig.app.personalAccountBilling,
            Icon: <CreditCard className={iconClasses} />,
          }
        : undefined,
    ].filter((route) => !!route),
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const personalAccountNavigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_USER_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
  sidebarCollapsedStyle: process.env.NEXT_PUBLIC_SIDEBAR_COLLAPSIBLE_STYLE,
});
