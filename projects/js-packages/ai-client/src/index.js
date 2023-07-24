import apiFetch from '@wordpress/api-fetch';

/**
 * Fetches images from Jetpack AI
 *
 * It's up to the consumer to catch errors
 *
 * @param {*} prompt  - The prompt to send to Jetpack AI
 * @param {*} postId - The post ID where the completion is being requested
 * @returns {Promise<Array<string>>} The images
 */
export function requestImages( prompt, postId ) {
	return apiFetch( {
		path: '/wpcom/v2/jetpack-ai/images/generations',
		method: 'POST',
		data: {
			prompt,
			post_id: postId,
		},
	} ).then( res => {
		const images = res.data.map( image => {
			return 'data:image/png;base64,' + image.b64_json;
		} );
		return images;
	} );
}
