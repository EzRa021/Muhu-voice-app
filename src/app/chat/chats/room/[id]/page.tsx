"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatList from "../../page";
import { saveUnsentMessage } from "@/storage/offlineStorage";
import { ref, push, set, update, get } from "firebase/database";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { db } from "@/firebase/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { v4 as uuidv4 } from "uuid";
import ProtectedRoute from "@/app/protectedRoute";
import MessageStatusIndicator from "@/components/messageStatusIndicator";
import ChatInput from "@/components/chatInput";
import { UserProfile, Message } from "@/types";

// Fetch the user profile from Firebase
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

// Fetch messages from Firebase
const fetchMessages = async ({
  queryKey,
}: {
  queryKey: [string, string | undefined, string];
}) => {
  const [, currentUserUid, id] = queryKey;
  const messagesRef = ref(db, `messages/${currentUserUid}/${id}`);
  const snapshot = await get(messagesRef);
  if (snapshot.exists()) {
    return Object.entries(
      snapshot.val() as Record<string, Omit<Message, "id">>
    ).map(([key, message]) => ({
      id: key,
      ...message,
    }));
  }
  return [];
};

const ChatPage = () => {
  const { id } = useParams() as { id: string };
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");
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

  const { data: messages } = useQuery({
    queryKey: ["messages", currentUser?.uid, id],
    queryFn: fetchMessages,
    enabled: !!currentUser && !!id,
    refetchOnWindowFocus: false,
  });

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

  const sendMessage = async (message: Message) => {
    // Optimistically update the UI
    queryClient.setQueryData<Message[]>(
      ["messages", currentUser?.uid, id],
      (oldMessages = []) => [...oldMessages, message]
    );

    if (ws) {
      try {
        ws.send(
          JSON.stringify({
            message: message.text,
            lang: userProfile?.language || "english",
          })
        );
        ws.onmessage = async (event) => {
          const translatedMessage = event.data as string;
          message.status = "delivered";

          const newMessageRef = push(
            ref(db, `messages/${currentUser?.uid}/${id}`)
          );
          await set(newMessageRef, { ...message });

          const recipientMessageRef = push(
            ref(db, `messages/${id}/${currentUser?.uid}`)
          );
          await set(recipientMessageRef, {
            ...message,
            text: translatedMessage,
          });

          const userChatRef = ref(db, `userChats/${currentUser?.uid}/${id}`);
          const recipientChatRef = ref(
            db,
            `userChats/${id}/${currentUser?.uid}`
          );

          await update(userChatRef, {
            lastMessage: message.text,
            timestamp: message.timestamp,
          });

          await update(recipientChatRef, {
            lastMessage: translatedMessage,
            timestamp: message.timestamp,
            unreadCount: (userProfile?.unreadCount || 0) + 1,
          });

          queryClient.invalidateQueries({
            queryKey: ["messages", currentUser?.uid, id],
          });
          queryClient.invalidateQueries({
            queryKey: ["messages", id, currentUser?.uid],
          });
        };
      } catch (error) {
        console.error("Error sending message:", error);
        message.status = "failed";
        await saveUnsentMessage(message);

        queryClient.setQueryData<Message[]>(
          ["messages", currentUser?.uid, id],
          (oldMessages = []) =>
            oldMessages.map((msg) => (msg.id === message.id ? message : msg))
        );
      }
    } else {
      message.status = "offline";
      await saveUnsentMessage(message);

      queryClient.setQueryData<Message[]>(
        ["messages", currentUser?.uid, id],
        (oldMessages = []) =>
          oldMessages.map((msg) => (msg.id === message.id ? message : msg))
      );
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <ProtectedRoute>
      <main className="lg:grid grid-cols-[25%,75%] bg-background lg:p-4 p-0 gap-3 lg:h-screen h-full">
        <div className="bg-muted/40 lg:block hidden">
          <ChatList />
        </div>

        <div className="flex flex-col bg-muted/40 lg:w-full lg:max-h-[640px] rounded-md w-full h-full">
          <div className="flex justify-between sticky lg:top-0 top-14 items-center p-2 bg-background">
            <div className="flex gap-2 items-center">
              <ChevronLeftIcon className="h-5 w-5" onClick={goBack} />
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
          <div className=" overflow-y-auto p-5 lg:mb-0 mb-14 lg:mt-0 mt-10 h-full">
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
                      msg.sender === id ? "bg-lime-500" : "bg-orange-400"
                    }  text-white rounded-lg`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <div className=" flex items-center  justify-end"
                    >
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
          <ChatInput
            currentUserUid={currentUser?.uid || ""}
            recipientId={id}
            sendMessage={sendMessage}
            websocket={ws}
          />
        </div>
      </main>
    </ProtectedRoute>
  );
};

export default ChatPage;
