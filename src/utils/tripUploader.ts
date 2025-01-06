import axios, { AxiosError } from "axios";

const API_BASE_URL = "http://localhost:3000";

interface TripData {
  title: string;
  start_date: Date;
  end_date: Date;
  image_urls: string[];
  member_google_ids: string[];
}

interface TripResponse {
  _id: string;
  trip_id: string;  // Added this field
  title: string;
  start_date: string;
  end_date: string;
  image_urls: string[];
  member_google_ids: string[];
  created_at: string;
}

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

    if (!response.data || !response.data.trip_id) {
      throw new Error('Failed to create trip: Invalid response from server');
    }

    console.log('Trip created successfully:', response.data);
    return response.data;

  } catch (error) {
    console.error('Error creating trip:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new Error(`Server error: ${axiosError.response.status} - ${axiosError.response.data?.message || axiosError.message}`);
      } else if (axiosError.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw new Error(`Error setting up request: ${axiosError.message}`);
      }
    }
    throw error;
  }
};

export default sendTripToBackend;