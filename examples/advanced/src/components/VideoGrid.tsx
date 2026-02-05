import { useEffect, useRef } from "react";
import type { LocalVideoStream, LocalAudioStream } from "@skyway-sdk/room";
import { VideoTile } from "./VideoTile";
import type { Participant } from "../types";
import "./VideoGrid.css";

interface VideoGridProps {
  localStream: { audio: LocalAudioStream; video: LocalVideoStream } | null;
  localName: string;
  participants: Map<string, Participant>;
  isLocalAudioEnabled: boolean;
  isLocalVideoEnabled: boolean;
}

// Audio component for remote participants
function RemoteAudio({ participant }: { participant: Participant }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && participant.audioStream) {
      participant.audioStream.attach(audioRef.current);
      audioRef.current
        .play()
        .catch((e) => console.warn("Audio play failed:", e));
    }
  }, [participant.audioStream]);

  if (!participant.audioStream) return null;

  return <audio ref={audioRef} autoPlay />;
}

export function VideoGrid({
  localStream,
  localName,
  participants,
  isLocalAudioEnabled,
  isLocalVideoEnabled,
}: VideoGridProps) {
  const participantArray = Array.from(participants.values());
  const totalParticipants = participantArray.length + 1; // +1 for local

  // Calculate grid layout
  const getGridClass = () => {
    if (totalParticipants === 1) return "grid-1";
    if (totalParticipants === 2) return "grid-2";
    if (totalParticipants <= 4) return "grid-4";
    if (totalParticipants <= 6) return "grid-6";
    return "grid-9";
  };

  return (
    <>
      <div className={`video-grid ${getGridClass()}`}>
        {/* Local video */}
        <VideoTile
          stream={localStream?.video}
          name={`${localName} (You)`}
          isLocal={true}
          isMuted={!isLocalAudioEnabled}
          isVideoOff={!isLocalVideoEnabled}
        />

        {/* Remote participants */}
        {participantArray.map((participant) => (
          <VideoTile
            key={participant.id}
            stream={participant.videoStream}
            name={participant.name}
            isMuted={participant.isMuted}
            isVideoOff={participant.isVideoOff}
          />
        ))}
      </div>

      {/* Remote audio streams */}
      {participantArray.map((participant) => (
        <RemoteAudio
          key={`audio-${participant.id}`}
          participant={participant}
        />
      ))}
    </>
  );
}
