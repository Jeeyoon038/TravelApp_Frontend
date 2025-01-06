import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

interface TripData {
  title: string;
  start_date: Date;
  end_date: Date;
  image_urls: string[];
  member_google_ids: string[];
}

interface TripResponse {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  image_urls: string[];
  member_google_ids: string[];
  created_at: string;
}

/**
 * Sends trip data to the backend
 */
export const sendTripToBackend = async (tripData: TripData): Promise<TripResponse> => {
  try {
    const response = await axios.post<TripResponse>(
      `${API_BASE_URL}/trips`,
      {
        title: tripData.title,
        start_date: tripData.start_date.toISOString(),
        end_date: tripData.end_date.toISOString(),
        image_urls: tripData.image_urls,
        member_google_ids: tripData.member_google_ids
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.data || !response.data.id) {
      throw new Error('Failed to create trip: Invalid response from server');
    }

    console.log('Trip created successfully:', response.data);
    return response.data;

  } catch (error:any) {
    console.error('Error creating trip:', error);
    if (isAxiosError(error)) {
      if (error.response) {
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw new Error(`Error setting up request: ${error.message}`);
      }
    }
    throw error;
  }
};

export default sendTripToBackend;