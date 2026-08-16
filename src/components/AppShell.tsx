import { For, Show, createSignal, type Accessor, type ParentProps } from "solid-js";
import type { RoutePath } from "../types";
import { Avatar } from "./ui";
import type { AppData } from "../data/types";
import { useAuth } from "../auth/context";

const navItems: { path: RoutePath; label: string; sublabel: string; icon: string }[] = [
  { path: "/", label: "Today", sublabel: "Your daily overview", icon: "▣" },
  { path: "/notes", label: "My Notes", sublabel: "Upload & manage notes", icon: "▤" },
  { path: "/study", label: "AI Study Buddy", sublabel: "Explain & understand", icon: "✦" },
  { path: "/quiz", label: "Quizzes", sublabel: "Practice & learn", icon: "◉" },
  { path: "/plan", label: "Revision Plans", sublabel: "Smart study plans", icon: "◎" },
  { path: "/performance", label: "Performance", sublabel: "Track your progress", icon: "▥" },
];

export function AppShell(props: ParentProps<{ path: Accessor<RoutePath>; navigate: (path: RoutePath) => void; profile: AppData["profile"] }>) {
  const [menuOpen, setMenuOpen] = createSignal(false);
  const auth = useAuth();
  const go = (path: RoutePath) => {
    props.navigate(path);
    setMenuOpen(false);
  };

  return (
    <div class="min-h-screen bg-canvas text-ink">
      <header class="mobile-header">
        <button class="logo-mark" onClick={() => go("/")} aria-label="Go to today">Q</button>
        <span class="font-semibold">Quizzly</span>
        <button class="icon-button" onClick={() => setMenuOpen(!menuOpen())} aria-expanded={menuOpen() ? "true" : "false"} aria-label="Toggle menu">{menuOpen() ? "×" : "☰"}</button>
      </header>

      <Show when={menuOpen()}><button class="mobile-overlay" onClick={() => setMenuOpen(false)} aria-label="Close navigation" /></Show>

      <aside class={`sidebar ${menuOpen() ? "sidebar-open" : ""}`}>
        <button class="brand" onClick={() => go("/")} aria-label="Quizzly home">
          <span class="logo-mark">Q</span>
          <span><strong>Quizzly</strong><small>AI study companion</small></span>
        </button>

        <nav class="sidebar-nav" aria-label="Primary navigation">
          <For each={navItems}>
            {(item) => (
              <button class={`nav-item ${props.path() === item.path ? "nav-item-active" : ""}`} onClick={() => go(item.path)}>
                <span class="nav-icon" aria-hidden="true">{item.icon}</span>
                <span><strong>{item.label}</strong><small>{item.sublabel}</small></span>
              </button>
            )}
          </For>
        </nav>

        <div class="sidebar-support"><span class="nav-icon">?</span><span><strong>Need help?</strong><small>Open study guide</small></span></div>
        <button class="profile-chip" onClick={() => void auth.signOut()} title="Sign out">
          <Avatar name={props.profile.name} size="lg" color={props.profile.avatarColor} />
          <span><strong>{props.profile.name}</strong><small>Level {props.profile.level} · {props.profile.points.toLocaleString()} pts</small></span>
          <span class="ml-auto text-muted">↪</span>
        </button>
      </aside>

      <main class="app-main">{props.children}</main>

      <nav class="bottom-nav" aria-label="Mobile navigation">
        <For each={navItems.slice(0, 5)}>
          {(item) => (
            <button class={props.path() === item.path ? "active" : ""} onClick={() => go(item.path)}>
              <span aria-hidden="true">{item.icon}</span><small>{item.label.replace("My ", "")}</small>
            </button>
          )}
        </For>
      </nav>
    </div>
  );
}
