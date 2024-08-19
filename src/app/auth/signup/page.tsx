// /src/app/auth/signup.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { getDatabase, ref, set, serverTimestamp } from "firebase/database";
import { app } from "@/firebase/firebase"; // Import the initialized Firebase app

export default function SignUpForm() {
  const [step, setStep] = useState(1);
  const [alternativeLanguage, setAlternativeLanguage] = useState("");
  const [userData, setUserData] = useState({
    email: "",
    fullName: "",
    phone: "",
    username: "",
    password: "",
    language: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleLanguageSelection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData.email || !userData.fullName || !userData.phone || !userData.username || !userData.password || !alternativeLanguage) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const auth = getAuth(app); // Get the Auth instance
      const db = getDatabase(app); // Get the Database instance

      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      // Save additional user info in the Realtime Database
      await set(ref(db, `users/${user.uid}`), {
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone,
        username: userData.username,
        language: alternativeLanguage,
        createdAt: serverTimestamp(),
      });

      // Send email verification
      await sendEmailVerification(user);

      setLoading(false);
      setStep(3); // Proceed to the next step after successful signup
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mx-auto max-w-sm">
              <div className="flex justify-center items-center mt-3">
                <h1 className="text-4xl font-medium text-center">MUHU</h1>
              </div>
              <CardHeader>
                <CardDescription className="text-center">
                  Join us to start chatting with real-time text and voice translation!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input
                      id="full-name"
                      placeholder="Max"
                      required
                      onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone-number">Phone number</Label>
                    <Input
                      id="phone-number"
                      placeholder="Phone"
                      required
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Robinson"
                      required
                      onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create an account
                  </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="underline">
                    Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mx-auto max-w-sm">
              <div className="flex justify-center items-center mt-3">
                <h1 className="text-4xl font-medium text-center">MUHU</h1>
              </div>
              <CardHeader>
                <CardDescription className="text-center">
                  Choose your preferred language for translation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLanguageSelection} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="language">Choose your language</Label>
                    <Input
                      id="language"
                      placeholder="Enter your preferred language"
                      value={alternativeLanguage}
                      onChange={(e) => setAlternativeLanguage(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Processing..." : "Next"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mx-auto max-w-sm">
              <div className="flex justify-center items-center mt-3">
                <h1 className="text-4xl font-medium text-center">MUHU</h1>
              </div>
              <CardHeader>
                <CardDescription className="text-center">
                  We have sent you an email with a verification link. Please check your inbox.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center">After verifying your email, you can sign in.</p>
                <div className="mt-4 text-center">
                  <Button onClick={() => router.push("/auth/signin")} className="w-full">
                    Go to Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
