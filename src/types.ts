// src/types.ts
export type Message = {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'failed' | 'offline';
};

export type UserProfile = {
  username: string;
  photoURL?: string;
  language?: string;
  unreadCount?: number; // Add this line
};
