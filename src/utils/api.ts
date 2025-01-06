import axios from 'axios';
import { ImageMetadata, Trip } from '../types';


const api = axios.create({
    baseURL: 'https://your-backend-api.com/api', // 실제 백엔드 API URL로 변경하세요
    withCredentials: true, // 인증이 필요한 경우 설정
  });

export async function fetchTripMetadata(tripId: number) {
  const response = await axios.get(`/api/trips/${tripId}/metadata`);
  return response.data;
}

// 사용자 여행 목록 가져오기
export const fetchUserTrips = async (googleId: string): Promise<Trip[]> => {
    const response = await api.get(`/users/${googleId}/trips`);
    return response.data;
  };
  
  // 특정 여행의 사진 메타데이터 가져오기
  export const fetchTripPhotos = async (tripId: string): Promise<ImageMetadata[]> => {
    const response = await api.get(`/trips/${tripId}/photos`);
    return response.data;
  };
  
  // 사진에 일기 추가/수정
  export const saveDiaryEntry = async (imageId: string, diary: string): Promise<ImageMetadata> => {
    const response = await api.post(`/photos/${imageId}/diary`, { diary });
    return response.data;
  };

  export const fetchGoogleUser = async (googleId: string): Promise<GoogleUser> => {
    const response = await api.get<GoogleUser>(`/users/${googleId}`);
    return response.data;
  };
  
  export default api;