// getPhotoMetadata.ts
import exifr from "exifr";
import heic2any from "heic2any"; // heic2any 설치 필요

export interface PhotoMetadata {
  date: Date | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * ArrayBuffer의 매직 넘버를 검사하여 MIME 타입을 반환합니다.
 *
 * @param buffer - 검사할 ArrayBuffer
 * @returns MIME 타입 문자열 또는 undefined
 */
function getMimeType(buffer: ArrayBuffer): string | undefined {
  const view = new DataView(buffer);
  
  // JPEG: starts with 0xFFD8
  if (view.getUint16(0) === 0xFFD8) {
    return 'image/jpeg';
  }

  // HEIC/HEIF: 'ftypheic' 또는 'ftypheix' 등으로 시작
  const signature = String.fromCharCode.apply(null, new Uint8Array(buffer.slice(4, 12)));
  if (signature.startsWith('ftypheic') || signature.startsWith('ftypheix') || signature.startsWith('ftypmif1') || signature.startsWith('ftypmsf1')) {
    return 'image/heic';
  }

  // 추가적인 파일 타입을 원한다면 여기에 매직 넘버를 추가하세요.

  return undefined;
}

/**
 * 사진 메타데이터를 추출합니다. 날짜, 위도, 경도를 포함합니다.
 * JPEG/JPG/HEIC 형식을 지원합니다.
 *
 * @param source - 이미지 파일을 가리키는 File 객체 또는 원격 URL 문자열.
 * @returns PhotoMetadata를 반환하는 Promise.
 */
export async function getPhotoMetadata(source: string | File): Promise<PhotoMetadata> {
  try {
    let arrayBuffer: ArrayBuffer;
    let mimeType: string | undefined;

    // 1. 소스가 URL인지 File 객체인지 확인
    if (typeof source === "string") {
      // (1) URL: 리소스를 가져옴
      const res = await fetch(source, { mode: "cors" });
      if (!res.ok) {
        throw new Error(`이미지를 가져오지 못했습니다. 상태: ${res.status}`);
      }
      arrayBuffer = await res.arrayBuffer();

      // ArrayBuffer에서 파일 타입 감지
      mimeType = getMimeType(arrayBuffer);
    } else {
      // (2) File 객체: ArrayBuffer를 직접 읽음
      arrayBuffer = await source.arrayBuffer();

      // File 객체에서 파일 타입 감지
      mimeType = getMimeType(arrayBuffer);
    }

    // MIME 타입이 감지되지 않으면 파일의 type 속성 사용 (보조)
    if (!mimeType) {
      if (typeof source !== "string") {
        mimeType = source.type;
      }
    }

    // 2. 파일이 HEIC인 경우, heic2any를 사용하여 JPEG로 변환
    if (mimeType === "image/heic" || mimeType === "image/heif") {
      try {
        // Blob으로 변환
        const heicBlob = new Blob([arrayBuffer], { type: mimeType });
        // heic2any를 사용하여 JPEG로 변환
        const convertedBlob: Blob = await heic2any({
          blob: heicBlob,
          toType: "image/jpeg",
          quality: 0.9, // 품질 조정 가능
        }) as Blob;

        // 변환된 Blob을 ArrayBuffer로 변환
        arrayBuffer = await convertedBlob.arrayBuffer();
        mimeType = convertedBlob.type;
      } catch (heicError) {
        console.error("heic2any 변환 오류:", heicError);
        throw new Error("HEIC 이미지를 JPEG로 변환하지 못했습니다.");
      }
    }

    // 3. exifr를 사용하여 메타데이터 파싱
    const metadata = await exifr.parse(arrayBuffer, {
      tiff: true,
      ifd0: true,
      exif: true,
      gps: true,
      xmp: true,
    });

    // 4. 날짜 추출
    const date: Date | null =
      metadata?.DateTimeOriginal ||
      metadata?.CreateDate ||
      metadata?.DateTime ||
      null;

    // 5. GPS 좌표 추출
    const latitude: number | null = metadata?.latitude ?? null;
    const longitude: number | null = metadata?.longitude ?? null;

    return { date, latitude, longitude };
  } catch (error) {
    console.error("getPhotoMetadata 오류:", error);
    // 오류 발생 시 모든 값을 null로 반환
    return { date: null, latitude: null, longitude: null };
  }
}
