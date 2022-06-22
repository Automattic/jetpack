import save from './save';
import { filterVideoPressClasses } from './utils';

// This deprecation is a result of:
// - fixing regression from Gutenberg update forcing `wp-block-video` class,
// - bug introduced when VideoPress aspect ratio classes were added,
// - fixing inclusion of alignment classes that were omitted previously.
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
		guid: {
			type: 'string',
		},
		id: {
			type: 'number',
		},
		loop: {
			type: 'boolean',
		},
		muted: {
			type: 'boolean',
		},
		playsInline: {
			type: 'boolean',
		},
		poster: {
			type: 'string',
		},
		preload: {
			type: 'string',
			default: 'metadata',
		},
		src: {
			type: 'string',
		},
		videoPressClassNames: {
			type: 'string',
		},
		align: {
			type: 'wide',
		},
	},
	support: {
		reusable: false,
	},
	isEligible: ( { videoPressClassNames, guid } ) => guid && videoPressClassNames === undefined,
	migrate: attributes => {
		const { className, videoPressClassNames } = attributes;
		return {
			...attributes,
			...filterVideoPressClasses( className, videoPressClassNames ),
		};
	},
	save,
	isDeprecation: true,
};
