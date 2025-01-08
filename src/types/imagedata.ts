//imagedata.ts
export interface ImageData {
    latitude: number | null;
    longitude: number | null;
    taken_at: string | null;
    image_url: string;

    image_id: string;
  
  }
    

  export interface ImageDataWithDate extends Omit<ImageData, 'taken_at'> {
    taken_at: Date | null; // Transformed Date object
  }