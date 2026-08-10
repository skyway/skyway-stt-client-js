import {
  SkyWayContext,
  SkyWayRoom,
  SkyWayStreamFactory,
} from "@skyway-sdk/room";
import { SkyWaySTTClient } from "skyway-stt-client";

const SERVER_HOST = "http://localhost:9090";

// 翻訳モードで指定可能な言語については https://skyway.ntt.com/ja/docs/user-guide/stt/support-languages を参照してください。
const SUPPORTED_LOCALES = [
  { locale: "ja-JP", flag: "🇯🇵" },
  { locale: "en-US", flag: "🇺🇸" },
  { locale: "zh-CN", flag: "🇨🇳" },
  { locale: "ko-KR", flag: "🇰🇷" },
  { locale: "th-TH", flag: "🇹🇭" },
  { locale: "ru-RU", flag: "🇷🇺" },
  { locale: "vi-VN", flag: "🇻🇳" },
  { locale: "fil-PH", flag: "🇵🇭" },
  { locale: "pt-BR", flag: "🇧🇷" },
  { locale: "es-ES", flag: "🇪🇸" },
  { locale: "fr-FR", flag: "🇫🇷" },
  { locale: "ne-NP", flag: "🇳🇵" },
  { locale: "hi-IN", flag: "🇮🇳" },
  { locale: "id-ID", flag: "🇮🇩" },
];

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

    for (const { locale, text } of result.texts) {
      if (!text) continue;

      const localeContainer = document.createElement("div");
      localeContainer.className = "stt-language-text";

      const localeFlag = document.createElement("span");
      localeFlag.className = "stt-language-flag";
      localeFlag.textContent =
        SUPPORTED_LOCALES.find((l) => l.locale === locale)?.flag ?? "🌐";

      const localeContent = document.createElement("div");
      localeContent.className = "stt-language-content";
      localeContent.textContent = text;

      localeContainer.appendChild(localeFlag);
      localeContainer.appendChild(localeContent);
      translationContainer.appendChild(localeContainer);
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
  const localeArea = document.getElementById("locale-area");
  const sttLocale1 = document.getElementById("stt-locale-1");
  const sttLocale2 = document.getElementById("stt-locale-2");
  const sttResults = document.getElementById("stt-results");

  // 翻訳モードの言語選択肢を作成する
  for (const select of [sttLocale1, sttLocale2]) {
    for (const { locale, flag } of SUPPORTED_LOCALES) {
      const option = document.createElement("option");
      option.value = locale;
      option.textContent = `${flag} ${locale}`;
      select.appendChild(option);
    }
  }
  sttLocale1.value = "ja-JP";
  sttLocale2.value = "en-US";

  // 翻訳モードの場合のみ言語選択を表示する
  sttMode.onchange = () => {
    localeArea.hidden = sttMode.value !== "translation";
  };

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
      // 翻訳モードの場合は異なる2つの言語を指定する
      let locales;
      if (sttMode.value === "translation") {
        if (sttLocale1.value === sttLocale2.value) {
          alert("Please select two different locales for translation mode.");
          return;
        }
        locales = [sttLocale1.value, sttLocale2.value];
      }

      const result = await fetch(`${SERVER_HOST}/rooms/${roomName}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sttMode: sttMode.value,
          locales,
        }),
      });
      if (result.status === 200) {
        sttStatus.textContent = "ON";
        // 文字起こし中はモードと言語を変更できないようにする
        sttMode.disabled = true;
        sttLocale1.disabled = true;
        sttLocale2.disabled = true;
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
        sttMode.disabled = false;
        sttLocale1.disabled = false;
        sttLocale2.disabled = false;
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
