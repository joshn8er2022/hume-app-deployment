import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "./components/ui/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Layout } from "./components/Layout"
import { BlankPage } from "./pages/BlankPage"
import { LandingPage } from "./pages/LandingPage"
import { ClinicLanding } from "./pages/ClinicLanding"
import { ApplicationForm } from "./pages/ApplicationForm"
import { Dashboard } from "./pages/Dashboard"
import { LeadManagement } from "./pages/LeadManagement"
import { Analytics } from "./pages/Analytics"
import { Communications } from "./pages/Communications"
import { ConfirmationPage } from "./pages/ConfirmationPage"
import { FunnelBuilder } from "./pages/FunnelBuilder"
import { UserProfile } from "./pages/UserProfile"
import { AdminSeeding } from "./pages/AdminSeeding"
import { RouteHandler } from "./components/RouteHandler"

// Component to handle root route logic
function RootRoute() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  } else {
    return <LandingPage />
  }
}

function App() {
  return (
  <AuthProvider>
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <Router>
        <RouteHandler />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/clinic" element={<ClinicLanding />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
          {/* Admin seeding page - accessible without authentication */}
          <Route path="/admin/seeding" element={<AdminSeeding />} />
          
          {/* Protected routes - nested under Layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leads" element={<LeadManagement />} />
            <Route path="funnels" element={<FunnelBuilder />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="communications" element={<Communications />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* Root route - MUST come after specific routes */}
          <Route index element={<RootRoute />} />
          
          {/* Catch-all route for 404 */}
          <Route path="*" element={<BlankPage />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  </AuthProvider>
  )
}

export default App