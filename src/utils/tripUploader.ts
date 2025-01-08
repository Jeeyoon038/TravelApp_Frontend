// src/utils/tripUploaders.ts
// Handles creating the trip record
import axios from "axios";

// Define an interface for trip data to ensure type safety
interface TripData {
  groupId: string;
  title: string;
  startDate: string;
  endDate: string;
  createdBy: string; // Google ID of the user creating the trip
}

const sendTripToBackend = async (tripData: { groupId: string; title: string; startDate: string; endDate: string; createdBy: string; }) => {
  try {
    const response = await axios.post(`${process.env.VITE_API_URL}/trips`, {
      group_id: tripData.groupId,
      title: tripData.title,
      start_date: tripData.startDate,
      end_date: tripData.endDate,
      created_by: tripData.createdBy,
    });

    return response.data;
  } catch (error: any) {
    console.error("Axios error sending trip data to backend:", error.response?.data || error.message);
    return null;
  }
};

export default sendTripToBackend;
