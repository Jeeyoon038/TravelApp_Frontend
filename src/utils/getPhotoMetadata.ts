// src/utils/getPhotoMetadata.ts

import exifr from "exifr";
import heic2any from "heic2any"; // HEIC to JPEG conversion
import { decode } from "libheif-js"; // HEIC metadata extraction

/**
 * Note: heic2any operates only in the browser environment (not supported in Node.js).
 *       Be cautious when using server-side rendering frameworks like Next.js.
 */

// -----------------------------------
// 1) PhotoMetadata Interface
// -----------------------------------
export interface PhotoMetadata {
  date: Date | null;
  latitude: number | null;
  longitude: number | null;

  country: string | null;    // Reverse geocoding results
  city: string | null;
  state: string | null;
  postalCode: string | null;
  street: string | null;

  displaySrc: string;        // Final display image URL (used during HEIC conversion)
}

// -----------------------------------
// 2) API Key Configuration for Reverse Geocoding
// -----------------------------------
const GOOGLE_GEOCODING_API_KEY = import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY || "";

// -----------------------------------
// 3) Cache for Reverse Geocoding Results
// -----------------------------------
const geocodeCache: {
  [key: string]: {
    country: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    street: string | null;
  };
} = {};

// -----------------------------------
// 4) reverseGeocode Function
// -----------------------------------
/**
 * Performs reverse geocoding to obtain location details from latitude and longitude.
 * Utilizes caching to minimize API requests for previously queried coordinates.
 * 
 * @param lat - Latitude of the location.
 * @param lng - Longitude of the location.
 * @returns An object containing country, city, state, postalCode, and street information.
 */
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{
  country: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  street: string | null;
}> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`; // Generate a key with 5 decimal places

  // Return cached result if available
  if (geocodeCache[key]) {
    return geocodeCache[key];
  }

  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_GEOCODING_API_KEY}`;

  try {
    const response = await fetch(geocodeUrl);
    if (!response.ok) {
      throw new Error(`Reverse geocoding request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === "ZERO_RESULTS") {
      console.warn(`No geocoding results for coordinates (${lat}, ${lng}).`);
      return { country: null, city: null, state: null, postalCode: null, street: null };
    }
    if (data.status !== "OK" || data.results.length === 0) {
      throw new Error(`Geocoding API error status: ${data.status}`);
    }

    const addressComponents = data.results[0].address_components;

    let country: string | null = null;
    let city: string | null = null;
    let state: string | null = null;
    let postalCode: string | null = null;
    let street: string | null = null;

    // Extract relevant address components
    for (const component of addressComponents) {
      if (component.types.includes("country")) {
        country = component.long_name;
      }
      if (
        component.types.includes("locality") ||
        component.types.includes("sublocality") ||
        component.types.includes("postal_town")
      ) {
        city = component.long_name;
      }
      if (component.types.includes("administrative_area_level_1")) {
        state = component.long_name;
      }
      if (component.types.includes("postal_code")) {
        postalCode = component.long_name;
      }
      if (component.types.includes("route")) {
        street = component.long_name;
      }
    }

    // Cache the result for future requests
    geocodeCache[key] = { country, city, state, postalCode, street };
    return { country, city, state, postalCode, street };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    // Cache null results to prevent repeated failed attempts
    geocodeCache[key] = { country: null, city: null, state: null, postalCode: null, street: null };
    return { country: null, city: null, state: null, postalCode: null, street: null };
  }
}

// -----------------------------------
// 5) Blob to DataURL Conversion
// -----------------------------------
/**
 * Converts a Blob object to a Data URL.
 * 
 * @param blob - The Blob to convert.
 * @returns A promise that resolves to the Data URL string.
 */
async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to data URL."));
      }
    };
    reader.onerror = () => {
      reject(new Error("Error reading blob as data URL."));
    };
    reader.readAsDataURL(blob);
  });
}

// -----------------------------------
// 6) MIME Type Identification from ArrayBuffer
// -----------------------------------
/**
 * Identifies the MIME type of a file from its ArrayBuffer.
 * Currently supports JPEG and HEIC/HEIF formats.
 * 
 * @param buffer - The ArrayBuffer of the file.
 * @returns The MIME type as a string, or undefined if not recognized.
 */
function getMimeType(buffer: ArrayBuffer): string | undefined {
  const view = new DataView(buffer);

  // Check for JPEG (starts with 0xFFD8)
  if (view.getUint16(0) === 0xffd8) {
    return "image/jpeg";
  }

  // Check for HEIC/HEIF (starts with 'ftypheic', 'ftypheix', etc.)
  const signature = String.fromCharCode.apply(
    null,
    [...new Uint8Array(buffer.slice(4, 12))]
  );
  if (
    signature.startsWith("ftypheic") ||
    signature.startsWith("ftypheix") ||
    signature.startsWith("ftypmif1") ||
    signature.startsWith("ftypmsf1")
  ) {
    return "image/heic";
  }

  // Add additional MIME type checks (e.g., PNG, GIF) as needed
  return undefined;
}

// -----------------------------------
// 7) getPhotoMetadata Function
//    - (1) Load ArrayBuffer + Identify MIME Type
//    - (2) Convert HEIC to JPEG if necessary
//    - (3) Parse EXIF Data
//    - (4) Perform Reverse Geocoding
//    - (5) Return PhotoMetadata
// -----------------------------------
/**
 * Extracts metadata from a photo source, which can be a URL or a File object.
 * Handles HEIC conversion, EXIF parsing, and reverse geocoding.
 * 
 * @param source - The photo source, either a URL string or a File object.
 * @returns A promise that resolves to a PhotoMetadata object.
 */
export async function getPhotoMetadata(source: string | File): Promise<PhotoMetadata> {
  try {
    let arrayBuffer: ArrayBuffer;
    let mimeType: string | undefined;

    // (A) Determine if the source is a URL or a File and load the ArrayBuffer accordingly
    if (typeof source === "string") {
      // Source is a URL
      const res = await fetch(source);
      if (!res.ok) {
        throw new Error(`Failed to fetch image. Status: ${res.status}`);
      }
      arrayBuffer = await res.arrayBuffer();
      mimeType = getMimeType(arrayBuffer);
    } else {
      // Source is a File object
      arrayBuffer = await source.arrayBuffer();
      mimeType = getMimeType(arrayBuffer);
      // Use the File's type as a fallback if MIME type is not identified
      if (!mimeType && source.type) {
        mimeType = source.type;
      }
    }

    // (B) If the image is HEIC/HEIF, extract metadata and convert to JPEG
    let heicMetadata: Partial<PhotoMetadata> = {};
    let displaySrc = "";

    if (mimeType === "image/heic" || mimeType === "image/heif") {
      try {
        // Extract HEIC metadata using libheif-js
        const heif = await decode(new Uint8Array(arrayBuffer));
        if (heif && heif.metadata) {
          // Example: Adjust based on the actual HEIC metadata structure
          heicMetadata.date = heif.metadata.creation_time
            ? new Date(heif.metadata.creation_time)
            : null;
          heicMetadata.latitude = heif.metadata.latitude || null;
          heicMetadata.longitude = heif.metadata.longitude || null;
          // Additional metadata extraction can be implemented here
        }
      } catch (heicError) {
        console.error("Error extracting HEIC metadata:", heicError);
      }

      // Convert HEIC to JPEG
      const heicBlob = new Blob([arrayBuffer], { type: mimeType });
      const convertedBlob = (await heic2any({
        blob: heicBlob,
        toType: "image/jpeg",
        quality: 0.9,
      })) as Blob;
      // Reload ArrayBuffer and MIME type from the converted JPEG
      arrayBuffer = await convertedBlob.arrayBuffer();
      mimeType = convertedBlob.type;
      // Generate a Data URL for display purposes
      displaySrc = await blobToDataURL(convertedBlob);
    }

    // (C) Parse EXIF metadata using exifr
    const exifMetadata = await exifr.parse(arrayBuffer, {
      tiff: true,
      ifd0: {},
      exif: true,
      gps: true,
      xmp: true,
    });

    // Extract date
    const date: Date | null =
      exifMetadata?.DateTimeOriginal ||
      exifMetadata?.CreateDate ||
      exifMetadata?.DateTime ||
      heicMetadata.date ||
      null;

    // Extract GPS coordinates
    const latitude: number | null = exifMetadata?.latitude ?? heicMetadata.latitude ?? null;
    const longitude: number | null = exifMetadata?.longitude ?? heicMetadata.longitude ?? null;

    // (D) Perform reverse geocoding if GPS data is available
    let country: string | null = null;
    let city: string | null = null;
    let state: string | null = null;
    let postalCode: string | null = null;
    let street: string | null = null;

    if (latitude && longitude) {
      const location = await reverseGeocode(latitude, longitude);
      country = location.country;
      city = location.city;
      state = location.state;
      postalCode = location.postalCode;
      street = location.street;
    }

    // (E) Determine the display source URL
    if (!displaySrc) {
      if (typeof source === "string") {
        // If the source is a URL, use it directly
        displaySrc = source;
      } else {
        // If the source is a File object, convert it to a Data URL
        const jpegBlob = new Blob([arrayBuffer], { type: mimeType || "image/jpeg" });
        displaySrc = await blobToDataURL(jpegBlob);
      }
    }

    // Return the structured metadata
    return {
      date,
      latitude,
      longitude,
      country,
      city,
      state,
      postalCode,
      street,
      displaySrc,
    };
  } catch (error) {
    console.error("getPhotoMetadata error:", error);
    // Return default values in case of an error
    return {
      date: null,
      latitude: null,
      longitude: null,
      country: null,
      city: null,
      state: null,
      postalCode: null,
      street: null,
      displaySrc: typeof source === "string" ? source : "",
    };
  }
}
