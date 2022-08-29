/**
 * The code below is pulled from Gutenberg embed block, until we can use it directly from Gutenberg
 * https://github.com/WordPress/gutenberg/blob/e4b6d70f129a745a0cc7dc556d41a44bdab7b0ca/packages/block-library/src/embed/util.js#L177
 */
import classnames from 'classnames';
import { ASPECT_RATIOS } from './constants';

/**
 * Removes all previously set aspect ratio related classes and return the rest
 * existing class names.
 *
 * @param {string} existingClassNames Any existing class names.
 * @returns {string} The class names without any aspect ratio related class.
 */
export const removeAspectRatioClasses = existingClassNames => {
	const aspectRatioClassNames = ASPECT_RATIOS.reduce(
		( accumulator, { className } ) => {
			accumulator[ className ] = false;
			return accumulator;
		},
		{ 'wp-has-aspect-ratio': false }
	);
	return classnames( existingClassNames, aspectRatioClassNames );
};

/**
 * Returns class names with any relevant responsive aspect ratio names.
 *
 * @param {string}  html               The preview HTML that possibly contains an iframe with width and height set.
 * @param {string}  existingClassNames Any existing class names.
 * @param {boolean} allowResponsive    If the responsive class names should be added, or removed.
 * @returns {string} Deduped class names.
 */
export function getClassNames( html, existingClassNames = '', allowResponsive = true ) {
	if ( ! allowResponsive ) {
		return removeAspectRatioClasses( existingClassNames );
	}

	const previewDocument = document.implementation.createHTMLDocument( '' );
	previewDocument.body.innerHTML = html;
	const iframe = previewDocument.body.querySelector( 'iframe' );

	// If we have a fixed aspect iframe, and it's a responsive embed block.
	if ( iframe && iframe.height && iframe.width ) {
		const aspectRatio = ( iframe.width / iframe.height ).toFixed( 2 );
		// Given the actual aspect ratio, find the widest ratio to support it.
		for ( let ratioIndex = 0; ratioIndex < ASPECT_RATIOS.length; ratioIndex++ ) {
			const potentialRatio = ASPECT_RATIOS[ ratioIndex ];

			if ( aspectRatio >= potentialRatio.ratio ) {
				return classnames(
					removeAspectRatioClasses( existingClassNames ),
					potentialRatio.className,
					'wp-has-aspect-ratio'
				);
			}
		}
	}

	return existingClassNames;
}
