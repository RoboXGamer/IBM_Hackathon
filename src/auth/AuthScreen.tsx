import { Show, createSignal } from "solid-js";
import { authClient } from "./client";
import { Button } from "../components/ui";

export function AuthScreen() {
  const [mode, setMode] = createSignal<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal("");

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = mode() === "sign-up"
        ? await authClient.signUp.email({ name: name().trim(), email: email().trim(), password: password() })
        : await authClient.signIn.email({ email: email().trim(), password: password() });
      if (result.error) setError(result.error.message ?? "Authentication failed");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <main class="auth-page">
      <section class="auth-brand-panel">
        <div class="logo-mark">Q</div>
        <p class="eyebrow">Your AI study companion</p>
        <h1>Turn every note into a smarter study plan.</h1>
        <p>Upload your material, understand difficult ideas, practice actively, and let your plan adapt to your progress.</p>
        <div class="auth-benefits"><span>✦ AI explanations from your notes</span><span>◎ Revision plans that update with you</span><span>✓ Private progress saved to your account</span></div>
      </section>
      <section class="auth-form-panel">
        <div class="auth-card">
          <div><p class="eyebrow">Welcome to Quizzly</p><h2>{mode() === "sign-in" ? "Continue learning" : "Create your study space"}</h2><p>{mode() === "sign-in" ? "Sign in to access your notes and progress." : "Your personal learning workspace is one step away."}</p></div>
          <form onSubmit={submit}>
            <Show when={mode() === "sign-up"}><label><span>Name</span><input value={name()} onInput={(event) => setName(event.currentTarget.value)} required placeholder="Your name" autocomplete="name" /></label></Show>
            <label><span>Email</span><input value={email()} onInput={(event) => setEmail(event.currentTarget.value)} required type="email" placeholder="you@example.com" autocomplete="email" /></label>
            <label><span>Password</span><input value={password()} onInput={(event) => setPassword(event.currentTarget.value)} required minlength="8" type="password" placeholder="At least 8 characters" autocomplete={mode() === "sign-in" ? "current-password" : "new-password"} /></label>
            <Show when={error()}><p class="auth-error">{error()}</p></Show>
            <Button type="submit" class="w-full" disabled={pending()}>{pending() ? "Please wait…" : mode() === "sign-in" ? "Sign in" : "Create account"}</Button>
          </form>
          <p class="auth-switch">{mode() === "sign-in" ? "New to Quizzly?" : "Already have an account?"} <button onClick={() => { setMode(mode() === "sign-in" ? "sign-up" : "sign-in"); setError(""); }}>{mode() === "sign-in" ? "Create account" : "Sign in"}</button></p>
        </div>
      </section>
    </main>
  );
}
