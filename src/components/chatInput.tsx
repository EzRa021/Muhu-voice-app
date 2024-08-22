// src/components/chatInput.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { saveUnsentMessage } from '@/storage/offlineStorage';
import { Message } from '@/types';

type ChatInputProps = {
  currentUserUid: string;
  recipientId: string;
  sendMessage: (message: Message) => void;
  websocket: WebSocket | null;
};

const ChatInput: React.FC<ChatInputProps> = ({ currentUserUid, recipientId, sendMessage, websocket }) => {
  const [message, setMessage] = useState<string>('');
  const queryClient = useQueryClient();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: currentUserUid,
      text: message,
      timestamp: Date.now(),
      status: websocket && websocket.readyState === WebSocket.OPEN ? 'sending' : 'offline',
    };

    sendMessage(newMessage);
    setMessage('');

    if (newMessage.status === 'offline') {
      await saveUnsentMessage(newMessage);
    }

    queryClient.invalidateQueries({ queryKey: ["messages", currentUserUid, recipientId] });
  };

  return (
    // <div className=" ">
    <div className="flex gap-4  mx-4 my-5">
      <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message" />
      <Button onClick={handleSendMessage} disabled={!message.trim()}>Send</Button>
    </div>
    // </div>
  );
};

export default ChatInput;


      