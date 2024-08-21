// src/storage/offlineStorage.ts
import { Message } from '@/types';
import localForage from 'localforage';

const unsentMessagesStore = localForage.createInstance({
  name: 'unsentMessages',
});

// offlineStorage.ts
export const saveUnsentMessage = async (message: Message) => {
  try {
    const unsentMessages = JSON.parse(localStorage.getItem("unsentMessages") || "[]");
    unsentMessages.push(message);
    localStorage.setItem("unsentMessages", JSON.stringify(unsentMessages));
  } catch (error) {
    console.error("Error saving unsent message:", error);
  }
};


export const getUnsentMessages = async (): Promise<Message[]> => {
  return (await unsentMessagesStore.getItem<Message[]>('messages')) || [];
};

export const removeUnsentMessage = async (id: string) => {
  const existingMessages = (await getUnsentMessages()).filter(message => message.id !== id);
  await unsentMessagesStore.setItem('messages', existingMessages);
};
