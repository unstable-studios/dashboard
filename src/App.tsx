import { Routes, Route } from "react-router";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { CallbackPage } from "@/pages/CallbackPage";
import { Dashboard } from "@/pages/Dashboard";
import { LinksPage } from "@/pages/LinksPage";
import { DocsPage } from "@/pages/DocsPage";
import { DocViewer } from "@/pages/DocViewer";
import { DocEditor } from "@/pages/DocEditor";
import { AdminPanel } from "@/pages/AdminPanel";
import { SettingsPage } from "@/pages/SettingsPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/links"
          element={
            <ProtectedRoute>
              <LinksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docs"
          element={
            <ProtectedRoute>
              <DocsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docs/new"
          element={
            <ProtectedRoute>
              <DocEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docs/:slug"
          element={
            <ProtectedRoute>
              <DocViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docs/:slug/edit"
          element={
            <ProtectedRoute>
              <DocEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
