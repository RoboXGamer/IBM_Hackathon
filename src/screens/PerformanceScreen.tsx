import { For, Show, createSignal } from "solid-js";
import type { RoutePath } from "../types";
import type { AppData } from "../data/types";
import { Button, Card, IconBadge, Progress } from "../components/ui";

export function PerformanceScreen(props: { navigate: (path: RoutePath) => void; data: AppData["performance"] }) {
  const [period, setPeriod] = createSignal("Last 7 days");
  const exportReport = () => {
    const rows = ["Topic,Mastery,Trend", ...props.data.mastery.map((topic) => `${topic.name},${topic.score}%,${topic.trend}%`)];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "quizzly-performance.csv"; link.click(); URL.revokeObjectURL(url);
  };
  const toneFor = (score: number) => score >= 70 ? "green" as const : "amber" as const;

  return (
    <div class="page-stack">
      <header class="page-header"><div><p class="eyebrow">Learning analytics</p><h1>Performance <span aria-hidden="true">▥</span></h1><p>Track your learning progress and turn insights into action.</p></div><div class="header-actions"><label class="period-select"><span>▣</span><select value={period()} onChange={(event) => setPeriod(event.currentTarget.value)}><option>Last 7 days</option><option>Last 30 days</option><option>This term</option></select></label><Button variant="secondary" onClick={exportReport}>↗ Export report</Button></div></header>
      <div class="metrics-grid"><For each={props.data.metrics}>{(metric) => <Card class="metric-card"><IconBadge icon={metric.icon} tone={metric.tone} size="lg" /><div><small>{metric.label}</small><strong>{metric.value}</strong><span>{metric.change}</span></div><Progress value={metric.progress} tone={metric.tone} /></Card>}</For></div>
      <div class="dashboard-layout performance-layout">
        <div class="main-column">
          <Card><div class="section-heading"><div><h2>Accuracy trend</h2><p>Your quiz accuracy over the recorded period</p></div><span class="status-pill">{period()}</span></div><div class="trend-chart" aria-label="Quiz accuracy trend"><div class="chart-grid-lines"><span>100%</span><span>75%</span><span>50%</span><span>25%</span></div><div class="chart-points"><For each={props.data.activity}>{(item, index) => <div class="chart-point" style={{ left: `${index() * (100 / Math.max(1, props.data.activity.length - 1))}%`, bottom: `${item.accuracy}%` }}><b>{item.accuracy}%</b><i /><small>{item.label}</small></div>}</For></div><div class="chart-line" /></div></Card>
          <div class="split-grid">
            <Card><div class="section-heading compact"><div><h2>Topic mastery</h2><p>Where your learning stands</p></div></div><div class="mastery-list"><For each={props.data.mastery}>{(topic) => <div><IconBadge icon={topic.icon} tone={toneFor(topic.score)} size="sm" /><strong>{topic.name}</strong><Progress value={topic.score} tone={toneFor(topic.score)} /><b>{topic.score}%</b><span class={`status-pill ${topic.score > 70 ? "status-success" : "status-warning"}`}>{topic.score > 85 ? "Excellent" : topic.score > 70 ? "Good" : "Needs work"}</span></div>}</For></div></Card>
            <Card><div class="section-heading compact"><div><h2>Recent quiz results</h2><p>Your latest attempts</p></div></div><div class="results-table"><div class="table-head"><span>Quiz</span><span>Score</span><span>Status</span><span>Change</span></div><For each={props.data.attempts}>{(row) => { const percent = Math.round(row.score / Math.max(1, row.total) * 100); return <div><span><strong>{row.title}</strong><small>{row.subject} · {row.total} questions</small></span><b class={percent < 60 ? "text-amber" : "text-green"}>{percent}%</b><span class="status-pill status-success">✓ Done</span><b class={row.change < 0 ? "text-rose" : "text-green"}>{row.change >= 0 ? "↑" : "↓"} {Math.abs(row.change)}%</b></div>; }}</For></div></Card>
          </div>
          <Card class="focus-cta"><IconBadge icon="◎" size="lg" /><div><h2>Focus on your weak topics</h2><p>{props.data.mastery.filter((topic) => topic.score < 70).map((topic) => topic.name).join(" and ") || "Keep strengthening every topic"}</p></div><Button onClick={() => props.navigate("/plan")}>Open revision plan</Button></Card>
        </div>
        <aside class="right-rail">
          <Card><div class="section-heading compact"><div><h2>AI insights</h2><p>Personalized for you</p></div><IconBadge icon="✦" /></div><div class="insight-list"><For each={props.data.insights}>{(insight) => <div><IconBadge icon={insight.icon} tone={insight.tone} /><span><small>{insight.label}</small><strong>{insight.title}</strong><b class={insight.tone === "amber" ? "text-amber" : ""}>{insight.detail}</b><Show when={insight.actionLabel && insight.target}>{(actionLabel) => <button class="text-button" onClick={() => props.navigate(`/${insight.target}` as RoutePath)}>{actionLabel()} →</button>}</Show></span></div>}</For></div></Card>
          <Show when={props.data.milestone}>{(milestone) => <Card class="milestone-card"><div class="section-heading compact"><div><h2>Milestone</h2><p>Celebrate the consistency</p></div></div><div class="milestone"><span>{milestone().icon}</span><div><h3>{milestone().title}</h3><p>{milestone().body}</p></div></div></Card>}</Show>
          <Card><div class="section-heading compact"><div><h2>This week</h2><p>Compared with the first recorded day</p></div></div><div class="week-score"><span>Accuracy changed by</span><strong>{props.data.weekImprovement >= 0 ? "+" : ""}{props.data.weekImprovement}%</strong><small>{props.data.totalPoints.toLocaleString()} learning points recorded.</small><div class="mini-chart"><For each={props.data.activity.slice(-5)}>{(item) => <i style={{ height: `${Math.max(10, item.accuracy)}%` }} />}</For></div></div></Card>
        </aside>
      </div>
    </div>
  );
}
