import { Loading, Show, createSignal, onSettled, type Accessor } from "solid-js";
import { AppShell } from "./components/AppShell";
import { createMutation, createQuery } from "./convex";
import { api } from "./data/live";
import type { AppData } from "./data/types";
import { createSpaRouter } from "./lib/router";
import { NotesScreen } from "./screens/NotesScreen";
import { StudyScreen } from "./screens/StudyScreen";
import { TodayScreen } from "./screens/TodayScreen";
import { PlanScreen } from "./screens/PlanScreen";
import { QuizScreen } from "./screens/QuizScreen";
import { PerformanceScreen } from "./screens/PerformanceScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";

export default function App() {
  const [ready, setReady] = createSignal(false);
  const [error, setError] = createSignal("");
  const bootstrap = createMutation(api.profiles.bootstrap);
  const prepare = async () => {
    setError("");
    try { await bootstrap({}); setReady(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not prepare your study space"); }
  };
  onSettled(() => {
    void prepare();
  });
  return (
    <Show when={!error()} fallback={<div class="app-loading"><div class="logo-mark">Q</div><strong>We couldn’t open your study space.</strong><p>{error()}</p><button class="button button-primary" onClick={() => void prepare()}>Try again</button></div>}>
      <Show when={ready()} fallback={<div class="app-loading"><div class="logo-mark">Q</div><strong>Preparing your Convex workspace…</strong></div>}>
        <DataApp />
      </Show>
    </Show>
  );
}

function DataApp() {
  const router = createSpaRouter();
  const data = createQuery(api.appData.get, {}) as Accessor<AppData | undefined>;
  const [onboardingFinished, setOnboardingFinished] = createSignal(false);
  return (
    <Loading fallback={<div class="app-loading"><div class="logo-mark">Q</div><strong>Loading your study data…</strong></div>}>
      <Show when={data()}>
        {(appDataAccessor) => <DataView data={appDataAccessor()} router={router} onboardingFinished={onboardingFinished()} onOnboardingComplete={() => setOnboardingFinished(true)} />}
      </Show>
    </Loading>
  );
}

type SpaRouter = ReturnType<typeof createSpaRouter>;

function DataView(props: { data: AppData; router: SpaRouter; onboardingFinished: boolean; onOnboardingComplete: () => void }) {
  return (
    <Show
      when={props.data.profile.onboardingComplete || props.onboardingFinished}
      fallback={<OnboardingScreen name={props.data.profile.name} onComplete={props.onOnboardingComplete} />}
    >
      <Workspace data={props.data} router={props.router} />
    </Show>
  );
}

function Workspace(props: { data: AppData; router: SpaRouter }) {
  const screen = () => {
    const appData = props.data;
    switch (props.router.path()) {
      case "/notes": return <NotesScreen navigate={props.router.navigate} data={appData.notes} study={appData.study} />;
      case "/study": return <StudyScreen navigate={props.router.navigate} data={appData.study} />;
      case "/plan": return <PlanScreen navigate={props.router.navigate} data={appData.plan} />;
      case "/quiz": return <QuizScreen navigate={props.router.navigate} data={appData.quiz} />;
      case "/performance": return <PerformanceScreen navigate={props.router.navigate} data={appData.performance} />;
      default: return <TodayScreen navigate={props.router.navigate} data={appData.dashboard} profile={appData.profile} />;
    }
  };
  return <AppShell path={props.router.path} navigate={props.router.navigate} profile={props.data.profile}>{screen()}</AppShell>;
}
