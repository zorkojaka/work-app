import { getFunctions, httpsCallable } from "firebase/functions";

export const sendEmailInvite = async (email, role) => {
  const functions = getFunctions();
  const sendInvite = httpsCallable(functions, "sendInviteEmail");

  try {
    await sendInvite({ email, role });
    console.log("Email poslan na:", email);
  } catch (error) {
    console.error("Napaka pri pošiljanju emaila:", error);
  }
};
