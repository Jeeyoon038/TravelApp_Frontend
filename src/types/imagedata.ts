//imagedata.ts
export interface ImageData {
    _id: string;
    latitude: number | null;
    longitude: number | null;
    taken_at: Date | null;
    image_url: string | null;
    displaySrc: string | null;
    createdAt: Date;
    updatedAt: Date;
    image_id: string;
    country: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    street: string | null;

    __v: number;
  }
    

  // export interface ImageDataWithDate extends Omit<ImageData, 'taken_at'> {
  //   taken_at: Date | null; // Transformed Date object
  // }