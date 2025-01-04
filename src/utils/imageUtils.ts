import EXIF from 'exif-js';

interface Coordinates {
  lat: number;
  lng: number;
}

type ExifImage = HTMLImageElement | File | Blob;

export function getImageLocation(imageFile: ExifImage): Promise<Coordinates | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      try {
        const data = e.target.result;

        // Capture the context of 'this' to pass into EXIF.getData
        EXIF.getData(data, function () {
          const exifData = EXIF.getAllTags(this as any); // 'this' is now typed correctly
          console.log("EXIF Data:", exifData); // Log to see the EXIF data

          if (exifData?.GPSLatitude && exifData?.GPSLongitude) {
            const lat = exifData.GPSLatitude[0] + exifData.GPSLatitude[1] / 60 + exifData.GPSLatitude[2] / 3600;
            const lng = exifData.GPSLongitude[0] + exifData.GPSLongitude[1] / 60 + exifData.GPSLongitude[2] / 3600;
            
            const latRef = exifData.GPSLatitudeRef || 'N';
            const lngRef = exifData.GPSLongitudeRef || 'E';
            
            resolve({
              lat: latRef === 'N' ? lat : -lat,
              lng: lngRef === 'E' ? lng : -lng
            });
          } else {
            resolve(null);  // No GPS data found
          }
        });
      } catch (error) {
        console.error('Error reading EXIF data:', error);
        resolve(null);  // Handle the error gracefully
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };

    if (imageFile instanceof Blob || imageFile instanceof File) {
      reader.readAsDataURL(imageFile);  // Read the image as Data URL for EXIF.js
    } else {
      reject(new Error('Invalid image file type'));
    }
  });
}
