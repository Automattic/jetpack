/**
 *External dependencies
 */
import { getFilename } from '@wordpress/url';

const { imagesURLBase = '' } = window?.videoPressEditorState || {};

/**
 * Helper function to get the correct image URL.
 *
 * @param {string} image - The imported image.
 * @returns {string}     - The image URL.
 */
export default function editorImageURL( image: string ): string {
	// Get the file name from the image path, including build hash.
	const fileName = getFilename( image );

	return imagesURLBase ? `${ imagesURLBase }${ fileName }` : image;
}
