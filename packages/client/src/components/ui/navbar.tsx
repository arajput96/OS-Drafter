"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  // Hide navbar on OBS overlay pages
  if (pathname.endsWith("/overlay")) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-12 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-full items-center px-4">
        <Link href="/" className="text-sm font-bold text-gradient-hero">
          OS Drafter
        </Link>
      </div>
    </nav>
  );
}
