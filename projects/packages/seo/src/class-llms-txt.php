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
	 * its whole tree. Pages in the main menu are listed even past it.
	 */
	const MAX_POSTS_PER_TYPE = 50;

	/**
	 * Max main-menu pages listed, so a mega menu can't list a whole site.
	 */
	const MAX_MAIN_MENU_PAGES = 100;

	/**
	 * Page meta an owner sets to always list a page in llms.txt.
	 *
	 * @var string
	 */
	const META_ALWAYS_INCLUDE = 'jetpack_seo_llms_txt_always_include';

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
	 * Options whose changes alter llms.txt, besides its own on/off setting.
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
		self::META_ALWAYS_INCLUDE,
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
	 * Register the always-include page meta, so the Content tab can read and save it
	 * through core REST like the page's other SEO fields, and keep it off on hidden pages.
	 *
	 * @return void
	 */
	public static function register_always_include() {
		register_post_meta(
			'page',
			self::META_ALWAYS_INCLUDE,
			array(
				'type'         => 'boolean',
				// Not translated: this runs before `init`, too early to load the text domain.
				'description'  => 'Whether to always list the page in llms.txt.',
				'single'       => true,
				'default'      => false,
				'show_in_rest' => true,
			)
		);
		foreach ( array( 'added_post_meta', 'updated_post_meta' ) as $hook ) {
			add_action( $hook, array( __CLASS__, 'clear_always_include_if_hidden' ), 10, 4 );
		}
	}

	/**
	 * Keep "Always include" off while a page is hidden from search engines, from any editor,
	 * so un-hiding the page doesn't bring it back.
	 *
	 * @param int    $meta_id    Meta ID.
	 * @param int    $post_id    Post ID.
	 * @param string $meta_key   Meta key.
	 * @param mixed  $meta_value Meta value.
	 * @return void
	 */
	public static function clear_always_include_if_hidden( $meta_id, $post_id, $meta_key, $meta_value ) {
		if (
			$meta_value
			&& in_array( $meta_key, array( Content_Coverage::META_NOINDEX, self::META_ALWAYS_INCLUDE ), true )
			&& 'page' === get_post_type( $post_id )
			&& get_post_meta( $post_id, Content_Coverage::META_NOINDEX, true )
		) {
			delete_post_meta( $post_id, self::META_ALWAYS_INCLUDE );
		}
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
		foreach ( array( 'added_option', 'updated_option', 'deleted_option' ) as $hook ) {
			add_action( $hook, array( __CLASS__, 'clear_cache_for_option' ) );
		}
	}

	/**
	 * Drop the stored llms.txt after a write to an option it reads. Matched when the option is
	 * saved, since WordPress.com API requests register these hooks before switching to the site.
	 *
	 * @param string $option Option name.
	 * @return void
	 */
	public static function clear_cache_for_option( $option ) {
		if ( self::OPTION === $option ) {
			// Turning llms.txt off or on is the owner's reset, so purge even when nothing is stored:
			// the edge copy can outlive an expired stored one.
			delete_transient( self::CACHE_KEY );
			self::purge_edge_cache();
		} elseif (
			in_array( $option, self::CACHE_OPTIONS, true )
			|| ( 0 === strpos( $option, 'theme_mods_' ) && 'theme_mods_' . get_stylesheet() === $option )
		) {
			self::clear_cache();
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
		$name        = self::plain_text( get_bloginfo( 'name' ) );
		$description = self::plain_text( get_bloginfo( 'description' ) );

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

		$text = implode( "\n\n", $blocks ) . "\n";

		/**
		 * Filters the llms.txt Markdown, e.g. to add a section.
		 *
		 * The result is stored for up to 12 hours and built as a logged-out visitor, so a code change
		 * shows after the next content edit or after turning llms.txt off and on.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $text The llms.txt Markdown.
		 */
		return (string) apply_filters( 'jetpack_seo_llms_txt', $text );
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
		if ( 'page' === $post_type ) {
			return self::get_pages();
		}

		$args                   = self::query_args( $post_type );
		$args['posts_per_page'] = self::MAX_POSTS_PER_TYPE;
		$args['orderby']        = 'date';
		$args['order']          = 'DESC';

		return get_posts( $args );
	}

	/**
	 * Pages ranked: the ones the owner always includes, then the main menu, then other
	 * displayed menus, then the rest by {@see get_pages_by_order()}.
	 *
	 * @return \WP_Post[]
	 */
	private static function get_pages() {
		$always_included = self::get_always_included_pages();
		$skip            = wp_list_pluck( $always_included, 'ID' );
		$menus           = Nav_Menu_Pages::get();
		$main            = self::get_pages_in_order( array_values( array_diff( $menus['main'], $skip ) ), self::MAX_MAIN_MENU_PAGES );
		$room            = max( 0, self::MAX_POSTS_PER_TYPE - count( $always_included ) - count( $main ) );
		$other           = self::get_pages_in_order( array_values( array_diff( $menus['other'], $skip ) ), $room );
		$room           -= count( $other );
		if ( $room <= 0 ) {
			return array_merge( $always_included, $main, $other );
		}

		$args                   = self::query_args( 'page' );
		$args['posts_per_page'] = $room;
		$args['post__not_in']   = array_merge( $skip, $menus['main'], $menus['other'] );

		return array_merge( $always_included, $main, $other, self::get_pages_by_order( $args ) );
	}

	/**
	 * Listable pages the owner switched on to always include, sorted by {@see get_pages_by_order()}.
	 *
	 * @return \WP_Post[]
	 */
	private static function get_always_included_pages() {
		$args                   = self::query_args( 'page' );
		$args['meta_query']     = array(
			// @phan-suppress-next-line PhanPluginMixedKeyNoKey
			'relation' => 'AND',
			$args['meta_query'],
			array(
				'key'   => self::META_ALWAYS_INCLUDE,
				'value' => '1',
			),
		);
		$args['posts_per_page'] = -1;

		return self::get_pages_by_order( $args );
	}

	/**
	 * Run a page query sorted by the page Order, lowest first, with pages whose Order was
	 * set ahead of untouched ones (Order 0), then by title.
	 *
	 * @param array $args Query arguments.
	 * @return \WP_Post[]
	 */
	private static function get_pages_by_order( array $args ) {
		$flag          = 'jetpack_seo_llms_txt_order';
		$args[ $flag ] = true;
		$orderby       = static function ( $sql, $query ) use ( $flag ) {
			global $wpdb;
			if ( ! $query->get( $flag ) ) {
				return $sql;
			}
			// `menu_order = 0` is 0 for pages with an Order set and 1 for untouched ones, so ASC lists
			// pages with an Order first; each group then sorts by Order, then title.
			return "({$wpdb->posts}.menu_order = 0) ASC, {$wpdb->posts}.menu_order ASC, {$wpdb->posts}.post_title ASC";
		};

		add_filter( 'posts_orderby', $orderby, 10, 2 );
		$posts = get_posts( $args );
		remove_filter( 'posts_orderby', $orderby, 10 );

		return $posts;
	}

	/**
	 * Fetch listable pages by ID, keeping the given order.
	 *
	 * @param int[] $ids   Page IDs.
	 * @param int   $limit Max pages to return.
	 * @return \WP_Post[]
	 */
	private static function get_pages_in_order( array $ids, $limit ) {
		if ( empty( $ids ) || $limit <= 0 ) {
			return array();
		}

		$args                   = self::query_args( 'page' );
		$args['post__in']       = $ids;
		$args['orderby']        = 'post__in';
		$args['posts_per_page'] = $limit;

		return get_posts( $args );
	}

	/**
	 * Query arguments for published content that isn't password protected or hidden from
	 * search engines.
	 *
	 * @param string $post_type Post type slug.
	 * @return array
	 */
	private static function query_args( $post_type ) {
		return array(
			'post_type'        => $post_type,
			'post_status'      => 'publish',
			'has_password'     => false,
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
		return self::plain_text( $post_type->label );
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

			$title = self::plain_text( get_the_title( $post ) );
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
	 * A short, single-line summary for a post: its SEO description when set, then
	 * its excerpt, otherwise a trimmed slice of the content.
	 *
	 * @param \WP_Post $post Post to summarize.
	 * @return string
	 */
	private static function summary( $post ) {
		$seo_description = '';
		if ( class_exists( 'Jetpack_SEO_Utils' ) && class_exists( 'Jetpack_SEO_Posts' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Posts lives in plugins/jetpack; guarded by the class_exists checks above.
			$seo_description = wp_trim_words( strip_shortcodes( wp_strip_all_tags( \Jetpack_SEO_Posts::get_post_custom_description( $post ) ) ), Post_Schema_Node::DESCRIPTION_MAX_WORDS, '' );
		}

		// The SEO description and manual excerpt are deliberate public summaries; a body gate does not withhold them.
		if ( '' !== $seo_description ) {
			$raw = $seo_description;
		} elseif ( has_excerpt( $post ) ) {
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
		return self::plain_text( $raw );
	}

	/**
	 * Reduce a WordPress display string to one line of plain text.
	 *
	 * @param string $text Text that may hold tags and HTML entities.
	 * @return string
	 */
	private static function plain_text( $text ) {
		// Do not reorder: decoding can reveal whitespace (`&#10;`), and text like `&lt;b&gt;` isn't a tag.
		$text = \WP_HTML_Decoder::decode_text_node( wp_strip_all_tags( $text ) );
		return trim( preg_replace( '/\s+/', ' ', $text ) );
	}
}
