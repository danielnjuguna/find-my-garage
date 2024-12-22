export const extractFrames = async (
  videoFile: File,
  framesPerSecond: number = 1
): Promise<string[]> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const frames: string[] = [];

    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      const totalFrames = Math.floor(duration * framesPerSecond);
      let currentFrame = 0;

      video.currentTime = 0;

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0);
        frames.push(canvas.toDataURL("image/jpeg", 0.8));
        currentFrame++;

        if (currentFrame < totalFrames) {
          video.currentTime = currentFrame / framesPerSecond;
        } else {
          URL.revokeObjectURL(video.src);
          resolve(frames);
        }
      };
    };
  });
};