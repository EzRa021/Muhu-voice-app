// /app/api/auth/signup.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { auth, db, functions } from '@/firebase/firebase';

const signUpHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, fullName, phone, username, password, language } = req.body;

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);

    const sendVerificationCode = functions.httpsCallable('sendVerificationCode');
    await sendVerificationCode({ email });

    await db.ref(`users/${userCredential.user?.uid}`).set({
      email,
      fullName,
      phone,
      username,
      language,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
    });

    res.status(200).json({ message: 'User created successfully. Please verify your email.' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export default signUpHandler;
