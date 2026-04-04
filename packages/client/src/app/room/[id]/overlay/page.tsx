import { OverlayClient } from "@/components/overlay/overlay-client";

export default async function OverlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bg?: string }>;
}) {
  const { id } = await params;
  const { bg } = await searchParams;

  return <OverlayClient roomId={id} darkBg={bg === "dark"} />;
}
