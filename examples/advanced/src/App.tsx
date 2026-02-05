import { useState } from "react";
import { JoinScreen } from "./components/JoinScreen";
import { VideoGrid } from "./components/VideoGrid";
import { ControlBar } from "./components/ControlBar";
import { TranscriptionPanel } from "./components/TranscriptionPanel";
import { Tooltip } from "./components/Tooltip";
import { useMediaDevices } from "./hooks/useMediaDevices";
import { useConference } from "./hooks/useConference";
import "./App.css";

function App() {
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);

  const {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    error: mediaError,
  } = useMediaDevices();

  const { state, joinRoom, leaveRoom, startSTT, stopSTT, toggleSTTMode } =
    useConference();

  const handleJoin = async (roomName: string, memberName: string) => {
    if (!localStream) {
      alert(
        "Failed to access media devices. Please check your camera and microphone permissions.",
      );
      return;
    }

    try {
      await joinRoom(
        roomName,
        memberName,
        localStream.audio,
        localStream.video,
      );
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Failed to join room. Please try again.");
    }
  };

  const handleToggleSTT = async () => {
    if (state.sttEnabled) {
      await stopSTT();
    } else {
      await startSTT();
      setTranscriptionOpen(true);
    }
  };

  if (mediaError) {
    return (
      <div className="error-screen">
        <div className="error-container">
          <h1>Media Error</h1>
          <p>{mediaError}</p>
          <p>Please check your camera and microphone permissions.</p>
        </div>
      </div>
    );
  }

  if (!state.isJoined) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return (
    <div className="app">
      <div className="meeting-header">
        <div className="header-info">
          <h2>{state.roomName}</h2>
          <div className="header-meta">
            <span>Room ID: {state.roomId}</span>
            <span>•</span>
            <span>{state.participants.size + 1} participant(s)</span>
          </div>
        </div>
        <Tooltip
          text={
            transcriptionOpen
              ? "Close transcription panel"
              : "Open transcription panel"
          }
          position="left"
        >
          <button
            className="transcription-toggle"
            onClick={() => setTranscriptionOpen(!transcriptionOpen)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </Tooltip>
      </div>

      <div className={`main-content ${transcriptionOpen ? "with-panel" : ""}`}>
        <VideoGrid
          localStream={localStream}
          localName={state.memberName}
          participants={state.participants}
          isLocalAudioEnabled={isAudioEnabled}
          isLocalVideoEnabled={isVideoEnabled}
        />
      </div>

      <ControlBar
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={leaveRoom}
        sttEnabled={state.sttEnabled}
        onToggleSTT={handleToggleSTT}
        sttMode={state.sttMode}
        onToggleSTTMode={toggleSTTMode}
      />

      <TranscriptionPanel
        results={state.sttResults}
        mode={state.sttMode}
        isOpen={transcriptionOpen}
        onClose={() => setTranscriptionOpen(false)}
      />
    </div>
  );
}

export default App;
