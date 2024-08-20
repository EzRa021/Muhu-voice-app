import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set, serverTimestamp } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';

const signUpHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, fullName, phone, username, password, language } = req.body;

  try {
    const auth = getAuth(); // Initialize auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    const functions = getFunctions(); // Initialize functions
    const sendVerificationCode = httpsCallable(functions, 'sendVerificationCode');
    await sendVerificationCode({ email });

    const db = getDatabase(); // Initialize database
    await set(ref(db, `users/${userCredential.user?.uid}`), {
      email,
      fullName,
      phone,
      username,
      language,
      createdAt: serverTimestamp(), // Use `serverTimestamp`
    });

    res.status(200).json({ message: 'User created successfully. Please verify your email.' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export default signUpHandler;
