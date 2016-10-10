<?php

/**
 * Build description for post SEO
 *
 * @param WP_Post $post Source of data for custom description
 *
 * @return string Post description or empty string
 */
function get_post_description( $post ) {
	if ( post_password_required() ) {
		return '';
	}

	// Business users can overwrite the description
	$custom_description = get_post_custom_description( $post );

	if ( ! empty( $custom_description ) ) {
		return $custom_description;
	}

	if ( ! empty( $post->post_excerpt ) ) {
		return $post->post_excerpt;
	}

	return $post->post_content;
}

/**
 * Returns post's custom description if it is set and if
 * advanced SEO is enabled for current blog.
 *
 * @param WP_Post $post Source of data for custom description
 *
 * @return string Custom description or empty string
 */
function get_post_custom_description( $post ) {
	if ( empty( $post ) ) {
		return '';
	}

	$custom_description = get_post_meta( $post->ID, 'advanced_seo_description', true );

	if ( empty( $custom_description ) || ! is_enabled_advanced_seo() ) {
		return '';
	}

	return $custom_description;
}
