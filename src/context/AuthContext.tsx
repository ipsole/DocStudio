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
  deleteUser as fbDeleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as fbUpdatePassword,
  IdTokenResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  OAuthProvider,
  linkWithPopup,
  linkWithPhoneNumber,
  unlink,
} from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase/client';
import {
  ensureUserProfile,
  updateUserProfile as dbUpdateUserProfile,
  deleteUserAccountData,
  deactivateUserAccount,
  reactivateUserAccount,
  syncDeviceSession,
  revokeDeviceSession,
  subscribeToCurrentSessionStatus,
} from '@/lib/firebase/db';
import { getClientDeviceInfo } from '@/lib/device/deviceInfo';
import { isSuperAdminEmail } from '@/lib/adminConfig';
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
  signInWithApple: () => Promise<void>;
  setupRecaptcha: (containerId: string) => RecaptchaVerifier;
  sendPhoneOtp: (phoneNumber: string, verifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  confirmPhoneOtp: (confirmationResult: ConfirmationResult, code: string) => Promise<User | null>;
  signUp: (email: string, pass: string, displayName?: string) => Promise<void>;
  linkGoogle: () => Promise<User>;
  linkApple: () => Promise<User>;
  startPhoneLink: (phoneNumber: string, verifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  confirmPhoneLink: (confirmationResult: ConfirmationResult, code: string) => Promise<User>;
  unlinkProvider: (providerId: string) => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
  updateName: (newName: string) => Promise<void>;
  updateProfileDetails: (updates: {
    displayName?: string;
    username?: string;
    phoneNumber?: string;
    bio?: string;
    avatarIcon?: string | null;
    photoURL?: string | null;
  }) => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  deactivateAccount: (password?: string) => Promise<void>;
  reactivateAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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

    let unsubSessionStatus: (() => void) | null = null;
    let unsubUserDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (unsubSessionStatus) {
        unsubSessionStatus();
        unsubSessionStatus = null;
      }

      if (currentUser) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('docstudio_has_session', 'true');
          } catch {
            // ignore
          }
        }
        try {
          // Check custom claims for admin role
          const tokenResult: IdTokenResult = await currentUser.getIdTokenResult();
          const hasAdminClaim = Boolean(tokenResult.claims.admin);

          // Ensure profile document exists in Firestore
          const userProfile = await ensureUserProfile(
            currentUser.uid,
            currentUser.email || '',
            currentUser.displayName,
            currentUser.photoURL,
            currentUser.phoneNumber
          );

          const isSuperAdmin = isSuperAdminEmail(currentUser.email);
          setProfile(userProfile);
          setIsAdmin(isSuperAdmin || hasAdminClaim || Boolean(userProfile?.isAdmin));

          // Real-time synchronization of user membership, admin, and profile fields
          if (db) {
            try {
              unsubUserDoc = onSnapshot(
                doc(db, 'users', currentUser.uid),
                (snap) => {
                  if (snap.exists()) {
                    const liveData = snap.data();
                    setProfile((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        isEliteMember: Boolean(liveData.isEliteMember),
                        eliteExpiresAt: liveData.eliteExpiresAt?.toMillis
                          ? liveData.eliteExpiresAt.toMillis()
                          : (liveData.eliteExpiresAt || null),
                        eliteJoinedAt: liveData.eliteJoinedAt?.toMillis
                          ? liveData.eliteJoinedAt.toMillis()
                          : (liveData.eliteJoinedAt || null),
                        isAdmin: Boolean(liveData.isAdmin ?? prev.isAdmin),
                      };
                    });
                  }
                },
                (snapErr) => {
                  console.warn('[AuthContext] Live profile sync notice:', snapErr);
                }
              );
            } catch (snapInitErr) {
              console.warn('[AuthContext] Error setting up live profile listener:', snapInitErr);
            }
          }

          // Register and heartbeat active device session
          const dev = getClientDeviceInfo();
          fetch('/api/auth/geo')
            .then((r) => r.json())
            .then((geo) => {
              syncDeviceSession(currentUser.uid, {
                id: dev.sessionId,
                deviceName: dev.deviceName,
                deviceType: dev.deviceType,
                browser: dev.browser,
                os: dev.os,
                location: geo?.location || 'Online Session',
                ip: geo?.ip || '',
              });
            })
            .catch(() => {
              syncDeviceSession(currentUser.uid, {
                id: dev.sessionId,
                deviceName: dev.deviceName,
                deviceType: dev.deviceType,
                browser: dev.browser,
                os: dev.os,
              });
            });

          // Listen for remote session termination
          unsubSessionStatus = subscribeToCurrentSessionStatus(currentUser.uid, dev.sessionId, async () => {
            console.warn('[AuthContext] Session was signed out remotely from another device.');
            if (auth) {
              await fbSignOut(auth);
            }
            setUser(null);
            setProfile(null);
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem('docstudio_has_session');
              } catch {}
              window.location.href = '/sign-in?revoked=true';
            }
          });
        } catch (error) {
          console.error('[AuthContext] Error syncing user profile:', error);
        }
      } else {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('docstudio_has_session');
          } catch {
            // ignore
          }
        }
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubSessionStatus) {
        unsubSessionStatus();
      }
      if (unsubUserDoc) {
        unsubUserDoc();
      }
    };
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
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      const userProfile = await ensureUserProfile(
        result.user.uid,
        result.user.email || '',
        result.user.displayName,
        result.user.photoURL,
        result.user.phoneNumber
      );
      const createdTime = typeof userProfile?.createdAt === 'number' ? userProfile.createdAt : Number(userProfile?.createdAt || 0);
      if (userProfile && Date.now() - createdTime < 120000 && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('docstudio_login_welcome', 'pending');
        } catch {
          // ignore
        }
      }
    }
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

  const signInWithApple = async () => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase Authentication is not yet configured.');
    }
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    await signInWithPopup(auth, provider);
  };

  const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
    if (!auth) throw new Error('Firebase Auth is not initialized.');
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // Invisible reCAPTCHA resolved automatically
      },
    });
  };

  const sendPhoneOtp = async (
    phoneNumber: string,
    verifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    if (!auth) throw new Error('Firebase Auth is not initialized.');
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  };

  const confirmPhoneOtp = async (
    confirmationResult: ConfirmationResult,
    code: string
  ): Promise<User | null> => {
    const credential = await confirmationResult.confirm(code);
    if (credential.user) {
      const p = await ensureUserProfile(
        credential.user.uid,
        credential.user.email || '',
        credential.user.displayName,
        credential.user.photoURL,
        credential.user.phoneNumber
      );
      setProfile(p);
    }
    return credential.user;
  };

  const linkGoogle = async (): Promise<User> => {
    if (!auth?.currentUser) throw new Error('Not authenticated');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await linkWithPopup(auth.currentUser, provider);
    setUser(result.user);
    return result.user;
  };

  const linkApple = async (): Promise<User> => {
    if (!auth?.currentUser) throw new Error('Not authenticated');
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const result = await linkWithPopup(auth.currentUser, provider);
    setUser(result.user);
    return result.user;
  };

  const startPhoneLink = async (
    phoneNumber: string,
    verifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    if (!auth?.currentUser) throw new Error('Not authenticated');
    return await linkWithPhoneNumber(auth.currentUser, phoneNumber, verifier);
  };

  const confirmPhoneLink = async (
    confirmationResult: ConfirmationResult,
    code: string
  ): Promise<User> => {
    if (!auth?.currentUser) throw new Error('Not authenticated');
    const result = await confirmationResult.confirm(code);
    if (result.user) {
      setUser(result.user);
      if (result.user.phoneNumber) {
        await dbUpdateUserProfile(result.user.uid, { phoneNumber: result.user.phoneNumber });
        setProfile((prev) => (prev ? { ...prev, phoneNumber: result.user.phoneNumber } : null));
      }
    }
    return result.user;
  };

  const unlinkProvider = async (providerId: string): Promise<User> => {
    if (!auth?.currentUser) throw new Error('Not authenticated');
    if ((auth.currentUser.providerData?.length || 0) <= 1) {
      throw new Error('You cannot disconnect your only login method. Connect another login method first.');
    }
    const updatedUser = await unlink(auth.currentUser, providerId);
    setUser(updatedUser);
    if (providerId === 'phone') {
      await dbUpdateUserProfile(updatedUser.uid, { phoneNumber: '' });
      setProfile((prev) => (prev ? { ...prev, phoneNumber: '' } : null));
    }
    return updatedUser;
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
    const currentUid = auth?.currentUser?.uid || user?.uid;
    if (currentUid) {
      try {
        const dev = getClientDeviceInfo();
        await revokeDeviceSession(currentUid, dev.sessionId);
      } catch (err) {
        console.warn('[AuthContext] Error revoking session during sign out:', err);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('docstudio_has_session');
      } catch {
        // ignore
      }
    }
    if (auth) {
      await fbSignOut(auth);
    }
    setUser(null);
    setProfile(null);
    setIsAdmin(false);

    if (typeof window !== 'undefined') {
      window.location.href = '/sign-in';
    }
  };

  const resetPassword = async (email: string) => {
    if (!isConfigured || !auth) {
      throw new Error('Firebase Authentication is not yet configured.');
    }
    await sendPasswordResetEmail(auth, email);
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!isConfigured || !auth || !auth.currentUser) {
      throw new Error('You must be signed in to change your password.');
    }
    if (!auth.currentUser.email) {
      throw new Error('No email found for this user account.');
    }

    const hasPasswordProvider = auth.currentUser.providerData?.some(
      (p) => p.providerId === 'password'
    );
    if (!hasPasswordProvider) {
      throw new Error(
        'Your account is registered via Google Single Sign-On (SSO). Password changes are managed via your Google account.'
      );
    }

    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPass);
    try {
      await reauthenticateWithCredential(auth.currentUser, credential);
      await fbUpdatePassword(auth.currentUser, newPass);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('Current password is incorrect. Please double check and try again.');
      } else if (code === 'auth/weak-password') {
        throw new Error('The new password is too weak. Please use at least 6 characters.');
      } else if (code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later or use the password reset link.');
      }
      throw err;
    }
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
    username?: string;
    phoneNumber?: string;
    bio?: string;
    avatarIcon?: string | null;
    photoURL?: string | null;
  }) => {
    if (!user) throw new Error('Not authenticated');
    if (updates.displayName && auth?.currentUser) {
      await fbUpdateProfile(auth.currentUser, { displayName: updates.displayName });
    }
    await dbUpdateUserProfile(user.uid, updates);
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const deleteAccount = async (password?: string) => {
    if (!user || !auth?.currentUser) throw new Error('Not authenticated');

    const hasPasswordProvider = auth.currentUser.providerData?.some(
      (p) => p.providerId === 'password'
    );

    // If account has password, verify with re-authentication
    if (hasPasswordProvider) {
      if (!password || !password.trim()) {
        throw new Error('Please enter your account password to authorize deletion.');
      }
      try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email || '', password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          throw new Error('Incorrect password. Please verify your password and try again.');
        } else if (code === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please try again later.');
        }
        throw err;
      }
    }

    const googleProvider = user.providerData?.find((p) => p.providerId === 'google.com');
    const googleUid = googleProvider?.uid || null;

    // 1. Wipe Firestore documents & record anti-abuse tombstone record
    await deleteUserAccountData(user.uid, user.email || '', googleUid);

    // 2. Delete user credentials in Firebase Auth
    await fbDeleteUser(auth.currentUser);

    // 3. Clear local states
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const deactivateAccount = async (password?: string) => {
    if (!user || !auth?.currentUser) throw new Error('Not authenticated');

    const hasPasswordProvider = auth.currentUser.providerData?.some(
      (p) => p.providerId === 'password'
    );

    // If account has password, verify with re-authentication
    if (hasPasswordProvider) {
      if (!password || !password.trim()) {
        throw new Error('Please enter your account password to authorize deactivation.');
      }
      try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email || '', password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          throw new Error('Incorrect password. Please verify your password and try again.');
        } else if (code === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please try again later.');
        }
        throw err;
      }
    }

    // 1. Mark account as deactivated in Firestore
    await deactivateUserAccount(user.uid);

    // 2. Sign user out
    await fbSignOut(auth);

    // 3. Clear local states
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const reactivateAccount = async () => {
    if (!user) throw new Error('Not authenticated');
    await reactivateUserAccount(user.uid);
    setProfile((prev) => (prev ? { ...prev, isDeactivated: false, deactivatedAt: null } : null));
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const p = await ensureUserProfile(
        user.uid,
        user.email || '',
        user.displayName,
        user.photoURL,
        user.phoneNumber
      );
      if (p) setProfile(p);
    } catch (e) {
      console.warn('[AuthContext] Error refreshing profile:', e);
    }
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
        signInWithApple,
        setupRecaptcha,
        sendPhoneOtp,
        confirmPhoneOtp,
        signUp,
        linkGoogle,
        linkApple,
        startPhoneLink,
        confirmPhoneLink,
        unlinkProvider,
        signOut,
        resetPassword,
        changePassword,
        updateName,
        updateProfileDetails,
        deleteAccount,
        deactivateAccount,
        reactivateAccount,
        refreshProfile,
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
