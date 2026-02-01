import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router";
import { auth0Config } from "@/lib/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

// Debug: Log auth config on load
console.log("[Auth] Config:", {
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
  authorizationParams: auth0Config.authorizationParams,
  rawDomain: import.meta.env.VITE_AUTH0_DOMAIN,
  rawClientId: import.meta.env.VITE_AUTH0_APP_CLIENT_ID,
});

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();

  const onRedirectCallback = (appState?: { returnTo?: string }) => {
    console.log("[Auth] Redirect callback, appState:", appState);
    navigate(appState?.returnTo || "/");
  };

  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={auth0Config.authorizationParams}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
}
