"use client"
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, get, update } from "firebase/database"; // Ensure `get` is imported
import { db } from "@/firebase/firebase";
import { useQuery, useQueryClient, QueryFunctionContext } from "@tanstack/react-query";
import ProtectedRoute from "@/app/protectedRoute";

// Define the types for chat data
type Chat = {
  id: string;
  username: string;
  lastMessage: string;
  timestamp: number;
  unreadCount?: number;
  photoURL?: string;
};

// Define the props type for ChatListItem
type ChatListItemProps = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  avatarUrl: string;
};

const fetchUserChats = async ({ queryKey }: QueryFunctionContext<[string, string | undefined]>) => {
  const [, currentUserUid] = queryKey;
  if (!currentUserUid) return []; // Return an empty array if no user ID

  try {
    const userChatsRef = ref(db, `userChats/${currentUserUid}`);
    const snapshot = await get(userChatsRef); // Ensure `get` is used here
    if (snapshot.exists()) {
      return Object.entries(snapshot.val() as Record<string, Omit<Chat, 'id'>>).map(([id, chat]) => ({
        id,
        ...chat,
      })) as Chat[];
    }
    return [];
  } catch (error) {
    console.error("Error fetching user chats:", error);
    throw new Error("Failed to fetch user chats");
  }
};

const ChatListItem = ({ id, name, lastMessage, time, unreadCount, avatarUrl }: ChatListItemProps) => (
  <Link href={`/chat/chats/room/${id}`} className="flex items-center gap-3 p-3  hover:bg-muted/10 transition">
    <Image src={avatarUrl} alt={name} width={40} height={40} className="rounded-full" />
    <div className="flex-1 border-b pb-3">
      <div className="flex justify-between">
        <h2 className="text-sm font-medium text-primary">{name}</h2>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
      <p className="text-xs text-muted-foreground truncate line-clamp-1">{lastMessage}</p>
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
  const queryClient = useQueryClient();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user chats using TanStack Query
  const { data: chats } = useQuery({
    queryKey: ["userChats", currentUser?.uid],
    queryFn: fetchUserChats,
    enabled: !!currentUser,
  });

  const handleChatOpen = async (chatId: string) => {
    if (!currentUser) return;

    const userChatRef = ref(db, `userChats/${currentUser.uid}/${chatId}`);
    await update(userChatRef, { unreadCount: 0 });

    queryClient.invalidateQueries({
      queryKey: ["userChats", currentUser.uid],
    });
  };

  return (
    <ProtectedRoute>
      <div className="w-full h-full static top-4 max-w-auto rounded-md overflow-y-auto py-2">
        <nav>
          <div className="sticky top-0 bg-muted/40 z-10">
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
          <div className="overflow-hidden ">
            {chats &&
              chats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  id={chat.id}
                  name={chat.username}
                  lastMessage={chat.lastMessage || "No messages yet"}
                  time={new Date(chat.timestamp).toLocaleTimeString()}
                  unreadCount={chat.unreadCount || 0}
                  avatarUrl={chat.photoURL || "https://randomuser.me/api/portraits/men/1.jpg"}
                />
              ))}
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  );
};

export default ChatList;
