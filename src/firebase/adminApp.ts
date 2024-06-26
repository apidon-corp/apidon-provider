import * as admin from "firebase-admin";

const buffer = Buffer.from(
  process.env.GOOGLE_SERVICE_ACCOUNT_KEYS_BASE64 as string,
  "base64"
);

const decryptedService = buffer.toString("utf-8");
const decryptedServiceJson = JSON.parse(decryptedService);

const serviceAccount = decryptedServiceJson;
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const fieldValue = admin.firestore.FieldValue;
export const bucket = admin
  .storage()
  .bucket(process.env.FIREBASE_STORAGE_BUCKET_ID as string);

export const appCheck = admin.appCheck();
