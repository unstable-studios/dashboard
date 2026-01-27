import { Context, Next } from "hono";
import { AuthUser } from "./auth";

// Permissions (match Auth0 API scopes)
const READ_PERMISSION = "hub:read";
const EDIT_PERMISSION = "hub:edit";

// Check if user has read permission
export function hasReadPermission(permissions: string[] | undefined): boolean {
  return permissions?.includes(READ_PERMISSION) ?? false;
}

// Check if user has admin/edit permission
export function hasAdminPermission(permissions: string[] | undefined): boolean {
  return permissions?.includes(EDIT_PERMISSION) ?? false;
}

// Middleware to require read access via Auth0 RBAC
export function readerMiddleware() {
  return async (
    c: Context<{ Bindings: Env; Variables: { user: AuthUser } }>,
    next: Next
  ) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!user.permissions?.includes(READ_PERMISSION)) {
      console.log("[Reader] Access denied for:", user.email, "permissions:", user.permissions);
      return c.json({ error: "Forbidden: Read access required" }, 403);
    }

    await next();
  };
}

// Middleware to require admin/edit access via Auth0 RBAC
export function adminMiddleware() {
  return async (
    c: Context<{ Bindings: Env; Variables: { user: AuthUser; isAdmin: boolean } }>,
    next: Next
  ) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!user.permissions?.includes(EDIT_PERMISSION)) {
      console.log("[Admin] Access denied for:", user.email, "permissions:", user.permissions);
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    console.log("[Admin] Access granted for:", user.email);
    c.set("isAdmin", true);
    await next();
  };
}
