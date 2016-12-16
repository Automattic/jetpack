<?php

/**
 * Class containing utility static methods for managing SEO custom descriptions for Posts and Pages.
 */
class Jetpack_SEO_Posts {
	/**
	 * Key of the post meta value that will be used to store post custom description.
	 */
	const DESCRIPTION_META_KEY = 'advanced_seo_description';

	/**
	 * Build meta description for post SEO.
	 *
	 * @param WP_Post $post Source of data for custom description.
	 *
	 * @return string Post description or empty string.
	 */
	public static function get_post_description( $post ) {
		if ( empty( $post ) ) {
			return '';
		}

		if ( post_password_required() || ! is_singular() ) {
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
	 * Returns post's custom meta description if it is set, and if
	 * SEO tools are enabled for current blog.
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

		if ( empty( $custom_description ) || ! Jetpack_SEO_Utils::is_enabled_jetpack_seo() ) {
			return '';
		}

		return $custom_description;
	}
}
