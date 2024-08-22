// src/storage/offlineStorage.ts
import { Message } from '@/types';

export const saveUnsentMessage = async (message: Message) => {
  try {
    const unsentMessages = JSON.parse(localStorage.getItem('unsentMessages') || '[]') as Message[];
    unsentMessages.push(message);
    localStorage.setItem('unsentMessages', JSON.stringify(unsentMessages));
  } catch (error) {
    console.error('Failed to save unsent message', error);
  }
};

export const getUnsentMessages = async (): Promise<Message[]> => {
  try {
    return JSON.parse(localStorage.getItem('unsentMessages') || '[]') as Message[];
  } catch (error) {
    console.error('Failed to retrieve unsent messages', error);
    return [];
  }
};

export const clearUnsentMessages = async () => {
  try {
    localStorage.removeItem('unsentMessages');
  } catch (error) {
    console.error('Failed to clear unsent messages', error);
  }
};
