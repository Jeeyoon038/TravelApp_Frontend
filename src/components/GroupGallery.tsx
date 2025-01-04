// src/components/GroupGallery.tsx

import {
  Box,
  Image as ChakraImage,
  Spinner,
  Text,
} from "@chakra-ui/react";
import exifr from "exifr";
import heic2any from "heic2any";
import { useEffect, useRef, useState } from "react";
import Masonry from "react-masonry-css";
import { useNavigate } from "react-router-dom";
import { Group } from "../types/group";
import React from "react";
import { Button } from "@chakra-ui/react";
//import { Spinner } from "@chakra-ui/icons";

// forwardRef를 react에서 직접 가져옵니다.
import { forwardRef } from "react";

interface GalleryPhoto {
  originalSrc: string; // 원본 이미지 URL
  displaySrc: string;   // 변환된 이미지 URL (HEIC인 경우 변환된 JPEG)
  date: Date | null;
  latitude: number | null;
  longitude: number | null;
}

interface GroupGalleryProps {
  group: Group;
  isHeaderCollapsed: boolean;
}

export default function GroupGallery({ group, isHeaderCollapsed }: GroupGalleryProps) {
  const navigate = useNavigate();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 갤러리 영역에 대한 ref
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadMetadata() {
      try {
        const array: GalleryPhoto[] = await Promise.all(
          group.galleryImages.map(async (src) => {
            try {
              const isHeic = src.toLowerCase().endsWith(".heic") || src.toLowerCase().includes("image/heic");
              let displaySrc = src;
              let date: Date | null = null;
              let latitude: number | null = null;
              let longitude: number | null = null;

              if (isHeic) {
                // HEIC 파일 처리: 변환 및 EXIF 데이터 추출
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

                // HEIC를 JPEG로 변환
                const convertedBlob = await heic2any({
                  blob,
                  toType: "image/jpeg",
                  quality: 0.8,
                });

                // Blob을 데이터 URL로 변환
                displaySrc = await blobToDataURL(convertedBlob as Blob);
              } else {
                // HEIC가 아닌 경우: EXIF 데이터 추출
                const response = await fetch(src);
                if (!response.ok) {
                  throw new Error(`이미지를 불러오는 데 실패했습니다: ${src}`);
                }
                const blob = await response.blob();

                const exif = await exifr.parse(blob, { translateValues: true });
                date = exif?.DateTimeOriginal ?? null;
                latitude = exif?.latitude ?? null;
                longitude = exif?.longitude ?? null;
              }

              return {
                originalSrc: src,
                displaySrc,
                date,
                latitude,
                longitude,
              };
            } catch (photoErr) {
              console.error(`Error processing photo ${src}: `, photoErr);
              return {
                originalSrc: src,
                displaySrc: src, // 변환 실패 시 원본 src 사용
                date: null,
                latitude: null,
                longitude: null,
              };
            }
          })
        );

        // 날짜 오름차순 정렬 (날짜가 없는 경우 마지막에 배치)
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
        if (isMounted) setError("사진 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [group.galleryImages]);

  // 헤더가 축소된 순간 → 갤러리로 스크롤 이동
  useEffect(() => {
    if (isHeaderCollapsed && galleryRef.current) {
      // 스크롤 위치 조정(헤더 높이 등을 고려한 오프셋)
      const OFFSET = 80; // 헤더 높이+알파
      const rect = galleryRef.current.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top - OFFSET;

      window.scrollTo({
        top: absoluteTop,
        behavior: "smooth",
      });
    }
  }, [isHeaderCollapsed]);

  // 사진 클릭 → PhotoDetailPage로 이동
  const handleClickPhoto = (photo: GalleryPhoto) => {
    navigate("/photo-detail", {
      state: { photo },
    });
  };

  // Masonry 브레이크포인트 설정
  const breakpointColumnsObj = {
    default: 6,  // 기본: 6열
    1200: 5,     // 1200px 이하: 5열
    992: 4,      // 992px 이하: 4열
    768: 3,      // 768px 이하: 3열
    576: 2,      // 576px 이하: 2열
    0: 1         // 그 외: 1열
  };

  return (
    <Box ref={galleryRef} px={4} mb={4}>
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

      {!isLoading && !error && (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {photos.map((p, idx) => (
            <Box
              key={idx}
              overflow="hidden"
              borderRadius="md"
              cursor="pointer"
              mb={4} // Masonry에서는 개별 아이템의 아래 마진이 필요
              onClick={() => handleClickPhoto(p)}
            >
              <ChakraImage
                src={p.displaySrc}
                alt={`Gallery-${idx}`}
                objectFit="cover"
                width="100%"
                loading="lazy" // 지연 로딩 추가
              />
            </Box>
          ))}
        </Masonry>
      )}
    </Box>
  );
}

// Blob을 Data URL로 변환하는 유틸리티 함수
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
