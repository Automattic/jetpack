/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const displayNotice = message => {
	const headerEnd = document.querySelector( '.wp-header-end' );
	if ( ! headerEnd ) {
		return;
	}

	const dismissText = window.wpcomCommentLikesData.dismiss_notice_text;

	// Create notice container.
	const notice = document.createElement( 'div' );
	notice.className = 'notice notice-error is-dismissible';
	// Add role="alert" so that screen readers announce the notice.
	notice.setAttribute( 'role', 'alert' );

	// Create paragraph element for the message.
	const p = document.createElement( 'p' );
	p.innerText = message;
	notice.appendChild( p );

	// Create dismiss (close) button.
	const button = document.createElement( 'button' );
	button.setAttribute( 'type', 'button' );
	button.className = 'notice-dismiss';
	button.setAttribute( 'aria-label', dismissText );
	notice.appendChild( button );

	// Create a span element for screen readers.
	const span = document.createElement( 'span' );
	span.className = 'screen-reader-text';
	span.innerText = dismissText;
	button.appendChild( span );

	// Hook up the dismiss functionality.
	button.addEventListener( 'click', () => {
		notice.remove();
	} );

	// Insert the notice after the headerEnd element.
	headerEnd.after( notice );

	// Use wp.a11y.speak, if available, to immediately announce the notice.
	window.wp?.a11y?.speak?.( message );
};

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
			const label = isUnlike ? 'post_unlike_error' : 'post_like_error';
			displayNotice( window.wpcomCommentLikesData?.[ label ] );
			return;
		} finally {
			button.disabled = false;
		}

		const row = span.closest( 'tr' );
		row.classList.toggle( 'liked', response.i_like );
	}
} );
