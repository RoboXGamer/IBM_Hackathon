import { render } from "@solidjs/web";
import App from "./App";
import { convex, ConvexProvider } from "./convex";
import { AuthProvider } from "./auth/context";
import { AuthGate } from "./auth/AuthGate";
import "./styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("Unable to find the application root.");

render(
  () => (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <AuthGate><App /></AuthGate>
      </AuthProvider>
    </ConvexProvider>
  ),
  root,
);
