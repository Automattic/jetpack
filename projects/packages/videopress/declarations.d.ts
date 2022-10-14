declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';

export declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		wp: { media: any };
	}
}
