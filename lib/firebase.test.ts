import { describe, it, expect } from 'vitest';

describe('Firebase Configuration', () => {
  it('should have valid Firebase credentials from environment variables', () => {
    const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
    const databaseURL = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
    const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

    expect(apiKey).toBeDefined();
    expect(authDomain).toBeDefined();
    expect(databaseURL).toBeDefined();
    expect(projectId).toBeDefined();
    expect(storageBucket).toBeDefined();
    expect(messagingSenderId).toBeDefined();
    expect(appId).toBeDefined();

    // Validate format
    expect(apiKey).toContain('AIzaSy');
    expect(authDomain).toContain('firebaseapp.com');
    expect(databaseURL).toContain('firebaseio.com');
    expect(projectId).toBe('canteiro-saudavel');
    expect(storageBucket).toContain('firebasestorage');
  });
});
