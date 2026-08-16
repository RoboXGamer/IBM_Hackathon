import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { trustedOrigins } from "./authOrigins";
const http = httpRouter();
authComponent.registerRoutesLazy(http, createAuth, { cors: true, trustedOrigins });
export default http;
