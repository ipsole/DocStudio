'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
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
    const cred = await signInWithPopup(auth, provider);
    if (cred.user) {
      await ensureUserProfile(
        cred.user.uid,
        cred.user.email || '',
        cred.user.displayName,
        cred.user.photoURL
      );
    }
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
