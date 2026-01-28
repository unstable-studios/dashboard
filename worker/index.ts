import { Hono } from "hono";
import { authMiddleware, AuthUser } from "./middleware/auth";
import { adminMiddleware, hasAdminPermission } from "./middleware/admin";
import { getCalendarPermissions } from "./middleware/calendar";
import { getHubPermissions } from "./middleware/permissions";
import links from "./routes/links";
import categories from "./routes/categories";
import docs from "./routes/docs";
import preferences from "./routes/preferences";
import attachments from "./routes/attachments";
import reminders from "./routes/reminders";
import calendar from "./routes/calendar";

interface Variables {
  user: AuthUser;
  isAdmin: boolean;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Health check
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Debug endpoint (admin only)
app.get("/api/debug/config", authMiddleware(), adminMiddleware(), (c) => {
  console.log("[Worker] Debug config requested");
  return c.json({
    auth0_domain: c.env.AUTH0_DOMAIN || "NOT SET",
    auth0_audience: c.env.AUTH0_AUDIENCE || "NOT SET",
    auth0_client_id: c.env.AUTH0_CLIENT_ID ? "SET (hidden)" : "NOT SET",
    auth0_client_secret: c.env.AUTH0_CLIENT_SECRET ? "SET (hidden)" : "NOT SET",
    db_bound: !!c.env.DB,
    cache_bound: !!c.env.CACHE,
  });
});

// Get current user info (requires auth)
app.get("/api/auth/me", authMiddleware(), (c) => {
  const user = c.get("user");

  return c.json({
    sub: user.sub,
    email: user.email,
    name: user.name,
    picture: user.picture,
    permissions: user.permissions,
    isAdmin: hasAdminPermission(user.permissions),
    hub: getHubPermissions(user.permissions),
    calendar: getCalendarPermissions(user.permissions),
  });
});

// Admin-only routes (managed via Auth0 RBAC)
const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
adminRoutes.use("*", authMiddleware(), adminMiddleware());

// Admin status check
adminRoutes.get("/status", (c) => {
  const user = c.get("user");
  return c.json({
    isAdmin: true,
    email: user.email,
    permissions: user.permissions,
  });
});

app.route("/api/admin", adminRoutes);

// Service links and categories
app.route("/api/links", links);
app.route("/api/categories", categories);

// Documents
app.route("/api/docs", docs);

// User preferences
app.route("/api/preferences", preferences);

// File attachments
app.route("/api/attachments", attachments);

// Reminders
app.route("/api/reminders", reminders);

// Calendar token management
app.route("/api/calendar", calendar);

// iCal feed (token-authenticated, at root level for calendar app compatibility)
app.get("/calendar.ics", async (c) => {
  // Rewrite to the calendar feed handler with token
  const token = c.req.query("token");
  const url = new URL(c.req.url);
  url.pathname = "/api/calendar/feed";
  if (token) {
    url.searchParams.set("token", token);
  }
  // Forward to internal handler
  const response = await calendar.fetch(
    new Request(url.toString(), c.req.raw),
    c.env,
    c.executionCtx
  );
  return response;
});

export default app;
