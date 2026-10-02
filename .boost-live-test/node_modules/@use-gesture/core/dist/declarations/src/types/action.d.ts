import type { ResolverMap } from "../config/resolver.js";
import type { Controller } from "../Controller.js";
import type { Engine } from "../engines/Engine.js";
import { GestureKey } from "./config.js";
export type EngineClass<Key extends GestureKey> = {
    new (controller: Controller, args: any[], key: Key): Engine<Key>;
};
export type Action = {
    key: GestureKey;
    engine: EngineClass<GestureKey>;
    resolver: ResolverMap;
};
