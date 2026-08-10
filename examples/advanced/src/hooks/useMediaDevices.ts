import { useState, useEffect, useRef } from "react";
import {
  SkyWayStreamFactory,
  type LocalAudioStream,
  type LocalVideoStream,
} from "@skyway-sdk/room";

type LocalMediaStream = {
  audio: LocalAudioStream;
  video: LocalVideoStream;
};

export function useMediaDevices() {
  const [localStream, setLocalStream] = useState<LocalMediaStream | null>(null);
  const localStreamRef = useRef<LocalMediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    void (async () => {
      try {
        const { audio, video } =
          await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();

        if (isDisposed) {
          audio.release?.();
          video.release?.();
          return;
        }

        const stream = { audio, video };
        localStreamRef.current = stream;
        setLocalStream(stream);
        setError(null);
      } catch (err: unknown) {
        console.error("Failed to initialize media devices:", err);
        if (isDisposed) {
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to access media devices",
        );
      }
    })();

    return () => {
      isDisposed = true;

      const stream = localStreamRef.current;
      stream?.audio.release?.();
      stream?.video.release?.();
      localStreamRef.current = null;
      setLocalStream(null);
    };
  }, []);

  return {
    localStream,
    error,
  };
}
