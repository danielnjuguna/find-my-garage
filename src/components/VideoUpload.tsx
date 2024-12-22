import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file && file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        setPreview(url);
        onVideoSelect(file);
        toast.success("Video uploaded successfully");
      } else {
        toast.error("Please upload a valid video file");
      }
    },
    [onVideoSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [],
    },
    multiple: false,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-12 transition-all duration-300 ease-in-out ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          {preview ? (
            <>
              <video
                src={preview}
                className="w-full max-h-[300px] rounded-lg object-cover"
                controls
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">
                  Drop your video here
                </p>
                <p className="text-sm text-gray-500">
                  or click to select a video file
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;