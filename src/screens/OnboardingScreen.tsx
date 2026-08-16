import { For, Show, createSignal } from "solid-js";
import { Button, IconBadge } from "../components/ui";
import { createMutation } from "../convex";
import { api } from "../data/live";

const subjectOptions = ["Biology", "Chemistry", "Physics", "Mathematics", "Computer Science", "English"];

export function OnboardingScreen(props: { name: string }) {
  const [grade, setGrade] = createSignal("Class 11");
  const [dailyGoalMinutes, setDailyGoalMinutes] = createSignal(60);
  const [subjects, setSubjects] = createSignal<string[]>([]);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");
  const complete = createMutation(api.profiles.completeOnboarding);

  const toggleSubject = (subject: string) => setSubjects((current) => current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]);
  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (subjects().length === 0) { setError("Choose at least one subject so recommendations feel relevant."); return; }
    setSaving(true); setError("");
    try { await complete({ grade: grade(), dailyGoalMinutes: dailyGoalMinutes(), subjects: subjects() }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your preferences"); }
    finally { setSaving(false); }
  };

  return <main class="onboarding-page">
    <section class="onboarding-shell">
      <div class="onboarding-copy"><span class="logo-mark">Q</span><p class="eyebrow">Two-minute setup</p><h1>Let’s shape Quizzly around you, {props.name.split(" ")[0]}.</h1><p>No fake progress and no generic plan. Your workspace starts from your grade, your subjects, and the time you actually have.</p><div class="onboarding-promise"><span><IconBadge icon="1" size="sm" />Choose your learning context</span><span><IconBadge icon="2" size="sm" />Upload a real note or explore a sample</span><span><IconBadge icon="3" size="sm" />Build progress through completed work</span></div></div>
      <form class="onboarding-form" onSubmit={submit}>
        <div><p class="eyebrow">Step 1 of 1</p><h2>Personalize your study space</h2><p>These choices guide your goals and recommendations.</p></div>
        <label><span>Your class or grade</span><select value={grade()} onChange={(event) => setGrade(event.currentTarget.value)}><option>Class 9</option><option>Class 10</option><option>Class 11</option><option>Class 12</option><option>College</option><option>Other</option></select></label>
        <fieldset><legend>Subjects you’re focusing on</legend><div class="subject-picker"><For each={subjectOptions}>{(subject) => <button type="button" class={subjects().includes(subject) ? "selected" : ""} onClick={() => toggleSubject(subject)}>{subjects().includes(subject) ? "✓ " : "+ "}{subject}</button>}</For></div></fieldset>
        <label><span>Daily study goal</span><div class="goal-control"><input type="range" min="15" max="180" step="15" value={dailyGoalMinutes()} onInput={(event) => setDailyGoalMinutes(Number(event.currentTarget.value))} /><strong>{dailyGoalMinutes()} min</strong></div></label>
        <Show when={error()}><p class="auth-error">{error()}</p></Show>
        <Button type="submit" class="w-full" disabled={saving()}>{saving() ? "Creating your workspace…" : "Enter my study space →"}</Button>
      </form>
    </section>
  </main>;
}
