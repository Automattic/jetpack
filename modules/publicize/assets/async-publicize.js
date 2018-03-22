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

} );
