// /src/app/api/auth/resetPassword/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/firebase/firebase';

export async function POST(req: NextRequest) {
    try {
        const { oobCode, newPassword } = await req.json();

        // Confirm the password reset using the oobCode and new password
        await auth.confirmPasswordReset(oobCode, newPassword);

        return NextResponse.json({ message: 'Password has been reset.' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}
