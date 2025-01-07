// src/utils/imageUploader.ts
import axios from "axios";

const sendTripToBackend = async (tripData: { groupId: string;  title: string; startDate: string; endDate: string }) => {
  try {
    // POST 요청으로 trip 정보를 백엔드로 보냄

    const apiUrl = import.meta.env.VITE_API_URL;
    const response = await axios.post(`${apiUrl}/api/trips`, {
      group_id: tripData.groupId,
      title: tripData.title,
      start_date: tripData.startDate,
      end_date: tripData.endDate,
    });

    console.log("Trip created successfully:", response.data);
    return response.data;  // 백엔드에서 반환하는 응답 처리
  } catch (error) {
    console.error("Error sending trip data to backend:", error);
    return null;  // 에러 발생 시 null 반환
  }
};

export default sendTripToBackend;
