/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { classNameFactory } from "@api/Styles";
import { makeRange } from "@components/PluginSettings/components";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { useForceUpdater } from "@utils/react";
import { Button, Card, Forms, Slider, Switch, TextInput, useState } from "@webpack/common";

import { SoundOverride, SoundType } from "../types";

const OVERRIDES_KEY = "CustomSounds_overrides";
const cl = classNameFactory("vc-custom-sounds-");

export function SoundOverrideComponent({ type, override, onChange }: { type: SoundType; override: SoundOverride; onChange: (newOverride: SoundOverride) => Promise<void>; }) {
    const update = useForceUpdater();
    const [overrideS, setOverride] = useState<SoundOverride>(override);

    const handleUrlChange = async (newUrl: string) => {
        const newOverride = { ...overrideS, url: newUrl };
        setOverride(newOverride);
        await onChange(newOverride);
        const savedOverrides = await DataStore.get<Record<string, SoundOverride>>(OVERRIDES_KEY);
        const updatedOverrides = { ...savedOverrides, [type.id]: overrideS };
        await DataStore.set(OVERRIDES_KEY, updatedOverrides);
        console.log(updatedOverrides);
    };

    return (
        <Card className={cl("card")}>
            <Switch
                value={overrideS.enabled}
                onChange={async value => {
                    const newOverride = { ...overrideS, enabled: value };
                    setOverride(newOverride);
                    await onChange(newOverride);
                    update();
                }}
                className={Margins.bottom16}
                hideBorder={true}
            >
                {type.name} <span className={cl("id")}>({type.id})</span>
            </Switch>
            <Button
                color={Button.Colors.PRIMARY}
                className={Margins.bottom16}
                onClick={() => {
                    const audioElement = new Audio(overrideS.url);
                    audioElement.volume = overrideS.volume / 100;
                    audioElement.play();
                }}
                disabled={!overrideS.enabled}
            >
                Preview
            </Button>
            <Forms.FormTitle>Replacement Sound URL</Forms.FormTitle>
            <div className={Margins.bottom16}>
                <TextInput
                    value={overrideS.url}
                    onChange={handleUrlChange}
                    placeholder="Enter URL of the replacement sound"
                    disabled={!overrideS.enabled}
                />
            </div>
            <Button
                color={Button.Colors.RED}
                onClick={async () => {
                    const newOverride = { ...overrideS, url: "" };
                    setOverride(newOverride);
                    await onChange(newOverride);
                    update();
                }}
                disabled={!(overrideS.enabled && overrideS.url.length !== 0)}
                style={{ display: "inline" }}
                className={classes(Margins.right8, Margins.bottom16)}
            >
                Clear
            </Button>
            <Forms.FormTitle>Volume</Forms.FormTitle>
            <Slider
                markers={makeRange(0, 100, 10)}
                initialValue={overrideS.volume}
                onValueChange={async value => {
                    const newOverride = { ...overrideS, volume: value };
                    setOverride(newOverride);
                    await onChange(newOverride);
                    update();
                }}
                className={Margins.bottom16}
                disabled={!overrideS.enabled}
            />
        </Card>
    );
}
