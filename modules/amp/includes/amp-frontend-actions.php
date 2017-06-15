<?php
// Callbacks for adding AMP-related things to the main theme

add_action( 'wp_head', 'amp_frontend_add_canonical' );

function amp_frontend_add_canonical() {
	if ( false === apply_filters( 'amp_frontend_show_canonical', true ) ) {
		return;
	}

	$amp_url = amp_get_permalink( get_queried_object_id() );
	printf( '<link rel="amphtml" href="%s" />', esc_url( $amp_url ) );
}
