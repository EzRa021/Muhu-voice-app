// src/pages/chat/chats/create-group.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ref, set } from "firebase/database";
import { db } from "@/firebase/firebase";
import { v4 as uuidv4 } from "uuid";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState("");
  const [groupLink, setGroupLink] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    const groupId = uuidv4();
    const groupRef = ref(db, `groups/${groupId}`);

    await set(groupRef, {
      groupName,
      createdAt: Date.now(),
      members: {},
      messages: {},
    });

    const link = `${window.location.origin}/chat/chats/group-room/${groupId}`;
    setGroupLink(link);
  };

  const handleCopyLink = () => {
    if (groupLink) {
      navigator.clipboard.writeText(groupLink);
      toast("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-[400px]">
        {!groupLink ? (
          <CardHeader>
            <CardTitle>Create Group</CardTitle>
          </CardHeader>
        ) : (
          <CardHeader>
            <CardTitle>Group Created</CardTitle>
          </CardHeader>
        )}

        <CardContent>
          {!groupLink ? (
            <div className="grid w-full items-center gap-4">
              <Label htmlFor="name">Group Title</Label>
              <Input
                id="name"
                placeholder="Name of your group"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          ) : (
            <div className="mt-4">
              <Label>Group Name</Label>
              <p className="text-lg font-semibold mb-2">{groupName}</p>
              <Label>Group Link</Label>
              <div className="flex items-center space-x-2 mt-2">
                <span className="p-1 border border-gray-200 line-clamp-1">
                  <p className="underline">{groupLink}</p>
                </span>
                <Button variant="ghost" size="icon" onClick={handleCopyLink}>
                  <Copy className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    router.push(
                      `/chat/chats/group-room/${groupLink.split("/").pop()}`
                    )
                  }
                >
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <Button onClick={handleCreateGroup} className="m-4">
          Create Group
        </Button>
      </Card>
    </div>
  );
}
