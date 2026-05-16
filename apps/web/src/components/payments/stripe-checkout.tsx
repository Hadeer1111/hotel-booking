'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { env } from '@/lib/env';

let stripePromise: Promise<StripeJs | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(env.stripePublishableKey);
  }
  return stripePromise;
}

export function StripeCheckout({
  clientSecret,
  returnUrl,
}: {
  clientSecret: string;
  returnUrl: string;
}) {
  if (!env.stripePublishableKey) {
    return (
      <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/20">
        Stripe is enabled (<code className="font-mono text-xs">NEXT_PUBLIC_PAYMENTS_PROVIDER=stripe</code>)
        but <code className="font-mono text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> is missing. Add it to{' '}
        <code className="font-mono text-xs">apps/web/.env.local</code> and restart <code className="font-mono text-xs">next dev</code>.
      </p>
    );
  }
  return (
    <Elements stripe={getStripe()} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <Form returnUrl={returnUrl} />
    </Elements>
  );
}

function Form({ returnUrl }: { returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (stripe && elements) setReady(true);
  }, [stripe, elements]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    if (result.error) {
      toast({
        title: 'Payment failed',
        description: result.error.message ?? 'Please try a different card.',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!ready || submitting} className="w-full">
        {submitting ? 'Processing…' : 'Pay & confirm booking'}
      </Button>
    </form>
  );
}
