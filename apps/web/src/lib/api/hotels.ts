import type {
  Hotel,
  Paginated,
  Room,
  RoomType,
  RoomTypeAvailability,
} from '@hotel-booking/types';
import { api } from './client';

export interface HotelsListParams {
  page?: number;
  limit?: number;
  q?: string;
  city?: string;
  /** Staff-only widen to INACTIVE listings (requires Bearer for ADMIN/MANAGER). */
  includeInactive?: boolean;
  /** Multi-select star ratings; serialised as a CSV (`?stars=4,5`). */
  stars?: number[];
}

/** Shape accepted by POST /hotels / PATCH /hotels:id (authenticated). */
export interface HotelUpsertPayload {
  name: string;
  city: string;
  address: string;
  stars: number;
  status?: 'ACTIVE' | 'INACTIVE';
  managerId?: string | null;
}

/**
 * Backend `paginationSchema` enforces `limit` ≤ 100. The manage UI unions every
 * page via {@link fetchHotelsManageCatalog} so staff still see the full catalogue.
 */
export const MANAGE_HOTEL_LIST_PAGE_SIZE = 100;

/** @deprecated Prefer {@link fetchHotelsManageCatalog}; values above the API max are rejected. */
export const MANAGE_HOTELS_LIST_PARAMS = {
  page: 1,
  limit: MANAGE_HOTEL_LIST_PAGE_SIZE,
} satisfies HotelsListParams;

export const hotelsApi = {
  list(params: HotelsListParams): Promise<Paginated<Hotel>> {
    const search = buildQuery(params);
    return api.get<Paginated<Hotel>>(`/hotels${search}`);
  },
  detail(id: string): Promise<Hotel> {
    return api.get<Hotel>(`/hotels/${id}`);
  },
  roomTypes(hotelId: string): Promise<RoomType[]> {
    return api.get<RoomType[]>(`/hotels/${hotelId}/room-types`);
  },
  rooms(hotelId: string): Promise<Room[]> {
    return api.get<Room[]>(`/hotels/${hotelId}/rooms`);
  },
  /** Flat task-style listing: `GET /v1/rooms?hotelId=…` (same rows as nested route). */
  roomsByHotelFlat(hotelId: string): Promise<Room[]> {
    const sp = new URLSearchParams({ hotelId }).toString();
    return api.get<Room[]>(`/rooms?${sp}`);
  },
  availability(
    hotelId: string,
    range: { checkIn: string; checkOut: string },
  ): Promise<RoomTypeAvailability[]> {
    const sp = new URLSearchParams(range).toString();
    return api.get<RoomTypeAvailability[]>(`/hotels/${hotelId}/availability?${sp}`);
  },
  create(payload: HotelUpsertPayload): Promise<Hotel> {
    return api.post<Hotel>('/hotels', {
      ...payload,
      status: payload.status ?? 'ACTIVE',
    });
  },
  update(id: string, payload: Partial<HotelUpsertPayload>): Promise<Hotel> {
    return api.patch<Hotel>(`/hotels/${id}`, payload);
  },
  remove(id: string): Promise<void> {
    return api.delete(`/hotels/${id}`);
  },
};

export async function fetchHotelsManageCatalog(): Promise<Hotel[]> {
  const limit = MANAGE_HOTEL_LIST_PAGE_SIZE;
  let page = 1;
  const all: Hotel[] = [];
  for (;;) {
    const res = await hotelsApi.list({ page, limit, includeInactive: true });
    all.push(...res.data);
    if (page >= res.meta.totalPages) break;
    page += 1;
  }
  return all;
}

function buildQuery(params: HotelsListParams): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'boolean') {
      if (v) sp.set(k, 'true');
      continue;
    }
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      sp.set(k, v.join(','));
      continue;
    }
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
