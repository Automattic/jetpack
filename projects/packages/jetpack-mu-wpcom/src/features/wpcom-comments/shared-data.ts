/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * CommentData interface.
 *
 * @property {boolean} i_like The like status.
 * @property {number}  ID     The comment ID.
 */
export interface CommentData {
	i_like: boolean;
	ID: number;
}

let sharedCommentsPromise: Promise< CommentData[] > | null = null;

/**
 * Fetch shared comments data from the API only once and cache the result.
 *
 * @return {Promise<CommentData[]>} A promise that resolves to an array of comment data.
 */
export function loadSharedComments(): Promise< CommentData[] > {
	if ( ! sharedCommentsPromise ) {
		sharedCommentsPromise = apiFetch< { comments: CommentData[] } >( {
			path: '/rest/v1/comments/?fields=ID,i_like',
			method: 'GET',
		} ).then( response => response.comments );
	}

	return sharedCommentsPromise;
}

/**
 * Get the like status for a specific comment.
 *
 * Precondition: The shared comments data must have been preloaded.
 *
 * @param {string|number} commentId - The comment ID.
 * @return {Promise<boolean>} A promise resolving to the comment's like status.
 */
export async function getCommentLikeStatus( commentId: string | number ): Promise< boolean > {
	const comments = await sharedCommentsPromise;
	if ( ! comments ) {
		// If the shared comments data isn't loaded, return false.
		return false;
	}
	const id = Number( commentId );
	const comment = comments.find( c => c.ID === id );
	return comment ? comment.i_like : false;
}

// Preload wpcom comments data using the global siteId, if available.
loadSharedComments();
