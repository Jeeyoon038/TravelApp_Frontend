// src/types/libheif-js.d.ts

declare module 'libheif-js' {
    interface HeifMetadata {
      creation_time?: number;
      latitude?: number;
      longitude?: number;
      // Add other metadata properties as needed
    }
  
    interface HeifImage {
      metadata?: HeifMetadata;
    }
  
    export function decode(data: Uint8Array): Promise<HeifImage>;
  }