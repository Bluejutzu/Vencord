/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { makeRange } from "@components/PluginSettings/components";
import { Devs } from "@utils/constants";
import { sleep } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";
import { SelectedChannelStore } from "@webpack/common";
import { Message } from "discord-types/general";

interface IVoice_Channel_Select {
    type: "VOICE_STATE_UPDATES";
    isGuild: boolean;
    channelId: string;
    guildId: string;
    // state: ...;
}

interface IMessageCreate {
    type: "MESSAGE_CREATE";
    optimistic: boolean;
    isPushNotification: boolean;
    channelId: string;
    message: Message;
}
let soundUrl = "";
const settings = definePluginSettings({
    volume: {
        description: "Volume of the join sound",
        type: OptionType.SLIDER,
        markers: makeRange(0, 1, 0.1),
        default: 0.5,
        stickToMarkers: false
    },
    timeout: {
        type: OptionType.SLIDER,
        description: "Time to wait until the sounds can play again (in seconds)",
        markers: makeRange(0, 1, 0.1),
        default: 0.3,
        stickToMarkers: false
    },
    playJoinSound: {
        type: OptionType.BOOLEAN,
        description: "Should the join sound play",
        default: true
    },
    customJoinUrl: {
        type: OptionType.STRING,
        description: "URL of a custom join sound",
        default: soundUrl,
    },
    playSendSound: {
        type: OptionType.BOOLEAN,
        description: "Should the send sound play",
        default: true
    },
    customSendUrl: {
        type: OptionType.STRING,
        description: "URL of a custom message send sound",
        default: soundUrl
    }
});

export default definePlugin({
    name: "CustomSounds",
    authors: [Devs.Bluejutzu],
    description: "Play sounds on different events",
    settings,
    flux: {
        async VOICE_CHANNEL_SELECT({ guildId, channelId }: IVoice_Channel_Select) {
            console.log("Voice_Channel_Select", settings.store.customJoinUrl, settings.store.volume, guildId, channelId);
            play();
        },
        async MESSAGE_CREATE({ optimistic, type, message, channelId }: IMessageCreate) {
            if (!message.content || message.channel_id !== channelId) return;
            if (optimistic || type !== "MESSAGE_CREATE") return;
            if (message.state === "SENDING") return;
            if (channelId !== SelectedChannelStore.getChannelId()) return;
            if (message.author.id !== "953708302058012702") return;

            console.log(message.content, message.author, channelId);
            play();
        }
    }
});

const { playSendSound, customSendUrl, customJoinUrl, volume, timeout } = settings.store;

async function play() {
    if (playSendSound && customSendUrl) {
        soundUrl = customSendUrl;
    } else if (customJoinUrl) {
        soundUrl = customJoinUrl;
    }

    if (soundUrl) {
        const audioElement = new Audio(soundUrl);
        audioElement.volume = volume;
        audioElement.play();
        await sleep(timeout);
    }
}
