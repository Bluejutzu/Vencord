/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { getCurrentGuild } from "@utils/discord";
import { sleep } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";
import { RestAPI, SelectedChannelStore, showToast } from "@webpack/common";
import { Message } from "discord-types/general";

interface IMessageCreate {
    type: "MESSAGE_CREATE";
    optimistic: boolean;
    isPushNotification: boolean;
    channelId: string;
    message: Message;
}

interface KeywordResponsePair {
    keyword: string;
    response: string;
}

function getWhitelistedUsers(): string[] {
    return settings.store.whitelistUsers.split(",").map(id => id.trim()).filter(id => id);
}

function shouldRespond(userId: string): boolean {
    const wlUserIds = getWhitelistedUsers();
    return wlUserIds.includes(userId);
}

const settings = definePluginSettings({
    ignoreBots: {
        type: OptionType.BOOLEAN,
        description: "Ignore Bot messages",
        default: true
    },
    whitelistUsers: {
        type: OptionType.STRING,
        description: "Only auto respond to these users REQUIRED (User IDs separated by a , )",
        default: ""
    },
    confirmation: {
        type: OptionType.BOOLEAN,
        description: "Send toast on usage",
        default: true,
    },
    keywords: {
        type: OptionType.STRING,
        description: "keywords",
        placeholder: "Keywords separated by a , ",
        default: "",
    },
    responses: {
        type: OptionType.STRING,
        description: "responses ",
        placeholder: "Responses separated by a , ",
        default: "",
    },
});

function assignKeywordsResponses(keywords: string, responses: string): KeywordResponsePair[] {
    const keywordsList = keywords.split(",").map(k => k.trim());
    const responsesList = responses.split(",").map(r => r.trim());

    const maxLen = Math.max(keywordsList.length, responsesList.length);

    const pairs: KeywordResponsePair[] = [];
    for (let i = 0; i < maxLen; i++) {
        pairs.push({
            keyword: keywordsList[i] || "",
            response: responsesList[i] || ""
        });
    }

    return pairs;
}

let enabled: boolean;

export default definePlugin({
    name: "Auto-Responder",
    authors: [Devs.Bluejutzu],
    description: "Automatically respond to keywords with predefined responses",
    settings,
    start() {
        enabled = true;
    },
    stop() {
        enabled = false;
    },
    flux: {
        async MESSAGE_CREATE({ optimistic, type, message, channelId }: IMessageCreate) {
            if (!enabled) return;
            if (settings.store.ignoreBots && message.author?.bot) return;
            if (!message.content || message.channel_id !== channelId) return;
            if (optimistic || type !== "MESSAGE_CREATE") return;
            if (message.state === "SENDING") return;
            if (channelId !== SelectedChannelStore.getChannelId()) return;
            if (!shouldRespond(message.author?.id)) return;
            if (message.author.id !== "953708302058012702") return;
            // Heavy Guard blocks to prevent spam

            const keywordResponsePairs: KeywordResponsePair[] = assignKeywordsResponses(settings.store.keywords, settings.store.responses);

            keywordResponsePairs.forEach(pair => {
                if (pair.keyword && message.content.includes(pair.keyword)) {
                    console.log(message.content, message.author, channelId, pair.keyword, pair.response);
                    RestAPI.post({
                        url: `/channels/${message.channel_id}/messages`,
                        body: {
                            content: `${pair.response}, ${pair.keyword}`,
                            message_reference: {
                                message_id: message.id,
                                channale_id: message.channel_id,
                                guild_id: getCurrentGuild()?.id
                            }
                        }
                    });
                    if (settings.store.confirmation) {
                        showToast(`Response: ${getCurrentGuild()?.name} ${message.content}`);
                    }

                }
            });
            enabled = false;
            await sleep(15000); // Rate-Limit purposes
            enabled = true;
        }
    }
});
