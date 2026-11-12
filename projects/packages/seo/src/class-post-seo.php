<?php
/**
 * Per-post SEO fields: the description and Schema.org type a post emits.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Block_Scanner;
use WP_Post;

/**
 * Reads a post's SEO description and schema type.
 *
 * @since $$next-version$$
 */
class Post_Seo {

	/**
	 * Schema.org types the per-post schema-type meta can hold; '' means no override.
	 */
	const ALLOWED_SCHEMA_TYPES = array( '', 'article', 'faq' );

	/**
	 * Build the meta description for a post on its own singular view.
	 *
	 * @param WP_Post|int|null $post Post, post ID, or null for the global post.
	 * @return string Post description or empty string.
	 */
	public static function get_description( $post = null ) {
		$post = get_post( $post );
		if ( ! ( $post instanceof WP_Post ) ) {
			return '';
		}

		// Check the post being described, not the global one.
		if ( post_password_required( $post ) || ! is_singular() ) {
			return '';
		}

		$custom_description = self::get_custom_description( $post );
		if ( ! empty( $custom_description ) ) {
			return $custom_description;
		}

		if ( ! empty( $post->post_excerpt ) ) {
			return $post->post_excerpt;
		}

		// The fall-through reads raw post_content, which never passes the `the_content` paywall.
		$content = $post->post_content;
		if ( Content_Gate::is_gated( $post ) ) {
			$content = Content_Gate::public_teaser( $post );
			if ( '' === $content ) {
				return '';
			}
		}

		// WordPress.com can load an older block-delimiter copy without remove_blocks(); the content then keeps its Query Loop blocks.
		if ( ! method_exists( Block_Scanner::class, 'remove_blocks' ) ) {
			return $content;
		}

		// A Query Loop block lists other posts, so its text doesn't describe this one.
		return Block_Scanner::remove_blocks( $content, 'query' );
	}

	/**
	 * The custom meta description saved for a post, when SEO output is live.
	 *
	 * @param WP_Post|int|null $post Post, post ID, or null for the global post.
	 * @return string Custom description or empty string.
	 */
	public static function get_custom_description( $post = null ) {
		$post = get_post( $post );
		if ( ! ( $post instanceof WP_Post ) ) {
			return '';
		}

		$custom_description = get_post_meta( $post->ID, Content_Coverage::META_DESCRIPTION, true );

		if ( empty( $custom_description ) || ! Seo_Tools::is_enabled() ) {
			return '';
		}

		return $custom_description;
	}

	/**
	 * Sanitize a schema type to the allowed list; unknown values become ''.
	 *
	 * @param mixed $value The submitted value.
	 * @return string A value from self::ALLOWED_SCHEMA_TYPES.
	 */
	public static function sanitize_schema_type( $value ) {
		$value = is_string( $value ) ? sanitize_key( $value ) : '';
		return in_array( $value, self::ALLOWED_SCHEMA_TYPES, true ) ? $value : '';
	}

	/**
	 * Get the per-post schema-type override, if any.
	 *
	 * @param WP_Post|int|null $post Post, post ID, or null for the global post.
	 * @return string A value from self::ALLOWED_SCHEMA_TYPES ('' = no override).
	 */
	public static function get_schema_type( $post = null ) {
		$post = get_post( $post );
		if ( ! ( $post instanceof WP_Post ) ) {
			return '';
		}

		return self::sanitize_schema_type( (string) get_post_meta( $post->ID, Content_Coverage::META_SCHEMA_TYPE, true ) );
	}
}
