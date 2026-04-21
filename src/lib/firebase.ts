import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document exists, create if not
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || 'Без имени',
        totalReps: 0,
        lastWorkoutAt: serverTimestamp(),
        photoURL: user.photoURL || ''
      });
    }
  } catch (error) {
    console.error("Auth Error:", error);
  }
};

export const logout = () => signOut(auth);

// Helper to add reps to a user's total
export const addRepsToLeaderboard = async (userId: string, repsToAdd: number) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    totalReps: increment(repsToAdd),
    lastWorkoutAt: serverTimestamp()
  });
};
