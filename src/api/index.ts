// src/api/index.ts
import { UserProfile, Message } from '@/types';
import { ref, get } from 'firebase/database';
import { db } from '@/firebase/firebase';

export const fetchUserProfile = async ({ queryKey }: { queryKey: [string, string] }): Promise<UserProfile | null> => {
  const [, id] = queryKey;
  const userRef = ref(db, `users/${id}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() as UserProfile : null;
};

export const fetchMessages = async ({ queryKey }: { queryKey: [string, string | undefined, string] }): Promise<Message[]> => {
  const [, currentUserUid, id] = queryKey;
  const messagesRef = ref(db, `messages/${currentUserUid}/${id}`);
  const snapshot = await get(messagesRef);
  if (snapshot.exists()) {
    return Object.entries(snapshot.val() as Record<string, Omit<Message, 'id'>>).map(([key, message]) => ({
      id: key,
      ...message,
    }));
  }
  return [];
};
