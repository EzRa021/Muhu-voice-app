// /src/app/api/auth/verifyResetCode/route.ts
import { NextRequest, NextResponse } from 'next/server';

// This API is optional if you want to manually verify a custom OTP code
export async function POST(req: NextRequest) {
    try {
        const { email, code } = await req.json();

        // Verify the OTP code
        // Implement your custom OTP verification logic here if needed
        const isValid = true; // Replace with actual validation logic

        if (isValid) {
            return NextResponse.json({ message: 'OTP verified.' }, { status: 200 });
        } else {
            return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}
