// src/utils/getPhotoMetadata.ts

import exifr from "exifr";
import heic2any from "heic2any"; // HEIC 변환
import { decode } from "libheif-js"; // HEIC 메타데이터 추출

/**
 * 주의: heic2any는 브라우저 환경에서만 동작합니다. (Node.js 환경 불가)
 *      따라서, Next.js 등에서 서버사이드 렌더링 시 주의가 필요합니다.
 */

// -----------------------------------
// 1) PhotoMetadata 인터페이스
// -----------------------------------
export interface PhotoMetadata {
  date: Date | null;
  latitude: number | null;
  longitude: number | null;

  country: string | null;    // 역지오코딩 결과
  city: string | null;
  state: string | null;
  postalCode: string | null;
  street: string | null;

  displaySrc: string;        // (HEIC 변환 시 사용) 최종 표시용 이미지 URL
}

// -----------------------------------
// 2) 역지오코딩을 위한 API 키 설정
// -----------------------------------
const GOOGLE_GEOCODING_API_KEY = import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY || "";

// -----------------------------------
// 3) 역지오코딩 결과 캐싱을 위한 객체
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
// 4) reverseGeocode 함수
// -----------------------------------
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
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`; // 소수점 5자리까지 키 생성

  if (geocodeCache[key]) {
    return geocodeCache[key];
  }

  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_GEOCODING_API_KEY}`;

  try {
    const response = await fetch(geocodeUrl);
    if (!response.ok) {
      throw new Error(`역지오코딩 요청 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === "ZERO_RESULTS") {
      console.warn(`Geocoding API에서 좌표 (${lat}, ${lng})에 대한 결과가 없습니다.`);
      return { country: null, city: null, state: null, postalCode: null, street: null };
    }
    if (data.status !== "OK" || data.results.length === 0) {
      throw new Error(`Geocoding API 오류 상태: ${data.status}`);
    }

    const addressComponents = data.results[0].address_components;

    let country: string | null = null;
    let city: string | null = null;
    let state: string | null = null;
    let postalCode: string | null = null;
    let street: string | null = null;

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

    geocodeCache[key] = { country, city, state, postalCode, street };
    return { country, city, state, postalCode, street };
  } catch (error) {
    console.error("역지오코딩 에러:", error);
    // 오류가 나면 캐시에 null로 저장
    geocodeCache[key] = { country: null, city: null, state: null, postalCode: null, street: null };
    return { country: null, city: null, state: null, postalCode: null, street: null };
  }
}

// -----------------------------------
// 5) Blob → DataURL 변환
// -----------------------------------
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
// 6) ArrayBuffer로부터 MIME 타입 식별
// -----------------------------------
function getMimeType(buffer: ArrayBuffer): string | undefined {
  const view = new DataView(buffer);

  // JPEG: starts with 0xFFD8
  if (view.getUint16(0) === 0xffd8) {
    return "image/jpeg";
  }

  // HEIC/HEIF: 'ftypheic' 또는 'ftypheix' 등으로 시작
  const signature = String.fromCharCode.apply(null, [...new Uint8Array(buffer.slice(4, 12))]);
  if (
    signature.startsWith("ftypheic") ||
    signature.startsWith("ftypheix") ||
    signature.startsWith("ftypmif1") ||
    signature.startsWith("ftypmsf1")
  ) {
    return "image/heic";
  }

  // 필요시 PNG, GIF 등 추가 가능
  return undefined;
}

// -----------------------------------
// 7) getPhotoMetadata 함수
//    - (1) ArrayBuffer 로드 + MIME 식별
//    - (2) HEIC → JPEG 변환 (필요 시)
//    - (3) EXIF 파싱
//    - (4) 위도/경도 → 역지오코딩
//    - (5) PhotoMetadata 리턴
// -----------------------------------
export async function getPhotoMetadata(source: string | File): Promise<PhotoMetadata> {
  try {
    let arrayBuffer: ArrayBuffer;
    let mimeType: string | undefined;

    // (A) 소스가 URL인지 File인지 구분해서 ArrayBuffer 획득
    if (typeof source === "string") {
      // URL
      const res = await fetch(source);
      if (!res.ok) {
        throw new Error(`이미지를 가져오지 못했습니다. 상태: ${res.status}`);
      }
      arrayBuffer = await res.arrayBuffer();
      mimeType = getMimeType(arrayBuffer);
    } else {
      // File
      arrayBuffer = await source.arrayBuffer();
      mimeType = getMimeType(arrayBuffer);
      // File.type을 보조로 사용
      if (!mimeType && source.type) {
        mimeType = source.type;
      }
    }

    // (B) HEIC이면 EXIF 추출 및 JPEG로 변환
    let heicMetadata: Partial<PhotoMetadata> = {};
    let displaySrc = "";

    if (mimeType === "image/heic" || mimeType === "image/heif") {
      try {
        // HEIC 메타데이터 추출 using libheif-js
        const heif = await decode(new Uint8Array(arrayBuffer));
        if (heif && heif.metadata) {
          // 예시: HEIC 메타데이터 구조에 따라 조정 필요
          heicMetadata.date = heif.metadata.creation_time
            ? new Date(heif.metadata.creation_time)
            : null;
          heicMetadata.latitude = heif.metadata.latitude || null;
          heicMetadata.longitude = heif.metadata.longitude || null;
          // 추가적인 메타데이터 추출 가능
        }
      } catch (heicError) {
        console.error("HEIC 메타데이터 추출 오류:", heicError);
      }

      // HEIC → JPEG 변환
      const heicBlob = new Blob([arrayBuffer], { type: mimeType });
      const convertedBlob = (await heic2any({
        blob: heicBlob,
        toType: "image/jpeg",
        quality: 0.9,
      })) as Blob;
      // 다시 ArrayBuffer
      arrayBuffer = await convertedBlob.arrayBuffer();
      mimeType = convertedBlob.type;
      // 화면 표시용 URL
      displaySrc = await blobToDataURL(convertedBlob);
    }

    // (C) EXIF 파싱
    const exifMetadata = await exifr.parse(arrayBuffer, {
      tiff: true,
      ifd0: {},
      exif: true,
      gps: true,
      xmp: true,
    });

    // 날짜
    const date: Date | null =
      exifMetadata?.DateTimeOriginal ||
      exifMetadata?.CreateDate ||
      exifMetadata?.DateTime ||
      heicMetadata.date ||
      null;

    // 위/경도
    const latitude: number | null = exifMetadata?.latitude ?? heicMetadata.latitude ?? null;
    const longitude: number | null = exifMetadata?.longitude ?? heicMetadata.longitude ?? null;

    // (D) 역지오코딩
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

    // (E) 만약 이미 JPEG였다면 displaySrc는?
    //     - 그냥 source(문자열) 혹은 File URL을 사용하거나,
    //       blob -> DataURL 변환을 원하는 경우 변환하세요.
    if (!displaySrc) {
      // 원본이 URL이면 그대로 사용 가능
      if (typeof source === "string") {
        displaySrc = source;
      } else {
        // File 객체일 경우 (로컬 미리보기) => blobToDataURL
        const jpegBlob = new Blob([arrayBuffer], { type: mimeType || "image/jpeg" });
        displaySrc = await blobToDataURL(jpegBlob);
      }
    }

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
    console.error("getPhotoMetadata 오류:", error);
    // 오류 시, 기본값 반환
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
