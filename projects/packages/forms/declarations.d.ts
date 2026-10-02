import type { ConnectionScriptData } from '@automattic/jetpack-connection';

declare module '*.png';
declare module '*.webp';
declare module '*.svg';
declare module '*.svg?raw';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.scss';
declare module '*.css';
declare module '*.mdx';
declare module '*.svg';

// `declare global` is required: the top-level import above makes this file a
// module, so a bare `interface Window` would declare a local type rather than
// augment the real one.
declare global {
	interface Window {
		JP_CONNECTION_INITIAL_STATE: ConnectionScriptData;
	}
}
