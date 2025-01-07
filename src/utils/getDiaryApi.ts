// src/utils/getDiaryApi.ts

import axios from "axios";
import { Diary } from "../types/trip.ts";

const apiUrl = import.meta.env.VITE_API_URL;

// 모든 일기 가져오기
export async function fetchAllDiaries(): Promise<Diary[]> {
  try {
    const response = await axios.get(`${apiUrl}/diaries`);
    return response.data;
  } catch (error) {
    console.error("fetchAllDiaries 오류: ", error);
    throw error;
  }
}

// 일기 생성
export async function createDiary(tripId: string, date: string, content: string): Promise<Diary> {
  try {
    const response = await axios.post(`${apiUrl}/trips/${tripId}/diaries`, {
      trip_id: tripId,
      date,
      content,
    });
    return response.data;
  } catch (error) {
    console.error("createDiary 오류: ", error);
    throw error;
  }
}

// 일기 수정
export async function updateDiary(tripId: string, diaryId: string, content: string): Promise<Diary> {
  try {
    const response = await axios.put(`${apiUrl}/trips/${tripId}/diaries/${diaryId}`, {
      content,
    });
    return response.data;
  } catch (error) {
    console.error("updateDiary 오류: ", error);
    throw error;
  }
}
