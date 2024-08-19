// /functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendVerificationCode = functions.https.onCall(async (data, context) => {
  const { email } = data;
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  await admin.database().ref(`verificationCodes/${email}`).set({
    code: verificationCode,
    timestamp: admin.database.ServerValue.TIMESTAMP,
  });

  // Send the OTP via email (for simplicity, using Firebase Cloud Messaging or another service)
  // Replace with actual email sending logic
  await admin.messaging().send({
    notification: {
      title: 'Your Verification Code',
      body: `Your code is ${verificationCode}`,
    },
    token: context.auth?.token, // Replace with actual token for messaging or use another email service
  });

  return { success: true };
});
