// src/types/index.ts

export interface GoogleUser {
    googleId: string;
    email: string;
    displayName: string;
    profilePicture?: string;
  }
  
  export interface ImageMetadata {
    image_id: string;
    latitude: number | null;
    longitude: number | null;
    taken_at: string | null; // ISO 날짜 문자열
    image_url: string | null;
    displaySrc: string | null;
    country: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    street: string | null;
    diary?: string; // 일기 추가
  }
  
  export interface Trip {
    trip_id: string;
    title: string;
    start_date: string; // ISO 날짜 문자열
    end_date: string; // ISO 날짜 문자열
    image_urls: string[]; // image_id 배열
    member_google_ids: string[];
  }
  