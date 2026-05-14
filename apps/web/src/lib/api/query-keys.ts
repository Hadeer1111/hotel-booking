/**
 * Centralised TanStack Query key factory. Keys are tuples whose first element
 * names the resource family so cache invalidation is precise (and so reading
 * a component's data dependencies just means scanning queryFn calls).
 */
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  hotels: {
    all: () => ['hotels'] as const,
    list: (params: Record<string, unknown>) => ['hotels', 'list', params] as const,
    detail: (id: string) => ['hotels', 'detail', id] as const,
    roomTypes: (hotelId: string) => ['hotels', hotelId, 'room-types'] as const,
    rooms: (hotelId: string) => ['hotels', hotelId, 'rooms'] as const,
    availability: (hotelId: string, params: { checkIn: string; checkOut: string }) =>
      ['hotels', hotelId, 'availability', params] as const,
  },
  bookings: {
    all: () => ['bookings'] as const,
    list: (params: Record<string, unknown>) => ['bookings', 'list', params] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
  },
  dashboard: {
    stats: () => ['dashboard', 'stats'] as const,
  },
} as const;
