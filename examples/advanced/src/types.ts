import type {
  LocalRoomMember,
  RoomPublication,
  RemoteAudioStream,
  RemoteVideoStream,
} from "@skyway-sdk/room";
import type { STTResult as SkyWaySTTResult } from "skyway-stt-client";

export interface Participant {
  id: string;
  name: string;
  audioPublication?: RoomPublication;
  videoPublication?: RoomPublication;
  audioStream?: RemoteAudioStream;
  videoStream?: RemoteVideoStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export type STTResult = SkyWaySTTResult;

export type STTResultWithMemberName = SkyWaySTTResult & {
  memberName: string;
};

export interface ConferenceState {
  isJoined: boolean;
  roomName: string;
  memberName: string;
  roomId: string;
  memberId: string;
  localMember: LocalRoomMember | null;
  participants: Map<string, Participant>;
  sttEnabled: boolean;
  sttMode: "transcription" | "translation";
  sttResults: STTResultWithMemberName[];
}
