import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db, auth, isFirebaseConfigured } from "./firebase";

export type StaffProfile = {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: string;
  autoReminders: boolean;
  retryAttempts: number;
  retryGapMinutes: number;
  updatedAt?: unknown;
};

/** Create or retrieve a staff profile in Cloud Firestore */
export async function ensureStaffProfile(targetUser?: User | null, preferredName?: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  const user = targetUser ?? auth.currentUser;
  if (!user) return;

  try {
    const profileRef = doc(db, "profiles", user.uid);
    const snap = await getDoc(profileRef);

    if (!snap.exists()) {
      const displayName =
        preferredName?.trim() ||
        user.displayName?.trim() ||
        (user.email ? user.email.split("@")[0] : "Staff");

      await setDoc(profileRef, {
        id: user.uid,
        email: user.email || "",
        displayName,
        preferredLanguage: "EN",
        autoReminders: true,
        retryAttempts: 3,
        retryGapMinutes: 30,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("[Firestore] ensureStaffProfile error:", error);
  }
}

export async function getStaffProfile(uid?: string): Promise<StaffProfile | null> {
  if (!isFirebaseConfigured) return null;
  const targetUid = uid || auth.currentUser?.uid;
  if (!targetUid) return null;

  try {
    const profileRef = doc(db, "profiles", targetUid);
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return snap.data() as StaffProfile;
    }
  } catch (error) {
    console.error("[Firestore] getStaffProfile error:", error);
  }
  return null;
}

export async function updateStaffProfilePreferences(
  updates: Partial<Pick<StaffProfile, "preferredLanguage" | "autoReminders" | "retryAttempts" | "retryGapMinutes">>
): Promise<void> {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const profileRef = doc(db, "profiles", auth.currentUser.uid);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[Firestore] updateStaffProfilePreferences error:", error);
  }
}