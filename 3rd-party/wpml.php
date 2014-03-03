<?php

// Only load these if WPML is active.
if ( defined( 'ICL_SITEPRESS_VERSION' ) ) :

add_action( 'jetpack_widget_get_top_posts', 'wpml_jetpack_widget_get_top_posts', 10, 3 );
function wpml_jetpack_widget_get_top_posts( $posts, $post_ids, $count ) {
	global $sitepress;

	foreach ( $posts as $k => $post ) {
		$lang_information = wpml_get_language_information( $post['post_id'] );
		$post_language    = substr( $lang_information['locale'], 0, 2 );
		if ( $post_language !== $sitepress->get_current_language() ) {
			unset( $posts[ $k ] );
		}
	}

	return $posts;
}

endif;
