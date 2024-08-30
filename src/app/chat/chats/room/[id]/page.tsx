"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ref, push, set, update, get, onChildAdded } from "firebase/database";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { db } from "@/firebase/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { saveUnsentMessage } from "@/storage/offlineStorage";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, SendIcon, StopCircle } from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import ChatList from "../../page";

type UserProfile = {
  uid: string;
  username: string;
  photoURL: string;
  language: string;
  unreadCount?: number; // Adding unreadCount as an optional property
};

type Message = {
  id: string;
  sender: string;
  text?: string;
  audioURL?: string;
  timestamp: number;
  status: "sending" | "sent" | "failed" | "offline";
};

const fetchUserProfile = async (id: string): Promise<UserProfile | null> => {
  const userRef = ref(db, `users/${id}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
};

const ChatPage = () => {
  const { id } = useParams() as { id: string };
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Connecting...");
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientProfile, setRecipientProfile] = useState<UserProfile | null>(
    null
  );
  const [message, setMessage] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voiceType, setVoiceType] = useState<"vt" | "vv">("vt");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await fetchUserProfile(id);
      setRecipientProfile(profile);
    };

    fetchProfile();
  }, [id]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserProfile(user.uid).then((profile) => {
          if (profile) {
            // Manually adding language property to the FirebaseUser object
            (user as any).language = profile.language;
          }
        });
      } else {
        console.error("No current user found");
      }
    });
    return () => unsubscribe();
  }, []);

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
        setTimeout(connectWebSocket, 5000);
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
          unreadCount: (recipientProfile?.unreadCount || 0) + 1,
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

  const sendMessage = async () => {
    if (!message.trim() && !audioBlob) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: currentUser!.uid,
      ...(message && { text: message }),
      ...(audioBlob && { audioURL: URL.createObjectURL(audioBlob) }),
      timestamp: Date.now(),
      status: ws && ws.readyState === WebSocket.OPEN ? "sending" : "offline",
    };

    queryClient.setQueryData<Message[]>(
      ["messages", currentUser?.uid, id],
      (oldMessages = []) => [...oldMessages, newMessage]
    );

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const audioBytes = audioBlob
          ? await audioBlob.arrayBuffer()
          : undefined;

        const messageData = audioBytes
          ? {
              message: Array.from(new Uint8Array(audioBytes)),
              lang: recipientProfile?.language || "english",
              key: voiceType,
              sender_lang: (currentUser as any).language || "english",
            }
          : {
              message: message,
              lang: recipientProfile?.language || "english",
              key: "none",
              sender_lang: (currentUser as any).language || "english",
            };

        console.log("Data sent:", JSON.stringify(messageData, null, 2));
        ws.send(JSON.stringify(messageData));
        newMessage.status = "sent";

        const recipientChatRef = ref(db, `userChats/${id}/${currentUser?.uid}`);
        await update(recipientChatRef, {
          username: currentUser?.displayName || "Unknown User",
          photoURL: currentUser?.photoURL || "",
          lastMessage: message || "Audio message",
          timestamp: newMessage.timestamp,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        newMessage.status = "failed";
        await saveUnsentMessage(newMessage);
      }
    } else {
      newMessage.status = "offline";
      await saveUnsentMessage(newMessage);
    }

    const newMessageRef = push(ref(db, `messages/${currentUser?.uid}/${id}`));
    await set(newMessageRef, { ...newMessage });

    const userChatRef = ref(db, `userChats/${currentUser?.uid}/${id}`);
    await update(userChatRef, {
      lastMessage: message || "Audio message",
      timestamp: newMessage.timestamp,
    });

    // Reset states after sending
    setMessage("");
    setAudioBlob(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false); // Reset the paused state
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      setAudioBlob(audioBlob);
      audioChunksRef.current = []; // Clear chunks after stopping to ensure a fresh start next time
      stopRecordingDuration();
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    setIsPaused(false);
    startRecordingDuration();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current?.stop();
      setIsRecording(false); // Indicate that recording has stopped, but keep the recording UI visible
    }
  };

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      stopRecordingDuration();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      startRecordingDuration();
      setIsPaused(false);
    }
  };

  const startRecordingDuration = () => {
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopRecordingDuration = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${minutes}:${sec < 10 ? "0" : ""}${sec}`;
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <main className="lg:grid grid-cols-[25%,75%] bg-background lg:p-4 p-0 gap-3 h-screen overflow-hidden">
      <div className="bg-muted/40 lg:block hidden">
        <ChatList />
      </div>

      <div className="flex flex-col bg-muted/40 lg:w-full lg:max-h-full rounded-md w-full h-full">
        <div className="flex justify-between sticky lg:top-0 top-14 items-center p-2 bg-background">
          <div className="flex gap-2 items-center">
            <ChevronLeftIcon className="h-5 w-5" onClick={router.back} />
            <Avatar>
              <AvatarImage src={recipientProfile?.photoURL} />
              <AvatarFallback>
                {recipientProfile?.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm">{recipientProfile?.username}</p>
              <p className="text-xs">{connectionStatus}</p>
            </div>
          </div>
        </div>
        <div className="overflow-y-scroll p-5 lg:mb-0 mb-20 lg:mt-0 mt-10 max-h-[500px]">
          {messages.map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === id ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`lg:max-w-80 max-w-72 min-w-36 mt-4 p-2 ${
                  msg.sender === id ? "bg-zinc-500" : "bg-zinc-700"
                } text-white rounded-lg`}
              >
                {msg.audioURL ? (
                  <audio controls>
                    <source src={msg.audioURL} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
                <div className="flex items-center justify-end">
                  <span className="text-[10px]">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <div className="bg-muted fixed flex items-center justify-between gap-4 p-3 lg:relative w-full bottom-0">
          {!isRecording && !audioBlob && (
            <>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message"
              />
              <Button onClick={sendMessage} disabled={!message.trim()}>
                Send
              </Button>
            </>
          )}
          {(isRecording || audioBlob) && (
            <div className="flex items-center justify-between px-2 gap-3 w-full">
              <div className="">
                <span>{formatDuration(recordingDuration)}</span>
              </div>
              {!audioBlob && (
                <>
                  <Button onClick={isPaused ? resumeRecording : pauseRecording}>
                    {isPaused ? (
                      <Play className="text-black" />
                    ) : (
                      <Pause className="text-black" />
                    )}
                  </Button>
                  <Button onClick={stopRecording}>
                    <StopCircle className="text-black" />
                  </Button>
                </>
              )}
              {audioBlob && (
                <>
                  <video autoPlay muted loop className="w-20 h-16 bg-none">
                    <source
                      src="\vecteezy_audio-spectrum-animation_38835278.mp4"
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>

                  <button
                    className="p-4 rounded flex justify-center items-center bg-black"
                    onClick={sendMessage}
                    disabled={!audioBlob}
                  >
                    <SendIcon className="text-white" />
                  </button>
                </>
              )}
            </div>
          )}
          {!isRecording && !audioBlob && (
            <Menubar className="bg-none">
              <MenubarMenu>
                <MenubarTrigger className="flex justify-center items-center p-3 rounded-full bg-background">
                  <Mic className="h-5 w-5" />
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem
                    onClick={() => {
                      setVoiceType("vt");
                      startRecording();
                    }}
                  >
                    Voice to text
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem
                    onClick={() => {
                      setVoiceType("vv");
                      startRecording();
                    }}
                  >
                    Voice to Voice
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          )}
        </div>
      </div>
    </main>
  );
};

export default ChatPage;
