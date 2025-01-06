//imagedata.ts
export interface ImageData {
    _id: string;
    latitude: number | null;
    longitude: number | null;
    taken_at: string | null;
    image_url: string;
    createdAt: string;
    updatedAt: string;
    image_id: string;
    __v: number;
  }
    

  export interface ImageDataWithDate extends Omit<ImageData, 'taken_at'> {
    taken_at: Date | null; // Transformed Date object
  }