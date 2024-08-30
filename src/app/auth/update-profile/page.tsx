// src/pages/auth/update-profile.tsx
"use client";

import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ref, update } from "firebase/database";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function UpdateProfile() {
  const [language, setLanguage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!language) {
      setError("Please fill in the language field");
      return;
    }

    setLoading(true);
    setError("");

    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = ref(db, `users/${user.uid}`);
        await update(userRef, { language });

        router.push("/chat/chats"); // Redirect to chats page after successful update
      } catch (error) {
        setError("Failed to update profile");
        setLoading(false);
      }
    }
  };

  return (
    <Card className="mx-auto max-w-sm mt-10">
      <CardHeader>
        <CardTitle className="text-xl">Update Profile</CardTitle>
        <CardDescription>Set your preferred language</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              placeholder="Preferred Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
