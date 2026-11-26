<?php
/**
 * AboutSpec: /.well-known/about.md
 *
 * @link https://aboutspec.org/
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Socialspec;

use Automattic\Jetpack\Publicize\Lib\Markdown;

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
	 * @return string|null Null if there is no public About page, or the page is empty.
	 */
	public function get_content() {
		$page = self::get_page();

		if ( ! $page ) {
			return null;
		}

		$html     = self::render( $page );
		$title    = self::to_markdown( '<h1>' . get_the_title( $page ) . '</h1>' );
		$markdown = self::to_markdown( $html );

		// HTML is valid Markdown, so it is the fallback if it cannot be converted.
		if ( '' === $markdown ) {
			$markdown = trim( wp_kses_post( $html ) );
		}

		if ( '' !== $title ) {
			$markdown = rtrim( $title . "\n\n" . $markdown );
		}

		return '' !== $markdown ? $markdown . "\n" : null;
	}

	/**
	 * Converts HTML to Markdown with the html-to-md library where the site has it, and with our converter otherwise.
	 *
	 * @link https://github.com/dmsnell/html-to-md
	 *
	 * @param string $html The HTML.
	 * @return string The Markdown, or an empty string if the HTML cannot be converted.
	 */
	private static function to_markdown( $html ) {
		$markdown = '';

		if ( function_exists( 'wp_html_to_markdown' ) ) {
			try {
				// @phan-suppress-next-line PhanUndeclaredFunction -- From the html-to-md library, on sites that have it.
				$markdown = trim( (string) wp_html_to_markdown( $html ) );
			} catch ( \Throwable $e ) {
				// The library throws on HTML it cannot handle.
				$markdown = '';
			}
		}

		return '' !== $markdown ? $markdown : trim( (string) Markdown::from_html( $html ) );
	}

	/**
	 * The About page, if everyone can see it: the page from the settings, or the one at /about.
	 *
	 * @return \WP_Post|null
	 */
	private static function get_page() {
		/**
		 * Filters the page published as /.well-known/about.md.
		 *
		 * @since $$next-version$$
		 *
		 * @param int|\WP_Post $page The page from the settings, or the page at /about until one is picked. 0 for none.
		 */
		$page = apply_filters( 'jetpack_social_about_page', Socialspec::get_about_page_id() );

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

		// A callback of its own, so removing it cannot remove another plugin's `__return_false`.
		$hide = static function () {
			return false;
		};

		foreach ( self::ADDITIONS as $hook ) {
			add_filter( $hook, $hide, PHP_INT_MAX );
		}

		/** This filter is documented in wp-includes/post-template.php */
		$html = (string) apply_filters( 'the_content', $page->post_content );

		foreach ( self::ADDITIONS as $hook ) {
			remove_filter( $hook, $hide, PHP_INT_MAX );
		}

		// In this order: wp_reset_postdata() sets the global post to the one of the main query.
		wp_reset_postdata();
		$GLOBALS['post'] = $previous; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		return $html;
	}
}
