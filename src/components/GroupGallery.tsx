// src/components/GroupGallery.tsx
import {
  Box,
  Image as ChakraImage,
  Spinner,
  Text
} from "@chakra-ui/react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import exifr from "exifr";
import heic2any from "heic2any";
import React, { useEffect, useRef, useState } from "react";
import Masonry from "react-masonry-css";
import { useNavigate } from "react-router-dom";
import "../styles/masonry.css"; // 기존 Masonry 스타일 사용
import { Group } from "../types/group";

// 지도를 표시할 때 사용하는 API 키
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// 역지오코딩을 할 때 사용하는 API 키
const GOOGLE_GEOCODING_API_KEY = import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY || "";

interface GalleryPhoto {
  originalSrc: string; // 원본 이미지 URL
  displaySrc: string;  // 변환된 이미지 URL (HEIC인 경우 변환된 JPEG)
  date: Date | null;
  latitude: number | null;
  longitude: number | null;
  country: string | null; // 추가된 필드
  city: string | null;    // 추가된 필드
  state: string | null;   // 추가된 필드 (예: 주)
  postalCode: string | null; // 추가된 필드
  street: string | null;  // 추가된 필드
}

interface GroupGalleryProps {
  group: Group;
  isHeaderCollapsed: boolean;
}

// 그룹화된 섹션을 위한 타입
interface PhotoGroup {
  dateKey: string;       // 예) 2025-01-04 (YYYY-MM-DD)
  locationKey: string;   // 예) "37.123,127.987"
  photos: GalleryPhoto[];
}

interface Coordinates {
  lat: number;
  lng: number;
}

// 캐시를 저장할 객체
const geocodeCache: { 
  [key: string]: { 
    country: string | null; 
    city: string | null; 
    state: string | null; 
    postalCode: string | null; 
    street: string | null; 
  } 
} = {};

// ------------------------------------------------------
// 역지오코딩 함수: 위도와 경도를 받아 다양한 주소 정보를 반환
// ------------------------------------------------------
async function reverseGeocode(lat: number, lng: number): Promise<{ 
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
    const data = await response.json();

    console.log(`Geocoding API 응답 for (${lat}, ${lng}):`, data);

    if (!response.ok) {
      throw new Error(`역지오코딩 요청 실패: ${response.status} ${response.statusText}`);
    }

    if (data.status === "ZERO_RESULTS") {
      console.warn(`Geocoding API에서 좌표 (${lat}, ${lng})에 대한 결과가 없습니다.`);
      return { country: null, city: null, state: null, postalCode: null, street: null };
    }

    if (data.status !== "OK") {
      throw new Error(`Geocoding API 오류 상태: ${data.status}`);
    }

    if (data.results.length === 0) {
      throw new Error("유효한 지오코딩 결과가 없습니다.");
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
      // 필요에 따라 추가적인 타입을 처리할 수 있습니다.
    }

    geocodeCache[key] = { country, city, state, postalCode, street };
    return { country, city, state, postalCode, street };
  } catch (error) {
    console.error("역지오코딩 에러:", error);
    geocodeCache[key] = { country: null, city: null, state: null, postalCode: null, street: null };
    return { country: null, city: null, state: null, postalCode: null, street: null };
  }
}

// ------------------------------------------------------
// Blob → Data URL 변환
// ------------------------------------------------------
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

// ------------------------------------------------------
// 작은 지도 컴포넌트
// ------------------------------------------------------
const SmallMap: React.FC<{ 
  coordinates: Coordinates,
  country: string | null,
  city: string | null,
  state: string | null,
  postalCode: string | null,
  street: string | null,
}> = ({ coordinates, country, city, state, postalCode, street }) => {
  const mapStyles = {
    height: "150px",
    width: "100%",
    borderRadius: "8px",
    overflow: "hidden",
  };

  const defaultCenter = {
    lat: 37.5665,
    lng: 126.9780,
  };

  const isValidCoordinates =
    coordinates && !isNaN(coordinates.lat) && !isNaN(coordinates.lng);

  return (
    <Box style={mapStyles}>
      <GoogleMap
        mapContainerStyle={{ height: "100%", width: "100%" }}
        zoom={13}
        center={isValidCoordinates ? coordinates : defaultCenter}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {isValidCoordinates && (
          <Marker 
            position={coordinates} 
          />
        )}
      </GoogleMap>
      {/* 카드 내부에 텍스트로 위치 정보 표시 */}
      <Box mt={2}>
        {city && <Text fontWeight="bold">{city}</Text>}
        {state && <Text>{state}</Text>}
        {country && <Text>{country}</Text>}
        {postalCode && <Text>{postalCode}</Text>}
        {street && <Text>{street}</Text>}
      </Box>
    </Box>
  );
};

// ------------------------------------------------------
// 파스텔 색상 팔레트 정의
// ------------------------------------------------------
const pastelColors = [
  '#f2f2f2',
  'blue.50',
  'pink.50',
  'green.50',
  'yellow.50',
  'purple.50',
  'teal.50',
  'orange.50',
  'cyan.50',
  'red.50',

];

// ------------------------------------------------------
// 해시 함수 정의 (djb2 알고리즘 사용)
// ------------------------------------------------------
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i); // hash * 33 + c
  }
  return hash;
}

// ------------------------------------------------------
// 색상 할당 함수 정의
// ------------------------------------------------------
function getPastelColor(key: string): string {
  const index = Math.abs(hashString(key)) % pastelColors.length;
  return pastelColors[index];
}

export default function GroupGallery({ group, isHeaderCollapsed }: GroupGalleryProps) {
  const navigate = useNavigate();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 갤러리 영역에 대한 ref
  const galleryRef = useRef<HTMLDivElement>(null);

  // Google Maps API 로드
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // ------------------------------------------------------
  // 1) 사진 메타데이터 로드 + HEIC 변환 + 역지오코딩
  // ------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadMetadata() {
      try {
        const array: GalleryPhoto[] = await Promise.all(
          group.galleryImages.map(async (src) => {
            try {
              const isHeic =
                src.toLowerCase().endsWith(".heic") ||
                src.toLowerCase().includes("image/heic");
              let displaySrc = src;
              let date: Date | null = null;
              let latitude: number | null = null;
              let longitude: number | null = null;
              let country: string | null = null;
              let city: string | null = null;
              let state: string | null = null;
              let postalCode: string | null = null;
              let street: string | null = null;

              if (isHeic) {
                // HEIC 파일 처리: 변환 + EXIF 추출
                const response = await fetch(src);
                if (!response.ok) {
                  throw new Error(`이미지를 불러오는 데 실패했습니다: ${src}`);
                }
                const blob = await response.blob();

                // EXIF 데이터 추출
                const exif = await exifr.parse(blob, { translateValues: true });
                date = exif?.DateTimeOriginal ?? null;
                latitude = exif?.latitude ?? null;
                longitude = exif?.longitude ?? null;

                if (latitude && longitude) {
                  console.log(`역지오코딩 시도 좌표 - 위도: ${latitude}, 경도: ${longitude}`);
                  const location = await reverseGeocode(latitude, longitude);
                  country = location.country;
                  city = location.city;
                  state = location.state;
                  postalCode = location.postalCode;
                  street = location.street;
                }

                // HEIC -> JPEG 변환
                const convertedBlob = await heic2any({
                  blob,
                  toType: "image/jpeg",
                  quality: 0.8,
                });

                // 변환된 Blob -> Data URL
                displaySrc = await blobToDataURL(convertedBlob as Blob);
              } else {
                // 일반 이미지 (ex: jpg, png 등)
                const response = await fetch(src);
                if (!response.ok) {
                  throw new Error(`이미지를 불러오는 데 실패했습니다: ${src}`);
                }
                const blob = await response.blob();

                const exif = await exifr.parse(blob, { translateValues: true });
                date = exif?.DateTimeOriginal ?? null;
                latitude = exif?.latitude ?? null;
                longitude = exif?.longitude ?? null;

                if (latitude && longitude) {
                  console.log(`역지오코딩 시도 좌표 - 위도: ${latitude}, 경도: ${longitude}`);
                  const location = await reverseGeocode(latitude, longitude);
                  country = location.country;
                  city = location.city;
                  state = location.state;
                  postalCode = location.postalCode;
                  street = location.street;
                }
              }

              return {
                originalSrc: src,
                displaySrc,
                date,
                latitude,
                longitude,
                country,
                city,
                state,
                postalCode,
                street,
              };
            } catch (photoErr) {
              console.error(`Error processing photo ${src}: `, photoErr);
              return {
                originalSrc: src,
                displaySrc: src, // 변환 실패시 원본 사용
                date: null,
                latitude: null,
                longitude: null,
                country: null,
                city: null,
                state: null,
                postalCode: null,
                street: null,
              };
            }
          })
        );

        // 날짜 오름차순 정렬 (날짜 없으면 뒤로)
        array.sort((a, b) => {
          if (a.date && b.date) {
            return a.date.getTime() - b.date.getTime();
          } else if (a.date) {
            return -1;
          } else if (b.date) {
            return 1;
          } else {
            return 0;
          }
        });

        if (isMounted) setPhotos(array);
      } catch (err) {
        console.error("Error loading metadata: ", err);
        if (isMounted)
          setError("사진 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [group.galleryImages]);

  // ------------------------------------------------------
  // 2) 헤더가 축소된 순간 → 갤러리로 스크롤 이동
  // ------------------------------------------------------
  useEffect(() => {
    if (isHeaderCollapsed && galleryRef.current) {
      const OFFSET = 80; // 헤더 높이 등의 여유분
      const rect = galleryRef.current.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top - OFFSET;

      window.scrollTo({
        top: absoluteTop,
        behavior: "smooth",
      });
    }
  }, [isHeaderCollapsed]);

  // ------------------------------------------------------
  // 3) 그룹화 함수 (날짜 + 위치 기준)
  // ------------------------------------------------------
  function groupPhotosByDateAndLocation(photos: GalleryPhoto[]): PhotoGroup[] {
    const result: PhotoGroup[] = [];
    let currentGroup: PhotoGroup | null = null;

    for (const photo of photos) {
      const dateKey = photo.date
        ? new Date(photo.date).toISOString().slice(0, 10) // YYYY-MM-DD
        : "Unknown Date";
      const latLonKey =
        photo.latitude && photo.longitude
          ? `${photo.latitude.toFixed(3)},${photo.longitude.toFixed(3)}`
          : "Unknown Location";

      if (
        !currentGroup ||
        currentGroup.dateKey !== dateKey ||
        currentGroup.locationKey !== latLonKey
      ) {
        if (currentGroup) {
          result.push(currentGroup);
        }
        currentGroup = {
          dateKey,
          locationKey: latLonKey,
          photos: [photo],
        };
      } else {
        currentGroup.photos.push(photo);
      }
    }

    if (currentGroup) {
      result.push(currentGroup);
    }

    return result;
  }

  // ------------------------------------------------------
  // 4) 사진 클릭 → PhotoDetailPage로 이동
  // ------------------------------------------------------
  const handleClickPhoto = (photo: GalleryPhoto) => {
    navigate("/photo-detail", {
      state: { photo },
    });
  };

  // ------------------------------------------------------
  // 5) Masonry 브레이크포인트 설정
  // ------------------------------------------------------
  const breakpointColumnsObj = {
    default: 6,
    1200: 5,
    992: 4,
    768: 3,
    576: 2,
    0: 1,
  };

  // ------------------------------------------------------
  // 6) 월 이름 배열 정의
  // ------------------------------------------------------
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // ------------------------------------------------------
  // 최종 렌더링
  // ------------------------------------------------------
  // 그룹화된 데이터
  const groupedPhotoData: PhotoGroup[] = groupPhotosByDateAndLocation(photos);

  // 준비된 아이템 배열: 헤더와 이미지가 번갈아가며 포함
  const items = groupedPhotoData.flatMap((group, groupIdx) => {
    const itemsArray: Array<
      { type: 'dateHeader'; data: PhotoGroup } |
      { type: 'locationHeader'; data: PhotoGroup } |
      { type: 'image'; data: GalleryPhoto }
    > = [];

    // 날짜 헤더 추가
    itemsArray.push({ type: 'dateHeader', data: group });

    // 위치 헤더 추가
    if (group.locationKey !== "Unknown Location") {
      itemsArray.push({ type: 'locationHeader', data: group });
    }

    // 이미지들 추가
    group.photos.forEach(photo => {
      itemsArray.push({ type: 'image', data: photo });
    });

    return itemsArray;
  });

  return (
    <Box ref={galleryRef} px={4} mb={4} >
      {/* 로딩 스피너 / 에러 메시지 */}
      {isLoading && (
        <Box textAlign="center" my={4}>
          <Spinner size="lg" />
          <Text mt={2}>데이터 로딩 중...</Text>
        </Box>
      )}
      {error && (
        <Box textAlign="center" my={4}>
          <Text color="red.500">{error}</Text>
        </Box>
      )}

      {/* 그룹별 섹션 */}
      {!isLoading && !error && isLoaded && (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {items.map((item, idx) => {
            if (item.type === 'dateHeader') {
              const group = item.data;

              // 날짜 포맷: 월 이름과 일자로 표시 (예: Jan 04)
              const dateParts = group.dateKey.split("-");
              const year = dateParts[0];
              const monthIndex = parseInt(dateParts[1], 10) - 1; // 월 인덱스는 0부터 시작
              const day = dateParts[2];

              const monthName = monthNames[monthIndex] || "Unknown";

              // 색상 할당
              const bgColor = getPastelColor(group.dateKey);

              return (
                <Box
                  key={`dateHeader-${idx}`}
                  p={4}
                  bg={bgColor} // 랜덤 파스텔 색상 적용
                  borderRadius="md"
                  boxShadow="sm"
                  mb={4}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"      // 수평 중앙 정렬
                  justifyContent="center"  // 수직 중앙 정렬
                >
                  <Box alignItems="center" >
                    <Text fontSize={20} mb={-4} mt={6} ml={5} color="gray.600">
                      {monthName} {year} 
                    </Text>
                    <Text fontSize={60} fontWeight="bold" mb={3}>
                      {day}일
                    </Text>
                  </Box>
                </Box>
              );
            } else if (item.type === 'locationHeader') {
              const group = item.data;

              // 위치 좌표 및 나라, 도시 정보
              let coordinates: Coordinates | null = null;
              let country: string | null = null;
              let city: string | null = null;
              let state: string | null = null;
              let postalCode: string | null = null;
              let street: string | null = null;

              if (group.locationKey !== "Unknown Location") {
                const [lat, lng] = group.locationKey.split(",").map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                  coordinates = { lat, lng };

                  // 그룹 내 첫 번째 사진의 모든 위치 정보 사용
                  const firstPhoto = group.photos.find(photo => 
                    photo.country || 
                    photo.city || 
                    photo.state || 
                    photo.postalCode || 
                    photo.street
                  );
                  if (firstPhoto) {
                    country = firstPhoto.country;
                    city = firstPhoto.city;
                    state = firstPhoto.state;
                    postalCode = firstPhoto.postalCode;
                    street = firstPhoto.street;
                  }
                }
              }

              // 색상 할당
              const bgColor = getPastelColor(group.locationKey);

              return (
                <Box
                  key={`locationHeader-${idx}`}
                  p={4}
                  bg={bgColor} // 랜덤 파스텔 색상 적용
                  borderRadius="md"
                  boxShadow="sm"
                  mb={4}
                >
   
                  {/* country, city, state, postalCode, street 텍스트 추가 */}
                  {(country || city || state || postalCode || street) && (
                    <Box mb={2}>
                      {city && <Text fontWeight="bold" fontSize={24}>{city}</Text>}
                      {state && <Text fontSize={14}>{state}</Text>}
                      {country && <Text fontSize={14}>{country}</Text>}
                      {street && <Text>{street}</Text>}
                    </Box>
          )}

                  {coordinates && (
                    <SmallMap 
                      coordinates={coordinates} 
                      country={country} 
                      city={city} 
                      state={state}
                      postalCode={postalCode}
                      street={street}
                    />
                  )}
                </Box>
              );
            } else if (item.type === 'image') {
              const photo = item.data;

              return (
                <Box
                  key={`image-${idx}`}
                  position="relative"
                  mb={4}
                  cursor="pointer"
                  onClick={() => handleClickPhoto(photo)}
                  borderRadius="md"
                  overflow="hidden"
                >
                  <ChakraImage
                    src={photo.displaySrc}
                    alt={`Gallery-${idx}`}
                    objectFit="cover"
                    width="100%"
                    height="auto"
                    loading="lazy"
                    borderRadius="md"
                    transition="transform 0.2s"
                    _hover={{ transform: "scale(1.05)" }}
                  />
                </Box>
              );
            } else {
              return null;
            }
          })}
        </Masonry>
      )}
    </Box>
  );
}
