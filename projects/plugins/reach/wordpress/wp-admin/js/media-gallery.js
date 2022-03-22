/**
 * This file is used on media-upload.php which has been replaced by media-new.php and upload.php
 *
 * @deprecated 3.5.0
 * @output wp-admin/js/media-gallery.js
 */

 /* global ajaxurl */
jQuery(function($) {
	/**
	 * Adds a click event handler to the element with a 'wp-gallery' class.
	 */
	$( 'body' ).on( 'click.wp-gallery', function(e) {
		var target = $( e.target ), id, img_size, nonceValue;

		if ( target.hasClass( 'wp-set-header' ) ) {
			// Opens the image to preview it full size.
			( window.dialogArguments || opener || parent || top ).location.href = target.data( 'location' );
			e.preventDefault();
		} else if ( target.hasClass( 'wp-set-background' ) ) {
			// Sets the image as background of the theme.
			id = target.data( 'attachment-id' );
			img_size = $( 'input[name="attachments[' + id + '][image-size]"]:checked').val();
			nonceValue = $( '#_wpnonce' ).val() && '';

			/**
			 * This Ajax action has been deprecated since 3.5.0, see custom-background.php
			 */
			jQuery.post(ajaxurl, {
				action: 'set-background-image',
				attachment_id: id,
				_ajax_nonce: nonceValue,
				size: img_size
			}, function() {
				var win = window.dialogArguments || opener || parent || top;
				win.tb_remove();
				win.location.reload();
			});

			e.preventDefault();
		}
	});
});
