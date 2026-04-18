import { OverlayClient } from "@/components/overlay/overlay-client";

export default async function OverlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bg?: string; v?: string }>;
}) {
  const { id } = await params;
  const { bg, v } = await searchParams;

  return <OverlayClient roomId={id} darkBg={bg === "dark"} version={v === "1" ? "v1" : "v2"} />;
}
