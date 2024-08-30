// src/pages/chat/adduser.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { ref, get, update } from "firebase/database";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import ProtectedRoute from "@/app/protectedRoute";

type UserData = {
  username?: string;
  photoURL?: string;
  email?: string;
  bio?: string;
  language?: string; // For future language update
};

type FirebaseUser = [string, UserData];

export default function AddUser() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [addedUsers, setAddedUsers] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        console.error("No user is signed in");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);
    if (searchValue.length < 3) return;

    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const usersData = snapshot.val() as Record<string, UserData>;
      const filteredUsers: FirebaseUser[] = Object.entries(usersData).filter(
        ([, user]) =>
          user.username?.toLowerCase().includes(searchValue.toLowerCase())
      );
      setUsers(filteredUsers);
    } else {
      setUsers([]);
    }
  };

  const handleAddUser = async () => {
    if (!currentUser || !selectedUser) {
      console.error("No current user or selected user found");
      return;
    }

    const [selectedUserId, selectedUserData] = selectedUser;

    // Add the user to the current user's chat list
    const userChatsRef = ref(
      db,
      `userChats/${currentUser.uid}/${selectedUserId}`
    );
    await update(userChatsRef, {
      username: selectedUserData.username || "Unknown User",
      photoURL: selectedUserData.photoURL || "",
      lastMessage: "",
      timestamp: Date.now(),
    });

    setAddedUsers((prev) => new Set(prev).add(selectedUserId));
    setShowDialog(false);
    router.push(`/chat/chats/room/${selectedUserId}`);
  };

  const checkIfUserAdded = async (userId: string): Promise<boolean> => {
    if (!currentUser) return false;

    const userChatRef = ref(db, `userChats/${currentUser.uid}/${userId}`);
    const snapshot = await get(userChatRef);
    return snapshot.exists();
  };

  const handleSelectUser = async (selected: FirebaseUser) => {
    setSelectedUser(selected);
    const isUserAdded = await checkIfUserAdded(selected[0]);
    setAddedUsers((prev) => {
      const newSet = new Set(prev);
      if (isUserAdded) {
        newSet.add(selected[0]);
      }
      return newSet;
    });
    setShowDialog(true);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col justify-between lg:px-52 px-7 mt-10 max-h-screen py-10">
        <div className="p-4">
          <Button className="w-full">Add User</Button>
        </div>
        <div className="flex-grow">
          <Command className="rounded-lg border shadow-md h-full">
            <input
              className="p-3 outline-none"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                {users.map(([id, user]) => (
                  <CommandItem
                    key={id}
                    onSelect={() => handleSelectUser([id, user])}
                    className="flex gap-3"
                  >
                    <Avatar>
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>{user.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex justify-between items-center w-full">
                      <span>{user.username || "Unknown User"}</span>
                      {addedUsers.has(id) ? <span>Added</span> : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        {selectedUser && (
          <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogContent>
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>
                    View and add this user to your chat list.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <Avatar className="w-24 h-24 mb-4">
                      <AvatarImage
                        src={selectedUser[1].photoURL}
                        alt={selectedUser[1].username || "Unknown User"}
                      />
                      <AvatarFallback>
                        {selectedUser[1].username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-lg font-medium">
                      {selectedUser[1].username || "Unknown User"}
                    </h2>
                    <p className="text-muted-foreground">{selectedUser[1].bio}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleAddUser}
                    disabled={addedUsers.has(selectedUser[0])}
                  >
                    {addedUsers.has(selectedUser[0]) ? "Added" : "Add user"}
                  </Button>
                </CardFooter>
              </Card>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </ProtectedRoute>
  );
}
