// /src/app/api/auth/forgotPassword/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/firebase/firebase';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        // Send password reset email
        await auth.sendPasswordResetEmail(email);

        return NextResponse.json({ message: 'Password reset email sent.' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}
