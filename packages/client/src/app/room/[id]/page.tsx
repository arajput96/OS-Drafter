import type { RoomRole } from "@os-drafter/shared";
import { RoomClient } from "@/components/room/room-client";
import { redirect } from "next/navigation";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { id } = await params;
  const { role } = await searchParams;

  const validRoles: RoomRole[] = ["blue", "red", "spectator"];
  if (!role || !validRoles.includes(role as RoomRole)) {
    redirect(`/room/${id}?role=spectator`);
  }

  return <RoomClient roomId={id} role={role as RoomRole} />;
}
