"use client";
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "@/firebase/firebase"; 
import ProtectedRoute from "./protectedRoute";

// Define types for profile data
interface ProfileData {
  bio: string;
  language: string;
}

export default function AuthCheckComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Fetch user profile data from Realtime Database
        const db = getDatabase(app);
        const userRef = ref(db, `users/${currentUser.uid}`);

        get(userRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              setProfileData(snapshot.val() as ProfileData);
            } else {
              console.log("No profile data found.");
            }
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
            setLoading(false);
          });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>You are not logged in.</div>;
  }

  return (
    <ProtectedRoute>
      <div>
        <h1>Welcome, {user.displayName || "User"}!</h1>
        <p>Email: {user.email}</p>
        {profileData && (
          <div>
            <h2>Profile Data:</h2>
            <p>Bio: {profileData.bio}</p>
            <p>Language: {profileData.language}</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
