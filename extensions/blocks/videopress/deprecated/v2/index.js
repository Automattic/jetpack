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
		classNames: {
			type: 'string',
		},
		align: {
			type: 'wide',
		},
	},
	support: {
		reusable: false,
	},
	isEligible: ( { className, classNames, guid } ) => {
		const missingClassNames = classNames === undefined;
		const missingVideoClass = ! className?.indexOf( 'wp-block-video' ) >= 0;

		return guid && ( missingClassNames || missingVideoClass );
	},
	migrate: attributes => {
		const { align, className, classNames } = attributes;
		return {
			...attributes,
			className: classnames( 'wp-block-video', className, classNames, {
				[ `align${ align }` ]: align,
			} ),
		};
	},
	save,
	isDeprecation: true,
};
