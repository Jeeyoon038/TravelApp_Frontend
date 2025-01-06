import EXIF from "exifr";
import { v4 as uuidv4 } from "uuid";

const GOOGLE_GEOCODING_API_KEY = import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY;
const AWS_UPLOAD_ENDPOINT = import.meta.env.VITE_AWS_UPLOAD_ENDPOINT || "http://localhost:3000/upload/image";

export interface PhotoMetadata {
  image_id: string;
  image_url: string | null;
  displaySrc: string;  // Changed to non-null as we always have this
  latitude: number | null;
  longitude: number | null;
  taken_at: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  street: string | null;
}

// Upload image to AWS S3 and get URL
async function uploadImageToAWS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file); // Changed from 'file' to 'image' to match backend

  try {
    const response = await fetch("http://localhost:3000/upload/image", {
      method: "POST",
      body: formData,
      // Remove any headers that might interfere with FormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    if (!data.imageUrl) {
      throw new Error('No image URL in response');
    }

    return data.imageUrl;
  } catch (error) {
    console.error("AWS upload error:", error);
    throw error;
  }
}

// Extract EXIF data from image
async function extractEXIFData(file: File) {
  try {
    const exifData = await EXIF.parse(file);
    
    let latitude = null;
    let longitude = null;
    let takenAt = null;

    if (exifData?.GPSLatitude && exifData?.GPSLatitudeRef) {
      latitude = exifData.GPSLatitude[0] + 
                exifData.GPSLatitude[1] / 60 + 
                exifData.GPSLatitude[2] / 3600;
      if (exifData.GPSLatitudeRef === 'S') latitude = -latitude;
    }

    if (exifData?.GPSLongitude && exifData?.GPSLongitudeRef) {
      longitude = exifData.GPSLongitude[0] + 
                 exifData.GPSLongitude[1] / 60 + 
                 exifData.GPSLongitude[2] / 3600;
      if (exifData.GPSLongitudeRef === 'W') longitude = -longitude;
    }

    if (exifData?.DateTimeOriginal) {
      takenAt = new Date(exifData.DateTimeOriginal).toISOString();
    }

    return { latitude, longitude, takenAt };
  } catch (error) {
    console.error("EXIF extraction error:", error);
    return { latitude: null, longitude: null, takenAt: null };
  }
}

// Get location data from coordinates
async function getLocationData(latitude: number | null, longitude: number | null) {
  if (!latitude || !longitude || !GOOGLE_GEOCODING_API_KEY) {
    return {
      country: null,
      city: null,
      state: null,
      postalCode: null,
      street: null
    };
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_GEOCODING_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Geocoding API error');
    }

    const data = await response.json();
    const components = data.results[0]?.address_components || [];

    return {
      country: components.find((c: any) => c.types.includes("country"))?.long_name || null,
      city: components.find((c: any) => c.types.includes("locality"))?.long_name || null,
      state: components.find((c: any) => c.types.includes("administrative_area_level_1"))?.long_name || null,
      postalCode: components.find((c: any) => c.types.includes("postal_code"))?.long_name || null,
      street: components.find((c: any) => c.types.includes("route"))?.long_name || null
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return {
      country: null,
      city: null,
      state: null,
      postalCode: null,
      street: null
    };
  }
}

// Process a single image
async function processImage(file: File, onProgress?: (status: string) => void): Promise<PhotoMetadata> {
  const image_id = uuidv4();
  const displaySrc = URL.createObjectURL(file);

  try {
    onProgress?.('Uploading to AWS...');
    const image_url = await uploadImageToAWS(file);

    onProgress?.('Extracting EXIF data...');
    const { latitude, longitude, takenAt } = await extractEXIFData(file);

    onProgress?.('Getting location data...');
    const locationData = await getLocationData(latitude, longitude);

    return {
      image_id,
      image_url,
      displaySrc,
      latitude,
      longitude,
      taken_at: takenAt,
      ...locationData
    };
  } catch (error) {
    console.error(`Error processing image ${image_id}:`, error);
    return {
      image_id,
      image_url: null,
      displaySrc,
      latitude: null,
      longitude: null,
      taken_at: null,
      country: null,
      city: null,
      state: null,
      postalCode: null,
      street: null
    };
  }
}

// Main function to extract metadata from multiple images
export const extractMetadata = async (
  images: File[], 
  onProgress?: (current: number, total: number, status: string) => void
): Promise<PhotoMetadata[]> => {
  if (!images.length) return [];

  const results: PhotoMetadata[] = [];

  for (let i = 0; i < images.length; i++) {
    onProgress?.(i + 1, images.length, 'Starting...');
    
    const result = await processImage(images[i], 
      (status) => onProgress?.(i + 1, images.length, status)
    );
    results.push(result);
  }

  return results;
};