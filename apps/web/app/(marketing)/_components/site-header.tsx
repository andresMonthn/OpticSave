import { JWTUserData } from '@kit/supabase/types';
import { Header } from '@kit/ui/marketing';

import { AppLogo } from '~/components/app-logo';

import { SiteHeaderAccountSection } from './site-header-account-section';
import { SiteNavigation } from './site-navigation';

export function SiteHeader(props: { user?: JWTUserData | null }) {
  return (
    <Header
      className="dark:[&_svg]:text-white dark:[&_svg]:fill-white"
      logo={<AppLogo className="dark:invert dark:brightness-0 dark:contrast-200" />}
      navigation={<SiteNavigation />}
      actions={<SiteHeaderAccountSection user={props.user ?? null} />}
    />
  );
}
