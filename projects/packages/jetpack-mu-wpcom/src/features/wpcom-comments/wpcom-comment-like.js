/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

document.addEventListener( 'DOMContentLoaded', async () => {
	document
		.querySelectorAll( '#the-comment-list .row-actions > :is(.like, .unlike)' )
		.forEach( el => el.addEventListener( 'click', handleLikeUnlike ) );

	/**
	 * Makes an API request to either set or unset a "like" on a comment on
	 * behalf of the current user.
	 *
	 * State is represented in the DOM as follows:
	 * - the comment row (tr) may have class `liked`
	 * - the target (button) may have attribute `disabled` while in progress
	 *
	 * @param {Event} event - Click event.
	 */
	async function handleLikeUnlike( event ) {
		event.preventDefault();

		const button = event.target;
		const span = button.parentElement;
		const commentId = button.dataset.commentId;

		// We handle both Like and Unlike buttons and need to distinguish them
		const isUnlike = span.classList.contains( 'unlike' );

		const options = {
			path: isUnlike
				? `/rest/v1.1/comments/${ commentId }/likes/mine/delete`
				: `/rest/v1.1/comments/${ commentId }/likes/new`,
			method: 'POST',
		};

		let response;
		button.disabled = true;
		try {
			response = await apiFetch( options );
			if ( ! response.success ) {
				throw new Error();
			}
		} catch {
			// FIXME: Find a better way to surface issues to the user
			const label = isUnlike ? 'post_unlike_error' : 'post_like_error';
			alert( window.wpcomCommentLikesData?.[ label ] );
			return;
		} finally {
			button.disabled = false;
		}

		const row = span.closest( 'tr' );
		row.classList.toggle( 'liked', response.i_like );
	}
} );
