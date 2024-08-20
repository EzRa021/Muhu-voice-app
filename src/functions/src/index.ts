import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendVerificationCode = functions.https.onCall(async (data, context) => {
  const { email, fcmToken } = data; // Ensure the FCM token is passed in data
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store the verification code in the database
  await admin.database().ref(`verificationCodes/${email}`).set({
    code: verificationCode,
    timestamp: admin.database.ServerValue.TIMESTAMP,
  });

  // Use the FCM token provided in the data
  if (fcmToken) {
    await admin.messaging().send({
      notification: {
        title: 'Your Verification Code',
        body: `Your code is ${verificationCode}`,
      },
      token: fcmToken, // This is the correct token to use
    });
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'FCM token is required to send a notification.');
  }

  return { success: true };
});
