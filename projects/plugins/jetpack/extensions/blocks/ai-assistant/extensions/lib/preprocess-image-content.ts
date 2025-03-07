/**
 * Preprocess the serialized post content to remove image URLs and alt text, adding a unique count to each image.
 * This is used to ensure that the AI is not confused by the URLs in the post content.
 * @param {string} content - The content to preprocess.
 * @return {string} The preprocessed content.
 */
export const preprocessImageContent = ( content: string ): string => {
	let imageCounter = 0;

	// Remove figcaption elements
	content = content.replace( /<figcaption[^>]*>.*?<\/figcaption>/g, '' );

	// Replace image URLs with a unique count and remove alt text
	content = content.replace( /<img[^>]*>/g, () => {
		imageCounter++;

		return `<img src="image-${ imageCounter }">`;
	} );

	return content;
};
