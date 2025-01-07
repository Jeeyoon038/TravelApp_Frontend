declare module 'piexifjs' {
    export function load(data: any): any;

  export function dump(completeExif: { "0th": any; Exif: any; GPS: any; Interop: {}; "1st": {}; thumbnail: null; }) {
    throw new Error("Function not implemented.");
  }

  export function insert(exifBytes: void, binaryString: string) {
    throw new Error("Function not implemented.");
  }
  }
  