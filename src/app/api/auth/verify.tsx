// /app/api/auth/verify.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { auth, db } from '@/firebase/firebase';

const verifyHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, code } = req.body;

  try {
    const ref = db.ref(`verificationCodes/${email}`);
    const snapshot = await ref.once('value');
    const data = snapshot.val();

    if (data && data.code === code) {
      await ref.remove();
      await auth.currentUser?.sendEmailVerification();
      res.status(200).json({ message: 'Email verified successfully.' });
    } else {
      res.status(400).json({ error: 'Invalid verification code.' });
    }
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export default verifyHandler;
