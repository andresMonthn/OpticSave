"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

import { Menu } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuList } from '@kit/ui/navigation-menu';
import { Trans } from '@kit/ui/trans';

import { SiteNavigationItem } from './site-navigation-item';

const links = {
  // Blog: {
  //   label: 'blog',
  //   path: '/blog',
  // },
  Docs: {
    label: 'documentacion',
    path: '/docs',
  },
  Pricing: {
    label: 'precios',
    path: '/pricing',
  },
  FAQ: {
    label: 'faq',
    path: '/faq',
  },
  Contact: {
    label: 'contacto',
    path: '/contact',
  },
};

export function SiteNavigation() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);
  const NavItems = Object.values(links).map((item) => {
    return (
      <SiteNavigationItem key={item.path} path={item.path}>
        <Trans i18nKey={item.label} />
      </SiteNavigationItem>
    );
  });

  return (
    <>
      <div className={'hidden items-center justify-center lg:flex'}>
        <NavigationMenu>
          <NavigationMenuList className={'gap-x-2'}>
            {NavItems}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className={'flex justify-start sm:items-center lg:hidden'}>
        <MobileDropdown open={menuOpen} onOpenChange={setMenuOpen} />
      </div>

      {menuOpen
        ? createPortal(
            <button
              type="button"
              aria-label={'Cerrar menú móvil'}
              onClick={() => setMenuOpen(false)}
              className={
                'fixed inset-0 z-40 cursor-default bg-black/30 dark:bg-black/50 backdrop-blur-sm sm:backdrop-blur-md transition-opacity duration-200'
              }
            />,
            document.body,
          )
        : null}
    </>
  );
}

function MobileDropdown({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger aria-label={'Abrir menú'} asChild>
        <button
          type="button"
          className={'flex size-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white'}
        >
          <Menu className={'h-5 w-5'} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className={'w-full z-50'}>
        {Object.values(links).map((item) => {
          const className = 'flex w-full h-full items-center';

          return (
            <DropdownMenuItem key={item.path} asChild>
              <Link className={className} href={item.path}>
                <Trans i18nKey={item.label} />
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
