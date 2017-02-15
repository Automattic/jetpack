<?php
/**
 * Only load these if WPML plugin is installed and active.
 */

/**
 * Load routines only if WPML is loaded.
 *
 * @since 4.4.0
 */
function wpml_jetpack_init() {
	add_action( 'jetpack_widget_get_top_posts', 'wpml_jetpack_widget_get_top_posts', 10, 3 );
	add_filter( 'grunion_contact_form_field_html', 'grunion_contact_form_field_html_filter', 10, 3 );
}
add_action( 'wpml_loaded', 'wpml_jetpack_init' );

/**
 * Filter the Top Posts and Pages by language.
 *
 * @param array  $posts    Array of the most popular posts.
 * @param array  $post_ids Array of Post IDs.
 * @param string $count    Number of Top Posts we want to display.
 *
 * @return array
 */
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

/**
 * Filter the HTML of the Contact Form and output the one requested by language.
 *
 * @param string   $r           Contact Form HTML output.
 * @param string   $field_label Field label.
 * @param int|null $id          Post ID.
 *
 * @return string
 */
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