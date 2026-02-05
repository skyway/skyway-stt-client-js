import { useState, useCallback } from "react";
import {
  SkyWayContext,
  SkyWayRoom,
  type RoomPublication,
  type LocalAudioStream,
  type LocalVideoStream,
  type RemoteAudioStream,
  type RemoteVideoStream,
} from "@skyway-sdk/room";
import { SkyWaySTTClient } from "skyway-stt-client";
import type { ConferenceState } from "../types";
import { SERVER_HOST } from "../config";

export function useConference() {
  const [state, setState] = useState<ConferenceState>({
    isJoined: false,
    roomName: "",
    memberName: "",
    roomId: "",
    memberId: "",
    localMember: null,
    participants: new Map(),
    sttEnabled: false,
    sttMode: "transcription",
    sttResults: [],
  });

  const [room, setRoom] = useState<Awaited<
    ReturnType<typeof SkyWayRoom.Find>
  > | null>(null);
  const [token, setToken] = useState<string>("");

  const joinRoom = useCallback(
    async (
      roomName: string,
      memberName: string,
      localAudio: LocalAudioStream,
      localVideo: LocalVideoStream,
    ) => {
      try {
        // Create or get room token from server
        const response = await fetch(
          `${SERVER_HOST}/rooms/${roomName}/create`,
          {
            method: "POST",
          },
        );
        const { token } = await response.json();
        setToken(token);

        // Create SkyWay context and find room
        const context = await SkyWayContext.Create(token);
        const roomInstance = await SkyWayRoom.FindOrCreate(context, {
          name: roomName,
          type: "sfu",
        });

        // Join room
        const me = await roomInstance.join({ name: memberName });

        // Initialize STT client
        const sttClientInstance = new SkyWaySTTClient(context, me);
        sttClientInstance.onSTTResultReceived.add(({ result }) => {
          const member = roomInstance.members.find(
            (m) => m.id === result.memberId,
          );
          setState((prev) => ({
            ...prev,
            sttResults: [
              ...prev.sttResults,
              {
                ...result,
                memberName: member?.name || "Unknown",
              },
            ],
          }));
        });

        // Publish local streams
        await me.publish(localAudio, { type: "sfu" });
        await me.publish(localVideo, { type: "sfu" });

        // Subscribe to existing publications
        const subscribeAndAttach = async (publication: RoomPublication) => {
          if (publication.publisher.id === me.id) return;

          const { stream } = await me.subscribe(publication.id);

          setState((prev) => {
            const participants = new Map(prev.participants);
            const participantId = publication.publisher.id;
            const participant = participants.get(participantId) || {
              id: participantId,
              name: publication.publisher.name || "Unknown",
            };

            if (publication.contentType === "audio") {
              participant.audioPublication = publication;
              participant.audioStream = stream as RemoteAudioStream;
            } else if (publication.contentType === "video") {
              participant.videoPublication = publication;
              participant.videoStream = stream as RemoteVideoStream;
            }

            participants.set(participantId, participant);
            return { ...prev, participants };
          });
        };

        roomInstance.publications.forEach(subscribeAndAttach);
        roomInstance.onStreamPublished.add((e) =>
          subscribeAndAttach(e.publication),
        );

        // Handle stream unpublished
        roomInstance.onStreamUnpublished.add((e) => {
          setState((prev) => {
            const participants = new Map(prev.participants);
            const participantId = e.publication.publisher.id;
            const participant = participants.get(participantId);

            if (participant) {
              if (e.publication.contentType === "audio") {
                delete participant.audioPublication;
                delete participant.audioStream;
              } else if (e.publication.contentType === "video") {
                delete participant.videoPublication;
                delete participant.videoStream;
              }

              if (
                !participant.audioPublication &&
                !participant.videoPublication
              ) {
                participants.delete(participantId);
              } else {
                participants.set(participantId, participant);
              }
            }

            return { ...prev, participants };
          });
        });

        setRoom(roomInstance);
        setState((prev) => ({
          ...prev,
          isJoined: true,
          roomName,
          memberName,
          roomId: roomInstance.id,
          memberId: me.id,
          localMember: me,
        }));
      } catch (error) {
        console.error("Failed to join room:", error);
        throw error;
      }
    },
    [],
  );

  const leaveRoom = useCallback(async () => {
    if (state.localMember) {
      await state.localMember.leave();
    }
    if (room) {
      await room.dispose();
    }
    setRoom(null);
    setState({
      isJoined: false,
      roomName: "",
      memberName: "",
      roomId: "",
      memberId: "",
      localMember: null,
      participants: new Map(),
      sttEnabled: false,
      sttMode: "transcription",
      sttResults: [],
    });
  }, [state.localMember, room]);

  const startSTT = useCallback(async () => {
    if (!token || !state.roomName) return;

    try {
      const result = await fetch(
        `${SERVER_HOST}/rooms/${state.roomName}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sttMode: state.sttMode,
          }),
        },
      );

      if (result.status === 200) {
        setState((prev) => ({ ...prev, sttEnabled: true }));
        console.log("STT started");
      } else {
        console.error("Failed to start STT");
      }
    } catch (error) {
      console.error("Error starting STT:", error);
    }
  }, [token, state.roomName, state.sttMode]);

  const stopSTT = useCallback(async () => {
    if (!token || !state.roomName) return;

    try {
      const result = await fetch(`${SERVER_HOST}/rooms/${state.roomName}/end`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (result.status === 200) {
        setState((prev) => ({ ...prev, sttEnabled: false }));
        console.log("STT stopped");
      } else {
        console.error("Failed to stop STT");
      }
    } catch (error) {
      console.error("Error stopping STT:", error);
    }
  }, [token, state.roomName]);

  const toggleSTTMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sttMode:
        prev.sttMode === "transcription" ? "translation" : "transcription",
    }));
  }, []);

  return {
    state,
    joinRoom,
    leaveRoom,
    startSTT,
    stopSTT,
    toggleSTTMode,
  };
}
