// src/types/diary.ts

export interface Diary {
    _id: string;
    trip_id: number;
    date: string; // 'YYYY-MM-DD'
    content: string;
    image_url: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
  }
  