<?php
/**
 * The function to prevent for Featured Images to be displayed in a theme.
 */
function jetpack_featured_images_remove_post_thumbnail( $metadata, $object_id, $meta_key, $single ) {
	$opts = jetpack_featured_images_get_settings();

	// Automatically return metadata if it's a PayPal product - we don't want to hide the Featured Image.
	if ( 'jp_pay_product' === get_post_type( $object_id ) ) {
		return $metadata;
	}

	// Return false if the archive option or singular option is unticked.
	if (
		( true === $opts['archive']
			&& ( is_home() || is_archive() || is_search() )
			&& ! $opts['archive-option']
			&& ( isset( $meta_key )
			&& '_thumbnail_id' === $meta_key )
			&& in_the_loop()
		)
		|| ( true === $opts['post']
			&& is_single()
			&& ! jetpack_is_product()
			&& ! $opts['post-option']
			&& ( isset( $meta_key )
			&& '_thumbnail_id' === $meta_key )
			&& in_the_loop()
		)
		|| ( true === $opts['page']
			&& is_singular()
			&& is_page()
			&& ! $opts['page-option']
			&& ( isset( $meta_key )
			&& '_thumbnail_id' === $meta_key )
			&& in_the_loop()
		)
		|| ( true === $opts['portfolio']
			&& post_type_exists( 'jetpack-portfolio' )
			&& is_singular( 'jetpack-portfolio' )
			&& ! $opts['portfolio-option']
			&& ( isset( $meta_key )
			&& '_thumbnail_id' === $meta_key )
			&& in_the_loop()
		)
	) {
		return false;
	} else {
		return $metadata;
	}
}
add_filter( 'get_post_metadata', 'jetpack_featured_images_remove_post_thumbnail', true, 4 );

/**
 * Check if we are in a WooCommerce Product in order to exclude it from the is_single check.
 */
function jetpack_is_product() {
	return ( function_exists( 'is_product' ) ) ? is_product() : false;
}
