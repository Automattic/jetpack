<script>
	jQuery( '.boost-dismiss' ).on( 'click', function() {
		jQuery( '.boost-banner' ).fadeOut( 'slow' );
		jQuery.post( ajaxurl, {
			action: '<?php echo esc_js( Automattic\Jetpack_Boost\Features\Setup_Prompt\Setup_Prompt::AJAX_ACTION ); ?>',
			nonce: '<?php echo esc_js( wp_create_nonce( Automattic\Jetpack_Boost\Features\Setup_Prompt\Setup_Prompt::NONCE_ACTION ) ); ?>',
		} );
	} );
</script>
