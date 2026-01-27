import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!isAuthenticated) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const response = await authFetch(
          "/api/auth/me",
          getAccessTokenSilently
        );
        if (response.ok) {
          const data = (await response.json()) as { isAdmin?: boolean } | null;
          setIsAdmin(Boolean(data?.isAdmin));
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    }

    if (!isLoading) {
      checkAdmin();
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  if (isLoading || checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Checking permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
