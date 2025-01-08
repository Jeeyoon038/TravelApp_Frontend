// src/utils/heicToJpg.ts

import * as exifr from "exifr";
import heic2any from "heic2any";
import * as piexif from "piexifjs";

/**
 * Interface representing the extracted metadata from an image.
 */
export interface ImageMetadata {
  [key: string]: any; // Define specific metadata fields as needed
}

// -----------------------------------
// 1) EXIF Tag Definitions
// -----------------------------------

/**
 * Defines necessary EXIF tag IDs for different sections.
 */
const ImageIFD = {
  Make: 0x010F,         // Tag ID 271
  Model: 0x0110,        // Tag ID 272
  DateTime: 0x0132,     // Tag ID 306
  Software: 0x0131,     // Tag ID 305
  // Add other tag IDs as needed
};

const ExifIFD = {
  DateTimeOriginal: 0x9003, // Tag ID 36867
  // Add other tag IDs as needed
};

const GPSIFD = {
  GPSLatitudeRef: 1, // 'N' or 'S'
  GPSLatitude: 2,    // [degrees, minutes, seconds]
  GPSLongitudeRef: 3, // 'E' or 'W'
  GPSLongitude: 4,    // [degrees, minutes, seconds]
  GPSAltitudeRef: 5,  // 0 = above sea level, 1 = below sea level
  GPSAltitude: 6,     // Altitude in meters
  // Add other GPS tag IDs as needed
};

// -----------------------------------
// 2) Helper Functions
// -----------------------------------

/**
 * Converts an ArrayBuffer to a binary string.
 * @param buffer - The ArrayBuffer to convert.
 * @returns The resulting binary string.
 */
const arrayBufferToBinaryString = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
};

/**
 * Converts a binary string to an ArrayBuffer.
 * @param binary - The binary string to convert.
 * @returns The resulting ArrayBuffer.
 */
const binaryStringToArrayBuffer = (binary: string): ArrayBuffer => {
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
};

/**
 * Formats a date object or ISO string into EXIF DateTime format.
 * @param date - The date to format.
 * @returns The formatted date string.
 */
const formatDateTime = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * Converts decimal GPS coordinates to degrees, minutes, and seconds (DMS) format.
 * @param coord - The decimal coordinate.
 * @returns An array representing [degrees, minutes, seconds].
 */
const convertDecimalToDMS = (coord: number): [number, number, number] => {
  const absolute = Math.abs(coord);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.round((minutesNotTruncated - minutes) * 60 * 1000) / 1000; // Rounded to 3 decimal places
  return [degrees, minutes, seconds];
};

/**
 * Converts DMS coordinates to EXIF fractional format.
 * @param dms - The DMS coordinate array.
 * @returns An array of [numerator, denominator] pairs for each DMS component.
 */
const dmsToExif = (dms: [number, number, number]) => {
  return dms.map(value => {
    const numerator = Math.floor(value * 1000);
    const denominator = 1000;
    return [numerator, denominator];
  });
};

/**
 * Maps extracted metadata to EXIF object structure.
 * @param metadata - The metadata to convert.
 * @returns An object containing zeroth, Exif, and GPS EXIF data.
 */
const convertMetadataToExif = (metadata: ImageMetadata): any => {
  const zeroth: { [key: number]: any } = {};
  const exif: { [key: number]: any } = {};
  const gps: { [key: number]: any } = {};

  // Map metadata to zeroth IFD
  if (metadata.Make) {
    zeroth[ImageIFD.Make] = metadata.Make;
  }
  if (metadata.Model) {
    zeroth[ImageIFD.Model] = metadata.Model;
  }
  if (metadata.DateTime) {
    zeroth[ImageIFD.DateTime] = formatDateTime(metadata.DateTime);
  }
  if (metadata.Software) {
    zeroth[ImageIFD.Software] = metadata.Software;
  }

  // Map metadata to Exif IFD
  if (metadata.DateTimeOriginal) {
    exif[ExifIFD.DateTimeOriginal] = formatDateTime(metadata.DateTimeOriginal);
  }
  // Add other Exif metadata fields as needed

  // Map metadata to GPS IFD
  if (metadata.latitude && metadata.longitude) {
    const latitude = metadata.latitude;
    const longitude = metadata.longitude;

    const latDMS = convertDecimalToDMS(latitude);
    const lonDMS = convertDecimalToDMS(longitude);

    gps[GPSIFD.GPSLatitudeRef] = latitude >= 0 ? 'N' : 'S';
    gps[GPSIFD.GPSLatitude] = dmsToExif(latDMS);
    gps[GPSIFD.GPSLongitudeRef] = longitude >= 0 ? 'E' : 'W';
    gps[GPSIFD.GPSLongitude] = dmsToExif(lonDMS);

    if (metadata.altitude !== undefined) {
      gps[GPSIFD.GPSAltitudeRef] = metadata.altitude < 0 ? 1 : 0;
      gps[GPSIFD.GPSAltitude] = Math.abs(metadata.altitude);
    }
  }

  return { zeroth, Exif: exif, GPS: gps };
};

// -----------------------------------
// 3) HEIC to JPEG Conversion with Metadata Insertion
// -----------------------------------

/**
 * Converts a HEIC file to JPEG and inserts extracted metadata into the JPEG's EXIF data.
 * @param file - The HEIC file to convert.
 * @returns A promise that resolves to the converted JPEG File object.
 */
export const convertHeicToJpgWithMetadata = async (file: File): Promise<File> => {
  try {
    // 1. Extract metadata from HEIC file using exifr
    const metadata = await exifr.parse(file, { translateValues: true }) || {};

    // 2. Convert HEIC to JPEG using heic2any
    const blob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.8, // Adjust quality as needed
    }) as Blob;

    const arrayBuffer = await blob.arrayBuffer();
    const binaryString = arrayBufferToBinaryString(arrayBuffer);

    // 3. Convert extracted metadata to EXIF format
    const exifObj = convertMetadataToExif(metadata);
    const completeExif = {
      "0th": exifObj.zeroth,
      "Exif": exifObj.Exif,
      "GPS": exifObj.GPS,
      "Interop": {},
      "1st": {},
      "thumbnail": null,
    };
    const exifBytes = piexif.dump(completeExif);

    // 4. Insert EXIF data into the JPEG binary string
    const newBinaryString = piexif.insert(exifBytes, binaryString) as unknown as string;

    // 5. Convert the modified binary string back to an ArrayBuffer and then to a Blob
    const newArrayBuffer = binaryStringToArrayBuffer(newBinaryString);
    const newBlob = new Blob([newArrayBuffer], { type: "image/jpeg" });

    // 6. Create a new JPEG File object with the modified Blob
    const jpgFile = new File([newBlob], file.name.replace(/\.heic$/i, ".jpg"), {
      type: "image/jpeg",
    });

    return jpgFile;
  } catch (error) {
    console.error("Error converting HEIC to JPEG and inserting metadata:", error);
    throw new Error("Failed to convert HEIC file to JPEG.");
  }
};

// -----------------------------------
// 4) EXIF Metadata Extraction
// -----------------------------------

/**
 * Extracts metadata from an image file using exifr.
 * @param file - The image file from which to extract metadata.
 * @returns A promise that resolves to an ImageMetadata object.
 */
export const extractMetadata = async (file: File): Promise<ImageMetadata> => {
  try {
    const metadata = await exifr.parse(file, { translateValues: true });
    return metadata || {};
  } catch (error) {
    console.warn(`Failed to extract metadata from ${file.name}:`, error);
    return {};
  }
};

// -----------------------------------
// 5) File Processing Function
// -----------------------------------

/**
 * Processes an array of image files by converting HEIC files to JPEG and extracting metadata.
 * @param files - An array of image File objects to process.
 * @returns A promise that resolves to an array of objects containing the processed File and its metadata.
 */
export const processFiles = async (files: File[]): Promise<{ file: File; metadata: ImageMetadata }[]> => {
  const processedImages: { file: File; metadata: ImageMetadata }[] = [];

  for (const file of files) {
    let processedFile: File;
    let metadata: ImageMetadata = {};

    if (file.type === "image/heic" || file.type === "image/heif") {
      // Convert HEIC files to JPEG and preserve metadata
      try {
        processedFile = await convertHeicToJpgWithMetadata(file);
        metadata = await exifr.parse(file, { translateValues: true }) || {}; // Extract metadata from original HEIC
      } catch (error) {
        console.error(`Failed to convert HEIC file ${file.name}:`, error);
        continue; // Skip this file if conversion fails
      }
    } else {
      // For non-HEIC files, use the original file and extract metadata
      processedFile = file;
      metadata = await extractMetadata(file);
    }

    processedImages.push({ file: processedFile, metadata });
  }

  return processedImages;
};
