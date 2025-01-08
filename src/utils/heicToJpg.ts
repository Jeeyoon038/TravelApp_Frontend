// src/utils/heicToJpg.ts

import * as exifr from "exifr";
import heic2any from "heic2any";
import * as piexif from "piexifjs";

export interface ImageMetadata {
  [key: string]: any; // 필요한 경우 구체적인 메타데이터 필드를 정의
}

// 필요한 Exif 태그 ID를 수동으로 정의
const ImageIFD = {
  Make: 0x010F,         // 271
  Model: 0x0110,        // 272
  DateTime: 0x0132,     // 306
  Software: 0x0131,     // 305
  // 필요한 다른 태그 ID 추가
};

const ExifIFD = {
  DateTimeOriginal: 0x9003, // 36867
  // 필요한 다른 태그 ID 추가
};

const GPSIFD = {
  GPSLatitudeRef: 1, // 'N' 또는 'S'
  GPSLatitude: 2,    // [degrees, minutes, seconds]
  GPSLongitudeRef: 3, // 'E' 또는 'W'
  GPSLongitude: 4,    // [degrees, minutes, seconds]
  GPSAltitudeRef: 5,  // 0 = 해수면 위, 1 = 해수면 아래
  GPSAltitude: 6,     // 미터 단위
  // 필요한 다른 GPS 태그 ID 추가
};

// 헬퍼 함수: ArrayBuffer를 Binary String으로 변환
const arrayBufferToBinaryString = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
};

// 헬퍼 함수: Binary String을 ArrayBuffer로 변환
const binaryStringToArrayBuffer = (binary: string): ArrayBuffer => {
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
};

// 헬퍼 함수: 날짜 형식 변환 (Date 객체 또는 ISO 문자열을 EXIF 형식으로 변환)
const formatDateTime = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// 헬퍼 함수: 소수형 GPS 좌표를 [도, 분, 초] 형식의 배열로 변환
const convertDecimalToDMS = (coord: number): [number, number, number] => {
  const absolute = Math.abs(coord);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.round((minutesNotTruncated - minutes) * 60 * 1000) / 1000; // 소수점 3자리까지
  return [degrees, minutes, seconds];
};

// 헬퍼 함수: DMS를 Exif 형식의 분수로 변환
const dmsToExif = (dms: [number, number, number]) => {
  return dms.map(value => {
    const numerator = Math.floor(value * 1000);
    const denominator = 1000;
    return [numerator, denominator];
  });
};

// 메타데이터를 Exif 객체로 변환
const convertMetadataToExif = (metadata: ImageMetadata): any => {
  const zeroth: { [key: number]: any } = {};
  const exif: { [key: number]: any } = {};
  const gps: { [key: number]: any } = {};

  // zeroth 섹션에 메타데이터 매핑
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

  // Exif 섹션에 메타데이터 매핑
  if (metadata.DateTimeOriginal) {
    exif[ExifIFD.DateTimeOriginal] = formatDateTime(metadata.DateTimeOriginal);
  }
  // 필요한 다른 메타데이터 필드 추가

  // GPS 섹션에 메타데이터 매핑
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

// HEIC 파일을 JPG로 변환하고 메타데이터를 삽입하는 함수
export const convertHeicToJpgWithMetadata = async (file: File): Promise<File> => {
  try {
    // 1. HEIC 파일에서 메타데이터 추출
    const metadata = await exifr.parse(file, { translateValues: true }) || {};

    // 2. HEIC를 JPG로 변환
    const blob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.8, // 필요한 경우 품질 조정
    }) as Blob;
    const arrayBuffer = await blob.arrayBuffer();
    const binaryString = arrayBufferToBinaryString(arrayBuffer);

    // 3. 메타데이터를 JPG에 삽입
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
if (!binaryString) {
  throw new Error("Failed to convert array buffer to binary string.");
}

let newBinaryString: string;
try {
  newBinaryString = piexif.insert(exifBytes, binaryString) as unknown as string;
} catch (error) {
  throw new Error("Failed to generate new binary string with Exif data.");
}

    // 4. 새로운 Blob과 File 생성
    const newArrayBuffer = binaryStringToArrayBuffer(newBinaryString);
    const newBlob = new Blob([newArrayBuffer], { type: "image/jpeg" });
    const jpgFile = new File([newBlob], file.name.replace(/\.heic$/i, ".jpg"), {
      type: "image/jpeg",
    });
    return jpgFile;
  } catch (error) {
    console.error("HEIC 파일을 JPG로 변환하고 메타데이터를 삽입하는 중 오류가 발생했습니다.", error);
    throw new Error("HEIC 파일을 JPG로 변환하는 중 오류가 발생했습니다.");
  }
};

// 메타데이터 추출 함수 (기존)
export const extractMetadata = async (file: File): Promise<ImageMetadata> => {
  try {
    const metadata = await exifr.parse(file, { translateValues: true });
    return metadata || {};
  } catch (error) {
    console.warn(`메타데이터 추출 실패: ${file.name}`, error);
    return {};
  }
};

// 파일을 처리하는 메인 함수
export const processFiles = async (files: File[]): Promise<{ file: File; metadata: ImageMetadata }[]> => {
  const processedImages: { file: File; metadata: ImageMetadata }[] = [];

  for (const file of files) {
    let processedFile: File;
    let metadata: ImageMetadata = {};

    if (file.type === "image/heic" || file.type === "image/heif") {
      // HEIC 파일을 JPG로 변환하고 메타데이터 보존
      try {
        processedFile = await convertHeicToJpgWithMetadata(file);
        metadata = await exifr.parse(file, { translateValues: true }) || {}; // 원본 HEIC에서 메타데이터 추출
      } catch (error) {
        console.error(`HEIC 변환 실패: ${file.name}`, error);
        continue; // 변환 실패 시 해당 파일은 건너뜁니다.
      }
    } else {
      processedFile = file;
      metadata = await extractMetadata(file);
    }

    processedImages.push({ file: processedFile, metadata });
  }

  return processedImages;
}; 