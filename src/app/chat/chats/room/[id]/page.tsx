// src/app/chat/chats/room/[id]/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatList from "../../page";
import { saveUnsentMessage } from "@/storage/offlineStorage";
import { ref, push, set, update, get, onChildAdded } from "firebase/database";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { db } from "@/firebase/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/app/protectedRoute";
import MessageStatusIndicator from "@/components/messageStatusIndicator";
import ChatInput from "@/components/chatInput";
import { UserProfile, Message } from "@/types";
import { Button } from "@/components/ui/button";

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
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const goBack = () => {
    router.back();
  };

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", id],
    queryFn: fetchUserProfile,
    enabled: !!id,
  });

  useEffect(() => {
    if (!currentUser) return;

    const messagesRef = ref(db, `messages/${currentUser.uid}/${id}`);
    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const newMessage = snapshot.val() as Message;
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => unsubscribe();
  }, [currentUser, id]);

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
    const connectWebSocket = () => {
      const websocket = new WebSocket(
        "wss://muhu-voice-bd2fa0883b8b.herokuapp.com"
      );

      websocket.onopen = () => {
        setConnectionStatus("Connected");
        console.log("WebSocket connected");
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error", error);
        setConnectionStatus("Connection Failed");
      };

      websocket.onclose = () => {
        setConnectionStatus("Disconnected");
        setTimeout(connectWebSocket, 5000); // Try reconnecting after 5 seconds
      };

      websocket.onmessage = async (event) => {
        const translatedMessage = event.data as string;
        console.log("Translated message received:", translatedMessage);

        const recipientMessageRef = push(
          ref(db, `messages/${id}/${currentUser?.uid}`)
        );
        await set(recipientMessageRef, {
          text: translatedMessage,
          timestamp: Date.now(),
          sender: currentUser?.uid,
          status: "delivered",
        });

        const recipientChatRef = ref(db, `userChats/${id}/${currentUser?.uid}`);
        await update(recipientChatRef, {
          lastMessage: translatedMessage,
          timestamp: Date.now(),
          unreadCount: (userProfile?.unreadCount || 0) + 1,
        });

        queryClient.invalidateQueries({
          queryKey: ["messages", currentUser?.uid, id],
        });
        queryClient.invalidateQueries({
          queryKey: ["messages", id, currentUser?.uid],
        });
      };

      setWs(websocket);
    };

    if (currentUser) {
      connectWebSocket();
    }

    return () => {
      if (ws) ws.close();
    };
  }, [id, currentUser]);

  const sendMessage = async (message: Message) => {
    queryClient.setQueryData<Message[]>(
      ["messages", currentUser?.uid, id],
      (oldMessages = []) => [...oldMessages, message]
    );

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        console.log("Sending message:", message.text);
        ws.send(
          JSON.stringify({
            message: message.text,
            lang: userProfile?.language || "english",
          })
        );
        message.status = "sent";
      } catch (error) {
        console.error("Error sending message:", error);
        message.status = "failed";
        await saveUnsentMessage(message);
      }
    } else {
      message.status = "offline";
      await saveUnsentMessage(message);
    }

    const newMessageRef = push(ref(db, `messages/${currentUser?.uid}/${id}`));
    await set(newMessageRef, { ...message });

    const userChatRef = ref(db, `userChats/${currentUser?.uid}/${id}`);
    await update(userChatRef, {
      lastMessage: message.text,
      timestamp: message.timestamp,
    });

    queryClient.invalidateQueries({
      queryKey: ["messages", currentUser?.uid, id],
    });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <ProtectedRoute>
      <main className="lg:grid grid-cols-[25%,75%] bg-background lg:p-4 p-0 gap-3 h-screen overflow-hidden">
        <div className="bg-muted/40 lg:block hidden">
          <ChatList />
        </div>

        <div className="flex flex-col bg-muted/40 lg:w-full lg:max-h-full rounded-md w-full h-full">
          <div className="flex justify-between sticky lg:top-0 top-14 items-center p-2 bg-background">
            <div className="flex gap-2 items-center">
              <ChevronLeftIcon className="h-5 w-5" onClick={goBack} />
              <Avatar>
                <AvatarImage
                  src={
                    userProfile?.photoURL
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
          <div className=" overflow-y-scroll p-5 lg:mb-0 mb-20 lg:mt-0 mt-10 max-h-[500px]">
            {messages &&
              messages.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === id ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`lg:max-w-80 max-w-72 min-w-36 mt-4 p-2 ${
                      msg.sender === id ? "bg-zinc-500" : "bg-zinc-700"
                    }  text-white rounded-lg`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <div className="flex items-center justify-end">
                      <span className="text-[10px]">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      <MessageStatusIndicator status={msg.status} />
                    </div>
                  </div>
                </div>
              ))}
            <div ref={messagesEndRef}></div>
          </div>
          <div className="bg-muted fixed lg:relative w-full  bottom-0 ">
            <ChatInput
              currentUserUid={currentUser?.uid || ""}
              recipientId={id}
              sendMessage={sendMessage}
              websocket={ws}
            />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
};

export default ChatPage;
