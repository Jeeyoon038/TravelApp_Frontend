// src/utils/exifMetadataExtractor.ts

import EXIF from 'exifr';
import { v4 as uuidv4 } from "uuid";

/**
 * Interface representing the metadata extracted from an image.
 */
export interface Metadata {
  latitude: number | null;
  longitude: number | null;
  taken_at: string | null;
  image_id: string;
  image_url: string;
  // pH?: number | null; // Uncomment if pH data is required in the future
}

/**
 * Extracts metadata from an array of image URLs.
 * @param imageUrls - Array of image URLs to process.
 * @returns A promise that resolves to an array of Metadata objects.
 */
export const extractMetadataFromUrls = async (imageUrls: string[]): Promise<Metadata[]> => {
  const promises = imageUrls.map((url) => {
    return new Promise<Metadata>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // To handle CORS issues
      img.src = url;

      /**
       * Handles successful image load by extracting EXIF data.
       */
      img.onload = () => {
        try {
          EXIF.parse(img).then((exifData) => {
            const latitude = exifData.GPSLatitude;
            const latitudeRef = exifData.GPSLatitudeRef;
            const longitude = exifData.GPSLongitude;
            const longitudeRef = exifData.GPSLongitudeRef;
            const dateTime = exifData.DateTimeOriginal;
            // const pH = exifData.pH; // Uncomment if pH data is required

            // Convert GPS coordinates to decimal format
            const lat = latitude && latitudeRef ? gpsToDecimal(latitude, latitudeRef) : null;
            const lon = longitude && longitudeRef ? gpsToDecimal(longitude, longitudeRef) : null;

            const metadata: Metadata = {
              latitude: lat,
              longitude: lon,
              taken_at: dateTime || null,
              image_id: uuidv4(),
              image_url: url,
              // pH: pH ?? null, // Uncomment if pH data is required
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
              // pH: null, // Uncomment if pH data is required
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
            // pH: null, // Uncomment if pH data is required
          });
        }
      };

      /**
       * Handles image load errors by resolving with default metadata.
       */
      img.onerror = () => {
        console.error(`Failed to load image from URL: ${url}`);
        resolve({
          latitude: null,
          longitude: null,
          taken_at: null,
          image_id: uuidv4(),
          image_url: url,
          // pH: null, // Uncomment if pH data is required
        });
      };
    });
  });

  // Wait for all metadata extraction promises to resolve
  return Promise.all(promises);
};

/**
 * Converts GPS coordinates from degrees, minutes, seconds to decimal format.
 * @param gpsData - Array containing degrees, minutes, and seconds.
 * @param hem - Hemisphere indicator ('N', 'S', 'E', 'W').
 * @returns The decimal representation of the GPS coordinate.
 */
const gpsToDecimal = (gpsData: number[], hem: string): number => {
  const [degrees, minutes, seconds] = gpsData;
  let decimal = degrees + minutes / 60 + seconds / 3600;
  return (hem === 'S' || hem === 'W') ? decimal * -1 : decimal;
};
