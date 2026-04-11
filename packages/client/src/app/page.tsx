import { HomeTabs } from "@/components/home/home-tabs";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-4 overflow-hidden">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />
      <HomeTabs />
    </main>
  );
}
