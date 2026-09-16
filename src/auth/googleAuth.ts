/**
 * Google Official OAuth 2.0 & Firebase Authentication Module
 * 
 * Complies strictly with Google AI Studio authentication requirements:
 * 1. Automatically uses configuration from `firebase-applet-config.json` provisioned by AI Studio OAuth setup.
 * 2. Never requires user to enter or hardcode client IDs, secrets, or API keys in source code.
 * 3. Launches the official Google account-selection/sign-in flow.
 * 4. Dual-engine support:
 *    - Primary: Firebase Auth `signInWithPopup` with GoogleAuthProvider.
 *    - Direct Fallback: Google Identity Services (GSI) OAuth 2.0 token client using provisioned oAuthClientId.
 * 5. Handles popup blocked, user cancellation, network errors, and session restoration.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  signOut as firebaseSignOut,
  browserLocalPersistence,
  setPersistence,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Global declarations for Google Identity Services (GSI)
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
              expires_in?: number;
            }) => void;
            error_callback?: (error: { type: string; message: string }) => void;
          }): {
            requestAccessToken(overrideConfig?: { prompt?: string }): void;
          };
        };
      };
    };
  }
}

export interface GoogleAuthProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  idToken?: string;
  accessToken?: string;
}

// 1. Initialize Firebase App securely
let firebaseAppInstance: any = null;
let firebaseAuthInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!firebaseAuthInstance) {
    if (!getApps().length) {
      firebaseAppInstance = initializeApp(firebaseConfig);
    } else {
      firebaseAppInstance = getApp();
    }
    firebaseAuthInstance = getAuth(firebaseAppInstance);
    // Set local persistence so session survives reloads
    try {
      setPersistence(firebaseAuthInstance, browserLocalPersistence);
    } catch {
      // Non-blocking in storage-restricted environments
    }
  }
  return firebaseAuthInstance;
}

/**
 * Executes the official Google Sign-In flow.
 * Opens Google's account selection popup and returns the verified profile.
 */
export async function executeGoogleSignIn(): Promise<GoogleAuthProfile> {
  const auth = getFirebaseAuth();
  const clientId = firebaseConfig.oAuthClientId;

  // Strategy 1: Firebase Auth GoogleAuthProvider
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('openid');
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user || !user.email) {
      throw new Error('No verified email returned by Google account.');
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);

    return {
      uid: user.uid,
      email: user.email.toLowerCase().trim(),
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || undefined,
      idToken: credential?.idToken,
      accessToken: credential?.accessToken,
    };
  } catch (firebaseErr: any) {
    const errorCode = firebaseErr?.code || '';
    const errorMessage = (firebaseErr?.message || '').toLowerCase();

    // Check for explicit user cancellation in Firebase popup
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorMessage.includes('closed-by-user') ||
      errorMessage.includes('cancelled')
    ) {
      throw new Error('Sign in cancelled');
    }

    // Check for popup blocked by browser
    if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
      throw new Error('Popup blocked. Please allow popups for this site and try again.');
    }

    // Check for network errors
    if (
      errorCode === 'auth/network-request-failed' ||
      errorMessage.includes('network-request-failed') ||
      errorMessage.includes('offline')
    ) {
      throw new Error('Network error. Check your connection.');
    }

    // If Firebase Auth provider is not enabled on the Firebase console or domain is restricted,
    // gracefully fall back to Google Identity Services (GSI) OAuth 2.0 flow directly using the provisioned OAuth Client ID!
    if (
      errorCode === 'auth/operation-not-allowed' ||
      errorCode === 'auth/configuration-not-found' ||
      errorCode === 'auth/unauthorized-domain' ||
      errorCode === 'auth/internal-error' ||
      !clientId
    ) {
      return executeGsiOAuthFlow(clientId);
    }

    // Attempt GSI as secondary official Google provider
    try {
      return await executeGsiOAuthFlow(clientId);
    } catch (gsiErr: any) {
      throw gsiErr;
    }
  }
}

/**
 * Official Google Identity Services (GSI) OAuth 2.0 flow using the provisioned OAuth Client ID.
 */
async function executeGsiOAuthFlow(clientId?: string): Promise<GoogleAuthProfile> {
  const resolvedClientId = clientId || firebaseConfig.oAuthClientId;

  if (!resolvedClientId) {
    throw new Error('Google OAuth Client ID is not configured.');
  }

  // Ensure GSI script is loaded
  await ensureGsiScriptLoaded();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services is currently unavailable. Please reload the page.');
  }

  return new Promise<GoogleAuthProfile>((resolve, reject) => {
    let isSettled = false;

    try {
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: resolvedClientId,
        scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: async (tokenResponse) => {
          if (isSettled) return;
          isSettled = true;

          if (tokenResponse.error) {
            if (
              tokenResponse.error === 'access_denied' ||
              tokenResponse.error === 'popup_closed_by_user' ||
              tokenResponse.error.includes('cancel')
            ) {
              reject(new Error('Sign in cancelled'));
              return;
            }
            if (tokenResponse.error === 'popup_blocked_by_browser') {
              reject(new Error('Popup blocked. Please allow popups for this site and try again.'));
              return;
            }
            reject(new Error(`Google sign-in error: ${tokenResponse.error_description || tokenResponse.error}`));
            return;
          }

          if (!tokenResponse.access_token) {
            reject(new Error('Google authentication failed. No access token returned.'));
            return;
          }

          try {
            // Fetch verified user profile directly from Google's OpenID userinfo endpoint
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!res.ok) {
              reject(new Error('Failed to fetch Google profile. Please check your connection.'));
              return;
            }

            const info = await res.json();
            if (!info.email) {
              reject(new Error('Google account did not return an email address.'));
              return;
            }

            resolve({
              uid: `g_${info.sub}`,
              email: info.email.toLowerCase().trim(),
              displayName: info.name || info.email.split('@')[0],
              photoURL: info.picture || undefined,
              accessToken: tokenResponse.access_token,
            });
          } catch (err: any) {
            reject(new Error('Network error connecting to Google servers.'));
          }
        },
        error_callback: (error) => {
          if (isSettled) return;
          isSettled = true;

          if (error?.type === 'popup_closed') {
            reject(new Error('Sign in cancelled'));
          } else if (error?.type === 'popup_blocked') {
            reject(new Error('Popup blocked. Please allow popups for this site and try again.'));
          } else {
            reject(new Error('Google sign-in unavailable'));
          }
        },
      });

      // Launch Google's official account selector popup dialog
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      if (!isSettled) {
        isSettled = true;
        if (err?.message?.includes('popup')) {
          reject(new Error('Popup blocked. Please allow popups for this site and try again.'));
        } else {
          reject(new Error(err?.message || 'Google sign-in unavailable'));
        }
      }
    }
  });
}

/**
 * Ensures Google Identity Services script is ready in DOM
 */
async function ensureGsiScriptLoaded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.google?.accounts?.oauth2) return;

  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.google?.accounts?.oauth2 || attempts > 30) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

/**
 * Sign out from Google / Firebase Auth
 */
export async function signOutGoogle(): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  } catch {
    // Non-blocking
  }
}
