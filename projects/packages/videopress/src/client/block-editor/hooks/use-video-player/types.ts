export type PlayerStateProp = 'not-rendered' | 'loaded' | 'first-play' | 'ready';

export type UseVideoPlayer = {
	playerIsReady: boolean;
	play: () => void;
	pause: () => void;
};

export type UseVideoPlayerOptions = {
	/*
	 * Autoplay the video.
	 * It will be controlled when the previewOnHover is enabled.
	 */
	autoplay?: boolean;

	/*
	 * The time to initially set the player to.
	 */
	initialTimePosition: number;

	/*
	 * DOM player wrapper element.
	 */
	wrapperElement?: HTMLDivElement | null;

	/*
	 * PreviewOnHover feature options.
	 */
	previewOnHover?: {
		atTime: number;
		duration: number;
	};
};
