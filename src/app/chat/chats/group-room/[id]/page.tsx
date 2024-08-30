"use client";

import React, { useState, useEffect, useRef } from "react";
import { ref, push, set, update, get, onChildAdded, onValue } from "firebase/database";
import { useParams, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, storage } from "@/firebase/firebase";
import { uploadBytes, getDownloadURL, ref as storageRef } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Paperclip, CornerDownLeft } from "lucide-react";
import { UserProfile, Message } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Fix 2: Add uid to UserProfile, update the key extraction to "id"
const fetchUserProfile = async ({ queryKey }: { queryKey: [string, string] }) => {
  const [, id] = queryKey;
  const userRef = ref(db, `users/${id}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? (snapshot.val() as UserProfile & { uid: string }) : null;
};

const GroupChatPage = () => {
  const { id } = useParams() as { id: string };
  const [currentUser, setCurrentUser] = useState<(UserProfile & { uid: string }) | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<(UserProfile & { uid: string })[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [voiceType, setVoiceType] = useState<string>("vv");
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", id],
    queryFn: fetchUserProfile,
    enabled: !!id,
  });

  const [ws, setWs] = useState<WebSocket | null>(null);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket("wss://muhu-voice-bd2fa0883b8b.herokuapp.com");

      websocket.onopen = () => console.log("WebSocket connected");

      websocket.onerror = (error) => {
        console.error("WebSocket error", error);
      };

      websocket.onclose = () => {
        console.log("WebSocket disconnected, attempting to reconnect...");
        setTimeout(connectWebSocket, 5000);
      };

      websocket.onmessage = (event) => {
        try {
          const translatedMessage = JSON.parse(event.data);
          console.log("Translation API Response:", translatedMessage);

          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === translatedMessage.id
                ? { ...msg, text: translatedMessage.message, status: "delivered" }
                : msg
            )
          );
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      setWs(websocket);
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Authentication and user setup
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        const userProfileSnapshot = await get(userRef);

        if (userProfileSnapshot.exists()) {
          const userData = userProfileSnapshot.val();
          const userProfile: UserProfile & { uid: string } = {
            uid: user.uid,
            username: userData.username || "Unknown User",
            photoURL: userData.photoURL || "",
            language: userData.language || "english",
          };
          setCurrentUser(userProfile);

          // Add current user to group members if not already added
          const memberRef = ref(db, `groups/${id}/members/${user.uid}`);
          await set(memberRef, userProfile);
        }
      }
    });

    return () => unsubscribe();
  }, [id]);

  // Message handling
  useEffect(() => {
    if (!currentUser) return;

    const messagesRef = ref(db, `groups/${id}/messages`);
    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const newMessage = snapshot.val() as Message;
      const isCurrentUserSender = newMessage.sender === currentUser.username;

      if (!isCurrentUserSender && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            id: newMessage.id,
            message: newMessage.audioURL || newMessage.text,
            lang: currentUser.language,
            sender_lang: newMessage.language,
            key: newMessage.audioURL ? "audio_to_text" : "text",
          })
        );
      }

      setMessages((prevMessages): Message[] => [
        ...prevMessages,
        isCurrentUserSender ? newMessage : { ...newMessage, status: "sending", text: "Translating..." },
      ]);
    });

    return () => unsubscribe();
  }, [currentUser, id, ws]);

  // Fetch and update group members
  useEffect(() => {
    if (!currentUser) return;

    const groupUsersRef = ref(db, `groups/${id}/members`);

    const handleUserChange = (snapshot: any) => {
      const users = snapshot.val();
      if (users) {
        setUsers(Object.values(users) as (UserProfile & { uid: string })[]);
      }
    };

    const unsubscribe = onValue(groupUsersRef, handleUserChange);

    return () => unsubscribe();
  }, [currentUser, id]);

  // Handle text message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentUser) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: currentUser.username,
      text: inputMessage,
      timestamp: Date.now(),
      status: "sending",
      language: currentUser.language,
    };

    const messageRef = push(ref(db, `groups/${id}/messages`));
    await set(messageRef, newMessage);

    // Update group metadata
    const groupRef = ref(db, `groups/${id}`);
    await update(groupRef, {
      lastMessage: newMessage.text,
      timestamp: newMessage.timestamp,
    });

    setInputMessage("");
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data]);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const recordingInterval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      mediaRecorder.onstop = () => {
        clearInterval(recordingInterval);
        setIsRecording(false);
      };

      console.log("Recording in progress...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please check your microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendRecording = async () => {
    if (!audioChunks.length || !currentUser) return;

    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    const audioFileName = `${Date.now()}.wav`;
    const audioStorageRef = storageRef(storage, `audio/${audioFileName}`);

    try {
      const snapshot = await uploadBytes(audioStorageRef, audioBlob);
      const audioURL = await getDownloadURL(snapshot.ref);

      const newMessage: Message = {
        id: Date.now().toString(),
        sender: currentUser.username,
        audioURL,
        timestamp: Date.now(),
        status: "sending",
        language: currentUser.language,
      };

      const messageRef = push(ref(db, `groups/${id}/messages`));
      await set(messageRef, newMessage);

      setAudioChunks([]);
      document.querySelector(".text-ui")?.classList.remove("hidden");
      document.querySelector(".recording-ui")?.classList.add("hidden");

      // Update group metadata
      const groupRef = ref(db, `groups/${id}`);
      await update(groupRef, {
        lastMessage: "Audio message",
        timestamp: newMessage.timestamp,
      });
    } catch (error) {
      console.error("Error sending audio:", error);
      toast.error("Failed to send audio message. Please try again.");
    }
  };

  const handleVoiceTypeSelection = (type: string) => {
    setVoiceType(type);
    document.querySelector(".text-ui")?.classList.add("hidden");
    document.querySelector(".recording-ui")?.classList.remove("hidden");
  };

  return (
    <main className="lg:grid gap-4 h-screen overflow-hidden lg:p-4 lg:mt-0 mt-14 grid-cols-[24%,73%]">
      <div className="hidden lg:block">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Joined Users</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 overflow-y-auto">
            {users.map((user) => (
              <div key={user.uid} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL || "/avatars/placeholder.png"} alt="Avatar" />
                  <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.username}</p>
                </div>
                <div className="font-medium">joined</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="relative grid h-screen">
        <Badge variant="outline" className="absolute right-3 top-3">
          Group Chat
        </Badge>
        <ScrollArea className="flex-1 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === currentUser?.username ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[90%] p-3 my-2 rounded-lg bg-background">
                <div className="text-xs font-semibold">{msg.sender}</div>
                {msg.sender === currentUser?.username ? (
                  msg.audioURL ? (
                    <audio controls className="w-full" src={msg.audioURL} />
                  ) : (
                    <div className="text-sm">{msg.text}</div>
                  )
                ) : (
                  <div className="text-sm">
                    {msg.status === "sending" ? "Translating..." : msg.text}
                    {msg.status === "delivered" && <span className="text-xs ml-2">(Translated)</span>}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </ScrollArea>
        <form
          onSubmit={handleSendMessage}
          className="sticky bottom-0 w-full overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
        >
          <div className="text-ui">
            <Label htmlFor="message" className="sr-only">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <div className="flex items-center p-3 pt-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Paperclip className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach File</TooltipContent>
              </Tooltip>

              <Menubar>
                <MenubarMenu>
                  <MenubarTrigger>
                    <Mic className="size-4" />
                  </MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem onClick={() => handleVoiceTypeSelection("vt")}>
                      Voice to text
                    </MenubarItem>
                    <MenubarItem onClick={() => handleVoiceTypeSelection("vv")}>
                      Voice to Voice
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
              <Button type="submit" size="sm" className="ml-auto gap-1.5">
                Send Message
                <CornerDownLeft className="size-3.5" />
              </Button>
            </div>
          </div>
          <div className="recording-ui hidden">
            <div className="flex flex-col items-center gap-2 p-3">
              <div>
                <span>Recording: </span>
                <span>{Math.floor(recordingTime / 60)}:{("0" + (recordingTime % 60)).slice(-2)}</span>
              </div>
              <Button onClick={startRecording} size="sm" disabled={isRecording}>
                Start Recording
              </Button>
              <Button onClick={stopRecording} size="sm" disabled={!isRecording}>
                Stop Recording
              </Button>
              <Button onClick={sendRecording} size="sm" disabled={!audioChunks.length}>
                Send Recording
              </Button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default GroupChatPage;
