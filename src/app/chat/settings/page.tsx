"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { getAuth, updateProfile, updateEmail, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, update, get } from "firebase/database";
import { app } from "@/firebase/firebase";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    bio: "",
    language: "",
    photoURL: "",
  });
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);

    // Use onAuthStateChanged to listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("User is logged in:", currentUser);
        setUser(currentUser);
        setProfileData({
          username: currentUser.displayName || "",
          email: currentUser.email || "",
          bio: "",
          language: "",
          photoURL: currentUser.photoURL || "",
        });

        // Fetch additional profile info from Realtime Database
        const db = getDatabase(app);
        const userRef = ref(db, `users/${currentUser.uid}`);
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setProfileData((prevData) => ({
              ...prevData,
              bio: data.bio || "",
              language: data.language || "",
            }));
          }
        }).catch((error) => {
          console.error("Error fetching user data:", error);
        });
      } else {
        console.log("No user is logged in.");
      }
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPhoto(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!user) {
      console.error("No user is logged in.");
      return;
    }

    setSaving(true);

    const auth = getAuth(app);
    const db = getDatabase(app);
    const userRef = ref(db, `users/${user.uid}`);

    try {
      const updates: any = {};

      // Update user profile in Firebase Authentication
      if (profileData.username !== user.displayName) {
        await updateProfile(user, { displayName: profileData.username });
        console.log("Username updated successfully.");
      }

      if (profileData.email !== user.email) {
        await updateEmail(user, profileData.email);
        console.log("Email updated successfully.");
      }

      // Update photoURL if a new photo is selected (add logic to upload to Firebase Storage if needed)
      if (newPhoto) {
        const photoURL = URL.createObjectURL(newPhoto);
        await updateProfile(user, { photoURL });
        updates.photoURL = photoURL;
        console.log("Profile picture updated successfully.");
      }

      // Update additional profile info in Realtime Database
      updates.bio = profileData.bio;
      updates.language = profileData.language;
      await update(userRef, updates);
      console.log("Additional profile information updated successfully in the database.", updates);

    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Information Card */}
      <Card className="w-full border border-gray-200 rounded-lg shadow dark:bg-background dark:border-gray-700">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center pb-6">
            {profileData.photoURL ? (
              <Image
                className="w-24 h-24 mb-3 rounded-full shadow-lg"
                width={96}
                height={96}
                src={profileData.photoURL}
                alt="User image"
              />
            ) : (
              <div className="w-24 h-24 mb-3 rounded-full shadow-lg bg-gray-200"></div>
            )}
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={profileData.username} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profileData.email} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" value={profileData.bio} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Input id="language" value={profileData.language} onChange={handleInputChange} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
