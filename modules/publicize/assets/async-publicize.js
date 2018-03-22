/**
 * Scripts for asynchronous Publicize.
 *
 * Scripts ot support asynchronous Publicize features:
 * Allows for publishing a post, and then later (optionally)
 * sharing it with Publicize
 *
 * @file   Scripts for asynchronous Publicize.
 * @author ChrisShultz.
 * @since  5.9.1
 */

jQuery( function( $ ) {

	/**
	 * Flags a soon-to-be-published post for no automatic publicizing.
	 *
	 * Calls publicize/posts/<post_id>/flag-no-publicize to
	 * flag a post to NOT be automatically shared via Publicize.
	 * This is used to decouple publishing and publicizing of a post.
	 * This should only be called immediately before publishing because
	 * the flag expires after a timeout.
	 *
	 * @since      5.9.1
	 *
	 * @fires   ajaxSend
	 *
	 * @param {int}   post_id           Post id of post being flagged
	 *
	 * @return None
	 */
	flagPostNoPublicize = function( post_id ) {
		$.ajax({
			type: 'POST',
			url: async_publicize_setup.base_url + '/wp-json/publicize/posts/'+ post_id.toString() + '/flag-no-publicize',
			dataType: 'json',
			beforeSend: function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', async_publicize_setup.api_nonce );
			}
		});
	}

	/**
	 * Shares a post to connected social with Publicize
	 *
	 * Calls publicize/posts/<post_id>/publicize to directly
	 * publicize a post. This allows a post that was not previously
	 * shared with Publicize to be shared at a later time, which
	 * enables the following series of events in Gutenberg:
	 * 1. <User pushes 'Publish">
	 *    1.1. Call to flagPostNoPublicize( <post-id> ) so post will
	 *    not be automatically publicized.
	 *    1.2. <Gutenberg publishes to its normal endpoint>
	 * 2. <User pushes 'Share'>
	 *    2.1. Call to postPublishPublicizePost( <post-id> )
	 *         shares post.
	 *
	 * @since      5.9.1
	 *
	 * @fires   ajaxSend
	 *
	 * @param {int}   post_id           Post id of post being flagged
	 *
	 * @return None
	 */
	postPublishPublicizePost = function ( post_id, message ) {
		$.ajax( {
			type: 'POST',
			url: async_publicize_setup.base_url + '/wp-json/publicize/posts/' + post_id.toString() + '/publicize',
			headers: {
				message: message,
			},
			dataType: 'json',
			beforeSend: function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', async_publicize_setup.api_nonce );
			}
		} );
	}
} );
