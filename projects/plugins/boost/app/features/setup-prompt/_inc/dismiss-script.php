<script>
	jQuery( '.boost-dismiss' ).on( 'click', function() {
		jQuery( '.boost-banner' ).fadeOut( 'slow' );
		jQuery.post( ajaxurl, {
			action: 'dismiss_setup_banner',
			nonce: '<?php echo esc_js( wp_create_nonce( Automattic\Jetpack_Boost\Features\Setup_Prompt\Setup_Prompt::$nonce_action ) ); ?>',
		} );
	} );
</script>
