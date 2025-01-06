// src/mockData.ts
import { GoogleUser, ImageMetadata, Trip } from "./types";

// 모의 GoogleUser 데이터
export const mockGoogleUser: GoogleUser = {
  googleId: "googleId_1",
  email: "user1@example.com",
  displayName: "사용자1",
  profilePicture: "https://source.unsplash.com/random/100x100/?face1",
};

// 두 개의 여행 모의 데이터
export const mockTrips: Trip[] = [
  {
    trip_id: "trip_1",
    title: "제주도 여행",
    start_date: "2023-04-01T00:00:00.000Z",
    end_date: "2023-04-07T00:00:00.000Z",
    image_urls: ["image_1", "image_2", "image_3"],
    member_google_ids: ["googleId_1", "googleId_2"],
  },
  {
    trip_id: "trip_2",
    title: "부산 해운대 여행",
    start_date: "2023-08-15T00:00:00.000Z",
    end_date: "2023-08-20T00:00:00.000Z",
    image_urls: ["image_4", "image_5", "image_6"],
    member_google_ids: ["googleId_1", "googleId_3"],
  },
];

// 각 여행에 속한 이미지 메타데이터 모의 데이터
export const mockImageMetadata: ImageMetadata[] = [
  // 제주도 여행 이미지
  {
    image_id: "image_1",
    latitude: 33.450701,
    longitude: 126.570667,
    taken_at: "2023-04-02T10:30:00.000Z",
    image_url: "https://source.unsplash.com/random/800x600/?jeju1",
    displaySrc: "https://source.unsplash.com/random/800x600/?jeju1",
    country: "South Korea",
    city: "Jeju",
    state: null,
    postalCode: null,
    street: null,
  },
  {
    image_id: "image_2",
    latitude: 33.481483,
    longitude: 126.529893,
    taken_at: "2023-04-04T14:45:00.000Z",
    image_url: "https://source.unsplash.com/random/800x600/?jeju2",
    displaySrc: "https://source.unsplash.com/random/800x600/?jeju2",
    country: "South Korea",
    city: "Jeju",
    state: null,
    postalCode: null,
    street: null,
  },
  {
    image_id: "image_3",
    latitude: 33.510047,
    longitude: 126.491341,
    taken_at: "2023-04-06T09:15:00.000Z",
    image_url: "https://source.unsplash.com/random/800x600/?jeju3",
    displaySrc: "https://source.unsplash.com/random/800x600/?jeju3",
    country: "South Korea",
    city: "Jeju",
    state: null,
    postalCode: null,
    street: null,
  },
  // 부산 해운대 여행 이미지
  {
    image_id: "image_4",
    latitude: 35.1587,
    longitude: 129.1604,
    taken_at: "2023-08-16T11:00:00.000Z",
    image_url: "https://source.unsplash.com/random/800x600/?busan1",
    displaySrc: "https://source.unsplash.com/random/800x600/?busan1",
    country: "South Korea",
    city: "Busan",
    state: null,
    postalCode: null,
    street: null,
  },
  {
    image_id: "image_5",
    latitude: 35.1532,
    longitude: 129.1177,
    taken_at: "2023-08-18T16:20:00.000Z",
    image_url: "https://source.unsplash.com/random/800x600/?busan2",
    displaySrc: "https://source.unsplash.com/random/800x600/?busan2",
    country: "South Korea",
    city: "Busan",
    state: null,
    postalCode: null,
    street: null,
  },
  {
    image_id: "image_6",
    latitude: 35.1580,
    longitude: 129.1640,
    taken_at: "2023-08-19T08:45:00.000Z",
    image_url: "https://source.unsplash.com/random/800x600/?busan3",
    displaySrc: "https://source.unsplash.com/random/800x600/?busan3",
    country: "South Korea",
    city: "Busan",
    state: null,
    postalCode: null,
    street: null,
  },
];
