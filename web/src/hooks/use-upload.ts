import { useMutation } from "@tanstack/react-query";
import { uploadApi } from "@/lib/api";

export interface UploadResponse {
  url?: string;
  secure_url?: string;
  message?: string;
}

/**
 * Hook to upload an image or asset through the authenticated backend Cloudinary pipeline.
 */
export function useUpload() {
  return useMutation<UploadResponse, Error, File | FormData>({
    mutationFn: async (payload) => {
      let formData: FormData;
      if (payload instanceof FormData) {
        formData = payload;
      } else {
        formData = new FormData();
        formData.append("file", payload);
      }

      const response = await uploadApi.uploadFile<UploadResponse>(formData);
      return response.data;
    },
  });
}
