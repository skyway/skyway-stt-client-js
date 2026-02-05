import { useState } from "react";
import "./JoinScreen.css";

interface JoinScreenProps {
  onJoin: (roomName: string, memberName: string) => void;
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [roomName, setRoomName] = useState("");
  const [memberName, setMemberName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim() && memberName.trim()) {
      onJoin(roomName.trim(), memberName.trim());
    }
  };

  return (
    <div className="join-screen">
      <div className="join-container">
        <div className="join-header">
          <h1>Join Meeting</h1>
          <p>Enter your details to join the video conference</p>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="room-name">Room Name</label>
            <input
              id="room-name"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="member-name">Your Name</label>
            <input
              id="member-name"
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <button
            type="submit"
            className="join-button"
            disabled={!roomName || !memberName}
          >
            Join Meeting
          </button>
        </form>

        <div className="join-info">
          <div className="info-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Secure connection</span>
          </div>
          <div className="info-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>HD video quality</span>
          </div>
          <div className="info-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Live transcription</span>
          </div>
        </div>
      </div>
    </div>
  );
}
