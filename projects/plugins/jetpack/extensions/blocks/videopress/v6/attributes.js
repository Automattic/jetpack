export default {
	autoplay: {
		type: 'boolean',
	},
	autoplayHovering: {
		type: 'boolean',
	},
	autoplayHoveringStart: {
		type: 'number',
		default: 0,
	},
	autoplayHoveringDuration: {
		type: 'number',
		default: 5 * 3600,
	},
	caption: {
		type: 'string',
		source: 'html',
		selector: 'figcaption',
	},
	controls: {
		type: 'boolean',
		default: true,
	},
	loop: {
		type: 'boolean',
	},
	maxWidth: {
		type: 'string',
		default: '100%',
	},
	muted: {
		type: 'boolean',
	},
	playsinline: {
		type: 'boolean',
	},
	preload: {
		type: 'string',
		default: 'metadata',
	},
	seekbarPlayedColor: {
		type: 'string',
		default: '',
	},
	seekbarLoadingColor: {
		type: 'string',
		default: '',
	},
	seekbarColor: {
		type: 'string',
		default: '',
	},
	useAverageColor: {
		type: 'boolean',
		default: true,
	},
	id: {
		type: 'number',
	},
	guid: {
		type: 'string',
	},
	src: {
		type: 'string',
	},
	cacheHtml: {
		type: 'string',
		default: '',
	},
	poster: {
		type: 'string',
	},
	cacheThumbnail: {
		type: 'string',
		default: '',
	},
	videoRatio: {
		type: 'number',
	},
};
