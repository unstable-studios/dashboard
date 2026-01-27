import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export function CallbackPage() {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Auth0Provider's onRedirectCallback will handle the redirect
      // This is just a fallback
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-destructive">
          Authentication Error
        </h1>
        <p className="text-muted-foreground">{error.message}</p>
        <a href="/login" className="text-primary underline">
          Try again
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Completing sign in...</div>
    </div>
  );
}
