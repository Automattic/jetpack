/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import save from './save';

// This deprecation is a result of switching to useBlockProps in save to allow
// Gutenberg align hook to inject CSS alignment class e.g. `alignwide`.
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
	isEligible: ( { className, videoPressClassNames, guid } ) => {
		const missingClassNames = videoPressClassNames === undefined;
		const missingVideoClass = ! className?.indexOf( 'wp-block-video' ) >= 0;

		return guid && ( missingClassNames || missingVideoClass );
	},
	migrate: attributes => {
		const { align, className, videoPressClassNames } = attributes;
		return {
			...attributes,
			className: 'wp-block-video',
			videoPressClassNames: classnames( className, videoPressClassNames, {
				[ `align${ align }` ]: align,
			} ),
		};
	},
	save,
	isDeprecation: true,
};
