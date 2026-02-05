import { useEffect, useRef } from "react";
import type { STTResultWithMemberName } from "../types";
import "./TranscriptionPanel.css";

interface TranscriptionPanelProps {
  results: STTResultWithMemberName[];
  mode: "transcription" | "translation";
  isOpen: boolean;
  onClose: () => void;
}

export function TranscriptionPanel({
  results,
  isOpen,
  onClose,
}: TranscriptionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [results]);

  if (!isOpen) return null;

  return (
    <div className="transcription-panel">
      <div className="transcription-header">
        <h3>Live Transcription</h3>
        <button className="close-button" onClick={onClose}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="transcription-content" ref={scrollRef}>
        {results.length === 0 ? (
          <div className="empty-state">
            <p>No transcriptions yet</p>
            <p className="empty-hint">
              Start speaking to see live transcriptions
            </p>
          </div>
        ) : (
          results.map((result, index) => (
            <div key={index} className="transcription-item">
              <div className="transcription-meta">
                <span className="transcription-time">
                  {result.timestamp.toLocaleTimeString()}
                </span>
                <span className="transcription-member">
                  {result.memberName}
                </span>
              </div>
              {result.mode === "transcription" ? (
                <p className="transcription-text">{result.text}</p>
              ) : (
                <div className="translation-container">
                  {result.texts?.map((t, i) => (
                    <div key={i} className="translation-item">
                      <span className="language-flag">
                        {t.language === "ja" ? "🇯🇵" : "🇺🇸"}
                      </span>
                      <p className="translation-text">{t.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
