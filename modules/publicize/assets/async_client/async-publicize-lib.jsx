/**
 * Scripts for asynchronous Publicize.
 *
 * Scripts to support asynchronous Publicize features:
 * Allows for publishing a post, and then later (optionally)
 * sharing it with Publicize
 *
 * @file   Scripts for asynchronous Publicize.
 * @since  5.9.1
 */


/**
 * Shares a post to connected social accounts with Publicize
 *
 * Calls publicize/posts/<post_id>/publicize to directly
 * publicize a post. This allows a post that was not previously
 * shared with Publicize to be shared at a later time.
 *
 * @since      5.9.1
 *
 * @fires   ajaxSend
 *
 * @param {int}   postID           Post id of post being flagged
 * @param {string}   message       Message string to use for sharing with all connections
 *
 * @return promise object from .ajax call
 */
export function sharePost( postID, message) {
	return jQuery.ajax( {
		type: 'POST',
		url: async_publicize_setup.base_url + '/wp-json/publicize/posts/' + postID.toString() + '/publicize',
		headers: {
			message: message
		},
		dataType: 'json',
		beforeSend: function ( xhr ) {
			xhr.setRequestHeader( 'X-WP-Nonce', async_publicize_setup.api_nonce );
		},
	} );
};





