import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Coins, Film, RotateCcw, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import { getModel, getTool, resolveValues, toolPrice } from '@/config/ai';
import { pricingCatalog } from '@/config/pricing';
import { apiPost } from '@/lib/api-client';
import { currentPathWithQuery } from '@/lib/redirect';
import { m } from '@/paraglide/messages.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import {
  PaymentProviderModal,
  type PaymentProvider,
} from '@/components/payment-provider-modal';
import {
  PricingTable,
  type PricingGroup,
  type PricingPlan,
} from '@/components/pricing-table';

const ALL_PROVIDERS: PaymentProvider[] = [
  'stripe',
  'creem',
  'paypal',
  'alipay',
  'wechat',
];

export function Pricing({
  title,
  standalone,
}: {
  title?: string;
  /** 单独的价格页：标题用 h1 */ standalone?: boolean;
} = {}) {
  const Heading = standalone ? 'h1' : 'h2';
  const router = useRouter();
  const { data: session } = useSession();

  const { data: configsData } = usePublicConfig();
  const configs = configsData ?? {};
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PricingPlan | null>(null);
  const [loadingProvider, setLoadingProvider] =
    useState<PaymentProvider | null>(null);

  const enabledProviders = useMemo<PaymentProvider[]>(
    () => ALL_PROVIDERS.filter((p) => configs[`${p}_enabled`] === 'true'),
    [configs]
  );

  // 「大约能做几条」按默认工具的默认参数算，和工作台显示的价格一致
  const unitPrice = (toolId: string) => {
    const tool = getTool(toolId);
    const model = tool && getModel(tool.models[0]);
    return tool && model
      ? toolPrice(tool, model, resolveValues(tool, model, {}).values)
      : 0;
  };
  const videoCost = unitPrice('image-to-video');
  const imageCost = unitPrice('ai-image-generator');
  const packFeatures = (credits: number) => [
    { icon: Coins, label: m['landing.pricing.f_credits']({ count: credits }) },
    {
      icon: Film,
      label: m['landing.pricing.f_videos']({
        count: videoCost ? Math.floor(credits / videoCost) : 0,
        stills: imageCost ? Math.floor(credits / imageCost) : 0,
      }),
    },
    { icon: RotateCcw, label: m['landing.pricing.f_refund']() },
    { icon: Wallet, label: m['landing.pricing.f_no_sub']() },
  ];

  // Display-only: the checkout API looks up the real price
  // and credits from product_id.
  const groups: PricingGroup[] = [
    {
      key: 'packs',
      label: m['landing.pricing.packs'](),
      plans: [
        { key: 'credits_500', name: m['landing.pricing.starter']() },
        {
          key: 'credits_1100',
          name: m['landing.pricing.pro'](),
          featured: true,
          badge: m['landing.pricing.popular'](),
        },
        {
          key: 'credits_2500',
          name: m['landing.pricing.enterprise'](),
          badge: m['landing.pricing.best_value'](),
        },
      ]
        .filter((p) => pricingCatalog[p.key])
        .map((p) => {
          const prod = pricingCatalog[p.key];
          return {
            id: p.key,
            name: p.name,
            description: m['landing.pricing.pack_desc']({
              count: videoCost ? Math.floor(prod.credits / videoCost) : 0,
            }),
            featured: p.featured,
            badge: p.badge,
            price: `$${(prod.priceInCents / 100).toFixed(2)}`,
            features: packFeatures(prod.credits),
            productId: prod.productId,
            priceInCents: prod.priceInCents,
            currency: prod.currency,
            credits: prod.credits,
            buttonText: m['landing.pricing.buy'](),
          };
        }),
    },
  ];

  const checkoutMutation = useMutation({
    mutationFn: ({
      plan,
      provider,
    }: {
      plan: PricingPlan;
      provider: PaymentProvider;
    }) =>
      apiPost<{ checkout_url?: string }>('/api/payment/checkout', {
        product_id: plan.productId,
        product_name: plan.productName || plan.name,
        plan_name: plan.plan?.name || plan.name,
        price: plan.priceInCents,
        currency: plan.currency || 'usd',
        type: plan.plan ? 'subscription' : 'one-time',
        description: plan.name,
        plan: plan.plan,
        credits: plan.credits,
        credits_valid_days: plan.creditsValidDays,
        payment_provider: provider,
        // Land on the order list so the user sees the payment they just made.
        redirect: '/#generator',
      }),
    onSuccess: (data) => {
      if (!data?.checkout_url) {
        toast.error('Checkout failed');
        setLoadingProvider(null);
        return;
      }
      window.location.href = data.checkout_url;
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Checkout failed');
      setLoadingProvider(null);
    },
  });

  function startCheckout(plan: PricingPlan, provider: PaymentProvider) {
    setLoadingProvider(provider);
    checkoutMutation.mutate({ plan, provider });
  }

  async function handleCheckout(plan: PricingPlan) {
    if (!session?.user) {
      const callbackUrl = encodeURIComponent(currentPathWithQuery('/pricing'));
      router.push(`/sign-in?callbackUrl=${callbackUrl}`);
      return;
    }

    const selectEnabled = configs.select_payment_enabled === 'true';
    const defaultProvider = (configs.default_payment_provider ||
      enabledProviders[0] ||
      'stripe') as PaymentProvider;

    if (selectEnabled && enabledProviders.length > 1) {
      setPendingPlan(plan);
      setModalOpen(true);
      return;
    }

    await startCheckout(plan, defaultProvider);
  }

  function handleProviderSelect(provider: PaymentProvider) {
    if (!pendingPlan) return;
    startCheckout(pendingPlan, provider);
  }

  return (
    <section id="pricing" className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <Heading className={standalone ? 'display h1' : 'display h2'}>
            {title ?? (
              <>
                {m['landing.pricing.title']()}
                <em>{m['landing.pricing.title_em']()}</em>
              </>
            )}
          </Heading>
          <p className="lead mx-auto mt-4">
            {m['landing.pricing.description']()}
          </p>
        </div>
        <PricingTable groups={groups} onCheckout={handleCheckout} />
      </div>

      <PaymentProviderModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setPendingPlan(null);
            setLoadingProvider(null);
          }
        }}
        providers={enabledProviders.length ? enabledProviders : ['stripe']}
        loadingProvider={loadingProvider}
        onSelect={handleProviderSelect}
        planName={pendingPlan?.name}
        price={pendingPlan?.price}
      />
    </section>
  );
}
