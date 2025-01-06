export interface Trip {
  _id: string;
  title: string;
  start_date: Date | string;  // Allow both Date and string since MongoDB returns it as string
  end_date: Date | string;
  image_urls: string[];
  member_google_ids: string[];
  createdAt: string;
  updatedAt: string;
  trip_id: number;
  __v: number;
}

// types/trip.ts
export interface Group {
  trip_id: number;
  title: string;
  start_date: string | Date;
  image_urls: string[];
}

export interface Photo {
  photo_id: number;
  trip_id: number;
  url: string;
  description?: string;
}

export interface DiaryEntry {
  photo_id: number;
  content: string;
  date: string; // ISO string
}

  