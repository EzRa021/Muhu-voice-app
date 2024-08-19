// /app/api/auth/signin.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { auth, db } from '@/firebase/firebase';

const signInHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { emailOrUsername, password } = req.body;

  try {
    let email = emailOrUsername;

    if (!email.includes('@')) {
      const snapshot = await db.ref('users').orderByChild('username').equalTo(emailOrUsername).once('value');
      if (snapshot.exists()) {
        const userData = snapshot.val();
        email = Object.values(userData)[0].email;
      } else {
        throw new Error('User not found');
      }
    }

    await auth.signInWithEmailAndPassword(email, password);
    res.status(200).json({ message: 'Signed in successfully.' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export default signInHandler;
