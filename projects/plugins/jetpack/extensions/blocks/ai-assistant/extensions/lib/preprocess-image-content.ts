/**
 * External dependencies
 */
import { getAllBlocks } from '@automattic/jetpack-ai-client';

/**
 * Preprocess the serialized post content to remove image captions and alt text, changing the image urls to their clientId.
 * This is used to ensure that the AI is not confused by URLs in the post content, while still being able to identify the image blocks.
 * @param {string} content - The content to preprocess.
 * @return {string} The preprocessed content.
 */
export const preprocessImageContent = ( content: string ): string => {
	const imageBlocks = getAllBlocks().filter( block => block.name === 'core/image' );
	let currentImageIndex = 0;

	// Remove figcaption elements
	content = content.replace( /<figcaption[^>]*>.*?<\/figcaption>/g, '' );

	// Replace the urls of images within image blocks with their clientId
	content = content.replace( /<!-- wp:image[^>]*>.*?<img[^>]*>.*?<!-- \/wp:image -->/gs, () => {
		// The assumption here is that the image blocks are always in the same order as the images in the post's HTML content
		const imageBlock = imageBlocks[ currentImageIndex ];
		currentImageIndex++;

		if ( ! imageBlock ) {
			return '';
		}

		return `<img src="${ imageBlock.clientId }">`;
	} );

	return content;
};
