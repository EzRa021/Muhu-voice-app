"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatList from "../../page";
import { ref, push, onValue, get, set } from "firebase/database"; 
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/firebase/firebase"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Fetch user profile from Firebase
const fetchUserProfile = async ({ queryKey }) => {
  const [_, id] = queryKey;
  const userRef = ref(db, `users/${id}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
};

// Fetch messages between the current user and the other user
const fetchMessages = async ({ queryKey }) => {
  const [_, currentUserUid, id] = queryKey;
  const messagesRef = ref(db, `messages/${currentUserUid}/${id}`);
  const snapshot = await get(messagesRef);
  if (snapshot.exists()) {
    return Object.entries(snapshot.val()).map(([key, message]) => ({
      id: key,
      ...message,
    }));
  }
  return [];
};

const ChatPage = () => {
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const messagesEndRef = useRef(null);

  const queryClient = useQueryClient();

  // Fetch user profile using TanStack Query (formerly React Query)
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: fetchUserProfile,
    enabled: !!id,
  });

  // Fetch messages using TanStack Query
  const { data: messages } = useQuery({
    queryKey: ['messages', currentUser?.uid, id],
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

    // Initialize WebSocket
    const websocket = new WebSocket("ws://muhu-voice-bd2fa0883b8b.herokuapp.com");
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

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      console.warn("Empty message not sent");
      return;
    }

    if (!currentUser) {
      console.error("No current user found");
      return;
    }

    // Fetch the receiver's language
    const receiverProfile = await fetchUserProfile({ queryKey: ['userProfile', id] });
    const receiverLanguage = receiverProfile?.language || 'english'; // Default to English if not set

    const messageData = {
      sender: currentUser.uid,
      text: message,
      timestamp: Date.now(),
    };

    // Send message to WebSocket for translation
    if (ws) {
      ws.send(JSON.stringify({ message, lang: receiverLanguage })); 

      ws.onmessage = async (event) => {
        const translatedMessage = event.data;
        console.log("Translated message received:", translatedMessage);

        // Store the original message for the sender
        const newMessageRef = push(ref(db, `messages/${currentUser.uid}/${id}`));
        await set(newMessageRef, { ...messageData });

        // Store the translated message for the receiver
        const recipientMessageRef = push(ref(db, `messages/${id}/${currentUser.uid}`));
        await set(recipientMessageRef, { ...messageData, text: translatedMessage });

        setMessage(""); 
        queryClient.invalidateQueries(['messages', currentUser?.uid, id]); 
        queryClient.invalidateQueries(['messages', id, currentUser?.uid]); // Invalidate receiver's cache
      };
    } else {
      console.error("WebSocket connection is not established");
    }
  };

  // Auto-scroll to the bottom of the message list
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <main className="lg:grid grid-cols-[25%,75%] bg-background p-4 gap-3 h-screen">
      <div className="bg-muted/40 lg:block hidden">
        <ChatList />
      </div>

      <div className="flex flex-col bg-muted/40 lg:w-full rounded-md w-full">
        <div className="flex justify-between items-center p-2 bg-background">
          <div className="flex gap-2 items-center">
            <ChevronLeftIcon className="h-5 w-5" />
            <Avatar>
              <AvatarImage src={userProfile?.photoURL || 'https://via.placeholder.com/150'} />
              <AvatarFallback>{userProfile?.username?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm">{userProfile?.username}</p>
              <p className="text-xs">{connectionStatus}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {messages && messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === id ? "justify-start" : "justify-end"
              }`}
            >
              <div className="max-w-xs mt-4 p-3 bg-orange-400 text-white rounded-lg">
                <p>{msg.text}</p>
                <span className="text-xs">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <form onSubmit={handleSendMessage} className="flex p-4 gap-4 border-t">
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
  );
};

export default ChatPage;
