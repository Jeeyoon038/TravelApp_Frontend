// src/types/trip.ts

export interface Trip {
    _id: string;
    trip_id: number;
    title: string;
    start_date: string; // ISO 문자열
    end_date: string;   // ISO 문자열
    image_urls: string[];
    member_google_ids: string[];
    createdAt: string; // ISO 문자열
    updatedAt: string; // ISO 문자열
    __v: number;
  }
  
  export interface Diary {
    _id: string;
    trip_id: number;
    date: string; // 'YYYY-MM-DD' 형식
    content: string;
    
  }
  