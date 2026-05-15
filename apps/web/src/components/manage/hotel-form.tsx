'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { HotelUpsertPayload } from '@/lib/api/hotels';

interface HotelFormValues extends HotelUpsertPayload {
  managerId?: string | undefined;
}

export interface HotelFormProps {
  initial?: Partial<HotelUpsertPayload>;
  disabled?: boolean;
  submitLabel: string;
  showManagerField?: boolean;
  onSubmit: (data: HotelFormValues) => void;
}

/** Shared layout for onboarding (admin creates) and upkeep (staff edits). */
export function HotelForm({
  initial,
  disabled,
  submitLabel,
  showManagerField,
  onSubmit,
}: HotelFormProps) {
  const defaults: HotelUpsertPayload = {
    name: '',
    city: '',
    address: '',
    stars: 4,
    status: 'ACTIVE',
    ...initial,
  };

  return (
    <form
      className="grid gap-4"
      key={[
        defaults.name,
        defaults.city,
        defaults.address,
        defaults.stars,
        defaults.status,
        defaults.managerId ?? '',
      ].join('|')}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get('name') ?? '').trim();
        const city = String(fd.get('city') ?? '').trim();
        const address = String(fd.get('address') ?? '').trim();
        const stars = Number(fd.get('stars'));
        const rawStatus = String(fd.get('status') ?? 'ACTIVE');
        const status =
          rawStatus === 'INACTIVE' || rawStatus === 'ACTIVE' ? rawStatus : 'ACTIVE';
        const managerRaw = showManagerField
          ? String(fd.get('managerId') ?? '').trim()
          : undefined;
        if (!name || !city || !address || !Number.isFinite(stars)) return;
        onSubmit({
          name,
          city,
          address,
          stars: Math.min(5, Math.max(1, Math.round(stars))),
          status,
          managerId:
            typeof managerRaw === 'string' && managerRaw ? managerRaw : undefined,
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaults.name}
          disabled={disabled}
          className="rounded-xl"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          name="city"
          required
          defaultValue={defaults.city}
          disabled={disabled}
          className="rounded-xl"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          required
          defaultValue={defaults.address}
          disabled={disabled}
          className="rounded-xl"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="stars">Stars (1–5)</Label>
          <Input
            id="stars"
            name="stars"
            type="number"
            min={1}
            max={5}
            required
            defaultValue={defaults.stars}
            disabled={disabled}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Listing status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults.status}
            disabled={disabled}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          >
            <option value="ACTIVE">Active — visible on site</option>
            <option value="INACTIVE">Inactive — hidden from search</option>
          </select>
        </div>
      </div>
      {showManagerField ? (
        <div className="space-y-1.5">
          <Label htmlFor="managerId">Manager user ID (optional)</Label>
          <Input
            id="managerId"
            name="managerId"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            defaultValue={defaults.managerId ?? ''}
            disabled={disabled}
            className="rounded-xl font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Paste a manager&apos;s UUID from your database or seed scripts. Leave blank for
            unassigned.
          </p>
        </div>
      ) : null}
      <Button type="submit" disabled={disabled} className="mt-2 w-full rounded-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
