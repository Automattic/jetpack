<?php
/**
 * Generation and serving of the site's llms.txt.
 *
 * Serves a root-level `/llms.txt` — the emerging convention (llmstxt.org) for
 * giving AI assistants a curated, Markdown map of a site's key content. Gated on
 * the durable option `jetpack_seo_llms_txt_enabled` (round-tripped through core's
 * `/wp/v2/settings` endpoint by the GEO tab).
 *
 * Serving approach: this hooks `template_redirect` and inspects the raw request
 * path rather than registering a rewrite rule, so it needs no rewrite flush and
 * works under any permalink structure. The tradeoff — it matches a root-level
 * request only, and like robots.txt won't apply on a multisite subdirectory or
 * a site fronted by a static file. A rewrite rule is tracked separately in
 * JETPACK-1830.
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
	 * Transient holding the last built llms.txt until {@see clear_cache()} runs.
	 */
	const CACHE_KEY = 'jetpack_seo_llms_txt';

	/**
	 * How long a stored llms.txt is kept at most, for changes no hook reports.
	 */
	const CACHE_TTL = 12 * HOUR_IN_SECONDS;

	/**
	 * How long CDNs and page caches may keep a served llms.txt.
	 */
	const HTTP_MAX_AGE = 15 * MINUTE_IN_SECONDS;

	/**
	 * Options whose changes alter llms.txt.
	 */
	const CACHE_OPTIONS = array( 'blogname', 'blogdescription', 'blog_public', 'show_on_front', 'page_on_front', 'permalink_structure', 'home', 'siteurl', 'WPLANG' );

	/**
	 * Post meta that changes whether or how a post appears in llms.txt, including the
	 * always-include switch and page template the menu ranking reads.
	 */
	const CACHE_META = array(
		Content_Coverage::META_NOINDEX,
		Content_Gate::META_CONTAINS_PAID_CONTENT,
		Content_Gate::META_CONTAINS_PAYWALLED_CONTENT,
		Content_Gate::META_NEWSLETTER_ACCESS,
		'jetpack_seo_llms_txt_always_include',
		'_wp_page_template',
	);

	/**
	 * Non-public post types that still shape llms.txt: menus and the theme parts that hold them.
	 */
	const CACHE_POST_TYPES = array( 'nav_menu_item', 'wp_navigation', 'wp_template', 'wp_template_part', 'wp_block' );

	/**
	 * Wire the front-end request handler.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'template_redirect', array( __CLASS__, 'maybe_serve' ) );
	}

	/**
	 * Clear the stored copy when something it lists changes. Registered even while llms.txt
	 * can't be served, so a copy stored earlier is not served stale once it can again.
	 *
	 * @return void
	 */
	public static function register_invalidation() {
		foreach ( array( 'wp_update_nav_menu', 'switch_theme', 'customize_save_after', 'activated_plugin', 'deactivated_plugin' ) as $hook ) {
			add_action( $hook, array( __CLASS__, 'clear_cache' ) );
		}
		add_action( 'clean_post_cache', array( __CLASS__, 'clear_cache_for_post' ), 10, 2 );
		// Any taxonomy: besides menus, a category's slug or parent can be part of post URLs.
		add_action( 'clean_term_cache', array( __CLASS__, 'clear_cache' ) );
		foreach ( array( 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ) as $hook ) {
			add_action( $hook, array( __CLASS__, 'clear_cache_for_meta' ), 10, 3 );
		}
		foreach ( array( 'add_option_', 'update_option_', 'delete_option_' ) as $prefix ) {
			foreach ( array_merge( self::CACHE_OPTIONS, array( 'theme_mods_' . get_stylesheet() ) ) as $option ) {
				add_action( $prefix . $option, array( __CLASS__, 'clear_cache' ) );
			}
			add_action( $prefix . self::OPTION, array( __CLASS__, 'reset_cache' ) );
		}
	}

	/**
	 * Drop the stored llms.txt so the next request rebuilds it.
	 *
	 * @return void
	 */
	public static function clear_cache() {
		// The lookup is cached when nothing is stored, so bulk edits and imports don't query on every write.
		if ( false !== get_transient( self::CACHE_KEY ) && delete_transient( self::CACHE_KEY ) ) {
			self::purge_edge_cache();
		}
	}

	/**
	 * Drop the stored llms.txt and always purge the edge copy, which can outlive an expired
	 * stored one. Runs when llms.txt is turned off or on, the owner's way to reset it.
	 *
	 * @return void
	 */
	public static function reset_cache() {
		delete_transient( self::CACHE_KEY );
		self::purge_edge_cache();
	}

	/**
	 * Ask WordPress.com to drop its edge copy of llms.txt on every domain of the site, as
	 * it does for robots.txt; a no-op elsewhere.
	 *
	 * @return void
	 */
	private static function purge_edge_cache() {
		if ( ! function_exists( 'wpcom_get_all_blog_domains_with_path' ) || ! function_exists( 'queue_async_job' ) ) {
			return;
		}
		// @phan-suppress-next-line PhanUndeclaredFunction -- WordPress.com-only and guarded above; remove once wpcom stubs declare it.
		$urls = wpcom_get_all_blog_domains_with_path( 0, '/llms.txt', true );
		if ( ! empty( $urls ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction -- WordPress.com-only and guarded above; remove once wpcom stubs declare it.
			queue_async_job( array( 'output_cache' => array( 'url' => $urls ) ), 'wpcom_invalidate_output_cache_job', -16, 0 );
		}
	}

	/**
	 * Drop the stored llms.txt after a change to a post llms.txt can list or a menu it reads.
	 *
	 * @param int           $post_id Post ID.
	 * @param \WP_Post|null $post    Post object; still set after a permanent delete, when the ID no longer resolves.
	 * @return void
	 */
	public static function clear_cache_for_post( $post_id, $post = null ) {
		if ( self::shapes_llms_txt( $post instanceof \WP_Post ? $post->post_type : get_post_type( $post_id ) ) ) {
			self::clear_cache();
		}
	}

	/**
	 * Drop the stored llms.txt after a write to post meta that llms.txt reads.
	 *
	 * @param int|int[] $meta_id  Meta ID or IDs.
	 * @param int       $post_id  Post ID.
	 * @param string    $meta_key Meta key.
	 * @return void
	 */
	public static function clear_cache_for_meta( $meta_id, $post_id, $meta_key ) {
		if ( in_array( $meta_key, self::CACHE_META, true ) ) {
			self::clear_cache();
		}
	}

	/**
	 * Whether posts of a type can appear in llms.txt or hold a menu, so a sitemap, oEmbed
	 * cache or revision write leaves the stored copy alone.
	 *
	 * @param string|false $type Post type slug.
	 * @return bool
	 */
	private static function shapes_llms_txt( $type ) {
		return $type && ( is_post_type_viewable( $type ) || in_array( $type, self::CACHE_POST_TYPES, true ) );
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
	 * Whether Jetpack can serve llms.txt without a plugin, static-file or hosting conflict.
	 *
	 * Hosts can signal path restrictions through the jetpack_seo_llms_txt_can_serve filter.
	 *
	 * @return bool
	 */
	public static function can_serve() {
		if ( Seo_Tools::is_disabled() ) {
			return false;
		}

		$has_static_file = defined( 'ABSPATH' ) && Static_Files::exists( 'llms.txt' );

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
		if ( ! self::is_enabled() || 'llms.txt' !== self::request_path() || ! self::can_serve() ) {
			return;
		}

		// Respect the site's "discourage search engines" setting. When indexing is
		// discouraged, WordPress emits `Disallow: /` in robots.txt — serving an AI
		// content map would contradict that signal, and would expose a content map
		// on staging/private sites, so we don't serve it.
		if ( ! get_option( 'blog_public' ) ) {
			return;
		}

		// A private site (`blog_public` -1) serves members only, so shared caches must not keep it.
		if ( 1 === (int) get_option( 'blog_public' ) ) {
			header( 'Cache-Control: public, max-age=' . self::HTTP_MAX_AGE );
		} else {
			nocache_headers();
		}
		status_header( 200 );
		header( 'Content-Type: text/plain; charset=utf-8' );

		// Content is plain-text Markdown; not HTML, so it's emitted as-is.
		echo self::get_stored(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		exit;
	}

	/**
	 * The stored llms.txt, built and stored first when there is none.
	 *
	 * @return string
	 */
	public static function get_stored() {
		$body = get_transient( self::CACHE_KEY );
		if ( is_string( $body ) && '' !== $body ) {
			return $body;
		}

		// Every visitor gets the stored copy, so build it as a logged-out visitor sees it.
		$user_id = get_current_user_id();
		wp_set_current_user( 0 );
		try {
			$body = self::generate();
		} finally {
			wp_set_current_user( $user_id );
		}

		set_transient( self::CACHE_KEY, $body, self::CACHE_TTL );
		return $body;
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
			// A manual excerpt is a deliberate public summary; a body gate does not withhold it.
			$raw = get_the_excerpt( $post );
		} elseif ( Content_Gate::is_gated( $post ) ) {
			$teaser = Content_Gate::public_teaser( $post );
			if ( '' === $teaser ) {
				return '';
			}
			$raw = wp_trim_words( wp_strip_all_tags( strip_shortcodes( $teaser ) ), 30, '' );
		} else {
			$raw = wp_trim_words( wp_strip_all_tags( strip_shortcodes( get_the_excerpt( $post ) ) ), 30, '' );
		}

		// Collapse whitespace so a link line stays on one row.
		return trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( $raw ) ) );
	}
}
