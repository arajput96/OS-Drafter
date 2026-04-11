export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="overlay-root min-h-screen bg-[#0d0d12]">{children}</div>;
}
