// src/components/ChatList.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase/firebase";
import { useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/app/protectedRoute";

type Chat = {
  id: string;
  username: string;
  lastMessage: string;
  timestamp: number;
  unreadCount?: number;
  photoURL?: string;
};

const ChatListItem = ({
  id,
  name,
  lastMessage,
  time,
  unreadCount,
  avatarUrl,
  letter,
}: {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  avatarUrl: string;
  letter?: string;
}) => (
  <Link href={`/chat/chats/room/${id}`} className="flex items-center gap-3 p-3 hover:bg-muted/10 transition">
    <Avatar>
      <AvatarImage src={avatarUrl} />
      <AvatarFallback>{letter}</AvatarFallback>
    </Avatar>
    <div className="flex-1 border-b pb-3">
      <div className="flex justify-between">
        <h2 className="text-sm font-medium text-primary">{name}</h2>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
      <p className="text-xs text-muted-foreground w-24 lg:w-32 truncate">{lastMessage}</p>
    </div>
    {unreadCount && unreadCount > 0 && (
      <Badge className="ml-2 h-6 w-6 flex items-center justify-center rounded-full text-xs">
        {unreadCount}
      </Badge>
    )}
  </Link>
);

const ChatList = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const userChatsRef = ref(db, `userChats/${currentUser.uid}`);
    const unsubscribe = onValue(userChatsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const chatsData = Object.entries(snapshot.val() as Record<string, Omit<Chat, "id">>)
          .map(([id, chat]) => ({ id, ...chat }));

        setChats(chatsData);
        queryClient.invalidateQueries({ queryKey: ["userChats", currentUser.uid] });
      } else {
        setChats([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser, queryClient]);

  return (
    <ProtectedRoute>
      <div className="h-full max-w-auto rounded-md overflow-y-auto py-2">
        <nav>
          <div className="lg:mt-0 mt-14 bg-muted/40 z-10">
            <div className="flex justify-between items-center py-3 px-3">
              <h1 className="text-2xl">Chats</h1>
              <Link href="/chat/adduser">
                <button className="flex items-center justify-center p-1 rounded-full border-white border-2">
                  <UserPlus className="h-4 w-4" />
                </button>
              </Link>
            </div>
            <div className="px-3 pb-3">
              <Input type="search" placeholder="Search" />
            </div>
          </div>
          <div className="overflow-auto px-3 pb-3">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  id={chat.id}
                  name={chat.username}
                  lastMessage={chat.lastMessage || "No messages yet"}
                  time={new Date(chat.timestamp).toLocaleTimeString()}
                  unreadCount={chat.unreadCount || 0}
                  avatarUrl={chat.photoURL || "https://randomuser.me/api/portraits/men/1.jpg"}
                  letter={chat?.username?.charAt(0)}
                />
              ))
            ) : (
              <div className="text-center h-full flex flex-col justify-center items-center text-muted-foreground mt-10">
                <p className=" tex-4xl font-medium ">No users yet.</p>
                <Link href="/chat/adduser" className=" mt-5 text-blue-500 underline">
                  Add a user
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  );
};

export default ChatList;
