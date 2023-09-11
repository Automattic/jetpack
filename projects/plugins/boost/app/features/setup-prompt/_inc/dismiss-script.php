<script>
	jQuery( '.jb-setup-banner__dismiss' ).on( 'click', function() {
		jQuery( '.jb-setup-banner' ).fadeOut( 'slow' );
		jQuery.post( ajaxurl, {
			action: <?php echo wp_json_encode( Automattic\Jetpack_Boost\Features\Setup_Prompt\Setup_Prompt::AJAX_ACTION ); ?>,
			nonce: <?php echo wp_json_encode( wp_create_nonce( Automattic\Jetpack_Boost\Features\Setup_Prompt\Setup_Prompt::NONCE_ACTION ) ); ?>,
		} );
	} );
</script>
