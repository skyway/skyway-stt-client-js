import { useState, useEffect, useCallback } from "react";
import {
  SkyWayStreamFactory,
  type LocalAudioStream,
  type LocalVideoStream,
} from "@skyway-sdk/room";

export function useMediaDevices() {
  const [localStream, setLocalStream] = useState<{
    audio: LocalAudioStream;
    video: LocalVideoStream;
  } | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeMedia = useCallback(async () => {
    try {
      const { audio, video } =
        await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();

      // Disable audio and video by default
      if (audio.track) {
        audio.track.enabled = false;
      }
      if (video.track) {
        video.track.enabled = false;
      }

      setLocalStream({ audio, video });
      setError(null);
    } catch (err) {
      console.error("Failed to initialize media devices:", err);
      setError(
        err instanceof Error ? err.message : "Failed to access media devices",
      );
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStream?.audio) {
      const track = localStream.audio.track;
      if (track) {
        const newEnabled = !track.enabled;
        track.enabled = newEnabled;
        setIsAudioEnabled(newEnabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream?.video) {
      const track = localStream.video.track;
      if (track) {
        const newEnabled = !track.enabled;
        track.enabled = newEnabled;
        setIsVideoEnabled(newEnabled);
      }
    }
  }, [localStream]);

  useEffect(() => {
    initializeMedia();

    return () => {
      if (localStream?.audio) {
        localStream.audio.release?.();
      }
      if (localStream?.video) {
        localStream.video.release?.();
      }
    };
    // We want to run this only once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    error,
  };
}
