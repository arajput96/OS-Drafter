import { useState, useEffect } from "react";
import type { RoomRole } from "@shared/types";
import { Home } from "./pages/home";
import { Room } from "./pages/room";
import { Overlay } from "./pages/overlay";

type Route =
  | { page: "home" }
  | { page: "room"; id: string; role: RoomRole }
  | { page: "overlay"; id: string; darkBg: boolean };

function resolveRoute(pathname: string, search: string): Route {
  const roomMatch = pathname.match(/^\/room\/([^/]+)\/overlay$/);
  if (roomMatch) {
    const params = new URLSearchParams(search);
    return { page: "overlay", id: roomMatch[1]!, darkBg: params.get("bg") === "dark" };
  }

  const roomPageMatch = pathname.match(/^\/room\/([^/]+)$/);
  if (roomPageMatch) {
    const params = new URLSearchParams(search);
    const role = params.get("role");
    const validRoles: RoomRole[] = ["blue", "red", "spectator"];
    const resolvedRole: RoomRole = validRoles.includes(role as RoomRole)
      ? (role as RoomRole)
      : "spectator";
    return { page: "room", id: roomPageMatch[1]!, role: resolvedRole };
  }

  return { page: "home" };
}

export function navigate(url: string): void {
  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function App() {
  const [route, setRoute] = useState<Route>(() =>
    resolveRoute(window.location.pathname, window.location.search),
  );

  useEffect(() => {
    const onPopState = () => {
      setRoute(resolveRoute(window.location.pathname, window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  switch (route.page) {
    case "home":
      return <Home />;
    case "room":
      return <Room id={route.id} role={route.role} />;
    case "overlay":
      return <Overlay id={route.id} darkBg={route.darkBg} />;
  }
}
