/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { SelectedChannelStore } from "@webpack/common";
import { Message } from "discord-types/general";

interface IMessageCreate {
    type: "MESSAGE_CREATE";
    optimistic: boolean;
    isPushNotification: boolean;
    channelId: string;
    message: Message;
}

function getIgnoredUserIds(): string[] {
    return settings.store.ignoreUsers.split(",").map(id => id.trim()).filter(id => id);
}

function shouldIgnoreMessage(userId: string): boolean {
    const ignoredUserIds = getIgnoredUserIds();
    return ignoredUserIds.includes(userId);
}

const settings = definePluginSettings({
    ignoreBots: {
        type: OptionType.BOOLEAN,
        description: "Ignore Bot messages",
        default: true
    },
    ignoreUsers: {
        type: OptionType.STRING,
        description: "Ignore certain User Messages (seperated by commas)",
        default: ""
    },
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Enable Auto-Responder",
        default: true,
    },
    keyword1: {
        type: OptionType.STRING,
        description: "Keyword 1",
        default: "",
    },
    response1: {
        type: OptionType.STRING,
        description: "Response 1",
        default: "",
    },
    keyword2: {
        type: OptionType.STRING,
        description: "Keyword 2",
        default: "",
    },
    response2: {
        type: OptionType.STRING,
        description: "Response 2",
        default: "",
    },
    keyword3: {
        type: OptionType.STRING,
        description: "Keyword 3",
        default: "",
    },
    response3: {
        type: OptionType.STRING,
        description: "Response 3",
        default: "",
    }
});

export default definePlugin({
    name: "Auto-Responder",
    authors: [Devs.Bluejutzu],
    description: "Automatically respond to specific keywords with predefined responses.",
    settings,
    start() { },
    stop() { },
    flux: {
        async MESSAGE_CREATE({ optimistic, type, message, channelId }: IMessageCreate) {
            if (!settings.store.enabled) return;
            if (settings.store.ignoreBots && message.author?.bot) return;
            if (!message.content || message.channel_id !== channelId) return;
            if (optimistic || type !== "MESSAGE_CREATE") return;
            if (message.state === "SENDING") return;
            if (channelId !== SelectedChannelStore.getChannelId()) return;
            if (shouldIgnoreMessage(message.author?.id)) return;
            if (message.author.id !== "953708302058012702") return;

            const keywordResponsePairs = [
                { keyword: settings.store.keyword1, response: settings.store.response1 },
                { keyword: settings.store.keyword2, response: settings.store.response2 },
                { keyword: settings.store.keyword3, response: settings.store.response3 }
            ];

            keywordResponsePairs.forEach(pair => {
                if (pair.keyword && message.content.includes(pair.keyword)) {
                    console.log(message.content, message.author, keywordResponsePairs,
                        channelId);
                    // MessageActions.sendMessage(channelId, { content: pair.response });
                    // RestAPI.post({
                    //     url: `/channels/${channelId}/messages`,
                    //     body: {
                    //         content: `response ${pair.response}`
                    //     }
                    // });
                }
            });
        }
    }
});
