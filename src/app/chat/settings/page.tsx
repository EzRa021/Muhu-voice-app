"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { getAuth, updateProfile, updateEmail, onAuthStateChanged, User, signOut } from "firebase/auth";
import { getDatabase, ref, update, get } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"; // Import Firebase Storage
import { app } from "@/firebase/firebase";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setProfileData({
          username: currentUser.displayName || "",
          email: currentUser.email || "",
          bio: "",
          language: "",
          photoURL: currentUser.photoURL || "",
        });

        const db = getDatabase(app);
        const userRef = ref(db, `users/${currentUser.uid}`);
        get(userRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.val();
              setProfileData((prevData) => ({
                ...prevData,
                bio: data.bio || "",
                language: data.language || "",
              }));
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
    const storage = getStorage(app); // Initialize Firebase Storage
    const userRef = ref(db, `users/${user.uid}`);

    try {
      const updates: any = {};

      if (profileData.username !== user.displayName) {
        await updateProfile(user, { displayName: profileData.username });
        console.log("Username updated successfully.");
      }

      if (profileData.email !== user.email) {
        await updateEmail(user, profileData.email);
        console.log("Email updated successfully.");
      }

      if (newPhoto) {
        const photoStorageRef = storageRef(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(photoStorageRef, newPhoto); // Upload the image to Firebase Storage
        const photoURL = await getDownloadURL(photoStorageRef); // Get the download URL
        await updateProfile(user, { photoURL }); // Update the user's profile with the new photo URL
        updates.photoURL = photoURL;
        setProfileData((prevData) => ({ ...prevData, photoURL })); // Update the local state
        console.log("Profile picture updated successfully.");
      }

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

  const handleLogout = async () => {
    const auth = getAuth(app);
    try {
      await signOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Error logging out:", error);
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
        <CardFooter className="border-t px-6 py-4 flex justify-between">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>
      {/* Logout Button */}
      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
}
