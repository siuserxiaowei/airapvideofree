import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';

export interface MarketingEmailProps {
  appName?: string;
  logoUrl?: string;
  headline: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
  physicalAddress?: string;
}

export function MarketingEmail({
  appName = 'AIRapVideoFree',
  logoUrl,
  headline,
  content,
  ctaText,
  ctaUrl,
  unsubscribeUrl = 'https://airapvideofree.com/settings/profile',
  physicalAddress = 'AIRapVideoFree, 548 Market St, Suite 12345, San Francisco, CA 94104',
}: MarketingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{headline}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Section style={styles.accentBar} />
            {(logoUrl || appName) && (
              <Section style={styles.brandRow}>
                {logoUrl ? (
                  <Img
                    src={logoUrl}
                    width="40"
                    height="40"
                    alt={appName}
                    style={styles.cardLogo}
                  />
                ) : null}
                <Text style={styles.cardBrand}>{appName}</Text>
              </Section>
            )}

            <Heading style={styles.h1}>{headline}</Heading>

            <Text style={styles.p}>{content}</Text>

            {ctaText && ctaUrl && (
              <Section style={styles.buttonWrap}>
                <Button href={ctaUrl} style={styles.button}>
                  {ctaText}
                </Button>
              </Section>
            )}

            <Hr style={styles.hr} />

            {/* Legal Footers Required by CAN-SPAM Act & GDPR */}
            <Section style={styles.complianceSection}>
              <Text style={styles.complianceText}>
                You received this marketing update because you opted in or
                registered on{' '}
                <Link href="https://airapvideofree.com" style={styles.textLink}>
                  {appName}
                </Link>
                .
              </Text>
              <Text style={styles.complianceText}>
                Want to stop receiving these emails?{' '}
                <Link href={unsubscribeUrl} style={styles.unsubscribeLink}>
                  Unsubscribe here
                </Link>{' '}
                or update your email preferences in{' '}
                <Link
                  href="https://airapvideofree.com/settings/profile"
                  style={styles.textLink}
                >
                  Notification Settings
                </Link>
                .
              </Text>
              <Text style={styles.addressText}>{physicalAddress}</Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,Helvetica,Arial,sans-serif',
    color: '#0f172a',
  },
  container: {
    maxWidth: 580,
    margin: '0 auto',
    padding: '32px 16px 40px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '32px 28px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
  },
  accentBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f97316',
    marginBottom: 20,
  },
  brandRow: {
    marginBottom: 24,
  },
  cardLogo: {
    display: 'inline-block',
    verticalAlign: 'middle',
    borderRadius: 8,
  },
  cardBrand: {
    display: 'inline-block',
    verticalAlign: 'middle',
    margin: '0 0 0 10px',
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  h1: {
    margin: '0 0 16px',
    fontSize: 22,
    lineHeight: '30px',
    fontWeight: 700,
    color: '#0f172a',
  },
  p: {
    margin: '0 0 20px',
    fontSize: 15,
    lineHeight: '24px',
    color: '#334155',
  },
  buttonWrap: {
    margin: '28px 0',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    padding: '12px 28px',
    borderRadius: 9999,
    display: 'inline-block',
  },
  hr: {
    borderColor: 'rgba(15, 23, 42, 0.08)',
    margin: '28px 0 20px',
  },
  complianceSection: {
    textAlign: 'center',
  },
  complianceText: {
    margin: '0 0 8px',
    fontSize: 12,
    lineHeight: '18px',
    color: '#64748b',
  },
  textLink: {
    color: '#64748b',
    textDecoration: 'underline',
  },
  unsubscribeLink: {
    color: '#f97316',
    fontWeight: 600,
    textDecoration: 'underline',
  },
  addressText: {
    margin: '12px 0 0',
    fontSize: 11,
    lineHeight: '16px',
    color: '#94a3b8',
  },
};
