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
	 * Publishes post without publicizing it.
	 *
	 * Calls publicize/posts/<post_id>/publish-wo-publicize to
	 * publish the provided post id without triggering Publicize
	 * to share the post. Post can later be publicized directly.
	 *
	 * @since      5.9.1
	 *
	 * @fires   ajaxSend
	 *
	 * @param {int}   post_id           Post id of post being published
	 *
	 * @return None
	 */
	publicizeGutenbergPublish = function( post_id ) {
		$.ajax({
			type: 'POST',
			url: async_publicize_setup.base_url + '/wp-json/publicize/posts/'+ post_id.toString() + '/publish-wo-publicize',
			dataType: 'json',
			beforeSend: function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', async_publicize_setup.api_nonce );
			}
		});
	}

} );
