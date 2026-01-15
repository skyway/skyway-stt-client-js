import {
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory,
} from "@skyway-sdk/room";
import { SkyWaySTTClient } from "skyway-stt-client";

const SERVER_HOST = "http://localhost:9090";

function createSTTMessage(result, member, mode) {
  const messageContainer = document.createElement("div");
  messageContainer.className = `stt-message`;

  const header = document.createElement("div");
  header.className = "stt-message-header";

  const timestamp = document.createElement("span");
  timestamp.className = "stt-timestamp";
  timestamp.textContent = new Date(result.timestamp).toLocaleTimeString();

  const memberName = document.createElement("span");
  memberName.className = "stt-member";
  memberName.textContent = member?.name || "Unknown";

  header.appendChild(timestamp);
  header.appendChild(memberName);

  // テキスト部分
  if (mode === "transcription") {
    const textElement = document.createElement("p");
    textElement.className = "stt-text";
    textElement.textContent = result.text;

    messageContainer.appendChild(header);
    messageContainer.appendChild(textElement);
  } else {
    const translationContainer = document.createElement("div");
    translationContainer.className = "stt-translation-container";

    const textJa = result.texts.find((t) => t.language === "ja")?.text;
    if (textJa) {
      const jaContainer = document.createElement("div");
      jaContainer.className = "stt-language-text";

      const jaFlag = document.createElement("span");
      jaFlag.className = "stt-language-flag";
      jaFlag.textContent = "🇯🇵";

      const jaContent = document.createElement("div");
      jaContent.className = "stt-language-content";
      jaContent.textContent = textJa;

      jaContainer.appendChild(jaFlag);
      jaContainer.appendChild(jaContent);
      translationContainer.appendChild(jaContainer);
    }

    const textEn = result.texts.find((t) => t.language === "en")?.text;
    if (textEn) {
      const enContainer = document.createElement("div");
      enContainer.className = "stt-language-text";

      const enFlag = document.createElement("span");
      enFlag.className = "stt-language-flag";
      enFlag.textContent = "🇺🇸";

      const enContent = document.createElement("div");
      enContent.className = "stt-language-content";
      enContent.textContent = textEn;

      enContainer.appendChild(enFlag);
      enContainer.appendChild(enContent);
      translationContainer.appendChild(enContainer);
    }

    messageContainer.appendChild(header);
    messageContainer.appendChild(translationContainer);
  }

  return messageContainer;
}

void (async () => {
  const localVideo = document.getElementById("local-video");
  const buttonArea = document.getElementById("button-area");
  const remoteMediaArea = document.getElementById("remote-media-area");
  const roomNameInput = document.getElementById("room-name");
  const memberNameInput = document.getElementById("member-name");
  const roomId = document.getElementById("room-id");
  const memberId = document.getElementById("member-id");
  const sttStatus = document.getElementById("stt-status");
  const joinButton = document.getElementById("join");
  const leaveButton = document.getElementById("leave");
  const startSTTButton = document.getElementById("start");
  const endSTTButton = document.getElementById("end");
  const sttMode = document.getElementById("stt-mode");
  const sttResults = document.getElementById("stt-results");

  const { audio, video } =
    await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  video.attach(localVideo);
  await localVideo.play();

  joinButton.onclick = async () => {
    const roomName = roomNameInput.value;
    const memberName = memberNameInput.value;
    console.log(`Joining room: ${roomName} as ${memberName}`);
    if (roomName === "" || memberName === "") return;

    const response = await fetch(`${SERVER_HOST}/rooms/${roomName}/create`, {
      method: "POST",
    });
    const { token } = await response.json();
    const context = await SkyWayContext.Create(token);
    const room = await SkyWayRoom.Find(context, {
      name: roomName,
    });
    roomId.textContent = room.id;

    const me = await room.join({ name: memberName });

    const sttClient = new SkyWaySTTClient(context, me);
    sttClient.onSTTResultReceived.add(({ result }) => {
      const member = room.members.find((m) => m.id === result.memberId);
      const mode = sttMode.value;

      const messageElement = createSTTMessage(result, member, mode);
      sttResults.appendChild(messageElement);

      sttResults.scrollTop = sttResults.scrollHeight;
    });

    memberId.textContent = me.id;

    await me.publish(audio, { type: "sfu" });
    await me.publish(video, { type: "sfu" });

    const subscribeAndAttach = async (publication) => {
      if (publication.publisher.id === me.id) return;

      const { stream } = await me.subscribe(publication.id);

      let newMedia;
      switch (stream.track.kind) {
        case "video":
          newMedia = document.createElement("video");
          newMedia.playsInline = true;
          newMedia.autoplay = true;
          break;
        case "audio":
          newMedia = document.createElement("audio");
          newMedia.controls = true;
          newMedia.autoplay = true;
          break;
        default:
          return;
      }
      newMedia.id = `media-${publication.id}`;
      stream.attach(newMedia);
      remoteMediaArea.appendChild(newMedia);
    };

    room.publications.forEach(subscribeAndAttach);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));

    startSTTButton.onclick = async () => {
      const result = await fetch(`${SERVER_HOST}/rooms/${roomName}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sttMode: sttMode.value,
        }),
      });
      if (result.status === 200) {
        sttStatus.textContent = "ON";
        console.log("STT started");
      } else {
        console.error("Failed to Start STT");
      }
    };

    endSTTButton.onclick = async () => {
      const result = await fetch(`${SERVER_HOST}/rooms/${roomName}/end`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (result.status === 200) {
        sttStatus.textContent = "OFF";
        console.log("STT ended");
      } else {
        console.error("Failed to End STT");
      }
    };

    leaveButton.onclick = async () => {
      await me.leave();
      await room.dispose();

      memberId.textContent = "";
      buttonArea.replaceChildren();
      remoteMediaArea.replaceChildren();
    };

    room.onStreamUnpublished.add((e) => {
      document.getElementById(`subscribe-button-${e.publication.id}`)?.remove();
      document.getElementById(`media-${e.publication.id}`)?.remove();
    });
  };
})();
