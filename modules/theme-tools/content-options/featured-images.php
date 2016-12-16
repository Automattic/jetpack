<?php
/**
 * The function to prevent for Featured Images to be displayed in a theme.
 */
function jetpack_featured_images_remove_post_thumbnail( $metadata, $object_id, $meta_key, $single ) {
	$opts = jetpack_featured_images_get_settings();

	// Returns false if the archive option or singular option is unticked.
	if ( ( true === $opts['archive'] && ( is_home() || is_archive() || is_search() ) && ! $opts['archive-option'] && ( isset( $meta_key ) && '_thumbnail_id' === $meta_key ) && in_the_loop() )
		|| ( true === $opts['post'] && is_single() && ! $opts['post-option'] && ( isset( $meta_key ) && '_thumbnail_id' === $meta_key ) && in_the_loop() )
		|| ( true === $opts['page'] && is_singular() && is_page() && ! $opts['page-option'] && ( isset( $meta_key ) && '_thumbnail_id' === $meta_key ) && in_the_loop() ) ) {
		return false;
	} else {
		return $metadata;
	}
}
add_filter( 'get_post_metadata', 'jetpack_featured_images_remove_post_thumbnail', true, 4 );
