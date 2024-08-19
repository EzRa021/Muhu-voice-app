// /src/app/auth/signin.tsx (or wherever you're using it)
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, get, child } from "firebase/database";
import { app } from "@/firebase/firebase"; // Import the initialized Firebase app

export default function SignInForm() {
  const [loginData, setLoginData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = getAuth(app); // Get Auth instance
      const db = getDatabase(app); // Get Database instance
      let email = loginData.emailOrUsername;

      // If the input is a username, find the associated email
      if (!email.includes('@')) {
        const usernameRef = ref(db, 'users');
        const snapshot = await get(child(usernameRef, `/${email}`));

        if (snapshot.exists()) {
          email = snapshot.val().email;
        } else {
          throw new Error("User not found");
        }
      }

      await signInWithEmailAndPassword(auth, email, loginData.password);
      setLoading(false);
      router.push("/"); // Redirect to the home page after successful login
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="max-w-md w-full">
        <div className="flex justify-center items-center mt-3">
          <h1 className="text-4xl font-medium text-center">MUHU</h1>
        </div>
        <CardHeader>
          <CardDescription className="text-center">
            Enter your email or username and password to login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="emailOrUsername">Email or Username</Label>
              <Input
                id="emailOrUsername"
                type="text"
                placeholder="m@example.com"
                required
                onChange={(e) =>
                  setLoginData({ ...loginData, emailOrUsername: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })}
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
