"use client"
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "@/firebase/firebase"; // Your Firebase configuration file

export default function AuthCheckComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is logged in
        setUser(currentUser);

        // Fetch user profile data from Realtime Database
        const db = getDatabase(app);
        const userRef = ref(db, `users/${currentUser.uid}`);

        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            setProfileData(snapshot.val());
          } else {
            console.log("No profile data found.");
          }
          setLoading(false);
        }).catch((error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
        });
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>You are not logged in.</div>;
  }

  return (
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
  );
}
