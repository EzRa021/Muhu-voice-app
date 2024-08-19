// src/components/ProtectedRoute.tsx
"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login"); // Redirect to login if not authenticated
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <p>Loading...</p>; // Show a loading state while checking authentication
  }

  return <>{children}</>;
};

export default ProtectedRoute;
