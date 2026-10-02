import { lowerUserAgent } from "./shared.mjs";

/** Running in jsdom or HappyDOM (used by unit tests). */
export const jsdom = /jsdom|happydom/.test(lowerUserAgent);