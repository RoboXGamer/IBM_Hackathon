import { For, Show, createSignal } from "solid-js";
import type { AppData } from "../data/types";
import type { RoutePath } from "../types";
import { Button, Card, IconBadge, Progress } from "../components/ui";
import { createMutation } from "../convex";
import { api } from "../data/live";

const routeForTarget = (target: "notes" | "study" | "quiz" | "plan" | "performance"): RoutePath => target === "notes" ? "/notes" : target === "study" ? "/study" : target === "quiz" ? "/quiz" : target === "plan" ? "/plan" : "/performance";

export function TodayScreen(props: { navigate: (path: RoutePath) => void; data: AppData["dashboard"]; profile: AppData["profile"] }) {
  const [loadingSample, setLoadingSample] = createSignal(false);
  const [actionError, setActionError] = createSignal("");
  const loadSample = createMutation(api.profiles.loadSampleWorkspace);
  const toggleTask = createMutation(api.tasks.toggle);
  const activateQuiz = createMutation(api.quizzes.activate);
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const exploreSample = async () => {
    setLoadingSample(true); setActionError("");
    try { await loadSample({}); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : "Could not load the sample workspace"); }
    finally { setLoadingSample(false); }
  };

  const openQuiz = async (quizId: AppData["dashboard"]["suggestedQuizzes"][number]["_id"]) => {
    setActionError("");
    try { await activateQuiz({ quizSetId: quizId }); props.navigate("/quiz"); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : "Could not open that quiz"); }
  };

  return <div class="page-stack">
    <header class="page-header">
      <div><p class="eyebrow">{today}</p><h1>Welcome back, {props.profile.name.split(" ")[0]} <span aria-hidden="true">👋</span></h1><p>{props.data.isEmpty ? "Start with one useful action and build from there." : "Your next best study action is ready."}</p></div>
      <div class="header-actions"><div class="reward-pill"><span>🔥</span><strong>{props.profile.streak}</strong><small>day streak</small></div><div class="reward-pill"><span>☆</span><strong>{props.profile.points.toLocaleString()}</strong><small>points</small></div></div>
    </header>
    <Show when={actionError()}><div class="inline-notice error"><span>!</span><p>{actionError()}</p></div></Show>
    <Show when={!props.data.isEmpty} fallback={<EmptyDashboard navigate={props.navigate} loadingSample={loadingSample()} exploreSample={exploreSample} quickActions={props.data.quickActions} />}>
      <div class="dashboard-layout">
        <div class="main-column">
          <Card><div class="section-heading compact"><div><h2>Today’s study overview</h2><p>Live progress from completed work</p></div><span class="status-pill status-success">Synced</span></div><div class="stat-grid"><For each={props.data.stats}>{(stat) => <article class="stat-card"><div class="flex items-center gap-3"><IconBadge icon={stat.icon} tone={stat.tone} /><div><strong class="stat-value">{stat.value}</strong><span class="stat-label">{stat.label}</span></div></div><Progress value={stat.progress} tone={stat.tone} label={stat.label} /><small class={`text-${stat.tone}`}>{stat.detail}</small></article>}</For></div></Card>
          <Card><div class="section-heading"><div><h2>Today’s plan</h2><p>Complete tasks here or open the learning activity</p></div><button class="text-button" onClick={() => props.navigate("/plan")}>View full plan →</button></div><div class="timeline-list"><For each={props.data.tasks}>{(task) => <article class={`timeline-row ${task.completed ? "is-complete" : ""}`}><time>{task.time}</time><button class={`task-check ${task.completed ? "checked" : ""}`} onClick={() => void toggleTask({ taskId: task._id })} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}>{task.completed ? "✓" : ""}</button><div class="min-w-0"><strong>{task.title}</strong><small>{task.detail}</small></div><Button variant={task.completed ? "ghost" : "secondary"} onClick={() => props.navigate(routeForTarget(task.target))}>{task.completed ? "Review" : task.kind === "Quiz" ? "Start quiz" : "Continue"}</Button></article>}</For></div></Card>
          <Show when={props.data.suggestedQuizzes.length > 0}><Card><div class="section-heading"><div><h2>Suggested practice</h2><p>Pick a focused quiz and make the recommendation active</p></div></div><div class="practice-grid"><For each={props.data.suggestedQuizzes}>{(quiz) => <button class="practice-card" onClick={() => void openQuiz(quiz._id)}><span class="status-pill">{quiz.difficulty}</span><strong>{quiz.title}</strong><small>{quiz.questionCount} questions · {quiz.durationMinutes} min</small><span class="practice-arrow">↗</span></button>}</For></div></Card></Show>
        </div>
        <aside class="right-rail">
          <Show when={props.data.continueNote}>{(note) => <Card class="continue-card"><div class="section-heading compact"><div><h2>Continue learning</h2><p>Your most recent note</p></div></div><div class="file-summary"><IconBadge icon="▤" tone="green" /><div><strong>{note().fileName}</strong><small>{note().subject} · {note().grade}</small></div><span>{note().progress}%</span></div><Progress value={note().progress} label="Notes progress" /><Button variant="secondary" class="w-full" onClick={() => props.navigate("/notes")}>Open note library</Button></Card>}</Show>
          <Card><div class="section-heading compact"><div><h2>Quick actions</h2><p>Move directly to the work</p></div></div><div class="quick-grid"><For each={props.data.quickActions}>{(item) => <button onClick={() => item.target && props.navigate(routeForTarget(item.target))}><IconBadge icon={item.icon ?? "✦"} tone={item.tone ?? "violet"} /><small>{item.title}</small></button>}</For></div></Card>
          <Show when={props.data.focusAreas.length > 0}><Card><div class="section-heading compact"><div><h2>Focus areas</h2><p>Recommended from your performance</p></div></div><div class="focus-list"><For each={props.data.focusAreas}>{(topic) => <div><span>{topic.icon}</span><div><strong>{topic.name}</strong><Progress value={topic.score} tone={topic.score >= 70 ? "green" : "amber"} /></div><b>{topic.score}%</b></div>}</For></div></Card></Show>
          <Show when={props.data.tip}>{(tip) => <Card class="tip-card"><div class="flex gap-3"><IconBadge icon={tip().icon} size="lg" /><div><h2>{tip().title}</h2><p>{tip().body}</p></div></div></Card>}</Show>
        </aside>
      </div>
    </Show>
  </div>;
}

function EmptyDashboard(props: { navigate: (path: RoutePath) => void; loadingSample: boolean; exploreSample: () => Promise<void>; quickActions: AppData["dashboard"]["quickActions"] }) {
  return <div class="empty-dashboard">
    <Card class="empty-hero"><div class="empty-hero-copy"><span class="status-pill">Your workspace is ready</span><h2>Turn your first note into something you can actually study.</h2><p>Upload class material to keep your learning tied to your own content, or load the clearly labeled sample workspace to explore the complete flow.</p><div class="empty-actions"><Button onClick={() => props.navigate("/notes")}>↑ Upload my first note</Button><Button variant="secondary" disabled={props.loadingSample} onClick={() => void props.exploreSample()}>{props.loadingSample ? "Loading sample…" : "Explore sample workspace"}</Button></div></div><div class="empty-flow"><span><b>01</b> Add material</span><span><b>02</b> Understand it</span><span><b>03</b> Practice recall</span><span><b>04</b> Track mastery</span></div></Card>
    <div class="empty-quick-grid"><For each={props.quickActions}>{(item) => <Card><IconBadge icon={item.icon ?? "✦"} tone={item.tone ?? "violet"} /><div><h3>{item.title}</h3><p>{item.detail}</p></div></Card>}</For></div>
  </div>;
}
