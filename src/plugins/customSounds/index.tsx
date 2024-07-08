/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { DataStore } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Constants, RestAPI } from "@webpack/common";

import { SoundOverrideComponent } from "./components/SoundOverrideComponent";
import { makeEmptyOverride, SoundOverride, soundTypes } from "./types";

const OVERRIDES_KEY = "CustomSounds_overrides";
let overrides: Record<string, SoundOverride> = soundTypes.reduce((result, sound) => ({ ...result, [sound.id]: makeEmptyOverride() }), {});
function lol() {
    RestAPI.post({
        url: Constants.Endpoints.CALL
    });
}
const settings = definePluginSettings({
    overrides: {
        type: OptionType.COMPONENT,
        description: "",
        component: () =>
            <>
                {soundTypes.map(type =>
                    <SoundOverrideComponent
                        key={type.id}
                        type={type}
                        override={overrides[type.id]}
                        onChange={() => DataStore.set(OVERRIDES_KEY, overrides)}
                    />
                )}
            </>
    }
});

export default definePlugin({
    name: "CustomSounds",
    authors: [Devs.Bluejutzu],
    description: "Play sounds on different events",
    patches: [
        {
            find: 'Error("could not play audio")',
            replacement: [
                // override URL
                {
                    match: /(?<=new Audio;\i\.src=)\i\([0-9]+\)\("\.\/"\.concat\(this\.name,"\.mp3"\)/,
                    replace: "$self.findOverride(this.name)?.url || $&",
                },
                // override volume
                {
                    match: /Math.min\(\i\.\i\.getOutputVolume\(\)\/100\*this\._volume/,
                    replace: "$& * ($self.findOverride(this.name)?.volume ?? 100) / 100",
                },
            ],
        },
        {
            find: ".playWithListener().then",
            replacement: {
                match: /\i\.\i\.getSoundpack\(\)/,
                replace: '$self.isOverriden(arguments[0]) ? "classic" : $&',
            },
        },
    ],
    settings,
    findOverride,
    isOverriden,
    async start() {
        overrides = (await DataStore.get(OVERRIDES_KEY)) ?? {};
        for (const type of soundTypes)
            overrides[type.id] ??= makeEmptyOverride();
    }
});

export function isOverriden(id: string): boolean {
    return overrides[id]?.enabled ?? false;
}

export function findOverride(id: string): SoundOverride | null {
    const result = overrides[id];
    if (!result?.enabled)
        return null;

    return result;
}
