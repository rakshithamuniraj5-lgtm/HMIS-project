import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase";
import { ensureStaffProfile } from "./staff-profile";

export type StaffUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

function formatFirebaseError(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = String((err as { code: unknown }).code);
    switch (code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-disabled":
        return "This staff account has been disabled.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please check your details.";
      case "auth/email-already-in-use":
        return "An account with this email address already exists.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/popup-closed-by-user":
        return "Sign in cancelled. Please try again.";
      case "auth/network-request-failed":
        return "Network connection issue. Please check your connection.";
      case "auth/requires-recent-login":
        return "Please sign in again before updating your password.";
      case "auth/expired-action-code":
        return "This password reset link has expired. Please request a new one.";
      case "auth/invalid-action-code":
        return "This password reset link is invalid or has already been used.";
      default:
        break;
    }
  }
  return err instanceof Error ? err.message : "An unexpected error occurred.";
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase credentials are not configured in your .env file yet.");
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    await ensureStaffProfile(cred.user, displayName.trim());
    return cred.user;
  } catch (err) {
    throw new Error(formatFirebaseError(err));
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase credentials are not configured in your .env file yet.");
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await ensureStaffProfile(cred.user);
    return cred.user;
  } catch (err) {
    throw new Error(formatFirebaseError(err));
  }
}

export async function signInWithGoogle(): Promise<User> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase credentials are not configured in your .env file yet.");
  }
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    await ensureStaffProfile(cred.user);
    return cred.user;
  } catch (err) {
    throw new Error(formatFirebaseError(err));
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase credentials are not configured in your .env file yet.");
  }
  try {
    await sendPasswordResetEmail(auth, email.trim(), {
      url: `${window.location.origin}/reset-password`,
    });
  } catch (err) {
    throw new Error(formatFirebaseError(err));
  }
}

export async function confirmResetPassword(oobCode: string, newPassword: string): Promise<void> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase credentials are not configured in your .env file yet.");
  }
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
  } catch (err) {
    throw new Error(formatFirebaseError(err));
  }
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("No authenticated user found.");
  }
  try {
    await updatePassword(auth.currentUser, newPassword);
  } catch (err) {
    throw new Error(formatFirebaseError(err));
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    throw new Error(formatFirebaseError(err));
  }
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
