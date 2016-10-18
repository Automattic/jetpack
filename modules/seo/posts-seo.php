<?php

class A8C_SEO_Posts {
	/*
	 * Name of the meta value that will be used to store post custom description.
	 */
	const DESCRIPTION_META_KEY = 'advanced_seo_description';

	/**
	 * Build description for post SEO
	 *
	 * @param WP_Post $post Source of data for custom description
	 *
	 * @return string Post description or empty string
	 */
	public static function get_post_description( $post ) {
		if ( post_password_required() ) {
			return '';
		}

		// Business users can overwrite the description
		$custom_description = self::get_post_custom_description( $post );

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
	public static function get_post_custom_description( $post ) {
		if ( empty( $post ) ) {
			return '';
		}

		$custom_description = get_post_meta( $post->ID, self::DESCRIPTION_META_KEY, true );

		if ( empty( $custom_description ) || ! A8C_SEO::is_enabled_advanced_seo() ) {
			return '';
		}

		return $custom_description;
	}
}
