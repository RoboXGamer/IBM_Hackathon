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

export default function App() {
  const [ready, setReady] = createSignal(false);
  const [error, setError] = createSignal("");
  const bootstrap = createMutation(api.profiles.bootstrap);
  onSettled(() => {
    void bootstrap({}).then(() => setReady(true)).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not prepare your study space"));
  });
  return (
    <Show when={!error()} fallback={<div class="app-loading"><div class="logo-mark">Q</div><strong>We couldn’t open your study space.</strong><p>{error()}</p></div>}>
      <Show when={ready()} fallback={<div class="app-loading"><div class="logo-mark">Q</div><strong>Preparing your Convex workspace…</strong></div>}>
        <DataApp />
      </Show>
    </Show>
  );
}

function DataApp() {
  const router = createSpaRouter();
  const data = createQuery(api.appData.get, {}) as Accessor<AppData | undefined>;
  return (
    <Loading fallback={<div class="app-loading"><div class="logo-mark">Q</div><strong>Loading your study data…</strong></div>}>
      <Show when={data()}>
        {(appDataAccessor) => {
          const appData = appDataAccessor();
          const screen = () => {
            switch (router.path()) {
              case "/notes": return <NotesScreen navigate={router.navigate} data={appData.notes} study={appData.study} />;
              case "/study": return <StudyScreen navigate={router.navigate} data={appData.study} />;
              case "/plan": return <PlanScreen navigate={router.navigate} data={appData.plan} />;
              case "/quiz": return <QuizScreen navigate={router.navigate} data={appData.quiz} />;
              case "/performance": return <PerformanceScreen navigate={router.navigate} data={appData.performance} />;
              default: return <TodayScreen navigate={router.navigate} data={appData.dashboard} profile={appData.profile} />;
            }
          };
          return <AppShell path={router.path} navigate={router.navigate} profile={appData.profile}>{screen()}</AppShell>;
        }}
      </Show>
    </Loading>
  );
}
