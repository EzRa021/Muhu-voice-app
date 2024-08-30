// src/types.ts
export type Message = {
  id: string;
  sender: string;
  text?: string;  // Optional, as audio messages may not have text
  audioURL?: string;  // Include this for audio messages
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'failed' | 'offline';
  language?: string
};

export type UserProfile = {
  username: string;
  photoURL?: string;
  language?: string;
  unreadCount?: number;
};
