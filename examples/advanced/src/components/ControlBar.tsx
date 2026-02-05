import { Tooltip } from "./Tooltip";
import "./ControlBar.css";

interface ControlBarProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  sttEnabled: boolean;
  onToggleSTT: () => void;
  sttMode: "transcription" | "translation";
  onToggleSTTMode: () => void;
}

export function ControlBar({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  sttEnabled,
  onToggleSTT,
  sttMode,
  onToggleSTTMode,
}: ControlBarProps) {
  return (
    <div className="control-bar">
      <div className="control-group">
        <Tooltip
          text={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          <button
            className={`control-button ${!isAudioEnabled ? "active" : ""}`}
            onClick={onToggleAudio}
          >
            {isAudioEnabled ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
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
          </button>
        </Tooltip>

        <Tooltip text={isVideoEnabled ? "Turn off camera" : "Turn on camera"}>
          <button
            className={`control-button ${!isVideoEnabled ? "active" : ""}`}
            onClick={onToggleVideo}
          >
            {isVideoEnabled ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="2" y="5" width="14" height="14" rx="2" ry="2" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        </Tooltip>

        <Tooltip
          text={
            sttEnabled
              ? `Stop live ${sttMode}`
              : `Start live ${sttMode}`
          }
        >
          <button
            className={`control-button stt-button ${
              sttEnabled ? "active" : ""
            }`}
            onClick={onToggleSTT}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="18" rx="2" ry="2" />
              <line x1="7" y1="9" x2="17" y2="9" />
              <line x1="7" y1="13" x2="17" y2="13" />
              <line x1="7" y1="17" x2="13" y2="17" />
            </svg>
          </button>
        </Tooltip>

        <div className={`mode-switcher ${sttEnabled ? "disabled" : ""}`}>
          <button
            className={`mode-option ${sttMode === "transcription" ? "active" : ""}`}
            onClick={() => !sttEnabled && onToggleSTTMode()}
            disabled={sttEnabled}
          >
            <span>📝</span>
            <span>Transcription</span>
          </button>
          <button
            className={`mode-option ${sttMode === "translation" ? "active" : ""}`}
            onClick={() => !sttEnabled && onToggleSTTMode()}
            disabled={sttEnabled}
          >
            <span>🌐</span>
            <span>Translation</span>
          </button>
        </div>
      </div>

      <Tooltip text="Leave meeting">
        <button className="control-button leave-button" onClick={onLeave}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </Tooltip>
    </div>
  );
}
