import EXIF from 'exif-js';

/**
 * Interface representing geographical coordinates.
 */
interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Type representing the possible image inputs.
 * Can be an HTMLImageElement, File, or Blob.
 */
type ExifImage = HTMLImageElement | File | Blob;

/**
 * Extracts the geographical location (latitude and longitude) from an image's EXIF data.
 * 
 * @param imageFile - The image file or element from which to extract location data.
 * @returns A promise that resolves to the Coordinates object or null if no GPS data is found.
 */
export function getImageLocation(imageFile: ExifImage): Promise<Coordinates | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    /**
     * Handles the successful reading of the image file.
     * Parses the EXIF data to extract GPS information.
     */
    reader.onload = (e: any) => {
      try {
        const data = e.target.result;

        // Use EXIF.getData to parse EXIF information from the image
        EXIF.getData(data,  () => {
          const exifData = EXIF.getAllTags(this as any); // 'this' refers to the image element
          console.log("EXIF Data:", exifData); // Log EXIF data for debugging

          // Check if GPSLatitude and GPSLongitude are available in the EXIF data
          if (exifData?.GPSLatitude && exifData?.GPSLongitude) {
            // Convert GPS coordinates from degrees, minutes, seconds to decimal format
            const lat =
              (exifData.GPSLatitude[0] as number) +
              (exifData.GPSLatitude[1] as number) / 60 +
              (exifData.GPSLatitude[2] as number) / 3600;
            const lng =
              (exifData.GPSLongitude[0] as number) +
              (exifData.GPSLongitude[1] as number) / 60 +
              (exifData.GPSLongitude[2] as number) / 3600;

            // Determine the hemisphere based on GPSLatitudeRef and GPSLongitudeRef
            const latRef = exifData.GPSLatitudeRef || 'N';
            const lngRef = exifData.GPSLongitudeRef || 'E';

            // Adjust the sign of the coordinates based on the hemisphere
            resolve({
              lat: latRef === 'N' ? lat : -lat,
              lng: lngRef === 'E' ? lng : -lng,
            });
          } else {
            // Resolve with null if no GPS data is found
            resolve(null);
          }
        });
      } catch (error) {
        console.error('Error reading EXIF data:', error);
        // Resolve with null in case of any errors during EXIF parsing
        resolve(null);
      }
    };

    /**
     * Handles errors that occur while reading the image file.
     */
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error); // Reject the promise with the encountered error
    };

    // Check if the imageFile is a Blob or File before attempting to read
    if (imageFile instanceof Blob || imageFile instanceof File) {
      reader.readAsDataURL(imageFile); // Read the image as Data URL for EXIF.js parsing
    } else {
      reject(new Error('Invalid image file type')); // Reject if the imageFile type is not supported
    }
  });
}
