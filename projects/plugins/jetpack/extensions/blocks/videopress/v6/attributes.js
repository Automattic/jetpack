export default {
	autoplay: {
		type: 'boolean',
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
	videoRatio: {
		type: 'number',
	},
};
