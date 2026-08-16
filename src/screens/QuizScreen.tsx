import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import type { RoutePath } from "../types";
import type { AppData } from "../data/types";
import { Avatar, Button, Card, IconBadge, Progress } from "../components/ui";
import { createMutation } from "../convex";
import { api } from "../data/live";

type AnswerResult = { correct: boolean; correctAnswer: number; explanation: string; points: number };

export function QuizScreen(props: { navigate: (path: RoutePath) => void; data: AppData["quiz"] }) {
  const [index, setIndex] = createSignal(0);
  const [selected, setSelected] = createSignal<number | null>(null);
  const [result, setResult] = createSignal<AnswerResult>();
  const [score, setScore] = createSignal(0);
  const [finished, setFinished] = createSignal(false);
  const [checking, setChecking] = createSignal(false);
  const [finishing, setFinishing] = createSignal(false);
  const [error, setError] = createSignal("");
  const [timeLeft, setTimeLeft] = createSignal(0);
  const submitAnswer = createMutation(api.quizzes.submitAnswer);
  const recordAttempt = createMutation(api.quizzes.recordAttempt);
  const question = createMemo(() => props.data?.questions[index()]);
  const total = createMemo(() => props.data?.questions.length ?? 0);
  const progress = createMemo(() => total() ? Math.round(((index() + (result() ? 1 : 0)) / total()) * 100) : 0);
  const secondsPerQuestion = createMemo(() => Math.max(20, Math.round((props.data?.durationMinutes ?? 1) * 60 / Math.max(1, total()))));

  createEffect(() => ({ questionId: question()?._id, answered: Boolean(result()), done: finished() }), (state) => {
    if (!state.questionId || state.answered || state.done) return;
    setTimeLeft(secondsPerQuestion());
    const timer = window.setInterval(() => setTimeLeft((value) => {
      if (value <= 1) { window.clearInterval(timer); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  });

  const submit = async () => {
    const current = question();
    const choice = selected();
    if (!current || choice === null || result() || checking()) return;
    setChecking(true); setError("");
    try {
      const checked = await submitAnswer({ questionId: current._id, selected: choice });
      setResult(checked);
      if (checked.correct) setScore((value) => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not check that answer"); }
    finally { setChecking(false); }
  };

  const next = async () => {
    const quiz = props.data;
    if (!quiz) return;
    if (index() === quiz.questions.length - 1) {
      setFinishing(true); setError("");
      try { await recordAttempt({ quizSetId: quiz._id, score: score(), total: quiz.questions.length }); setFinished(true); }
      catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your attempt"); }
      finally { setFinishing(false); }
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setResult(undefined);
  };

  const restart = () => { setIndex(0); setSelected(null); setResult(undefined); setScore(0); setFinished(false); setError(""); };

  return (
    <Show when={props.data} fallback={<Card><h2>No active quiz</h2><p>Create a quiz from your study notes first.</p><Button onClick={() => props.navigate("/notes")}>Upload notes</Button></Card>}>
      {(quiz) => <div class="page-stack quiz-page">
        <header class="quiz-toolbar"><div class="quiz-pin"><strong>{quiz().title}</strong><span>{quiz().difficulty}</span></div><div class="join-pill">{quiz().subject} · <strong>{quiz().topic}</strong></div><Button variant="ghost" onClick={() => props.navigate("/")}>Exit quiz</Button></header>
        <div class="quiz-layout">
          <main class="main-column"><Card class="quiz-stage">
            <Show when={!finished()} fallback={<div class="quiz-results"><div class="result-burst">★</div><p class="eyebrow">Quiz complete</p><h1>{score()} / {total()}</h1><p>{score() / Math.max(1, total()) >= .8 ? "Outstanding work—you’ve mastered this topic." : score() / Math.max(1, total()) >= .6 ? "Nice progress. Review the explanations and try once more." : "Good first step. Revisit the study explanation before another try."}</p><div class="result-actions"><Button onClick={restart}>Try again</Button><Button variant="secondary" onClick={() => props.navigate("/performance")}>View performance</Button></div></div>}>
              <div class="quiz-meta"><span>Question {index() + 1} of {total()}</span><span>+{question()?.points ?? 0} pts</span></div><Progress value={progress()} label="Quiz progress" />
              <Show when={question()}>{(current) => <><div class="question-heading"><IconBadge icon="⌬" size="lg" /><span class="subject-pill">{current().subject} · {current().topic}</span><h1>{current().question}</h1></div><div class="answer-grid"><For each={current().options}>{(option, optionIndex) => { const state = () => result() ? optionIndex() === result()!.correctAnswer ? "correct" : selected() === optionIndex() ? "incorrect" : "" : selected() === optionIndex() ? "selected" : ""; return <button class={`answer-option ${state()}`} onClick={() => !result() && setSelected(optionIndex())}><span>{String.fromCharCode(65 + optionIndex())}</span><strong>{option}</strong><i>{result() && optionIndex() === result()!.correctAnswer ? "✓" : result() && selected() === optionIndex() ? "×" : ""}</i></button>; }}</For></div></>}</Show>
              <Show when={result()}>{(feedback) => <div class={`answer-feedback ${feedback().correct ? "success" : "error"}`}><strong>{feedback().correct ? `Correct! +${feedback().points} points` : "Not quite."}</strong><p>{feedback().explanation}</p></div>}</Show>
              <Show when={error()}><div class="inline-notice error"><span>!</span><p>{error()}</p></div></Show>
              <div class="quiz-actions"><span class="flex-1" />{result() ? <Button disabled={finishing()} onClick={() => void next()}>{finishing() ? "Saving result…" : index() === total() - 1 ? "Save & see results" : "Next question →"}</Button> : <Button disabled={selected() === null || checking()} onClick={() => void submit()}>{checking() ? "Checking…" : "Check answer"}</Button>}</div>
            </Show>
          </Card></main>
          <aside class="right-rail">
            <Card class="timer-card"><div class="section-heading compact"><div><h2>Question timer</h2><p>{quiz().durationMinutes} minutes total</p></div><IconBadge icon="◷" /></div><div class={`timer-ring ${timeLeft() <= 10 ? "urgent" : ""}`}><strong>{timeLeft()}</strong><small>seconds left</small></div><Show when={timeLeft() === 0 && !result()}><p class="text-amber">Time is up—choose your best answer.</p></Show></Card>
            <Card><div class="section-heading compact"><div><h2>Progress</h2><p>{index() + 1} / {total()} questions</p></div><strong>{progress()}%</strong></div><Progress value={progress()} /></Card>
            <Card><div class="section-heading compact"><div><h2>Leaderboard</h2><p>Live class ranking</p></div><span>🏆</span></div><div class="leader-list"><For each={quiz().leaderboard}>{(player, rank) => <div class={player.isCurrentUser ? "you" : ""}><b>{rank() + 1}</b><Avatar name={player.name} size="sm" color={player.color} /><span>{player.name}</span><strong>{(player.points + (player.isCurrentUser ? score() * 100 : 0)).toLocaleString()}</strong></div>}</For></div></Card>
            <Card><div class="section-heading compact"><div><h2>Class</h2><p>{quiz().onlineCount} players online</p></div><span class="live-dot">Live</span></div><div class="avatar-row"><For each={quiz().leaderboard.filter((player) => player.online).slice(0, 5)}>{(player) => <Avatar name={player.name} color={player.color} />}</For></div></Card>
          </aside>
        </div>
      </div>}
    </Show>
  );
}
