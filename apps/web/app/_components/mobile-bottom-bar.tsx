'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar as CalendarIcon,
  Settings,
  Users,
  CreditCard,
  LayoutDashboard,
  UserPlus,
  ClipboardCheck,
  Package,
  Menu,
  LogOut,
  Sun,
 
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';

import pathsConfig from '~/config/paths.config';
import { AppLogo } from '~/components/app-logo';
import { personalAccountNavigationConfig } from '~/config/personal-account-navigation.config';
import { getTeamAccountSidebarConfig } from '~/config/team-account-navigation.config';

function isTeamRoute(pathname: string) {
  // Team routes look like /home/<account-slug>/...
  // Personal routes are /home and /home/dashboard/*
  if (!pathname.startsWith('/home')) return false;
  if (pathname === '/home') return false;
  if (pathname.startsWith('/home/dashboard')) return false;
  if (pathname.startsWith('/home/settings')) return false; // personal settings page
  const segs = pathname.split('/').filter(Boolean);
  // segs[0] === 'home'; segs[1] should be the account slug
  return segs.length >= 2 && segs[1] !== 'dashboard' && segs[1] !== 'settings';
}

export default function MobileBottomBar() {
  const pathname = usePathname();
  const signOut = useSignOut();

  // Mostrar solo en rutas bajo /home
  if (typeof pathname !== 'string' || !pathname.startsWith('/home')) {
    return null;
  }

  const team = isTeamRoute(pathname);
  const segs = pathname.split('/').filter(Boolean);
  const accountSlug = team && segs.length >= 2 ? segs[1]! : '';

  // Construye las rutas para el menú inferior
  let items: Array<{ href: string; label: string; icon: React.ReactNode }> = [];
  let logoHref = pathsConfig.app.home;

  if (!team) {
    // Personal account: usa paths reales del config
    items = [
      { href: pathsConfig.app.home, label: 'Inicio', icon: <Home className="h-6 w-6" /> },
      { href: pathsConfig.app.crearpaciente, label: 'Crear Paciente', icon: <UserPlus className="h-6 w-6" /> },
      { href: pathsConfig.app.qr, label: 'Código QR', icon: <ClipboardCheck className="h-6 w-6" /> },
      { href: pathsConfig.app.inventario, label: 'Inventario', icon: <Package className="h-6 w-6" /> },
      { href: pathsConfig.app.agenda, label: 'Agenda', icon: <CalendarIcon className="h-6 w-6" /> },
      { href: pathsConfig.app.pacientes, label: 'Ver Pacientes', icon: <Users className="h-6 w-6" /> },
    ];
    logoHref = pathsConfig.app.home;

    // Fuerza el árbol a evaluarse para mantener paridad con navegación superior
    void personalAccountNavigationConfig;
  } else {
    // Team account: extrae slug y construye rutas desde config
    const account = accountSlug || segs[1] || '';
    const teamConfig = getTeamAccountSidebarConfig(account);

    // Intenta mapear: Dashboard, Members, Billing?, Settings
    const routes = teamConfig.routes;
    const applicationGroup = routes.find((r) => 'children' in r) as any;
    const settingsGroup = routes.find((r) => Array.isArray((r as any).children) && (r as any).children.length > 0) as any;

    const dashboard = applicationGroup?.children?.[0];
    const settings = settingsGroup?.children?.find((c: any) => c.label?.includes('settings')) || settingsGroup?.children?.[0];
    const members = settingsGroup?.children?.find((c: any) => c.label?.includes('members'));
    const billing = settingsGroup?.children?.find((c: any) => c.label?.includes('billing'));

    items = [
    //   dashboard
    //     ? { href: dashboard.path, label: 'Dashboard', icon: <LayoutDashboard className="h-6 w-6" /> }
    //     : { href: pathsConfig.app.accountHome.replace('[account]', account), label: 'Dashboard', icon: <LayoutDashboard className="h-6 w-6" /> },
      members ? { href: members.path, label: 'Miembros', icon: <Users className="h-6 w-6" /> } : undefined,
      billing ? { href: billing.path, label: 'Cobros', icon: <CreditCard className="h-6 w-6" /> } : undefined,
      settings
        ? { href: settings.path, label: 'Opciones', icon: <Settings className="h-6 w-6" /> }
        : { href: pathsConfig.app.accountSettings.replace('[account]', account), label: 'Opciones', icon: <Settings className="h-6 w-6" /> },
    ].filter(Boolean) as Array<{ href: string; label: string; icon: React.ReactNode }>;

    logoHref = pathsConfig.app.accountHome.replace('[account]', account);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 sm:hidden border-t border-gray-200 dark:border-primary/10 bg-background/80 backdrop-blur-md z-[1000]">
      <div className="mx-auto max-w-md">
        <ul className={`grid ${!team ? 'grid-cols-8' : 'grid-cols-6'} items-center px-4 py-2`}>
          {/* Primera mitad (3 items) */}
          {items.slice(0, 3).map((item) => (
            <li key={item.href} className="flex justify-center">
              <Link href={item.href} aria-label={item.label}>
                {item.icon}
              </Link>
            </li>
          ))}

          {/* Logo centrado con modo oscuro (se invierte a blanco) */}
          <li className="flex justify-center">
            <AppLogo href={logoHref} label="Logo OptiSave" className="h-10 w-10 dark:invert dark:brightness-0" />
          </li>

          {/* Segunda mitad */}
          {items.slice(3, 6).map((item) => (
            <li key={item.href} className="flex justify-center">
              <Link href={item.href} aria-label={item.label}>
                {item.icon}
              </Link>
            </li>
          ))}

          {/* Hamburguesa */}
          <li className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Menú">
                <Menu className="h-6 w-6" />
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={8} className="rounded-md">
                {/* Perfil */}
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      team && accountSlug
                        ? pathsConfig.app.accountSettings.replace('[account]', accountSlug)
                        : pathsConfig.app.personalAccountSettings
                    }
                    className="flex items-center gap-x-3"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>

                {/* Facturación */}
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      team && accountSlug
                        ? pathsConfig.app.accountBilling.replace('[account]', accountSlug)
                        : pathsConfig.app.personalAccountBilling
                    }
                    className="flex items-center gap-x-3"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Facturación</span>
                  </Link>
                </DropdownMenuItem>

                {/* Notificaciones: enlace simple, o componente dedicado si se requiere */}
                <DropdownMenuItem asChild>
                  <Link href={pathsConfig.app.home} className="flex items-center gap-x-3">
                    <Users className="h-4 w-4" />
                    <span>Notificaciones</span>
                  </Link>
                </DropdownMenuItem>

                {/* Cambiar tema */}
                <DropdownMenuItem
                  className="flex items-center gap-x-3"
                  onClick={() => {
                    const root = document.documentElement;
                    root.classList.toggle('dark');
                  }}
                >
                  <Sun className="h-4 w-4" />
                  <span>Cambiar tema</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Cerrar sesión */}
                <DropdownMenuItem
                  className="flex items-center gap-x-3"
                  onClick={() => signOut.mutateAsync()}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </div>
    </nav>
  );
}