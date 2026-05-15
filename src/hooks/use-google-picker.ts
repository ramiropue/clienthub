"use client";

import { useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const API_KEY     = process.env.NEXT_PUBLIC_GOOGLE_API_KEY     || '';
const CLIENT_ID   = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID   || '';
const SCOPE       = 'https://www.googleapis.com/auth/drive.readonly';
const PICKER_DISCOVERY = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

interface PickedFile {
  id: string;
  name: string;
  url: string;       // webViewLink (Drive link)
  mimeType: string;
  iconUrl: string;
}

interface UseGooglePickerOptions {
  onPick: (file: PickedFile) => void;
  onError?: (msg: string) => void;
}

/**
 * Returns an `openPicker` function that loads the Google Picker on demand
 * and opens the Drive file selector. Requires:
 *   NEXT_PUBLIC_GOOGLE_API_KEY
 *   NEXT_PUBLIC_GOOGLE_CLIENT_ID
 * in .env.local
 */
export function useGooglePicker({ onPick, onError }: UseGooglePickerOptions) {
  const tokenRef  = useRef<string | null>(null);
  const gapiReady = useRef(false);
  const gisReady  = useRef(false);
  const tokenClientRef = useRef<any>(null);

  // ── 1. Load gapi script once ─────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || window.gapi) {
      if (window.gapi) gapiReady.current = true;
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('picker', () => {
        gapiReady.current = true;
      });
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // ── 2. Load GIS (Google Identity Services) once ──────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!CLIENT_ID) return;

    const existing = document.getElementById('gis-script');
    if (existing) {
      // Already loaded
      if (window.google?.accounts) gisReady.current = true;
      return;
    }

    const script = document.createElement('script');
    script.id  = 'gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: '', // will be set per-call
      });
      gisReady.current = true;
    };
    document.body.appendChild(script);
  }, []);

  // ── 3. Open picker ───────────────────────────────────
  const openPicker = useCallback(() => {
    if (!API_KEY || !CLIENT_ID) {
      onError?.('Configura NEXT_PUBLIC_GOOGLE_API_KEY y NEXT_PUBLIC_GOOGLE_CLIENT_ID en .env.local');
      return;
    }

    const showPicker = (token: string) => {
      if (!gapiReady.current) {
        onError?.('La API de Google no ha cargado aún. Intenta de nuevo en un momento.');
        return;
      }

      const pickerCallback = (data: any) => {
        if (data.action !== window.google.picker.Action.PICKED) return;
        const doc = data.docs[0];
        onPick({
          id:       doc.id,
          name:     doc.name,
          url:      doc.url,
          mimeType: doc.mimeType,
          iconUrl:  doc.iconUrl,
        });
      };

      const view = new window.google.picker.DocsView()
        .setIncludeFolders(false)
        .setMimeTypes('image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,application/pdf');

      const picker = new window.google.picker.PickerBuilder()
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .setTitle('Seleccionar previsualización')
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .addView(view)
        .setCallback(pickerCallback)
        .build();

      picker.setVisible(true);
    };

    // If we already have a valid token, use it
    if (tokenRef.current) {
      showPicker(tokenRef.current);
      return;
    }

    // Otherwise request a new access token
    if (!gisReady.current || !tokenClientRef.current) {
      onError?.('El cliente de autenticación de Google no ha cargado aún. Intenta de nuevo.');
      return;
    }

    tokenClientRef.current.callback = (resp: any) => {
      if (resp.error) { onError?.('Error de autenticación: ' + resp.error); return; }
      tokenRef.current = resp.access_token;
      showPicker(resp.access_token);
    };

    // If user already authorized, skip consent screen
    if (tokenRef.current === null) {
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else {
      tokenClientRef.current.requestAccessToken({ prompt: '' });
    }
  }, [onPick, onError]);

  return { openPicker };
}
