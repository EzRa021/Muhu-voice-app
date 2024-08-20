"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatList from "../../page";
import { ref, push, get, set, update, onValue } from "firebase/database";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { db } from "@/firebase/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/app/protectedRoute";

type Message = {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
};

type UserProfile = {
  username: string;
  photoURL?: string;
  language?: string;
  unreadCount?: number;
};

const fetchUserProfile = async ({
  queryKey,
}: {
  queryKey: [string, string];
}) => {
  const [, id] = queryKey;
  const userRef = ref(db, `users/${id}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
};

const ChatPage = () => {
  const { id } = useParams() as { id: string };
  const [message, setMessage] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", id],
    queryFn: fetchUserProfile,
    enabled: !!id,
  });

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        console.error("No current user found");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const messagesRef = ref(db, `messages/${currentUser.uid}/${id}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = Object.entries(
          snapshot.val() as Record<string, Omit<Message, "id">>
        ).map(([key, message]) => ({
          id: key,
          ...message,
        }));
        setMessages(messagesData);
        queryClient.invalidateQueries({
          queryKey: ["messages", currentUser.uid, id],
        });
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser, id, queryClient]);

  useEffect(() => {
    if (!currentUser) return;

    const websocket = new WebSocket(
      "wss://muhu-voice-bd2fa0883b8b.herokuapp.com"
    );
    websocket.onopen = () => setConnectionStatus("Connected");
    websocket.onerror = (error) => {
      console.error("WebSocket error", error);
      setConnectionStatus("Connection Failed");
    };
    websocket.onclose = () => setConnectionStatus("Disconnected");
    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [id, currentUser]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!message.trim()) {
      console.warn("Empty message not sent");
      return;
    }

    if (!currentUser) {
      console.error("No current user found");
      return;
    }

    const receiverProfile = await fetchUserProfile({
      queryKey: ["userProfile", id],
    });
    const receiverLanguage = receiverProfile?.language || "english";

    const messageData = {
      sender: currentUser.uid,
      text: message,
      timestamp: Date.now(),
    };

    if (ws) {
      ws.send(JSON.stringify({ message, lang: receiverLanguage }));

      ws.onmessage = async (event) => {
        const translatedMessage = event.data as string;

        // Store the original message for the sender
        const newMessageRef = push(
          ref(db, `messages/${currentUser.uid}/${id}`)
        );
        await set(newMessageRef, { ...messageData });

        // Store the translated message for the receiver
        const recipientMessageRef = push(
          ref(db, `messages/${id}/${currentUser.uid}`)
        );
        await set(recipientMessageRef, {
          ...messageData,
          text: translatedMessage,
        });

        // Update chat metadata for both users
        const userChatRef = ref(db, `userChats/${currentUser.uid}/${id}`);
        const recipientChatRef = ref(db, `userChats/${id}/${currentUser.uid}`);

        await update(userChatRef, {
          lastMessage: message,
          timestamp: messageData.timestamp,
        });

        await update(recipientChatRef, {
          lastMessage: translatedMessage,
          timestamp: messageData.timestamp,
          unreadCount: (receiverProfile?.unreadCount || 0) + 1,
        });

        setMessage("");

        // Ensure the query keys are correct and invalidate them
        if (currentUser?.uid && id) {
          queryClient.invalidateQueries({
            queryKey: ["messages", currentUser.uid, id],
          });
          queryClient.invalidateQueries({
            queryKey: ["messages", id, currentUser.uid],
          });

          queryClient.invalidateQueries({
            queryKey: ["userChats", currentUser.uid],
          });
        }
      };
    } else {
      console.error("WebSocket connection is not established");
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <ProtectedRoute>
      <main className="flex flex-row  bg-background lg:p-4 p-0 gap-3 lg:h-screen h-full max-h-screen">
        <div className="sticky top-0 bg-muted/40 w-[40%]  lg:block hidden">
          <ChatList />
        </div>

        <div className="flex flex-col bg-muted/40 w-full  h-full rounded-md">
          <div className="flex justify-between sticky top-0 items-center p-2 bg-background">
            <div className="flex gap-2 items-center">
              <ChevronLeftIcon className="h-5 w-5" onClick={router.back} />
              <Avatar>
                <AvatarImage
                  src={
                    userProfile?.photoURL || "https://via.placeholder.com/150"
                  }
                />
                <AvatarFallback>
                  {userProfile?.username?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm">{userProfile?.username}</p>
                <p className="text-xs">{connectionStatus}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 max-h-full">
            {messages.map((msg: Message) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === id ? "justify-start" : "justify-end"
                }`}
              >
                <div className="max-w-80 min-w-36 mt-4 p-3 bg-orange-400 text-white rounded-lg">
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-[10px]">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>
          <form
            onSubmit={handleSendMessage}
            className="flex p-4 bg-muted sticky bottom-0 gap-4 border-t w-full"
          >
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message"
              className="flex-1"
            />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
};

export default ChatPage;
