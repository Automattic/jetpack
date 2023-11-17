/**
 * Returns the difference between the size of an image
 * and the potential size in percentage.
 *
 * @param {object} image Image to check.
 */
export function getImageSizeDifferencePercent( image ) {
	const difference = image.weight.current - image.weight.potential;
	const average = ( image.weight.current + image.weight.potential ) / 2;
	return ( difference / average ) * 100;
}
