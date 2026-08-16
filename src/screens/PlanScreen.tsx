import { For, Show, createMemo, createSignal } from "solid-js";
import type { RoutePath } from "../types";
import type { AppData } from "../data/types";
import { Button, Card, IconBadge, Progress } from "../components/ui";
import { createMutation } from "../convex";
import { api } from "../data/live";

export function PlanScreen(props: { navigate: (path: RoutePath) => void; data: AppData["plan"] }) {
  const toggleTask = createMutation(api.plans.toggleTask);
  const resetPlan = createMutation(api.plans.reset);
  const [notice, setNotice] = createSignal("");
  const [resetting, setResetting] = createSignal(false);
  const totalMinutes = createMemo(() => props.data?.tasks.reduce((sum, task) => sum + task.durationMinutes, 0) ?? 0);
  const topicCount = createMemo(() => new Set(props.data?.tasks.flatMap((task) => task.topics) ?? []).size);
  const exportPlan = () => {
    const plan = props.data;
    if (!plan) return;
    const rows = ["Day,Session,Topics,Minutes,Completed", ...plan.tasks.map((task) => `${task.day},"${task.title}","${task.topics.join("; ")}",${task.durationMinutes},${task.completed ? "Yes" : "No"}`)];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = `${plan.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-revision-plan.csv`; link.click(); URL.revokeObjectURL(url);
    setNotice("Revision plan exported.");
  };
  const reset = async () => {
    const plan = props.data;
    if (!plan || !window.confirm("Reset every session in this plan to incomplete?")) return;
    setResetting(true); setNotice("");
    try { await resetPlan({ planId: plan._id }); setNotice("Plan progress reset. Start again whenever you’re ready."); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Could not reset this plan"); }
    finally { setResetting(false); }
  };

  return (
    <Show when={props.data} fallback={<Card><h2>No revision plan yet</h2><p>Upload notes to create a personalized plan.</p><Button onClick={() => props.navigate("/notes")}>Upload notes</Button></Card>}>
      {(plan) => <div class="page-stack">
        <header class="study-toolbar"><Button variant="ghost" onClick={() => props.navigate("/notes")}>← Back to notes</Button><div class="document-picker"><IconBadge icon="▤" size="sm" />{plan().topic} — {plan().subject}</div><Button variant="ghost" onClick={() => props.navigate("/performance")}>View progress</Button></header>
        <div class="content-with-rail">
          <div class="main-column">
            <Card>
              <div class="section-heading"><div class="flex items-center gap-3"><IconBadge icon="◎" size="lg" /><div><h1 class="section-title">Your AI revision plan</h1><p>Personalized to help you master {plan().topic}</p></div></div><div class="flex gap-2"><Button variant="secondary" disabled={resetting()} onClick={() => void reset()}>{resetting() ? "Resetting…" : "↻ Reset progress"}</Button><Button variant="secondary" onClick={exportPlan}>↗ Export</Button></div></div>
              <Show when={notice()}><div class="inline-notice"><span>i</span><p>{notice()}</p><button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div></Show>
              <div class="plan-banner"><span class="banner-spark">✦</span><div><strong>Study smart, not hard.</strong><p>This plan balances topic difficulty, exam importance, and spaced repetition.</p></div><div class="target-art">◎<span>➤</span></div></div>
              <div class="plan-summary-grid">
                <article><IconBadge icon="◷" size="lg" /><div><small>Total duration</small><strong>{plan().durationDays} days</strong><span>{Math.round(totalMinutes() / Math.max(1, plan().durationDays))} min/day</span></div></article>
                <article><IconBadge icon="✓" tone="green" size="lg" /><div><small>Study sessions</small><strong>{plan().tasks.length}</strong><span>{plan().completedCount} complete</span></div></article>
                <article><IconBadge icon="▥" tone="blue" size="lg" /><div><small>Topics covered</small><strong>{topicCount()}</strong><span>{plan().subject}</span></div></article>
                <article><IconBadge icon="☆" tone="amber" size="lg" /><div><small>Confidence goal</small><strong>{plan().confidenceGoal}%+</strong><span>Target score</span></div></article>
              </div>
              <div class="section-heading schedule-heading"><div><h2>{plan().durationDays}-day revision schedule</h2><p>Mark each session as you complete it</p></div><span class="status-pill status-success">{plan().completedCount} of {plan().tasks.length} done</span></div>
              <div class="revision-list"><For each={plan().tasks}>{(task) => <article class={task.completed ? "is-complete" : ""}><span class="day-badge">Day {task.day}</span><div><strong>{task.title}</strong><p>{task.topics.join(" · ")}</p></div><span class="duration-pill">{task.durationMinutes} min</span><button class={`check-button ${task.completed ? "checked" : ""}`} onClick={() => void toggleTask({ taskId: task._id })} aria-label={`${task.completed ? "Mark incomplete" : "Complete"} day ${task.day}`}>{task.completed ? "✓" : ""}</button></article>}</For></div>
              <div class="plan-reminder"><span>▣</span> Review this plan daily and keep marking your progress. Consistency is the key.</div>
            </Card>
          </div>
          <aside class="right-rail">
            <Card class="progress-ring-card"><h2>Plan progress</h2><div class="progress-ring" style={{ "--progress": `${plan().progress * 3.6}deg` }}><span><strong>{plan().progress}%</strong><small>{plan().completedCount} of {plan().tasks.length} days</small></span></div><Progress value={plan().progress} label="Plan progress" /><p>{plan().progress >= 50 ? "Excellent momentum—keep it up!" : "You’re building a strong rhythm."}</p></Card>
            <Show when={plan().nextTask}>{(task) => <Card><div class="section-heading compact"><div><h2>Next up</h2><p>Day {task().day} · {task().durationMinutes} minutes</p></div><IconBadge icon="◷" size="sm" /></div><h3 class="next-title">{task().title}</h3><Button class="w-full" onClick={() => props.navigate("/study")}>▶ Start study session</Button></Card>}</Show>
            <Card><div class="section-heading compact"><div><h2>Spaced repetition</h2><p>Upcoming reviews</p></div></div><div class="review-list"><For each={plan().reviews}>{(review) => <div><span>{review.title}</span><b>{review.detail}</b></div>}</For></div></Card>
          </aside>
        </div>
      </div>}
    </Show>
  );
}
