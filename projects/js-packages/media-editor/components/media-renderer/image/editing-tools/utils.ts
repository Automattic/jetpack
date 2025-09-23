/**
 * WordPress dependencies
 * @param rotation
 */
// TODO: Implement image cropping functionality
// import { normalizeRotation } from '@wordpress/image-cropper';

// Stub implementation
const normalizeRotation = ( rotation: number ) => {
	return ( ( rotation % 360 ) + 360 ) % 360;
};

/**
 * Calculates the maximum scale that can be used to fit the image into the container.
 * To maximize the bounding box, this function assumes 90° rotations (0°, 90°, 180°, 270°) only.
 *
 * Later, if 0-360° rotations are supported, this function will need to be updated
 * to account for the maximum diagonal dimensions. E.g.,
 *
 * ```
 * 	 // The maximum bounding box dimensions occur at 45° for rectangles.
 * 	 // Max bounding width/height = (width + height) / √2 * √2 = width + height
 * 	 // But this is only true for squares. For rectangles, we need to be more precise.
 * 	 const diagonal = Math.sqrt(
 * 	 	imageWidth * imageWidth + imageHeight * imageHeight
 * 	 );
 *
 * 	// Scale to fit this maximum bounding square in the container.
 * 	const scale = Math.min(
 * 		containerWidth / diagonal,
 * 		containerHeight / diagonal
 * 	);
 * ```
 *
 * @param imageWidth      - The width of the image.
 * @param imageHeight     - The height of the image.
 * @param containerWidth  - The width of the container.
 * @param containerHeight - The height of the container.
 */
export function getMaximumScaledDimensions(
	imageWidth: number,
	imageHeight: number,
	containerWidth: number,
	containerHeight: number
): {
	scale: number;
	scaledWidth: number;
	scaledHeight: number;
} {
	// Calculate scale for original orientation.
	const scaleOriginal = Math.min( containerWidth / imageWidth, containerHeight / imageHeight );

	// Calculate scale for 90° rotated orientation.
	const scaleRotated = Math.min(
		containerWidth / imageHeight, // Rotated width is original height.
		containerHeight / imageWidth // Rotated height is original width.
	);

	// Use the smaller scale to ensure it fits in both orientations
	const scale = Math.min( scaleOriginal, scaleRotated );

	return {
		scale,
		scaledWidth: imageWidth * scale,
		scaledHeight: imageHeight * scale,
	};
}

/**
 * Checks if the rotation is 90° or 270°.
 *
 * @param  rotation - The rotation value to check.
 * @return {boolean} True if the rotation is 90° or 270°, false otherwise.
 */
export const isQuarterTurn = ( rotation: number ) => {
	return normalizeRotation( rotation ) % 180 === 90;
};
