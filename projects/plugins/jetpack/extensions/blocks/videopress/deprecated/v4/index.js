/**
 * Internal dependencies
 */
import save from './save';

// This deprecation is a result of:
// - changing the default of `useAverageColor` resulting in old blocks not passing validation.
export default {
	attributes: {
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
		maxWidth: {
			type: 'string',
			default: '100%',
		},
		guid: {
			type: 'string',
		},
		id: {
			type: 'number',
		},
		loop: {
			type: 'boolean',
		},
		isVideoPressExample: {
			type: 'boolean',
			default: false,
		},
		muted: {
			type: 'boolean',
		},
		playsinline: {
			type: 'boolean',
		},
		poster: {
			type: 'string',
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
		src: {
			type: 'string',
		},
		useAverageColor: {
			type: 'boolean',
			default: false, // forcing false here to be explicit about what is changing even though thats the default.
		},
		videoPressTracks: {
			type: 'array',
			items: {
				type: 'object',
			},
			default: [],
		},
		videoPressClassNames: {
			type: 'string',
		},
	},
	support: {
		reusable: false,
	},
	isEligible: attrs => {
		return attrs.guid;
	},
	save,
	isDeprecation: true,
};
