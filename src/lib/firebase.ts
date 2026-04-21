import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Helper to add reps to a user's total for anonymous unverified tracking
export const addRepsToLeaderboard = async (userId: string, displayName: string, repsToAdd: number) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      displayName: displayName,
      totalReps: repsToAdd,
      lastWorkoutAt: serverTimestamp(),
      photoURL: ''
    });
  } else {
    await updateDoc(userRef, {
      displayName: displayName,
      totalReps: increment(repsToAdd),
      lastWorkoutAt: serverTimestamp()
    });
  }
};
