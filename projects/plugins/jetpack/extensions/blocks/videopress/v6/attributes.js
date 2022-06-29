export default {
	autoplay: {
		type: 'boolean',
	},
	controls: {
		type: 'boolean',
		default: true,
	},
	loop: {
		type: 'boolean',
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
};
