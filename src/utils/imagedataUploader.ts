import axios from "axios";
import { PhotoMetadata } from "./getPhotoMetadata";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

interface ImageMetadata {
  image_id: string;
  trip_id: string;
  image_url: string;
  latitude: number | null;
  longitude: number | null;
  taken_at: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  street: string | null;
}

/**
 * Uploads metadata for a single image
 */
export const sendImageDataToBackend = async (
  tripId: string,
  metadata: PhotoMetadata
): Promise<ImageMetadata> => {
  try {
    const response = await axios.post<ImageMetadata>(
      `${API_BASE_URL}/images`,
      {
        trip_id: tripId,
        image_id: metadata.image_id,
        image_url: metadata.image_url,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        taken_at: metadata.taken_at,
        country: metadata.country,
        city: metadata.city,
        state: metadata.state,
        postal_code: metadata.postalCode,
        street: metadata.street
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return response.data;
  } catch (error:any) {
    console.error(`Error uploading metadata for image ${metadata.image_id}:`, error);
    if (axios.isAxiosError(error)) {
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

/**
 * Uploads metadata for multiple images
 */
export const sendImagesDataToBackend = async (
  tripId: string,
  metadataList: PhotoMetadata[]
): Promise<ImageMetadata[]> => {
  try {
    const uploadPromises = metadataList.map(metadata =>
      sendImageDataToBackend(tripId, metadata)
    );

    const results = await Promise.allSettled(uploadPromises);

    // Filter out failed uploads and log errors
    const successfulUploads = results
      .map((result, index) => {
        if (result.status === 'rejected') {
          console.error(
            `Failed to upload metadata for image ${metadataList[index].image_id}:`,
            result.reason
          );
          return null;
        }
        return result.value;
      })
      .filter((result): result is ImageMetadata => result !== null);

    if (successfulUploads.length === 0) {
      throw new Error('Failed to upload metadata for any images');
    }

    if (successfulUploads.length < metadataList.length) {
      console.warn(
        `Only ${successfulUploads.length} out of ${metadataList.length} image metadata were uploaded successfully`
      );
    }

    return successfulUploads;
  } catch (error) {
    console.error('Error uploading image metadata:', error);
    throw error;
  }
};

export default sendImagesDataToBackend;