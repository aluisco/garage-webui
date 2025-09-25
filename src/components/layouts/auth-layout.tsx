import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

const AuthLayout = () => {
  const auth = useAuth();

  console.log("AuthLayout render:", {
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user
  });

  if (auth.isLoading) {
    console.log("AuthLayout: Loading...");
    return null;
  }

  if (auth.isAuthenticated) {
    console.log("AuthLayout: User authenticated, redirecting to /");
    return <Navigate to="/" replace />;
  }

  console.log("AuthLayout: User not authenticated, showing login");
  return (
    <div className="min-h-svh flex items-center justify-center">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
