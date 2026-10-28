'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  IdTokenResult,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase/client';
import { ensureUserProfile, updateUserProfile as dbUpdateUserProfile } from '@/lib/firebase/db';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleCredential: (idToken: string) => Promise<User | null>;
  signUp: (email: string, pass: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateName: (newName: string) => Promise<void>;
  updateProfileDetails: (updates: {
    displayName?: string;
    phoneNumber?: string;
    bio?: string;
    avatarIcon?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const isConfigured = isFirebaseConfigured();

  useEffect(() => {
    if (!isConfigured || !auth) {
      setLoading(false);
      return;
    }

    // Process redirect sign-in in the same tab
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await ensureUserProfile(
            result.user.uid,
            result.user.email || '',
            result.user.displayName,
            result.user.photoURL
          );
        }
      })
      .catch((err) => {
        console.warn('[AuthContext] getRedirectResult notice:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Check custom claims for admin role
          const tokenResult: IdTokenResult = await currentUser.getIdTokenResult();
          const hasAdminClaim = Boolean(tokenResult.claims.admin);

          // Ensure profile document exists in Firestore
          const userProfile = await ensureUserProfile(
            currentUser.uid,
            currentUser.email || '',
            currentUser.displayName,
            currentUser.photoURL
          );

          setProfile(userProfile);
          setIsAdmin(hasAdminClaim || Boolean(userProfile?.isAdmin));
        } catch (error) {
          console.error('[AuthContext] Error syncing user profile:', error);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const signIn = async (email: string, pass: string) => {
    if (!isConfigured || !auth) {
      throw new Error(
        'Firebase Authentication is not yet configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables in .env.local.'
      );
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signInWithGoogle = async () => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase Authentication is not yet configured.');
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithRedirect(auth, provider);
  };

  const signInWithGoogleCredential = async (idToken: string): Promise<User | null> => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase Authentication is not yet configured.');
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    if (result.user) {
      const profile = await ensureUserProfile(
        result.user.uid,
        result.user.email || '',
        result.user.displayName,
        result.user.photoURL
      );
      const createdTime = typeof profile?.createdAt === 'number' ? profile.createdAt : Number(profile?.createdAt || 0);
      // Only show intro welcome if this account was created in the last 2 minutes
      if (profile && Date.now() - createdTime < 120000 && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('docstudio_login_welcome', 'pending');
        } catch {
          // ignore
        }
      }
    }
    return result.user;
  };

  const signUp = async (email: string, pass: string, displayName?: string) => {
    if (!isConfigured || !auth) {
      throw new Error(
        'Firebase Authentication is not yet configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables in .env.local.'
      );
    }
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && cred.user) {
      await fbUpdateProfile(cred.user, { displayName });
    }
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('docstudio_login_welcome', 'pending');
      } catch {
        // ignore
      }
    }
    await ensureUserProfile(cred.user.uid, cred.user.email || email, displayName || null);
  };

  const signOut = async () => {
    if (auth) {
      await fbSignOut(auth);
    }
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase Authentication is not yet configured.');
    }
    await sendPasswordResetEmail(auth, email);
  };

  const updateName = async (newName: string) => {
    if (!user) throw new Error('Not authenticated');
    if (auth?.currentUser) {
      await fbUpdateProfile(auth.currentUser, { displayName: newName });
    }
    await dbUpdateUserProfile(user.uid, { displayName: newName });
    setProfile((prev) => (prev ? { ...prev, displayName: newName } : null));
  };

  const updateProfileDetails = async (updates: {
    displayName?: string;
    phoneNumber?: string;
    bio?: string;
    avatarIcon?: string;
  }) => {
    if (!user) throw new Error('Not authenticated');
    if (updates.displayName && auth?.currentUser) {
      await fbUpdateProfile(auth.currentUser, { displayName: updates.displayName });
    }
    await dbUpdateUserProfile(user.uid, updates);
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isConfigured,
        signIn,
        signInWithGoogle,
        signInWithGoogleCredential,
        signUp,
        signOut,
        resetPassword,
        updateName,
        updateProfileDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
