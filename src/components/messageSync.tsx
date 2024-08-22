// src/components/messageSync.ts
import { useEffect } from 'react';
import { getUnsentMessages, clearUnsentMessages } from '@/storage/offlineStorage';
import { Message } from '@/types';

type MessageSyncProps = {
  websocket: WebSocket | null;
  sendMessage: (message: Message) => void;
};

const MessageSync: React.FC<MessageSyncProps> = ({ websocket, sendMessage }) => {
  useEffect(() => {
    const syncMessages = async () => {
      if (websocket && navigator.onLine) {
        const unsentMessages = await getUnsentMessages();
        for (const message of unsentMessages) {
          sendMessage(message);
          await clearUnsentMessages(message.id);
        }
      }
    };

    window.addEventListener('online', syncMessages);
    return () => {
      window.removeEventListener('online', syncMessages);
    };
  }, [websocket, sendMessage]);

  return null;
};

export default MessageSync;
