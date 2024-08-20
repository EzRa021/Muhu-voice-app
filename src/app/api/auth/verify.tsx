import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import { getDatabase, ref, get, remove } from 'firebase/database';

const verifyHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, code } = req.body;

  try {
    const db = getDatabase(); // Initialize database
    const verificationRef = ref(db, `verificationCodes/${email}`);
    const snapshot = await get(verificationRef);
    const data = snapshot.val();

    if (data && data.code === code) {
      await remove(verificationRef);

      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser); // Use the correct function
      }

      res.status(200).json({ message: 'Email verified successfully.' });
    } else {
      res.status(400).json({ error: 'Invalid verification code.' });
    }
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export default verifyHandler;
