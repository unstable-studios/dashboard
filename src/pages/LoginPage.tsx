import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();

  const returnTo = (location.state as { returnTo?: string })?.returnTo || "/";

  console.log("[LoginPage] State:", { isAuthenticated, isLoading, error, returnTo });

  useEffect(() => {
    if (error) {
      console.error("[LoginPage] Auth0 error:", error);
    }
    if (isAuthenticated && !isLoading) {
      console.log("[LoginPage] Authenticated, navigating to:", returnTo);
      navigate(returnTo);
    }
  }, [isAuthenticated, isLoading, navigate, returnTo, error]);

  const handleLogin = () => {
    console.log("[LoginPage] Initiating login redirect...");
    loginWithRedirect({
      appState: { returnTo },
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Unstable Studios</h1>
        <p className="text-muted-foreground mt-2">The Hub</p>
      </div>
      <Button size="lg" onClick={handleLogin}>
        Sign in with Auth0
      </Button>
    </div>
  );
}
