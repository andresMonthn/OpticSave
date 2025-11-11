'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { PersonalAccountDropdown } from '@kit/accounts/personal-account-dropdown';
import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { JWTUserData } from '@kit/supabase/types';
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';
import { LogIn, UserPlus } from 'lucide-react';

import featuresFlagConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const ModeToggle = dynamic(
  () =>
    import('@kit/ui/mode-toggle').then((mod) => ({
      default: mod.ModeToggle,
    })),
  { ssr: false },
);

const MobileModeToggle = dynamic(() =>
  import('@kit/ui/mobile-mode-toggle').then((mod) => ({
    default: mod.MobileModeToggle,
  })),
);

const paths = {
  home: pathsConfig.app.home,
};

const features = {
  enableThemeToggle: featuresFlagConfig.enableThemeToggle,
};

export function SiteHeaderAccountSection({
  user,
}: {
  user: JWTUserData | null;
}) {
  const signOut = useSignOut();

  if (user) {
    return (
      <PersonalAccountDropdown
        showProfileName={false}
        paths={paths}
        features={features}
        user={user}
        signOutRequested={() => signOut.mutateAsync()}
      />
    );
  }

  return <AuthButtons />;
}

function AuthButtons() {
  return (
    <div className={'animate-in fade-in flex items-center gap-2 duration-500'}>
      <div className={'hidden lg:flex'}>
        <If condition={features.enableThemeToggle}>
          <ModeToggle />
        </If>
      </div>

      <div className={'lg:hidden'}>
        <If condition={features.enableThemeToggle}>
          <MobileModeToggle />
        </If>
      </div>

      <div className={'inline-flex items-center gap-1 sm:gap-2 flex-nowrap'}>
        {/* Desktop: botones con texto */}
        <Button className={'hidden lg:block'} asChild variant={'ghost'}>
          <Link href={pathsConfig.auth.signIn}>
            <Trans i18nKey={'auth:signIn'} />
          </Link>
        </Button>

        <Button className={'hidden lg:block'} asChild variant={'default'}>
          <Link href={pathsConfig.auth.signUp}>
            <Trans i18nKey={'auth:signUp'} />
          </Link>
        </Button>

        {/* Móvil y tablets (< lg): iconos */}
        <Button
          className={'lg:hidden shrink-0'}
          asChild
          variant={'ghost'}
          size={'icon'}
          aria-label={'Iniciar sesión'}
        >
          <Link href={pathsConfig.auth.signIn}>
            <LogIn className={'h-4 w-4 sm:h-5 sm:w-5'} />
          </Link>
        </Button>

        <Button
          className={'lg:hidden shrink-0'}
          asChild
          variant={'default'}
          size={'icon'}
          aria-label={'Registrarse'}
        >
          <Link href={pathsConfig.auth.signUp}>
            <UserPlus className={'h-4 w-4 sm:h-5 sm:w-5'} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
