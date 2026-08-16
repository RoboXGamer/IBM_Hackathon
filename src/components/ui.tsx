import { For, type ParentProps } from "solid-js";
import type { JSX } from "@solidjs/web";

export function Card(props: ParentProps<{ class?: string }>) {
  return <section class={`panel ${props.class ?? ""}`}>{props.children}</section>;
}

export function IconBadge(props: {
  icon: string;
  tone?: "violet" | "green" | "blue" | "amber" | "rose";
  size?: "sm" | "md" | "lg";
}) {
  return <span class={`icon-badge icon-${props.tone ?? "violet"} icon-${props.size ?? "md"}`} aria-hidden="true">{props.icon}</span>;
}

export function Progress(props: { value: number; tone?: string; label?: string }) {
  return (
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={props.value} aria-label={props.label}>
      <span class={`progress-fill bg-${props.tone ?? "violet"}`} style={{ width: `${Math.min(100, Math.max(0, props.value))}%` }} />
    </div>
  );
}

export function Button(props: ParentProps<{
  variant?: "primary" | "secondary" | "ghost" | "success";
  class?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>;
  ariaLabel?: string;
}>) {
  return (
    <button type={props.type ?? "button"} class={`button button-${props.variant ?? "primary"} ${props.class ?? ""}`} disabled={props.disabled} onClick={props.onClick} aria-label={props.ariaLabel}>
      {props.children}
    </button>
  );
}

export function Avatar(props: { name: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const initials = () => props.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  return <span class={`avatar avatar-${props.size ?? "md"}`} style={{ "background-color": props.color ?? "#6d4aff" }} aria-label={props.name}>{initials()}</span>;
}

export function SkeletonLines(props: { count?: number }) {
  return (
    <div class="grid gap-3" aria-label="Loading">
      <For each={Array.from({ length: props.count ?? 3 })}>
        {(_, index) => <div class="skeleton" style={{ width: `${92 - index() * 13}%` }} />}
      </For>
    </div>
  );
}
