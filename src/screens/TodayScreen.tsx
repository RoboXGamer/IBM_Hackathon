import { For, Show } from "solid-js";
import type { AppData } from "../data/types";
import type { RoutePath } from "../types";
import { Button, Card, IconBadge, Progress } from "../components/ui";

const routeForTarget = (target: "notes" | "study" | "quiz" | "plan" | "performance"): RoutePath => target === "notes" ? "/notes" : target === "study" ? "/study" : target === "quiz" ? "/quiz" : target === "plan" ? "/plan" : "/performance";

export function TodayScreen(props: { navigate: (path: RoutePath) => void; data: AppData["dashboard"]; profile: AppData["profile"] }) {
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <div class="page-stack">
      <header class="page-header">
        <div><p class="eyebrow">{today}</p><h1>Good morning, {props.profile.name} <span aria-hidden="true">👋</span></h1><p>Let’s make today a productive study day.</p></div>
        <div class="header-actions"><div class="reward-pill"><span>🔥</span><strong>{props.profile.streak}</strong><small>day streak</small></div><div class="reward-pill"><span>☆</span><strong>{props.profile.points.toLocaleString()}</strong><small>points</small></div><button class="icon-button notification-button" aria-label={`${props.profile.notificationCount} notifications`}>♢<Show when={props.profile.notificationCount > 0}><span /></Show></button></div>
      </header>
      <div class="dashboard-layout">
        <div class="main-column">
          <Card><div class="section-heading compact"><div><h2>Today’s study overview</h2><p>Small steps add up to big progress.</p></div><span class="status-pill status-success">Live from Convex</span></div><div class="stat-grid"><For each={props.data.stats}>{(stat) => <article class="stat-card"><div class="flex items-center gap-3"><IconBadge icon={stat.icon} tone={stat.tone} /><div><strong class="stat-value">{stat.value}</strong><span class="stat-label">{stat.label}</span></div></div><Progress value={stat.progress} tone={stat.tone} label={stat.label} /><small class={`text-${stat.tone}`}>{stat.detail}</small></article>}</For></div></Card>
          <Card><div class="section-heading"><div><h2>Today’s plan</h2><p>Your personalized tasks for today</p></div><button class="text-button" onClick={() => props.navigate("/plan")}>View full plan →</button></div><div class="timeline-list"><For each={props.data.tasks}>{(task) => <article class={`timeline-row ${task.completed ? "is-complete" : ""}`}><time>{task.time}</time><IconBadge icon={task.completed ? "✓" : task.kind === "Quiz" ? "☷" : task.kind === "Explain" ? "✦" : "▣"} tone={task.completed ? "green" : task.kind === "Explain" ? "amber" : task.kind === "Quiz" ? "green" : "violet"} /><div class="min-w-0"><strong>{task.title}</strong><small>{task.detail}</small></div>{task.completed ? <span class="status-pill status-success">✓ Complete</span> : <Button variant="secondary" onClick={() => props.navigate(routeForTarget(task.target))}>{task.kind === "Quiz" ? "Start quiz" : "Continue"}</Button>}</article>}</For></div></Card>
          <Card><div class="section-heading"><div><h2>Suggested practice</h2><p>Based on your notes and weak areas</p></div><button class="text-button" onClick={() => props.navigate("/quiz")}>View all →</button></div><div class="practice-grid"><For each={props.data.suggestedQuizzes}>{(quiz) => <button class="practice-card" onClick={() => props.navigate("/quiz")}><span class="status-pill">{quiz.difficulty}</span><strong>{quiz.title}</strong><small>{quiz.questionCount} questions · {quiz.durationMinutes} min</small><span class="practice-arrow">↗</span></button>}</For></div></Card>
        </div>
        <aside class="right-rail">
          <Show when={props.data.continueNote}>{(note) => <Card class="continue-card"><div class="section-heading compact"><div><h2>Continue learning</h2><p>Pick up where you left off</p></div></div><div class="file-summary"><IconBadge icon="▤" tone="green" /><div><strong>{note().fileName}</strong><small>{note().subject} · {note().grade}</small></div><span>{note().progress}%</span></div><Progress value={note().progress} label="Notes progress" /><Button variant="secondary" class="w-full" onClick={() => props.navigate("/study")}>Open notes</Button></Card>}</Show>
          <Card><div class="section-heading compact"><div><h2>Quick actions</h2><p>Jump right in</p></div></div><div class="quick-grid"><For each={props.data.quickActions}>{(item) => <button onClick={() => item.target && props.navigate(routeForTarget(item.target))}><IconBadge icon={item.icon ?? "✦"} tone={item.tone ?? "violet"} /><small>{item.title}</small></button>}</For></div></Card>
          <Card><div class="section-heading compact"><div><h2>Focus areas</h2><p>Recommended from your performance</p></div></div><div class="focus-list"><For each={props.data.focusAreas}>{(topic) => <div><span>{topic.icon}</span><div><strong>{topic.name}</strong><Progress value={topic.score} tone={topic.score >= 70 ? "green" : "amber"} /></div><b>{topic.score}%</b></div>}</For></div></Card>
          <Show when={props.data.tip}>{(tip) => <Card class="tip-card"><div class="flex gap-3"><IconBadge icon={tip().icon} size="lg" /><div><h2>{tip().title}</h2><p>{tip().body}</p></div></div></Card>}</Show>
        </aside>
      </div>
    </div>
  );
}
