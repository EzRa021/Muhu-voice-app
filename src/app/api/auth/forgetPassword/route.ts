import { NextRequest, NextResponse } from 'next/server';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'; // Correct import

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();
        const auth = getAuth(); // Initialize auth
        await sendPasswordResetEmail(auth, email); // Use the correct method

        return NextResponse.json({ message: 'Password reset email sent.' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}
