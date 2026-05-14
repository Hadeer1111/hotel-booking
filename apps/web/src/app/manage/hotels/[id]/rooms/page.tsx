'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Room, RoomType } from '@hotel-booking/types';
import { api } from '@/lib/api/client';
import { hotelsApi } from '@/lib/api/hotels';
import { queryKeys } from '@/lib/api/query-keys';
import { RouteGuard } from '@/components/auth/route-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/format';

export default function ManageRoomsPage() {
  return (
    <RouteGuard allow={['ADMIN', 'MANAGER']}>
      <Inner />
    </RouteGuard>
  );
}

function Inner() {
  const params = useParams<{ id: string }>();
  const hotelId = params.id;
  const qc = useQueryClient();
  const { toast } = useToast();

  const hotelQuery = useQuery({
    queryKey: queryKeys.hotels.detail(hotelId),
    queryFn: () => hotelsApi.detail(hotelId),
  });
  const typesQuery = useQuery({
    queryKey: queryKeys.hotels.roomTypes(hotelId),
    queryFn: () => hotelsApi.roomTypes(hotelId),
  });
  const roomsQuery = useQuery({
    queryKey: queryKeys.hotels.rooms(hotelId),
    queryFn: () => hotelsApi.rooms(hotelId),
  });

  const createType = useMutation({
    mutationFn: (dto: {
      name: string;
      capacity: number;
      basePricePerNight: number;
      description?: string;
    }) => api.post<RoomType>(`/hotels/${hotelId}/room-types`, dto),
    onMutate: async (dto) => {
      await qc.cancelQueries({ queryKey: queryKeys.hotels.roomTypes(hotelId) });
      const previous = qc.getQueryData<RoomType[]>(queryKeys.hotels.roomTypes(hotelId));
      const optimistic: RoomType = {
        id: `tmp-${Date.now()}`,
        hotelId,
        name: dto.name,
        description: dto.description ?? null,
        capacity: dto.capacity,
        basePricePerNight: dto.basePricePerNight,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<RoomType[]>(
        queryKeys.hotels.roomTypes(hotelId),
        (prev) => [...(prev ?? []), optimistic],
      );
      return { previous };
    },
    onError: (err, _dto, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.hotels.roomTypes(hotelId), ctx.previous);
      toast({
        title: 'Could not create room type',
        description: (err as Error).message,
        variant: 'destructive',
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.hotels.roomTypes(hotelId) }),
  });

  const createRoom = useMutation({
    mutationFn: (dto: { roomTypeId: string; roomNumber: string }) =>
      api.post<Room>(`/hotels/${hotelId}/rooms`, dto),
    onMutate: async (dto) => {
      await qc.cancelQueries({ queryKey: queryKeys.hotels.rooms(hotelId) });
      const previous = qc.getQueryData<Room[]>(queryKeys.hotels.rooms(hotelId));
      const optimistic: Room = {
        id: `tmp-${Date.now()}`,
        roomTypeId: dto.roomTypeId,
        roomNumber: dto.roomNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<Room[]>(
        queryKeys.hotels.rooms(hotelId),
        (prev) => [...(prev ?? []), optimistic],
      );
      return { previous };
    },
    onError: (err, _dto, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.hotels.rooms(hotelId), ctx.previous);
      toast({
        title: 'Could not add room',
        description: (err as Error).message,
        variant: 'destructive',
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.hotels.rooms(hotelId) }),
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Manage</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {hotelQuery.data?.name ?? 'Hotel'}
        </h1>
        <p className="text-muted-foreground">
          Add room types (categories) and physical rooms.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add room type</CardTitle>
          </CardHeader>
          <CardContent>
            <RoomTypeForm
              onSubmit={(dto) => createType.mutate(dto)}
              pending={createType.isPending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add room</CardTitle>
          </CardHeader>
          <CardContent>
            <RoomForm
              types={typesQuery.data ?? []}
              onSubmit={(dto) => createRoom.mutate(dto)}
              pending={createRoom.isPending}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Room types</CardTitle>
        </CardHeader>
        <CardContent>
          {typesQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Price / night</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(typesQuery.data ?? []).map((rt) => (
                  <TableRow key={rt.id}>
                    <TableCell className="font-medium">{rt.name}</TableCell>
                    <TableCell>{rt.capacity}</TableCell>
                    <TableCell>{formatCurrency(Number(rt.basePricePerNight))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {roomsQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room number</TableHead>
                  <TableHead>Room type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(roomsQuery.data ?? []).map((r) => {
                  const type = (typesQuery.data ?? []).find((t) => t.id === r.roomTypeId);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.roomNumber}</TableCell>
                      <TableCell>{type?.name ?? '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RoomTypeForm({
  onSubmit,
  pending,
}: {
  onSubmit: (dto: {
    name: string;
    capacity: number;
    basePricePerNight: number;
    description?: string;
  }) => void;
  pending: boolean;
}) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(2);
  const [price, setPrice] = useState(100);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), capacity, basePricePerNight: price });
        setName('');
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="rt-name">Name</Label>
        <Input id="rt-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rt-cap">Capacity</Label>
          <Input
            id="rt-cap"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rt-price">Price / night</Label>
          <Input
            id="rt-price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add room type'}
      </Button>
    </form>
  );
}

function RoomForm({
  types,
  onSubmit,
  pending,
}: {
  types: RoomType[];
  onSubmit: (dto: { roomTypeId: string; roomNumber: string }) => void;
  pending: boolean;
}) {
  const [roomTypeId, setRoomTypeId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!roomTypeId || !roomNumber.trim()) return;
        onSubmit({ roomTypeId, roomNumber: roomNumber.trim() });
        setRoomNumber('');
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="r-type">Room type</Label>
        <select
          id="r-type"
          value={roomTypeId}
          onChange={(e) => setRoomTypeId(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">— select —</option>
          {types.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="r-num">Room number</Label>
        <Input id="r-num" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending || types.length === 0}>
        {pending ? 'Adding…' : 'Add room'}
      </Button>
    </form>
  );
}
