export type PlayerStateProp = 'not-rendered' | 'loaded' | 'first-play' | 'ready';

export type UseVideoPlayer = {
	playerIsReady: boolean;
	playerState: PlayerStateProp;
};

export type UseVideoPlayerOptions = {
	/*
	 * The time to initially set the player to.
	 */
	atTime: number;

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
