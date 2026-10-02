import { GestureKey, InternalConfig, UserGestureConfig } from "../types.js";
export type Resolver = (x: any, key: string, obj: any) => any;
export type ResolverMap = {
    [k: string]: Resolver | ResolverMap | boolean;
};
export declare function resolveWith<T extends {
    [k: string]: any;
}, V extends {
    [k: string]: any;
}>(config: Partial<T> | undefined, resolvers: ResolverMap): V;
export declare function parse(newConfig: UserGestureConfig, gestureKey?: GestureKey, _config?: any): InternalConfig;
