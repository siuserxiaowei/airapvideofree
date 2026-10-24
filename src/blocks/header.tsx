import { m } from '@/paraglide/messages.js';
import { SiteHeader } from '@/components/site-header';

export function Header() {
  const navLinks = [
    { href: '/#studio', label: m['landing.nav.generator']() },
    { href: '/effects', label: m['landing.nav.effects']() },
    { href: '/pricing', label: m['landing.nav.pricing']() },
    { href: '/blog', label: m['landing.nav.blog']() },
  ];

  return <SiteHeader navLinks={navLinks} />;
}
