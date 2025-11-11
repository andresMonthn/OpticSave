import { Footer } from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';
import { AppLogo } from '~/components/app-logo';
import appConfig from '~/config/app.config';

export function SiteFooter() {
  return (
    <Footer
      className={
        'backdrop-blur-sm bg-white/40 dark:bg-gray-900/40 border-t border-white/20 dark:border-gray-800/30 dark:[&_svg]:text-white dark:[&_svg]:fill-white'
      }
      logo={<AppLogo className="w-[85px] md:w-[95px] dark:invert dark:brightness-0 dark:contrast-200" />}
      description={<Trans i18nKey="marketing:footerDescription" />}
      copyright={
        <Trans
          i18nKey="marketing:copyright"
          values={{
            product: appConfig.name,
            year: new Date().getFullYear(),
          }}
        />
      }
      sections={[
        {
          heading: <Trans i18nKey="marketing:about" />,
          links: [
            { href: '/contact', label: <Trans i18nKey="marketing:contact" /> },
          ],
        },
        {
          heading: <Trans i18nKey="marketing:product" />,
          links: [
            {
              href: '/docs',
              label: <Trans i18nKey="marketing:documentation" />,
            },
          ],
        },
        {
          heading: <Trans i18nKey="marketing:legal" />,
          links: [
            {
              href: '/terms-of-service',
              label: <Trans i18nKey="marketing:termsOfService" />,
            },
            {
              href: '/privacy-policy',
              label: <Trans i18nKey="marketing:privacyPolicy" />,
            },
            {
              href: '/cookie-policy',
              label: <Trans i18nKey="marketing:cookiePolicy" />,
            },
          ],
        },
      ]}
    />
  );
}
