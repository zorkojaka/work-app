import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Pot do Firebase konfiguracije

/**
 * Funkcija za dodelitev nove vloge uporabniku
 * @param userId ID uporabnika
 * @param newRole Nova vloga (npr. "Organizator")
 */
export const addRoleToUser = async (userId: string, newRole: string) => {
  try {
    const userDocRef = doc(db, `users/${userId}`);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const roles = userDoc.data().roles || [];
      if (!roles.includes(newRole)) {
        await updateDoc(userDocRef, {
          roles: [...roles, newRole],
        });
        console.log(`Vloga '${newRole}' uspešno dodana uporabniku ${userId}.`);
      } else {
        console.warn(`Uporabnik ${userId} že ima vlogo '${newRole}'.`);
      }
    } else {
      console.error(`Uporabnik ${userId} ni najden.`);
    }
  } catch (err) {
    console.error('Napaka pri dodeljevanju vloge:', err);
  }
};
