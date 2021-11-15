export const defaultSlideProgressState = {
	currentTime: 0,
	duration: null,
	timeout: null,
	lastUpdate: null,
};

export const defaultCurrentSlideState = {
	progress: defaultSlideProgressState,
	index: 0,
	mediaElement: null,
	duration: null,
	ended: false,
	ready: false,
};

export const defaultPlayerSettings = {
	imageTime: 5, // in sec
	startMuted: false,
	playInFullscreen: true,
	playOnNextSlide: true,
	playOnLoad: false,
	exitFullscreenOnEnd: true,
	loadInFullscreen: false,
	blurredBackground: true,
	showSlideCount: false,
	showProgressBar: true,
	shadowDOM: {
		enabled: true,
		mode: 'open', // closed not supported right now
		globalStyleElements:
			'#jetpack-block-story-css, link[href*="jetpack/_inc/blocks/story/view.css"]',
	},
	defaultAspectRatio: 720 / 1280,
	cropUpTo: 0.2, // crop percentage allowed, after which media is displayed in letterbox
	volume: 0.8,
	maxBullets: 7,
	maxBulletsFullscreen: 14,
};

export const defaultPlayerState = {
	slideCount: 0,
	currentSlide: defaultCurrentSlideState,
	previousSlide: null, // used to reset the media that was just played
	muted: false,
	playing: false,
	ended: false,
	buffering: false,
	fullscreen: false,
	settings: defaultPlayerSettings,
};
