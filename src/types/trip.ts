// src/types/trip.ts

export interface Trip {
  _id: string;               // MongoDB ObjectId
  trip_id: number;           // 고유한 숫자 ID
  title: string;
  start_date: string;        // ISO 문자열 (e.g., "2023-10-01T00:00:00.000Z")
  end_date: string;          // ISO 문자열
  image_urls: string[];      // 이미지 URL 배열
  member_google_ids: string[]; // 멤버들의 Google ID 배열
  createdAt: string;         // ISO 문자열
  updatedAt: string;         // ISO 문자열
  __v: number;
}

export interface Diary {
  _id: string;
  trip_id: number;           // Trip의 trip_id (number)
  date: string;              // 'YYYY-MM-DD' 형식
  content: string;
  image_url?: string;        // 선택 사항
}
