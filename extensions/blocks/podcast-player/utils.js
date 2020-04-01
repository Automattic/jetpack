/**
 * Returns a class based on the context a color is being used and its slug.
 * Note: This helper function was copied from core @wordpress/block-editor lib,
 * in order to avoid requiring not-needed dependencies to reduce the size
 * of compiled files used in the front-end.
 *
 * @example
 *     const className = getColorClassName( 'color', canvasPrimaryColor );
 *
 * @param {string} colorContextName Context/place where color is being used e.g: background, text etc...
 * @param {string} colorSlug        Slug of the color.
 *
 * @return {?string} String with the class corresponding to the color in the provided context.
 *                   Returns undefined if either colorContextName or colorSlug are not provided.
 */
export function getColorClassName( colorContextName, colorSlug ) {
	if ( ! colorContextName || ! colorSlug ) {
		return undefined;
	}

	return `has-${ colorSlug }-${ colorContextName }`;
}
