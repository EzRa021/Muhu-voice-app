// src/pages/auth/signup.tsx
"use client";

import React from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ref, set } from "firebase/database";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

export default function SignUpForm() {
  const auth = getAuth();
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        const email = user.email || "";
        const username = email.split("@")[0]; // Extract the username from the email
        const userRef = ref(db, `users/${user.uid}`);

        await set(userRef, {
          username, // Store the generated username
          email,
          photoURL: user.photoURL || "",
          language: "english", // Default language, can be updated later
        });

        router.push("/auth/update-profile"); // Redirect to profile update page
        toast("Account Created Successfully");
      }
    } catch (error) {
      console.error("Error signing up with Google:", error);
    }
  };

  return (
    <div className="h-screen w-full flex justify-center items-center">
      <Card className="mx-auto max-w-sm mt-10">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>Sign up with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleSignUp} className="w-full">
            Sign up with Google
          </Button>
        </CardContent>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signin" className="underline">
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
}
