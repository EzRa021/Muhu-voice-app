import { NextRequest, NextResponse } from 'next/server';
import { getAuth, confirmPasswordReset } from 'firebase/auth'; // Correct import

export async function POST(req: NextRequest) {
    try {
        const { oobCode, newPassword } = await req.json();
        const auth = getAuth(); // Initialize auth
        await confirmPasswordReset(auth, oobCode, newPassword); // Use the correct method

        return NextResponse.json({ message: 'Password has been reset.' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
}
