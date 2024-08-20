"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'; // Import the correct function

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const auth = getAuth(); // Initialize auth

        try {
            await sendPasswordResetEmail(auth, email); // Use the correct function
            router.push(`/auth/verification-code?email=${encodeURIComponent(email)}`);
        } catch (error) {
            setError((error as Error).message);
            setLoading(false);
        }
    };

    return (
        <div className=" flex justify-center items-center h-screen">
            <Card className="w-full max-w-sm">
                <CardHeader className=" flex justify-center items-center">
                    <div className=" h-32 w-32 flex justify-center items-center rounded-full border-2 border-white">
                        <Lock className=" h-10 w-10"/>
                    </div>
                </CardHeader>
                <CardDescription className=" text-center px-3">
                    Enter your email address, and we will send you a link to reset your password.
                </CardDescription>
                <CardContent className="grid gap-4 mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="m@example.com" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Sending..." : "Submit"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
