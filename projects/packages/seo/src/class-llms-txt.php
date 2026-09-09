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
 * a site fronted by a static file. Hardening the serving path (a rewrite rule,
 * caching) is tracked separately in JETPACK-1830.
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
	 * Max items listed per supported content type, so a large site doesn't dump
	 * its whole tree.
	 */
	const MAX_POSTS_PER_TYPE = 50;

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
		 * @since 0.7.0
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

		// Respect the site's "discourage search engines" setting. When indexing is
		// discouraged, WordPress emits `Disallow: /` in robots.txt — serving an AI
		// content map would contradict that signal, and would expose a content map
		// on staging/private sites, so we don't serve it.
		if ( ! get_option( 'blog_public' ) ) {
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
	 * Build the llms.txt Markdown document from site identity and published
	 * supported content types.
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

		foreach ( self::get_llms_post_type_objects() as $post_type ) {
			$list = self::link_list( self::get_posts_for_type( $post_type->name ) );
			if ( '' !== $list ) {
				$blocks[] = '## ' . self::section_title( $post_type ) . "\n\n" . $list;
			}
		}

		return implode( "\n\n", $blocks ) . "\n";
	}

	/**
	 * Return supported post types in llms.txt reading order.
	 *
	 * @return \WP_Post_Type[]
	 */
	private static function get_llms_post_type_objects() {
		$post_types = Post_Types::get_supported_content_type_objects();
		$ordered    = array();

		foreach ( array( 'page', 'post' ) as $post_type ) {
			if ( isset( $post_types[ $post_type ] ) ) {
				$ordered[ $post_type ] = $post_types[ $post_type ];
				unset( $post_types[ $post_type ] );
			}
		}

		return array_merge( $ordered, $post_types );
	}

	/**
	 * Fetch published content for a supported post type.
	 *
	 * @param string $post_type Post type slug.
	 * @return \WP_Post[]
	 */
	private static function get_posts_for_type( $post_type ) {
		$args = array(
			'post_type'        => $post_type,
			'post_status'      => 'publish',
			'has_password'     => false,
			'posts_per_page'   => self::MAX_POSTS_PER_TYPE,
			'suppress_filters' => false,
			'meta_query'       => array(
				// WP_Query's meta_query takes its `relation` as a keyed entry alongside
				// the positional clauses below; the mixed shape is required, not a slip.
				// @phan-suppress-next-line PhanPluginMixedKeyNoKey
				'relation' => 'OR',
				array(
					'key'     => Content_Coverage::META_NOINDEX,
					'compare' => 'NOT EXISTS',
				),
				array(
					'key'     => Content_Coverage::META_NOINDEX,
					'value'   => '1',
					'compare' => '!=',
				),
			),
		);

		if ( 'page' === $post_type ) {
			$args['orderby'] = 'menu_order title';
			$args['order']   = 'ASC';
		} else {
			$args['orderby'] = 'date';
			$args['order']   = 'DESC';
		}

		return get_posts( $args );
	}

	/**
	 * Section title for a supported post type.
	 *
	 * @param \WP_Post_Type $post_type Post type object.
	 * @return string
	 */
	private static function section_title( $post_type ) {
		if ( 'page' === $post_type->name ) {
			return __( 'Pages', 'jetpack-seo' );
		}
		if ( 'post' === $post_type->name ) {
			return __( 'Posts', 'jetpack-seo' );
		}
		return wp_strip_all_tags( $post_type->label );
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
			// Password-protected posts are `publish` status but their content is
			// intentionally gated; keep them out of the public llms.txt entirely.
			if ( ! empty( $post->post_password ) ) {
				continue;
			}

			// Collapse whitespace (incl. newlines) so each entry stays on one line.
			$title = trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( get_the_title( $post ) ) ) );
			if ( '' === $title ) {
				$title = __( '(untitled)', 'jetpack-seo' );
			}
			// Escape brackets so a title can't break the `[title](url)` link syntax.
			$title = str_replace( array( '[', ']' ), array( '\[', '\]' ), $title );
			$url   = esc_url_raw( (string) get_permalink( $post ) );
			$line  = '- [' . $title . '](' . $url . ')';

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
		if ( has_excerpt( $post ) ) {
			$raw = get_the_excerpt( $post );
		} elseif (
			get_post_meta( $post->ID, '_jetpack_memberships_contains_paid_content', true )
			|| get_post_meta( $post->ID, '_jetpack_memberships_contains_paywalled_content', true )
			|| has_block( 'premium-content/container', $post )
			|| has_block( 'jetpack/paywall', $post )
		) {
			return '';
		} else {
			$raw = wp_trim_words( wp_strip_all_tags( strip_shortcodes( $post->post_content ) ), 30, '' );
		}

		// Collapse whitespace so a link line stays on one row.
		return trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( $raw ) ) );
	}
}
