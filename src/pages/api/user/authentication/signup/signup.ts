import { appCheck, auth, firestore } from "@/firebase/adminApp";
import { IShowcaseItem, UserInServer } from "@/types/User";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { referralCode, email, password, username, verificationCode } =
    req.body;

  // authorization
  if (!authorization) {
    return res.status(401).json({
      cause: "auth",
      message: "Authentication cannot be established.",
    });
  }

  try {
    await appCheck.verifyToken(authorization);
  } catch (error) {
    return res.status(401).json({
      cause: "auth",
      message: "Authentication cannot be established.",
    });
  }

  if (req.method !== "POST")
    return res.status(405).json({
      cause: "server",
      message: "Method is not allowed.",
    });

  if (!referralCode || !email || !password || !username) {
    return res.status(422).json({
      cause: "server",
      message: "Invalid props.",
    });
  }

  // Regex Check
  const regexTestResult = quickRegexCheck(
    email,
    password,
    username,
    verificationCode
  );
  if (regexTestResult !== true) {
    return res.status(422).json({
      cause: regexTestResult,
      message: "Invalid Prop",
    });
  }

  // Referral Code Check and updating
  try {
    const referralCodeDocSnapshot = await firestore
      .doc(`/references/${referralCode}`)
      .get();
    if (!referralCodeDocSnapshot.exists)
      return res.status(422).json({
        cause: "referralCode",
        message: "Referral code is invalid.",
      });

    const data = referralCodeDocSnapshot.data();

    if (data === undefined) {
      console.error("Refferal code exists but its data is undefined.");
      return res.status(500).json({
        cause: "server",
        message: "Internal Server Error",
      });
    }

    const inProcess = data.inProcess;
    const isUsed = data.isUsed;

    if (isUsed || inProcess) {
      return res.status(422).json({
        cause: "referralCode",
        message: "Referral code has already been used.",
      });
    }

    await referralCodeDocSnapshot.ref.update({
      inProcess: true,
    });
  } catch (error) {
    console.error("Error on checking referral code: \n", error);
    return res.status(422).json({
      cause: "server",
      message: "Internal server error.",
    });
  }

  // email validity
  try {
    await auth.getUserByEmail(email);

    // If there is no error throwed from above line we are going back.
    await releaseReferralCode(referralCode);

    return res.status(422).json({
      cause: "email",
      message: "This email is used by another account.",
    });
  } catch (error) {
    // Normal Situation
    // There is no account linked with requested email.
  }

  // username validity check (If it is taken or not.)
  try {
    const userDocSnapshot = await firestore.doc(`usernames/${username}`).get();
    if (userDocSnapshot.exists) {
      await releaseReferralCode(referralCode);
      return res.status(422).json({
        cause: "username",
        message: "Username is taken.",
      });
    }
    // So If there is no doc, no problem.
  } catch (error) {
    console.error(
      "Error on checking username validity: (If it is valid or not.): \n",
      error
    );
    await releaseReferralCode(referralCode);
    return res.status(500).json({
      cause: "server",
      message: "Internal server error.",
    });
  }

  // Verification Code Checking
  try {
    const verificationCodeDoc = await firestore
      .doc(`/emailVerifications/${email}`)
      .get();

    const verificationCodeDocData = verificationCodeDoc.data();

    if (verificationCodeDocData === undefined) {
      console.error(
        "There is a verification doc but there is no data in it: ",
        email
      );
      await releaseReferralCode(referralCode);
      return res.status(500).json({
        cause: "server",
        message: "Internal server error",
      });
    }

    let code = verificationCodeDocData.code;

    if (!code) {
      console.error("Code is empty even there is verificaton code doc.");
      await releaseReferralCode(referralCode);
      return res.status(500).json({
        cause: "server",
        message: "Internal server error",
      });
    }

    code = code.toString();

    // Verification Code Testing....
    if (verificationCode !== code) {
      console.warn("Verification code is invalid for: ", email);
      await releaseReferralCode(referralCode);
      return res.status(500).json({
        cause: "verificationCode",
        message: "Verification code is invalid.",
      });
    }
  } catch (error) {
    console.log("Error on verification code checking: \n", error);
    await releaseReferralCode(referralCode);
    return res.status(500).json({
      cause: "server",
      messae: "Internal server error",
    });
  }

  // Create User on Auth
  let uid;
  try {
    const { uid: createdUID } = await auth.createUser({
      email: email,
      password: password,
      displayName: username,
      emailVerified: true,
    });
    uid = createdUID;
  } catch (error) {
    console.error("Error on creating user: \n", error);
    await releaseReferralCode(referralCode);
    return res.status(500).json({
      cause: "server",
      message: "Internal Server Error",
    });
  }

  // Creating User on Firebase
  const createdProviderInformation: UserInServer = {
    description: "",
    email: email,
    image: "",
    name: username,
    clientCount: 0,

    revenue: 0,
    offer: 0,

    sumScore: 0,
    rateCount: 0,

    uid: uid,
  };

  try {
    const batch = firestore.batch();

    // Creating "user" doc in "users" collection
    batch.set(firestore.doc(`users/${username}`), {
      ...createdProviderInformation,
    });

    // Creating "postThemes" doc on "postThemes" collection and adds an empty array named "postThemes"
    batch.set(firestore.doc(`users/${username}/postThemes/postThemes`), {
      postThemesArray: [],
    });

    // Creating "{username}" doc for "showcase" collection
    const newShowcaseItemObject: IShowcaseItem = {
      name: username,
      description: "",
      image: "",

      clientCount: 0,

      rateCount: 0,
      sumScore: 0,

      offer: 0,
    };
    batch.set(firestore.doc(`showcase/${username}`), {
      ...newShowcaseItemObject,
    });

    await batch.commit();
  } catch (error) {
    console.log("Error on creating user on firestore database: \n", error);
    await releaseReferralCode(referralCode);
    await releaseAccount(uid);
    return res.status(500).json({
      cause: "server",
      message: "Internal Server Error",
    });
  }

  // Disabling referral code.
  try {
    await firestore.doc(`references/${referralCode}`).update({
      inProcess: false,
      isUsed: true,
      whoUsed: username,
      ts: Date.now(),
    });
  } catch (error) {
    console.error("Error on disabling referralCode: \n", error);
    await releaseReferralCode(referralCode);
    await releaseAccount(uid);
    await deleteUserDocs([`usernames/${username}`, `showcase/${username}`]);
    return res.status(500).json({
      cause: "server",
      message: "Internal Server Error",
    });
  }

  // Delete Email Verification Doc
  try {
    await firestore.doc(`emailVerifications/${email}`).delete();
  } catch (error) {
    console.error("Error on deleting emailVerification doc.: \n", error);
    await releaseReferralCode(referralCode);
    await releaseAccount(uid);
    await deleteUserDocs([`usernames/${username}`, `showcase/${username}`]);
    return res.status(500).json({
      cause: "server",
      message: "Internal Server Error",
    });
  }

  return res.status(200).send(`New user successfully created: ${username}`);
}

const quickRegexCheck = (
  email: string,
  password: string,
  username: string,
  verificationCode: string
) => {
  // Email
  const emailRegex =
    /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|aol|icloud|protonmail|yandex|mail|zoho)\.(com|net|org)$/i;
  const regexTestResultE = emailRegex.test(email);
  if (!regexTestResultE) return "email";

  // Password
  const passwordRegex =
    /^(?=.*?\p{Lu})(?=.*?\p{Ll})(?=.*?\d)(?=.*?[^\w\s]|[_]).{12,}$/u;
  const regexTestResultP = passwordRegex.test(password);
  if (!regexTestResultP) return "password";

  // Username
  const usernameRegex = /^[a-z0-9]{4,20}$/;
  const regexTestResultU = usernameRegex.test(username);
  if (!regexTestResultU) return "username";

  // Verification Code
  const verificationCodeRegex = /^\d{6}$/;
  const regexTestResultV = verificationCodeRegex.test(verificationCode);
  if (!regexTestResultV) {
    return "verificationCode";
  }

  return true;
};

/**
 * Use on errors.
 * @param refferalCode
 */
const releaseReferralCode = async (referralCode: string) => {
  try {
    await firestore.doc(`/references/${referralCode}`).update({
      inProcess: false,
      isUsed: false,
      ts: 0,
      whoUsed: "",
    });
  } catch (error) {
    console.error("Error while releasing referral code: \n", error);
  }
};

/**
 * Deletes user from AUTH.
 * After error on creating firestore doc for new user, we need to delete account from auth part.
 * @param uid
 */
const releaseAccount = async (uid: string) => {
  try {
    await auth.deleteUser(uid);
  } catch (error) {
    console.error(
      "Error on deleting user (We were deleting user because some unsuccessfull database operations): \n",
      error
    );
  }
};

const deleteUserDocs = async (docPaths: string[]) => {
  try {
    const batch = firestore.batch();
    for (const docPath of docPaths) batch.delete(firestore.doc(docPath));

    await batch.commit();
  } catch (error) {
    console.error(
      "Error while deleting user docs. (We were deleting beacuse unsuccessfull opeations after filling firestore.): \n",
      error
    );
  }
};
