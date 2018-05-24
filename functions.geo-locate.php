<?php

/**
 * Get the geo-location data associated with the supplied post ID, if it's available
 * and marked as being available for public display.  The returned array will contain
 * "latitude", "longitude" and "label" keys.
 *
 * If you do not supply a value for $post_id, the global $post will be used, if
 * available.
 *
 * @param integer|null $post_id
 *
 * @return array|null
 */
function jetpack_geo_get_data( $post_id = null) {
	$geo = Jetpack_Geo_Locate::init();

	if ( ! $post_id ) {
		$post_id = $geo->get_post_id();
	}

	$meta_values = $geo->get_meta_values( $post_id );

	if ( ! $meta_values['is_public'] || ! $meta_values['is_populated'] ) {
		return null;
	}

	return array(
		'latitude'  => $meta_values['latitude'],
		'longitude' => $meta_values['longitude'],
		'label'     => $meta_values['label']
	);
}

/**
 * Display the label HTML for the geo-location information associated with the supplied
 * post ID.
 *
 * If you do not supply a value for $post_id, the global $post will be used, if
 * available.
 *
 * @param integer|null $post_id
 *
 * @return void
 */
function jetpack_geo_display_location( $post_id = null ) {
	echo jetpack_geo_get_location( $post_id );
}

/**
 * Return the label HTML for the geo-location information associated with the supplied
 * post ID.
 *
 * If you do not supply a value for $post_id, the global $post will be used, if
 * available.
 *
 * @param integer|null $post_id
 *
 * @return string
 */
function jetpack_geo_get_location( $post_id = null ) {
	return Jetpack_Geo_Locate::init()->get_location_label( $post_id );
}
