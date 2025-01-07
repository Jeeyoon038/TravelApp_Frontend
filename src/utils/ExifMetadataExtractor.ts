// src/utils/exifMetadataExtractor.ts
import EXIF from 'exifr';
import { v4 as uuidv4 } from "uuid";

export interface Metadata {
  latitude: number | null;
  longitude: number | null;
  taken_at: string | null;
  image_id: string;
  image_url: string;
  //pH?: number | null;
}

export const extractMetadataFromUrls = async (imageUrls: string[]): Promise<Metadata[]> => {
  const promises = imageUrls.map((url) => {
    return new Promise<Metadata>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // To handle CORS
      img.src = url;

      img.onload = () => {
        try {
          EXIF.parse(img).then((exifData) => {
            const latitude = exifData.GPSLatitude;
            const latitudeRef = exifData.GPSLatitudeRef;
            const longitude = exifData.GPSLongitude;
            const longitudeRef = exifData.GPSLongitudeRef;
            const dateTime = exifData.DateTimeOriginal;
            //const pH = exifData.pH;

            // Convert GPS coordinates to decimal
            const lat = latitude && latitudeRef ? gpsToDecimal(latitude, latitudeRef) : null;
            const lon = longitude && longitudeRef ? gpsToDecimal(longitude, longitudeRef) : null;
            //const taken_at = exifData?.DateTimeOriginal ? new Date(exifData.DateTimeOriginal).toISOString() : null;

            
            const metadata: Metadata = {
              latitude: lat,
              longitude: lon,
              taken_at: dateTime || null,
              image_id: uuidv4(),
              image_url: url,
              //pH: pH ?? null,
            };

            console.log(`Metadata extracted from ${url}:`, metadata);
            resolve(metadata);
          }).catch((error) => {
            console.error(`Error extracting metadata from ${url}:`, error);
            resolve({
              latitude: null,
              longitude: null,
              taken_at: null,
              image_id: uuidv4(),
              image_url: url,
              //pH: null,
            });
          });
        } catch (error) {
          console.error(`Error extracting metadata from ${url}:`, error);
          resolve({
            latitude: null,
            longitude: null,
            taken_at: null,
            image_id: uuidv4(),
            image_url: url,
            //pH: null,
          });
        }
      };

      img.onerror = () => {
        console.error(`Failed to load image from URL: ${url}`);
        resolve({
          latitude: null,
          longitude: null,
          taken_at: null,
          image_id: uuidv4(),
          image_url: url,
          //pH: null,
        });
      };
    });
  });

  return Promise.all(promises);
};

const gpsToDecimal = (gpsData: number[], hem: string): number => {
  let d = gpsData[0];
  let m = gpsData[1];
  let s = gpsData[2];
  let dec = d + m / 60 + s / 3600;
  return (hem === 'S' || hem === 'W') ? dec * -1 : dec;
};
