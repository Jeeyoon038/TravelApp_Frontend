// src/utils/getDiaryApi.ts

import axios from "axios";
import { Diary, Trip } from "../types/trip"; // Trip 인터페이스 추가

const apiUrl = import.meta.env.VITE_API_URL;

// 모든 다이어리 가져오기 (병렬 요청 사용 권장)
export const fetchAllDiaries = async (): Promise<Diary[]> => {
  try {
    const tripsResponse = await axios.get<Trip[]>(`${apiUrl}/trips`);
    const trips = tripsResponse.data;

    // 병렬로 모든 trip의 다이어리를 가져옵니다.
    const diaryPromises = trips.map((trip) =>
      axios.get<Diary[]>(`${apiUrl}/trips/${trip.trip_id}/diaries`)
    );

    const diariesResponses = await Promise.all(diaryPromises);
    const allDiaries: Diary[] = diariesResponses.flatMap((res) => res.data);

    return allDiaries;
  } catch (error) {
    console.error("Error fetching all diaries:", error);
    throw error;
  }
};

// 특정 여행의 다이어리 가져오기
export const fetchDiariesForTrip = async (tripId: number): Promise<Diary[]> => {
  try {
    const response = await axios.get<Diary[]>(`${apiUrl}/trips/${tripId}/diaries`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching diaries for trip_id ${tripId}:`, error);
    throw error;
  }
};

// 다이어리 생성
export const createDiary = async (
  tripId: number,
  date: string,
  content: string,
  imageUrl?: string
): Promise<Diary> => {
  try {
    const response = await axios.post<Diary>(`${apiUrl}/trips/${tripId}/diaries`, {
      date,         // trip_id 제거
      content,
      image_url: imageUrl,  // image_url 포함
    });
    return response.data;
  } catch (error) {
    console.error(`Error creating diary for trip_id ${tripId}:`, error);
    throw error;
  }
};

// 다이어리 수정
export const updateDiary = async (
  tripId: number,
  diaryId: string,
  updateData: Partial<Diary>
): Promise<Diary> => {
  try {
    const response = await axios.put<Diary>(`${apiUrl}/trips/${tripId}/diaries/${diaryId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating diary ${diaryId} for trip_id ${tripId}:`, error);
    throw error;
  }
};
