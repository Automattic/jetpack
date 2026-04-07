import type { ConnectionScriptData } from '@automattic/jetpack-connection';

declare module '*.png';
declare module '*.svg';
declare module '*.svg?raw';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.scss';
declare module '*.css';
declare module '*.mdx';
declare module '*.svg';

interface Window {
	JP_CONNECTION_INITIAL_STATE: ConnectionScriptData;
}
