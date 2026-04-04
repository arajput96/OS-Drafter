export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="overlay-root">{children}</div>;
}
