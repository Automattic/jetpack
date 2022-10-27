<?php
/**
 * Used by the blogging prompt feature.
 *
 * @package automattic/jetpack
 */

add_filter( 'rest_api_allowed_public_metadata', 'jetpack_blogging_prompts_add_meta_data' );

/**
 * Adds the blogging prompt key post metq to the list of allowed post meta to be updated by rest api.
 *
 * @param array $keys Array of post meta keys that are allowed public metadata.
 *
 * @return array
 */
function jetpack_blogging_prompts_add_meta_data( $keys ) {
	$keys[] = '_jetpack_blogging_prompt_key';
	return $keys;
}

/**
 * Determines if the site might have a blog.
 *
 * @return bool
 */
function jetpack_is_potential_blogging_site() {
	// During site creation the "Write" intent was choose.
	if ( 'write' === get_option( 'site_intent', '' ) ) {
		return true;
	}

	// The site is set up to be a blog.
	if ( 'posts' === get_option( 'show_on_front' ) ) {
		return true;
	}

	// They are choosing to set the posts to be set to 0.
	$is_posts_page_set = (int) get_option( 'page_for_posts' ) > 0;
	if ( $is_posts_page_set ) {
		return true;
	}

	// Lets count the posts.
	$count_posts_object = wp_count_posts( 'post' );

	if ( $count_posts_object->publish >= 2 ) {
		return true;
	}

	$count_posts = (int) $count_posts_object->publish + (int) $count_posts_object->future + (int) $count_posts_object->draft;

	return $count_posts >= 100;
}
