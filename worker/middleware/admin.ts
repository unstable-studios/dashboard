import { Context, Next } from "hono";
import { AuthUser } from "./auth";

// Permission required for admin access (configure in Auth0 API permissions)
const ADMIN_PERMISSION = "admin";

// Check if user has admin permission (from Auth0 RBAC)
export function hasAdminPermission(permissions: string[] | undefined): boolean {
  return permissions?.includes(ADMIN_PERMISSION) ?? false;
}

// Middleware to require admin access via Auth0 RBAC
export function adminMiddleware() {
  return async (
    c: Context<{ Bindings: Env; Variables: { user: AuthUser; isAdmin: boolean } }>,
    next: Next
  ) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!user.permissions?.includes(ADMIN_PERMISSION)) {
      console.log("[Admin] Access denied for:", user.email, "permissions:", user.permissions);
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    console.log("[Admin] Access granted for:", user.email);
    c.set("isAdmin", true);
    await next();
  };
}
