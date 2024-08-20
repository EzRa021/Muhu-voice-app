import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, query, orderByChild, equalTo, get } from 'firebase/database';

const signInHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { emailOrUsername, password } = req.body;

  try {
    let email = emailOrUsername;

    const db = getDatabase(); // Initialize database
    if (!email.includes('@')) {
      const usersRef = ref(db, 'users');
      const userQuery = query(usersRef, orderByChild('username'), equalTo(emailOrUsername));
      const snapshot = await get(userQuery);
      if (snapshot.exists()) {
        const userData = snapshot.val() as Record<string, any>; // Assert `userData` is an object
        email = Object.values(userData)[0].email;
      } else {
        throw new Error('User not found');
      }
    }

    const auth = getAuth(); // Initialize auth
    await signInWithEmailAndPassword(auth, email, password); // Use correct method
    res.status(200).json({ message: 'Signed in successfully.' });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export default signInHandler;
