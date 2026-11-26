<?php
/**
 * AboutSpec: /.well-known/about.md
 *
 * @link https://aboutspec.org/
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Socialspec;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * The About page as Markdown.
 */
class About implements Document {

	/**
	 * Filters that add something of their own below the content: Sharing and Likes.
	 */
	const ADDITIONS = array( 'sharing_show', 'wpl_is_likes_visible' );

	/**
	 * The media type.
	 *
	 * @return string
	 */
	public function get_content_type() {
		return 'text/markdown';
	}

	/**
	 * The Markdown document: the title and the content of the About page.
	 *
	 * @return string|null Null if no public About page is set.
	 */
	public function get_content() {
		$page = self::get_page();

		if ( ! $page ) {
			return null;
		}

		// Defines wp_html_to_markdown() if the site does not have it.
		require_once __DIR__ . '/../lib/wp-html-to-markdown.php';

		$html     = self::render( $page );
		$title    = trim( wp_html_to_markdown( '<h1>' . get_the_title( $page ) . '</h1>' ) );
		$markdown = trim( wp_html_to_markdown( $html ) );

		// HTML is valid Markdown, so it is the fallback if it cannot be converted.
		if ( '' === $markdown ) {
			$markdown = trim( wp_kses_post( $html ) );
		}

		if ( '' !== $title ) {
			$markdown = rtrim( $title . "\n\n" . $markdown );
		}

		return $markdown . "\n";
	}

	/**
	 * The About page, if it is set and everyone can see it.
	 *
	 * @return \WP_Post|null
	 */
	private static function get_page() {
		/**
		 * Filters the page published as /.well-known/about.md.
		 *
		 * @since $$next-version$$
		 *
		 * @param int|\WP_Post $page The page, or 0 for none. Defaults to the `jetpack_social_about_page` option.
		 */
		$page = apply_filters( 'jetpack_social_about_page', (int) get_option( 'jetpack_social_about_page' ) );

		// get_post( 0 ) would return the global post.
		$page = $page ? get_post( $page ) : null;

		if ( ! $page instanceof \WP_Post || '' !== $page->post_password || ! is_post_publicly_viewable( $page ) ) {
			return null;
		}

		return $page;
	}

	/**
	 * Renders the page content like the theme would, so access checks on the_content apply.
	 *
	 * Blocks and shortcodes may read the global post, so it is set up for the duration.
	 *
	 * @param \WP_Post $page The page.
	 * @return string
	 */
	private static function render( \WP_Post $page ) {
		$previous = $GLOBALS['post'] ?? null;

		$GLOBALS['post'] = $page; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		setup_postdata( $page );

		foreach ( self::ADDITIONS as $hook ) {
			add_filter( $hook, '__return_false', PHP_INT_MAX );
		}

		/** This filter is documented in wp-includes/post-template.php */
		$html = (string) apply_filters( 'the_content', $page->post_content );

		foreach ( self::ADDITIONS as $hook ) {
			remove_filter( $hook, '__return_false', PHP_INT_MAX );
		}

		$GLOBALS['post'] = $previous; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		wp_reset_postdata();

		return $html;
	}
}
