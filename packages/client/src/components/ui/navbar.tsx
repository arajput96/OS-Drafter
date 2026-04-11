"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@os-drafter/shared";

export function Navbar() {
  const pathname = usePathname();
  if (pathname.endsWith("/overlay")) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-12 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-bold text-gradient-hero">
          {APP_NAME}
        </Link>
      </div>
    </nav>
  );
}
