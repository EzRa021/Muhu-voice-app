"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import {
  getAuth,
  onAuthStateChanged,
  User,
  updateProfile,
  signOut,
} from "firebase/auth";
import { getDatabase, ref, update, get } from "firebase/database";
import { app } from "@/firebase/firebase";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/protectedRoute";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const db = getDatabase(app);
        const userRef = ref(db, `users/${currentUser.uid}`);
        get(userRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              setLanguage(data.language || "");
            }
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
          });
      } else {
        console.log("No user is logged in.");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLanguage(e.target.value);
  };

  const handleSave = async () => {
    if (!user) {
      console.error("No user is logged in.");
      return;
    }

    const db = getDatabase(app);
    const userRef = ref(db, `users/${user.uid}`);

    try {
      await update(userRef, { language });
      toast("Language updated successfully.");
    } catch (error) {
      console.error("Error updating language:", error);
      toast("Error updating language.");
    }
  };

  const handleLogout = async () => {
    const auth = getAuth(app);
    try {
      await signOut(auth);
      router.push("/auth/login");
      toast("Logout Successfully");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Account Information Card */}
        <Card className="w-full border border-gray-200 rounded-lg shadow dark:bg-background dark:border-gray-700">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center pb-6">
              {user?.photoURL ? (
                <Image
                  className="w-24 h-24 mb-3 rounded-full shadow-lg"
                  width={96}
                  height={96}
                  src={user.photoURL}
                  alt="User image"
                />
              ) : (
                <div className="w-24 h-24 mb-3 rounded-full shadow-lg bg-gray-200"></div>
              )}
              <h2 className="text-lg font-medium">{user?.displayName}</h2>
            </div>
            <div>
              <Label htmlFor="username">username</Label>
              <Input
                id="username"
                
                disabled
              />
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={language}
                onChange={handleLanguageChange}
              />
            </div>
          </CardContent>
        </Card>
        {/* Save Button */}
        <Button onClick={handleSave} className="w-full">
          Save
        </Button>
        {/* Logout Button */}
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </ProtectedRoute>
  );
}
