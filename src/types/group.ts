export interface Group {
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
  