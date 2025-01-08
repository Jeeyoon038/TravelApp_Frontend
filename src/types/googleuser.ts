// src/types/googleuser.ts
export interface GoogleUser {
  _id: string;
  googleId: string;
  email: string;
  displayName: string;
  photo: string; // Matches backend's `avatarUrl`
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// For frontend-only data
export interface FrontendGoogleUser extends GoogleUser {
  firstName?: string; // Optional for frontend-only use
  lastName?: string; // Optional for frontend-only use
  accessToken?: string; // Not stored in database
}
