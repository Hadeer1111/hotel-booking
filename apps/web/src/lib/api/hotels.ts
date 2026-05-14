import type {
  Hotel,
  Paginated,
  Room,
  RoomType,
  RoomTypeAvailability,
} from '@hotel-booking/types';
import { api } from './client';

export interface HotelsListParams extends Record<string, string | number | undefined> {
  page?: number;
  limit?: number;
  q?: string;
  city?: string;
}

export const hotelsApi = {
  list(params: HotelsListParams): Promise<Paginated<Hotel>> {
    const search = buildQuery(params);
    return api.get<Paginated<Hotel>>(`/hotels${search}`, { skipAuth: true });
  },
  detail(id: string): Promise<Hotel> {
    return api.get<Hotel>(`/hotels/${id}`, { skipAuth: true });
  },
  roomTypes(hotelId: string): Promise<RoomType[]> {
    return api.get<RoomType[]>(`/hotels/${hotelId}/room-types`, { skipAuth: true });
  },
  rooms(hotelId: string): Promise<Room[]> {
    return api.get<Room[]>(`/hotels/${hotelId}/rooms`);
  },
  availability(
    hotelId: string,
    range: { checkIn: string; checkOut: string },
  ): Promise<RoomTypeAvailability[]> {
    const sp = new URLSearchParams(range).toString();
    return api.get<RoomTypeAvailability[]>(`/hotels/${hotelId}/availability?${sp}`, {
      skipAuth: true,
    });
  },
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
