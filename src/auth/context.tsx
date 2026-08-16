import { createContext, createEffect, createSignal, onSettled, useContext, type Accessor, type ParentProps } from "solid-js";
import { useOptionalConvexClient } from "../convex";
import { authClient } from "./client";

type SessionState = ReturnType<typeof authClient.useSession.get>;

interface AuthContextValue {
  session: Accessor<SessionState>;
  isLoading: Accessor<boolean>;
  isAuthenticated: Accessor<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>();

export function AuthProvider(props: ParentProps) {
  const client = useOptionalConvexClient();
  const [session, setSession] = createSignal<SessionState>(authClient.useSession.get());
  const [convexAuthenticated, setConvexAuthenticated] = createSignal(false);
  const [authConnecting, setAuthConnecting] = createSignal(false);
  let cachedToken: string | null = null;
  let pendingToken: Promise<string | null> | null = null;

  const fetchToken = async ({ forceRefreshToken = false }: { forceRefreshToken?: boolean } = {}) => {
    if (cachedToken && !forceRefreshToken) return cachedToken;
    if (pendingToken && !forceRefreshToken) return pendingToken;
    pendingToken = authClient.convex.token({ fetchOptions: { throw: false } })
      .then(({ data }) => {
        cachedToken = data?.token ?? null;
        return cachedToken;
      })
      .catch(() => {
        cachedToken = null;
        return null;
      })
      .finally(() => { pendingToken = null; });
    return pendingToken;
  };

  createEffect(
    () => session().data?.session?.id ?? null,
    (sessionId) => {
      if (!client) return;
      if (!sessionId) {
        cachedToken = null;
        setConvexAuthenticated(false);
        client.setAuth(async () => null, () => setConvexAuthenticated(false));
        return;
      }
      setAuthConnecting(true);
      client.setAuth(fetchToken, (authenticated) => {
        setConvexAuthenticated(authenticated);
        setAuthConnecting(false);
      });
    },
  );

  onSettled(() => {
    const unsubscribeSession = authClient.useSession.subscribe(setSession);
    const url = new URL(window.location.href);
    const token = url.searchParams.get("ott");
    if (token) {
      url.searchParams.delete("ott");
      window.history.replaceState({}, "", url);
      void authClient.crossDomain.oneTimeToken.verify({ token }).then(async (result) => {
        const verifiedSession = result.data?.session;
        if (!verifiedSession) return;
        await authClient.getSession({ fetchOptions: { headers: { Authorization: `Bearer ${verifiedSession.token}` } } });
        void authClient.useSession.get().refetch();
      });
    }
    return unsubscribeSession;
  });

  const value: AuthContextValue = {
    session,
    isLoading: () => session().isPending || authConnecting(),
    isAuthenticated: () => Boolean(session().data?.session) && convexAuthenticated(),
    signOut: async () => {
      await authClient.signOut();
      cachedToken = null;
      setConvexAuthenticated(false);
      client?.setAuth(async () => null, () => setConvexAuthenticated(false));
    },
  };

  return <AuthContext value={value}>{props.children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
