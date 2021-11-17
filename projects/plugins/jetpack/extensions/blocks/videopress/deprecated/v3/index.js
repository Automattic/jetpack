/**
 * Internal dependencies
 */
import { createBlock } from '@wordpress/blocks';
import save from './save';

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
		videoPressClassNames: {
			type: 'string',
		},
	},
	support: {
		reusable: false,
	},
	isEligible: ( attrs, innerBlock ) => attrs.guid && ! innerBlock.contains( 'cover=true' ),
	migrate: attributes => {
		return [ attributes, [ createBlock( 'core/video', attributes ) ] ];
	},
	save,
	isDeprecation: true,
};
