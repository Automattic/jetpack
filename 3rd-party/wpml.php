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
function jetpack_wpml_transient_language( $transient ) {
    return $transient . '_' . apply_filters( 'wpml_current_language', NULL );
}

add_filter( 'jetpack_sitemap_transient', 'jetpack_wpml_transient_language', 10, 1 );
add_filter( 'jetpack_news_sitemap_transient', 'jetpack_wpml_transient_language', 10, 1 );
add_filter( 'jetpack_sitemap_xsl_transient', 'jetpack_wpml_transient_language', 10, 1 ) ;

/**
 * Clear the multilingual sitemap cache when a sitemap action has changed.
 *
 * @param string $transient Transient name. Expected to not be SQL-escaped.
 */
function jetpack_wpml_transient_delete( $transient ) {
    $languages = apply_filters( 'wpml_active_languages', NULL );

    // Delete transient for every active language.
    foreach ( $languages as $language ) {
        delete_transient( $transient . '_' . $language['language_code'] );
    }
}

add_action( 'delete_transient_jetpack_sitemap', 'jetpack_wpml_transient_delete', 10, 1 ) ;
add_action( 'delete_transient_jetpack_news_sitemap', 'jetpack_wpml_transient_delete', 10, 1 );

/**
 * Translate permalink according to post language.
 *
 * @param int $post_id Post ID.
 * @return string|false The permalink URL.
 */
function jetpack_wpml_translate_permalink( $permalink, $post_id ) {
    $post_language  = apply_filters( 'wpml_post_language_details', NULL, $post_id );

    $wpml_permalink = apply_filters( 'wpml_permalink', $permalink, $post_language['language_code'] );

    return $wpml_permalink;
}

add_filter( 'jetpack_sitemap_post_permalink', 'jetpack_wpml_translate_permalink', 10, 2 );

/**
 * Using direct query to get right posts for current language.
 *
 * @param array $posts All queried published posts.
 * @param array $post_types Post type array.
 * @param string $post_types_in Post types already prepared for DB.
 *
 * @return array|null|object Posts array in the current language.
 */
function jetpack_wpml_sitemap_posts_per_language( $posts, $post_types, $post_types_in ) {
	global $wpdb;

	$prepared_data = jetpack_wpml_sitemap_posts_data_prepare( $wpdb, $post_types );

	$posts = $wpdb->get_results(
		"SELECT ID, post_type, post_modified_gmt, comment_count 
		FROM $wpdb->posts
			INNER JOIN {$prepared_data['wpml_table']} ON ID = element_id
		WHERE 
			post_status = 'publish' 
			AND post_type IN ( {$post_types_in} ) 
			AND element_type IN ( {$prepared_data['$element_types_in']} )
			AND language_code = {$prepared_data['current_lang']}
		ORDER BY post_modified_gmt 
		DESC LIMIT 1000" );

	return $posts;
}

add_filter( 'jetpack_sitemap_posts', 'jetpack_wpml_sitemap_posts_per_language', 10, 3 );

/**
 * Using direct query to get right news posts for current language.
 *
 * @param array $posts All queried published posts.
 * @param array $post_types Post type array.
 * @param string $post_types_in Post types already prepared for DB.
 * @param string $cur_datetime Contains a date-time string.
 * @param int $limit Number of entries to include in news sitemap.
 *
 * @return array|null|object Posts array in the current language.
 */
function jetpack_wpml_news_sitemap_posts_per_language( $posts, $post_types, $post_types_in_string, $cur_datetime, $limit ) {
	global $wpdb;

	$prepared_data = jetpack_wpml_sitemap_posts_data_prepare( $wpdb, $post_types );

	$posts = $wpdb->get_results(
		$wpdb->prepare( "
		SELECT p.ID, p.post_title, p.post_type, p.post_date, p.post_name, p.post_date_gmt, GROUP_CONCAT(t.name SEPARATOR ', ') AS keywords
		FROM
			$wpdb->posts AS p LEFT JOIN $wpdb->term_relationships AS r ON p.ID = r.object_id
			LEFT JOIN $wpdb->term_taxonomy AS tt ON r.term_taxonomy_id = tt.term_taxonomy_id AND tt.taxonomy = 'post_tag'
			LEFT JOIN $wpdb->terms AS t ON tt.term_id = t.term_id
			LEFT JOIN {$prepared_data['wpml_table']} AS w ON p.ID = w.element_id
		WHERE
			post_status='publish' 
			AND post_type IN ( {$post_types_in_string} ) 	
			AND w.element_type IN ( {$prepared_data['$element_types_in']} )
			AND w.language_code = {$prepared_data['current_lang']}
			AND post_date_gmt > (%s - INTERVAL 2 DAY)
		GROUP BY p.ID
		ORDER BY p.post_date_gmt DESC LIMIT %d",
			$cur_datetime,
			$limit
		)
	);

	return $posts;
}

add_filter( 'jetpack_news_sitemap_posts', 'jetpack_wpml_news_sitemap_posts_per_language', 10, 5 );

/**
 * Prepare sitemap posts query data for the database.
 *
 * @param object $wpdb WordPress DB Object
 * @param array $post_types Post type array.
 *
 * @return array Returns WPML table name, current language code and WPML element types.
 */
function jetpack_wpml_sitemap_posts_data_prepare( $wpdb, $post_types ) {
	$data = array(
		'wpml_table'   => $wpdb->prefix . 'icl_translations',
		'current_lang' => $wpdb->prepare( '%s', apply_filters( 'wpml_current_language', null ) )
	);

	// Post types are stored with "post_" prefix in icl_translations table.
	$element_types = preg_filter( '/^/', 'post_', (array) $post_types );

	// We are preparing that data too.
	$element_types_in = array();
	foreach ( (array) $element_types as $element_type ) {
		$element_types_in[] = $wpdb->prepare( '%s', $element_type );
	}
	$data['$element_types_in'] = join( ",", $element_types_in );

	return $data;
}

endif;
