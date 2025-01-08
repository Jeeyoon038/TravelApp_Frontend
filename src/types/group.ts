export interface Group {
  _id: string;
  trip_id: number;
  title: string;
  start_date: string | Date;
  end_date: string | Date;
  image_urls: string[];
  member_google_ids: string[];
  created_by: string;  // This will store the Google ID
  createdAt: string;
  updatedAt: string;
  __v: number;
}