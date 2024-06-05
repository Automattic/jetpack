import TokenList from '@wordpress/token-list';

// Aspect ratios at the time of deprecation.
export const ASPECT_RATIOS = [
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
export const filterVideoPressClasses = ( className, videoPressClassNames ) => {
	// Filter out VideoPress specific styles from className attribute.

	const aspectRatioClassNames = ASPECT_RATIOS.map( ratio => ratio.className );

	const customClassTokenList = new TokenList( className );
	customClassTokenList.remove(
		...aspectRatioClassNames,
		'wp-block-embed',
		'is-type-video',
		'is-provider-videopress'
	);

	const videoPressClassTokenList = new TokenList( className );
	videoPressClassTokenList.add( videoPressClassNames );

	videoPressClassTokenList.remove( ...customClassTokenList );

	return {
		className: customClassTokenList.value,
		videoPressClassNames: videoPressClassTokenList.value,
	};
};
