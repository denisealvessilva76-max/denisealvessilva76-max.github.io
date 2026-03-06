import { describe, it, expect } from "vitest";

describe("Firebase EXPO_PUBLIC credentials", () => {
  it("should have all required Firebase env vars set", () => {
    const required = [
      "EXPO_PUBLIC_FIREBASE_API_KEY",
      "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "EXPO_PUBLIC_FIREBASE_DATABASE_URL",
      "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
      "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "EXPO_PUBLIC_FIREBASE_APP_ID",
    ];

    for (const key of required) {
      const value = process.env[key];
      expect(value, `${key} should be set`).toBeTruthy();
      expect(value, `${key} should not be a demo value`).not.toContain("demo");
    }
  });

  it("should have valid Firebase database URL format", () => {
    const url = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
    expect(url).toMatch(/^https:\/\/.+\.firebaseio\.com$/);
  });

  it("should have valid Firebase project ID", () => {
    const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
    expect(projectId).toBe("canteiro-saudavel");
  });
});
