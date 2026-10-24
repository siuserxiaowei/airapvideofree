import { getRouteApi } from '@tanstack/react-router';

import { openCookieSettings } from '@/lib/cookie-consent';
import { m } from '@/paraglide/messages.js';
import {
  SiteFooter,
  type FooterColumn,
  type FooterSocial,
} from '@/components/site-footer';

const rootRoute = getRouteApi('__root__');

export function Footer() {
  const cookieConsentEnabled =
    !!rootRoute.useLoaderData()?.cookieConsentEnabled;
  const columns: FooterColumn[] = [
    {
      title: m['landing.footer.feature'](),
      links: [
        { label: m['landing.footer.generator'](), href: '/#studio' },
        { label: m['landing.footer.pricing'](), href: '/pricing' },
        {
          label: m['landing.footer.my_account'](),
          href: '/settings',
          external: true,
        },
      ],
    },
    {
      title: m['landing.footer.resources'](),
      links: [
        { label: m['landing.footer.what_is'](), href: '/#what-is' },
        { label: m['landing.nav.effects'](), href: '/effects' },
        { label: m['landing.footer.blog'](), href: '/blog' },
      ],
    },
    {
      title: m['landing.footer.legal'](),
      links: [
        { label: m['landing.footer.privacy'](), href: '/privacy-policy' },
        { label: m['landing.footer.terms'](), href: '/terms-of-service' },
        ...(cookieConsentEnabled
          ? [
              {
                label: m['landing.footer.cookie_settings'](),
                onClick: openCookieSettings,
              },
            ]
          : []),
      ],
    },
  ];

  // Add real profiles here once the project has them.
  const socials: FooterSocial[] = [];

  return (
    <SiteFooter
      tagline={m['landing.footer.tagline']()}
      columns={columns}
      socials={socials}
    />
  );
}
