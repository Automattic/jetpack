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

/**
 * Add current language as suffix to transient name.
 *
 * @param string $transient Transient name. Expected to not be SQL-escaped.
 * @return string Translated transient name.
 */
add_filter( 'jetpack_sitemap_transient', 'jetpack_wpml_transient_language', 10, 1 );
add_filter( 'jetpack_news_sitemap_transient', 'jetpack_wpml_transient_language', 10, 1 );
add_filter( 'jetpack_sitemap_xsl_transient', 'jetpack_wpml_transient_language', 10, 1 ) ;

function jetpack_wpml_transient_language( $transient ) {
    return $transient . '_' . apply_filters( 'wpml_current_language', NULL );
}

/**
 * Clear the multilingual sitemap cache when a sitemap action has changed.
 *
 * @param string $transient Transient name. Expected to not be SQL-escaped.
 */
add_action( 'delete_transient_jetpack_sitemap', 'jetpack_wpml_transient_delete', 10, 1 ) ;
add_action( 'delete_transient_jetpack_news_sitemap', 'jetpack_wpml_transient_delete', 10, 1 );

function jetpack_wpml_transient_delete( $transient ) {
    $languages = apply_filters( 'wpml_active_languages', NULL );

    // Delete transient for every active language.
    foreach ( $languages as $language ) {
        delete_transient( $transient . '_' . $language['language_code'] );
    }
}

/**
 * Translate permalink according to post language.
 *
 * @param int $post_id Post ID.
 * @return string|false The permalink URL
 */
add_filter( 'jetpack_sitemap_post_permalink', 'jetpack_wpml_translate_permalink', 10, 2 );

function jetpack_wpml_translate_permalink( $permalink, $post_id ) {
    $post_language  = apply_filters( 'wpml_post_language_details', NULL, $post_id );

    $wpml_permalink = apply_filters( 'wpml_permalink', $permalink, $post_language['language_code'] );

    return $wpml_permalink;
}

endif;
