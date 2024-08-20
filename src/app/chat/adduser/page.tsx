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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { ref, get, update, child } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation"; // Import the useRouter hook
import { db } from "@/firebase/firebase";
import Image from "next/image";
import ProtectedRoute from "@/components/protectedRoute";

export default function AddUser() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdded, setIsAdded] = useState(false);
  const router = useRouter(); // Initialize the router

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
    setSearchTerm(e.target.value);
    if (e.target.value.length < 3) return;

    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const filteredUsers = Object.entries(usersData).filter(([id, user]) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUsers(filteredUsers);
    } else {
      setUsers([]);
    }
  };

  const handleAddUser = async () => {
    if (!currentUser) {
      console.error("No current user found");
      return;
    }

    const selectedUserId = selectedUser[0];
    const selectedUserData = selectedUser[1];

    // Update the current user's chat list
    const userChatsRef = ref(
      db,
      `userChats/${currentUser.uid}/${selectedUserId}`
    );
    await update(userChatsRef, {
      username: selectedUserData.username,
      photoURL: selectedUserData.photoURL || "",
      lastMessage: "",
      timestamp: Date.now(),
    });

    // Update the selected user's chat list
    const selectedUserChatsRef = ref(
      db,
      `userChats/${selectedUserId}/${currentUser.uid}`
    );
    await update(selectedUserChatsRef, {
      username: currentUser.displayName || "Unknown User",
      photoURL: currentUser.photoURL || "",
      lastMessage: "",
      timestamp: Date.now(),
    });

    setIsAdded(true); // Set the button to "Added"
    setShowDialog(false);

    // Navigate to the chat page with the selected user
    router.push(`/chat/chats/room/${selectedUserId}`);
  };

  const checkIfUserAdded = async (userId) => {
    if (!currentUser) return false;

    const userChatRef = ref(db, `userChats/${currentUser.uid}/${userId}`);
    const snapshot = await get(userChatRef);
    return snapshot.exists();
  };

  const handleSelectUser = async ([id, user]) => {
    setSelectedUser([id, user]);
    const isUserAdded = await checkIfUserAdded(id);
    setIsAdded(isUserAdded);
    setShowDialog(true);
  };

  return (
    <ProtectedRoute>
      <div className="lg:px-10 flex items-center max-h-screen py-10">
        <Command className="rounded-lg border shadow-md h-full">
          <input
            className="p-3 outline-0"
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
                >
                  <Avatar>
                    <AvatarImage src={user.photoURL} />
                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex justify-between items-center w-full">
                    <span>{user.username}</span>
                    <Button disabled={isAdded}>
                      {isAdded ? "Added" : "Add"}
                    </Button>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        {selectedUser && (
          <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogContent>
              <div className="">
                <div className="bg-white shadow mt-24">
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="relative">
                      <Image
                        src={selectedUser[1].photoURL}
                        alt="Avatar"
                        height={48}
                        width={48}
                        className="w-48 h-48 bg-indigo-100 mx-auto rounded-full shadow-2xl"
                      />
                    </div>
                    <div className="mt-32 md:mt-0 md:justify-center">
                      <button
                        className="text-white py-2 px-4 uppercase rounded bg-blue-400 hover:bg-blue-500 shadow hover:shadow-lg font-medium transition transform hover:-translate-y-0.5"
                        onClick={handleAddUser}
                        disabled={isAdded} // Disable the button if the user is already added
                      >
                        {isAdded ? "Added" : "Add Friend"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-20 text-center border-b pb-12">
                    <h1 className="text-4xl font-medium text-gray-700">
                      {selectedUser[1].username}
                    </h1>
                    <p className="font-light text-gray-600 mt-3">
                      {selectedUser[1].email}
                    </p>
                    <p className="mt-8 text-gray-500">{selectedUser[1].bio}</p>
                  </div>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleAddUser}>
                  Add user
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </ProtectedRoute>
  );
}
