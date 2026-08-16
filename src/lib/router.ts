import { createSignal, onCleanup } from "solid-js";
import type { RoutePath } from "../types";

const validRoutes = new Set<RoutePath>(["/", "/notes", "/study", "/plan", "/quiz", "/performance"]);

function currentPath(): RoutePath {
  return validRoutes.has(window.location.pathname as RoutePath) ? (window.location.pathname as RoutePath) : "/";
}

export function createSpaRouter() {
  const [path, setPath] = createSignal<RoutePath>(currentPath());
  const onPopState = () => setPath(currentPath());
  window.addEventListener("popstate", onPopState);
  onCleanup(() => window.removeEventListener("popstate", onPopState));

  const navigate = (next: RoutePath) => {
    if (next === path()) return;
    window.history.pushState({}, "", next);
    setPath(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { path, navigate };
}
