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

add_filter( 'grunion_contact_form_field_html', 'grunion_contact_form_field_html_filter', 10, 3 );
function grunion_contact_form_field_html_filter( $r, $field_label, $id ){
	global $sitepress;

	if ( function_exists( 'icl_translate' ) ) {
		if ( $sitepress->get_current_language() !== $sitepress->get_default_language() ) {
			$label_translation = icl_translate( 'jetpack ', $field_label . '_label', $field_label );
			$r                 = str_replace( $field_label, $label_translation, $r );
		}
	}

	return $r;
}

endif;
