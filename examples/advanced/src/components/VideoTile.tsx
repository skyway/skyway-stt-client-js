import { useEffect, useRef } from "react";
import type { LocalVideoStream, RemoteVideoStream } from "@skyway-sdk/room";
import "./VideoTile.css";

interface VideoTileProps {
  stream?: LocalVideoStream | RemoteVideoStream;
  name: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export function VideoTile({
  stream,
  name,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      stream.attach(videoRef.current);
      videoRef.current
        .play()
        .catch((e) => console.warn("Video play failed:", e));
    }
  }, [stream]);

  return (
    <div className="video-tile">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`video-element ${isVideoOff ? "video-off" : ""}`}
      />
      {isVideoOff && (
        <div className="video-placeholder">
          <div className="avatar">{name.charAt(0).toUpperCase()}</div>
        </div>
      )}
      <div className="video-tile-footer">
        <span className="participant-name">{name}</span>
        {isMuted && (
          <svg
            className="muted-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </div>
    </div>
  );
}
