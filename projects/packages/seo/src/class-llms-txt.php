<?php
/**
 * Generation and serving of the site's llms.txt.
 *
 * Serves a root-level `/llms.txt` — the emerging convention (llmstxt.org) for
 * giving AI assistants a curated, Markdown map of a site's key content. Gated on
 * the durable option `jetpack_seo_llms_txt_enabled` (round-tripped through the
 * existing `/jetpack/v4/settings` endpoint by the AI tab).
 *
 * Serving approach: this hooks `template_redirect` and inspects the raw request
 * path rather than registering a rewrite rule, so it needs no rewrite flush and
 * works under any permalink structure. The tradeoff — it matches a root-level
 * request only, and like robots.txt won't apply on a multisite subdirectory or
 * a site fronted by a static file. A proper rewrite rule is worth weighing for
 * the production feature (Phase 1: llms.txt Generation).
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Builds and serves the site's llms.txt.
 */
class Llms_Txt {

	/**
	 * Option recording whether llms.txt generation is enabled. Mirrored as a
	 * literal in the plugin's settings endpoint whitelist (`jp_group =>
	 * 'seo-tools'`).
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_seo_llms_txt_enabled';

	/**
	 * Max pages and posts listed, so a large site doesn't dump its whole tree.
	 */
	const MAX_PAGES = 50;
	const MAX_POSTS = 50;

	/**
	 * Wire the front-end request handler.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'template_redirect', array( __CLASS__, 'maybe_serve' ) );
	}

	/**
	 * Whether llms.txt generation is currently switched on.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return (bool) get_option( self::OPTION, false );
	}

	/**
	 * Whether WordPress can actually serve the dynamic `/llms.txt` on this site.
	 *
	 * Two ways it can't, and the toggle then silently does nothing:
	 *  - A physical `llms.txt` sits at the site root, so the web server delivers
	 *    that file directly and WordPress never runs for the request. Detected
	 *    here.
	 *  - The host fronts WordPress for root-level paths (some managed hosts /
	 *    static-file setups). PHP can't see that, so hosts can signal it via the
	 *    `jetpack_seo_llms_txt_can_serve` filter.
	 *
	 * When this returns false the GEO tab shows an honest "can't take effect"
	 * notice instead of letting the admin believe the file is live.
	 *
	 * @return bool
	 */
	public static function can_serve() {
		$has_static_file = defined( 'ABSPATH' ) && file_exists( ABSPATH . 'llms.txt' );

		/**
		 * Filters whether WordPress can serve the dynamic `/llms.txt`. Hosts that
		 * intercept root-level paths before WordPress runs can return false to
		 * surface the honest "can't take effect" state in the SEO dashboard.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $can_serve Whether WordPress can serve `/llms.txt`.
		 */
		return (bool) apply_filters( 'jetpack_seo_llms_txt_can_serve', ! $has_static_file );
	}

	/**
	 * The site-root-relative request path, normalized without surrounding
	 * slashes (e.g. `llms.txt`).
	 *
	 * @return string
	 */
	private static function request_path() {
		if ( empty( $_SERVER['REQUEST_URI'] ) ) {
			return '';
		}
		$uri  = esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) );
		$path = (string) wp_parse_url( $uri, PHP_URL_PATH );
		return trim( $path, '/' );
	}

	/**
	 * Serve llms.txt when enabled and the request is for it; otherwise no-op.
	 *
	 * @return void
	 */
	public static function maybe_serve() {
		if ( ! self::is_enabled() || 'llms.txt' !== self::request_path() ) {
			return;
		}

		nocache_headers();
		status_header( 200 );
		header( 'Content-Type: text/plain; charset=utf-8' );

		// Content is plain-text Markdown; not HTML, so it's emitted as-is.
		echo self::generate(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		exit;
	}

	/**
	 * Build the llms.txt Markdown document from site identity, published pages,
	 * and recent posts.
	 *
	 * @return string
	 */
	public static function generate() {
		$name        = wp_strip_all_tags( get_bloginfo( 'name' ) );
		$description = wp_strip_all_tags( get_bloginfo( 'description' ) );

		$blocks = array();

		$blocks[] = '# ' . ( '' !== $name ? $name : home_url() );
		if ( '' !== $description ) {
			$blocks[] = '> ' . $description;
		}

		$pages = self::link_list(
			get_posts(
				array(
					'post_type'      => 'page',
					'post_status'    => 'publish',
					'posts_per_page' => self::MAX_PAGES,
					'orderby'        => 'menu_order title',
					'order'          => 'ASC',
				)
			)
		);
		if ( '' !== $pages ) {
			$blocks[] = "## Pages\n\n" . $pages;
		}

		$posts = self::link_list(
			get_posts(
				array(
					'post_type'      => 'post',
					'post_status'    => 'publish',
					'posts_per_page' => self::MAX_POSTS,
					'orderby'        => 'date',
					'order'          => 'DESC',
				)
			)
		);
		if ( '' !== $posts ) {
			$blocks[] = "## Posts\n\n" . $posts;
		}

		return implode( "\n\n", $blocks ) . "\n";
	}

	/**
	 * Render a list of posts as llms.txt link lines:
	 * `- [Title](url): summary`.
	 *
	 * @param \WP_Post[] $posts Posts to render.
	 * @return string Newline-joined link lines, or '' when there are none.
	 */
	private static function link_list( $posts ) {
		$lines = array();
		foreach ( $posts as $post ) {
			$title = wp_strip_all_tags( get_the_title( $post ) );
			if ( '' === $title ) {
				$title = __( '(untitled)', 'jetpack-seo' );
			}
			$url  = get_permalink( $post );
			$line = '- [' . $title . '](' . $url . ')';

			$summary = self::summary( $post );
			if ( '' !== $summary ) {
				$line .= ': ' . $summary;
			}
			$lines[] = $line;
		}
		return implode( "\n", $lines );
	}

	/**
	 * A short, single-line summary for a post: its excerpt when set, otherwise a
	 * trimmed slice of the content.
	 *
	 * @param \WP_Post $post Post to summarize.
	 * @return string
	 */
	private static function summary( $post ) {
		$raw = has_excerpt( $post )
			? get_the_excerpt( $post )
			: wp_trim_words( wp_strip_all_tags( strip_shortcodes( $post->post_content ) ), 30, '' );

		// Collapse whitespace so a link line stays on one row.
		return trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( $raw ) ) );
	}
}
