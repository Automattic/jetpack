/**
 * External dependencies
 */
import classnames from 'classnames/dedupe';
import TokenList from '@wordpress/token-list';

/**
 * Internal dependencies
 */
import save from './save';

// Aspect ratios at the time of deprecation.
const ASPECT_RATIOS = [
	// Common video resolutions.
	{ ratio: '2.33', className: 'wp-embed-aspect-21-9' },
	{ ratio: '2.00', className: 'wp-embed-aspect-18-9' },
	{ ratio: '1.77', className: 'wp-embed-aspect-16-9' },
	{ ratio: '1.33', className: 'wp-embed-aspect-4-3' },
	// Vertical video and instagram square video support.
	{ ratio: '1.00', className: 'wp-embed-aspect-1-1' },
	{ ratio: '0.56', className: 'wp-embed-aspect-9-16' },
	{ ratio: '0.50', className: 'wp-embed-aspect-1-2' },
];

/**
 * Filters out VideoPress specific CSS classes from the default classNames
 * attribute, leaving any custom CSS classes alone. Then filters those custom
 * CSS classes from the VideoPress specific class list.
 *
 * @param   {string} className            - CSS classes in standard className attribute.
 * @param   {string} videoPressClassNames - VideoPress block's custom CSS classes attribute.
 * @returns {object}                      - Filtered CSS class attributes.
 */
const filterVideoPressClasses = ( className, videoPressClassNames ) => {
	// Filter out VideoPress specific styles from className attribute.
	const aspectRatioClassNames = ASPECT_RATIOS.reduce(
		( accumulator, { className: ratioClass } ) => {
			accumulator[ ratioClass ] = false;
			return accumulator;
		},
		{ 'wp-has-aspect-ratio': false }
	);

	const customClasses = classnames( className, {
		...aspectRatioClassNames,
		'wp-block-embed': false,
		'is-type-video': false,
		'is-provider-videopress': false,
	} );

	// Filter the custom CSS classes from the VideoPress specific class list.
	const customClassList = new TokenList( customClasses );
	let videoPressClasses = classnames( className, videoPressClassNames );

	customClassList.forEach( customClass => {
		videoPressClasses = videoPressClasses.replace( customClass, '' );
	} );

	return {
		className: customClasses,
		videoPressClassNames: videoPressClasses.trim(),
	};
};

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
	isEligible: ( { videoPressClassNames, guid } ) => {
		const missingClassNames = videoPressClassNames === undefined;

		return guid && missingClassNames;
	},
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
