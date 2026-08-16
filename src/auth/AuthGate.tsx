import { Show, type ParentProps } from "solid-js";
import { useAuth } from "./context";
import { AuthScreen } from "./AuthScreen";

export function AuthGate(props: ParentProps) {
  const auth = useAuth();
  return (
    <Show when={!auth.isLoading()} fallback={<div class="app-loading"><div class="logo-mark">Q</div><strong>Securing your study space…</strong></div>}>
      <Show when={auth.isAuthenticated()} fallback={<AuthScreen />}>
        {props.children}
      </Show>
    </Show>
  );
}
