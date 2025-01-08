import exifr from 'exifr';
import { v4 as uuidv4 } from 'uuid';
import heic2any from 'heic2any';

export interface ImageMetadata {
  latitude: number | null;
  longitude: number | null;
  taken_at: string | null;
  image_id: string;
  image_url: string;
  country: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  street: string | null;
}

// Cache for reverse geocoding results
const geocodeCache: { [key: string]: any } = {};

/**
 * Performs reverse geocoding using Google Maps API
 */
async function reverseGeocode(lat: number, lng: number): Promise<Partial<ImageMetadata>> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (geocodeCache[key]) return geocodeCache[key];

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('No Google Maps API key provided');
    return {};
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const addressComponents = result.address_components;
    
    const locationData = {
      country: null,
      city: null,
      state: null,
      postalCode: null,
      street: null
    };

    addressComponents.forEach((component: any) => {
      if (component.types.includes('country')) {
        locationData.country = component.long_name;
      } else if (component.types.includes('locality')) {
        locationData.city = component.long_name;
      } else if (component.types.includes('administrative_area_level_1')) {
        locationData.state = component.long_name;
      } else if (component.types.includes('postal_code')) {
        locationData.postalCode = component.long_name;
      } else if (component.types.includes('route')) {
        locationData.street = component.long_name;
      }
    });

    geocodeCache[key] = locationData;
    return locationData;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return {};
  }
}

/**
 * Processes files, converting HEIC to JPEG if necessary
 */
export async function processFiles(files: File[]): Promise<{ file: File; metadata: ImageMetadata }[]> {
  const results = [];

  for (const file of files) {
    try {
      let processedFile = file;
      
      // Convert HEIC to JPEG if necessary
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        const blob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        }) as Blob;
        processedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
      }

      // Extract metadata
      const metadata = await extractMetadata(processedFile);
      results.push({ file: processedFile, metadata });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  }

  return results;
}

/**
 * Extracts metadata from an image file
 */
async function extractMetadata(file: File | string): Promise<ImageMetadata> {
  try {
    let url = typeof file === 'string' ? file : URL.createObjectURL(file);
    const exifData = await exifr.parse(file);
    
    let latitude = null;
    let longitude = null;
    let taken_at = null;

    if (exifData) {
      latitude = exifData.latitude || null;
      longitude = exifData.longitude || null;
      taken_at = exifData.DateTimeOriginal || exifData.CreateDate || null;
    }

    let locationData = {};
    if (latitude && longitude) {
      locationData = await reverseGeocode(latitude, longitude);
    }

    const metadata: ImageMetadata = {
      latitude,
      longitude,
      taken_at: taken_at ? new Date(taken_at).toISOString() : null,
      image_id: uuidv4(),
      image_url: url,
      country: null,
      city: null,
      state: null,
      postalCode: null,
      street: null,
      ...locationData
    };

    if (typeof file !== 'string') {
      URL.revokeObjectURL(url);
    }

    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      latitude: null,
      longitude: null,
      taken_at: null,
      image_id: uuidv4(),
      image_url: typeof file === 'string' ? file : URL.createObjectURL(file),
      country: null,
      city: null,
      state: null,
      postalCode: null,
      street: null
    };
  }
}

/**
 * Main function to extract metadata from image URLs
 */
export async function extractMetadataFromUrls(imageUrls: string[]): Promise<ImageMetadata[]> {
  const promises = imageUrls.map(url => extractMetadata(url));
  return Promise.all(promises);
}