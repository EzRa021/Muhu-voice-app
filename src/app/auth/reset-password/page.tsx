"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, confirmPasswordReset } from 'firebase/auth'; // Import the correct function

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    const oobCode = searchParams.get('oobCode'); // Firebase password reset code

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!oobCode) {
            setError('Invalid or expired password reset code.');
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        const auth = getAuth(); // Initialize auth

        try {
            await confirmPasswordReset(auth, oobCode, password); // Use the correct function
            router.push('/auth/signin');
        } catch (error) {
            setError((error as Error).message);
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <Card className="w-full max-w-sm">
                <CardHeader className="flex justify-center items-center">
                    <div className="h-32 w-32 flex justify-center items-center rounded-full border-2 border-white">
                        <Lock className="h-10 w-10" />
                    </div>
                </CardHeader>
                <CardDescription className="text-center px-3">
                    Enter a new password
                </CardDescription>
                <CardContent className="grid gap-4 mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            placeholder="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm password</Label>
                        <Input 
                            id="confirm-password" 
                            type="password" 
                            placeholder="confirm-password" 
                            required 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Resetting..." : "Submit"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
