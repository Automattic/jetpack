<?php
/**
 * REST controller for the `jetpack-seo/v1` namespace.
 *
 * The Overview endpoint aggregates site-wide SEO signals so the home base
 * can render with a single round-trip. Write endpoints for settings,
 * llms.txt, AI crawlers, and post-level SEO arrive in later PRs.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Modules;
use Jetpack_SEO_Posts;
use Jetpack_SEO_Utils;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Registers all routes under `jetpack-seo/v1`.
 */
class REST_Controller {

	const NAMESPACE_ROOT = 'jetpack-seo/v1';

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE_ROOT,
			'/overview',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_overview' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
			)
		);

		register_rest_route(
			self::NAMESPACE_ROOT,
			'/posts',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_posts' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
				'args'                => array(
					'post_type' => array(
						'type'    => 'string',
						'default' => 'post',
					),
					'status'    => array(
						'type'    => 'string',
						'default' => 'publish,draft',
					),
					'per_page'  => array(
						'type'    => 'integer',
						'default' => 20,
						'minimum' => 1,
						'maximum' => 100,
					),
					'page'      => array(
						'type'    => 'integer',
						'default' => 1,
						'minimum' => 1,
					),
					'search'    => array(
						'type' => 'string',
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_ROOT,
			'/llms-txt',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_llms_txt' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_llms_txt' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
					'args'                => array(
						'enabled'       => array( 'type' => 'boolean' ),
						'include_types' => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'max_items'     => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => 500,
						),
						'override'      => array( 'type' => 'string' ),
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_ROOT,
			'/sitemap',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_sitemap' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_sitemap' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
					'args'                => array(
						'enabled' => array( 'type' => 'boolean' ),
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_ROOT,
			'/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_settings' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_settings' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
					'args'                => array(
						'front_page_description' => array( 'type' => 'string' ),
						'title_formats'          => array( 'type' => 'object' ),
						'verification'           => array( 'type' => 'object' ),
						'canonical_urls_enabled' => array( 'type' => 'boolean' ),
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_ROOT,
			'/ai-crawlers',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_ai_crawlers' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_ai_crawlers' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
					'args'                => array(
						'crawlers' => array(
							'type'     => 'object',
							'required' => true,
						),
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_ROOT,
			'/posts/(?P<id>\d+)/seo',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( __CLASS__, 'update_post_seo' ),
				'permission_callback' => array( __CLASS__, 'edit_post_permissions_check' ),
				'args'                => array(
					'id'              => array(
						'type'     => 'integer',
						'required' => true,
					),
					'seo_title'       => array(
						'type' => 'string',
					),
					'seo_description' => array(
						'type' => 'string',
					),
					'schema_type'     => array(
						'type' => 'string',
					),
					'noindex'         => array(
						'type' => 'boolean',
					),
				),
			)
		);
	}

	/**
	 * Permission check — only users who can manage site options can hit these endpoints.
	 *
	 * @return bool
	 */
	public static function permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Permission check for per-post SEO edits.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return bool
	 */
	public static function edit_post_permissions_check( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'id' );
		return $post_id > 0 && current_user_can( 'edit_post', $post_id );
	}

	/**
	 * GET /jetpack-seo/v1/posts.
	 *
	 * Paginated post list with SEO meta joined and a server-computed
	 * `seo_status` traffic-light. This endpoint powers the Content DataViews.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public static function get_posts( WP_REST_Request $request ) {
		$post_type = (string) $request->get_param( 'post_type' );
		$status    = array_filter( array_map( 'trim', explode( ',', (string) $request->get_param( 'status' ) ) ) );
		$per_page  = max( 1, min( 100, (int) $request->get_param( 'per_page' ) ) );
		$page      = max( 1, (int) $request->get_param( 'page' ) );
		$search    = (string) $request->get_param( 'search' );

		$query_args = array(
			'post_type'      => $post_type,
			'post_status'    => $status,
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'no_found_rows'  => false,
			'orderby'        => 'date',
			'order'          => 'DESC',
		);
		if ( '' !== $search ) {
			$query_args['s'] = $search;
		}

		$query = new \WP_Query( $query_args );
		$items = array();

		foreach ( $query->posts as $post ) {
			$items[] = self::map_post_to_item( $post );
		}

		return new WP_REST_Response(
			array(
				'items' => $items,
				'total' => (int) $query->found_posts,
				'pages' => (int) $query->max_num_pages,
				'page'  => $page,
			)
		);
	}

	/**
	 * POST /jetpack-seo/v1/posts/{id}/seo.
	 *
	 * Updates any combination of the four SEO fields in one call. Wraps the
	 * existing post-meta registration so the Content DataViews can stream
	 * optimistic edits without touching the full /wp/v2/posts surface.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public static function update_post_seo( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'id' );
		$post    = get_post( $post_id );
		if ( ! $post ) {
			return new WP_REST_Response( array( 'error' => 'not_found' ), 404 );
		}

		if ( $request->has_param( 'seo_title' ) ) {
			update_post_meta( $post_id, Jetpack_SEO_Posts::HTML_TITLE_META_KEY, sanitize_text_field( (string) $request->get_param( 'seo_title' ) ) );
		}
		if ( $request->has_param( 'seo_description' ) ) {
			update_post_meta( $post_id, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, wp_strip_all_tags( (string) $request->get_param( 'seo_description' ) ) );
		}
		if ( $request->has_param( 'schema_type' ) ) {
			$schema = sanitize_key( (string) $request->get_param( 'schema_type' ) );
			if ( in_array( $schema, self::allowed_schema_types(), true ) ) {
				update_post_meta( $post_id, 'jetpack_seo_schema_type', $schema );
			}
		}
		if ( $request->has_param( 'noindex' ) ) {
			update_post_meta( $post_id, Jetpack_SEO_Posts::NOINDEX_META_KEY, (bool) $request->get_param( 'noindex' ) );
		}

		return new WP_REST_Response( self::map_post_to_item( get_post( $post_id ) ) );
	}

	/**
	 * Allowed schema types for per-post overrides.
	 *
	 * @return array
	 */
	public static function allowed_schema_types() {
		return array( '', 'article', 'faq', 'howto', 'localbusiness', 'organization' );
	}

	/**
	 * Shape a post for the Content DataViews response.
	 *
	 * @param \WP_Post $post The post to shape.
	 * @return array
	 */
	private static function map_post_to_item( \WP_Post $post ) {
		$seo_title       = (string) get_post_meta( $post->ID, Jetpack_SEO_Posts::HTML_TITLE_META_KEY, true );
		$seo_description = (string) get_post_meta( $post->ID, Jetpack_SEO_Posts::DESCRIPTION_META_KEY, true );
		$schema_type     = (string) get_post_meta( $post->ID, 'jetpack_seo_schema_type', true );
		$noindex         = (bool) get_post_meta( $post->ID, Jetpack_SEO_Posts::NOINDEX_META_KEY, true );

		return array(
			'id'              => $post->ID,
			'title'           => get_the_title( $post ),
			'permalink'       => get_permalink( $post ),
			'edit_link'       => get_edit_post_link( $post->ID, 'raw' ),
			'post_type'       => $post->post_type,
			'status'          => $post->post_status,
			'seo_title'       => $seo_title,
			'seo_description' => $seo_description,
			'schema_type'     => $schema_type,
			'noindex'         => $noindex,
			'seo_status'      => self::compute_seo_status( $seo_title, $seo_description, $noindex ),
		);
	}

	/**
	 * GET /jetpack-seo/v1/sitemap.
	 *
	 * Reads the `jetpack_seo_sitemap_enabled` option. Sitemaps used to be a
	 * standalone Jetpack module; they're now driven by this option under the
	 * SEO Settings screen.
	 *
	 * @return WP_REST_Response
	 */
	public static function get_sitemap() {
		return new WP_REST_Response(
			array(
				'enabled' => (bool) get_option( 'jetpack_seo_sitemap_enabled', false ),
				'urls'    => array(
					'sitemap'      => home_url( '/sitemap.xml' ),
					'news_sitemap' => home_url( '/news-sitemap.xml' ),
				),
			)
		);
	}

	/**
	 * POST /jetpack-seo/v1/sitemap.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public static function update_sitemap( WP_REST_Request $request ) {
		if ( $request->has_param( 'enabled' ) ) {
			update_option( 'jetpack_seo_sitemap_enabled', (bool) $request->get_param( 'enabled' ) );
		}
		return self::get_sitemap();
	}

	/**
	 * GET /jetpack-seo/v1/settings.
	 *
	 * @return WP_REST_Response
	 */
	public static function get_settings() {
		$title_formats = get_option( 'advanced_seo_title_formats', array() );
		if ( ! is_array( $title_formats ) ) {
			$title_formats = array();
		}
		return new WP_REST_Response(
			array(
				'front_page_description' => class_exists( 'Jetpack_SEO_Utils' )
					? Jetpack_SEO_Utils::get_front_page_meta_description()
					: (string) get_option( 'advanced_seo_front_page_description', '' ),
				'title_formats'          => $title_formats,
				'verification'           => self::get_site_verification(),
				'canonical_urls_enabled' => (bool) get_option( 'jetpack_seo_canonical_urls_enabled', true ),
			)
		);
	}

	/**
	 * POST /jetpack-seo/v1/settings.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public static function update_settings( WP_REST_Request $request ) {
		if ( $request->has_param( 'front_page_description' ) && class_exists( 'Jetpack_SEO_Utils' ) ) {
			Jetpack_SEO_Utils::update_front_page_meta_description( (string) $request->get_param( 'front_page_description' ) );
		}

		if ( $request->has_param( 'title_formats' ) ) {
			$formats = (array) $request->get_param( 'title_formats' );
			update_option( 'advanced_seo_title_formats', $formats );
		}

		if ( $request->has_param( 'verification' ) ) {
			$input    = (array) $request->get_param( 'verification' );
			$existing = get_option( 'verification_services_codes', array() );
			if ( ! is_array( $existing ) ) {
				$existing = array();
			}
			foreach ( array( 'google', 'bing', 'pinterest', 'yandex', 'facebook' ) as $service ) {
				if ( array_key_exists( $service, $input ) ) {
					$existing[ $service ] = sanitize_text_field( (string) $input[ $service ] );
				}
			}
			update_option( 'verification_services_codes', $existing );
		}

		if ( $request->has_param( 'canonical_urls_enabled' ) ) {
			update_option(
				'jetpack_seo_canonical_urls_enabled',
				(bool) $request->get_param( 'canonical_urls_enabled' )
			);
		}

		return self::get_settings();
	}

	/**
	 * GET /jetpack-seo/v1/llms-txt.
	 *
	 * @return WP_REST_Response
	 */
	public static function get_llms_txt() {
		return new WP_REST_Response(
			array(
				'enabled' => LLMS_Txt::is_enabled(),
				'config'  => LLMS_Txt::get_config(),
				'preview' => LLMS_Txt::render(),
			)
		);
	}

	/**
	 * POST /jetpack-seo/v1/llms-txt.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public static function update_llms_txt( WP_REST_Request $request ) {
		if ( $request->has_param( 'enabled' ) ) {
			update_option( LLMS_Txt::ENABLED_OPTION, (bool) $request->get_param( 'enabled' ) );
		}

		$config = LLMS_Txt::get_config();
		if ( $request->has_param( 'include_types' ) ) {
			$types                   = array_values(
				array_filter( array_map( 'sanitize_key', (array) $request->get_param( 'include_types' ) ) )
			);
			$config['include_types'] = $types ? $types : $config['include_types'];
		}
		if ( $request->has_param( 'max_items' ) ) {
			$config['max_items'] = max( 1, min( 500, (int) $request->get_param( 'max_items' ) ) );
		}
		if ( $request->has_param( 'override' ) ) {
			$config['override'] = wp_kses_post( (string) $request->get_param( 'override' ) );
		}
		update_option( LLMS_Txt::CONFIG_OPTION, $config );

		return self::get_llms_txt();
	}

	/**
	 * GET /jetpack-seo/v1/ai-crawlers.
	 *
	 * @return WP_REST_Response
	 */
	public static function get_ai_crawlers() {
		return new WP_REST_Response(
			array(
				'known'    => AI_Crawlers::get_known_bots(),
				'crawlers' => AI_Crawlers::get_state(),
			)
		);
	}

	/**
	 * POST /jetpack-seo/v1/ai-crawlers.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public static function update_ai_crawlers( WP_REST_Request $request ) {
		$input = (array) $request->get_param( 'crawlers' );
		$state = AI_Crawlers::save_state( $input );
		return new WP_REST_Response(
			array(
				'known'    => AI_Crawlers::get_known_bots(),
				'crawlers' => $state,
			)
		);
	}

	/**
	 * Compute a traffic-light score for a post.
	 *
	 * Rules of thumb (kept deliberately simple for Phase 1):
	 *
	 *   - "good":  title 30–60 chars, description 120–160 chars, not noindexed
	 *   - "fair":  title or description present but outside target range
	 *   - "poor":  title and description both empty, or the post is noindexed
	 *
	 * @param string $title       SEO title override (may be empty).
	 * @param string $description SEO description override (may be empty).
	 * @param bool   $noindex     Whether the post is marked noindex.
	 * @return string
	 */
	private static function compute_seo_status( $title, $description, $noindex ) {
		if ( $noindex ) {
			return 'poor';
		}
		$title_len = strlen( $title );
		$desc_len  = strlen( $description );
		if ( 0 === $title_len && 0 === $desc_len ) {
			return 'poor';
		}
		$title_ok = $title_len >= 30 && $title_len <= 60;
		$desc_ok  = $desc_len >= 120 && $desc_len <= 160;
		if ( $title_ok && $desc_ok ) {
			return 'good';
		}
		return 'fair';
	}

	/**
	 * GET /jetpack-seo/v1/overview.
	 *
	 * Returns the aggregated state the Overview screen renders. Kept in a
	 * single endpoint so the dashboard loads with one request.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public static function get_overview( WP_REST_Request $request ) {
		unset( $request );

		$modules           = new Modules();
		$seo_enabled       = class_exists( 'Jetpack_SEO_Utils' ) && Jetpack_SEO_Utils::is_enabled_jetpack_seo();
		$seo_tools_active  = $modules->is_active( 'seo-tools' );
		$sitemaps_active   = (bool) get_option( 'jetpack_seo_sitemap_enabled', false );
		$front_page_desc   = $seo_enabled ? Jetpack_SEO_Utils::get_front_page_meta_description() : '';
		$content_stats     = self::get_content_stats();
		$site_verification = self::get_site_verification();
		$ai_crawlers       = self::get_ai_crawlers_state();

		return new WP_REST_Response(
			array(
				'site_visibility'    => array(
					'search_engines_visible' => (int) get_option( 'blog_public', 1 ) === 1,
					'sitemap_active'         => $sitemaps_active,
					'sitemap_url'            => home_url( '/sitemap.xml' ),
					'seo_tools_active'       => $seo_tools_active,
					'front_page_description' => $front_page_desc,
				),
				'content_seo'        => $content_stats,
				'ai_discoverability' => array(
					'llms_txt_enabled' => (bool) get_option( 'jetpack_seo_llms_txt_enabled', false ),
					'crawlers'         => $ai_crawlers,
				),
				'site_verification'  => $site_verification,
				'plan'               => array(
					'seo_enabled_for_site' => $seo_enabled,
				),
			)
		);
	}

	/**
	 * Count posts by SEO state.
	 *
	 * @return array
	 */
	private static function get_content_stats() {
		$post_types = get_post_types( array( 'public' => true ), 'names' );
		unset( $post_types['attachment'] );

		$total           = 0;
		$missing_title   = 0;
		$missing_desc    = 0;
		$noindexed       = 0;
		$description_key = Jetpack_SEO_Posts::DESCRIPTION_META_KEY;
		$html_title_key  = Jetpack_SEO_Posts::HTML_TITLE_META_KEY;
		$noindex_key     = Jetpack_SEO_Posts::NOINDEX_META_KEY;

		foreach ( $post_types as $post_type ) {
			$counts = wp_count_posts( $post_type );
			$total += isset( $counts->publish ) ? (int) $counts->publish : 0;
		}

		// Bounded look-ups keep the dashboard snappy on large sites — the
		// full audit lives on the Content DataViews screen.
		$sample = get_posts(
			array(
				'post_type'      => array_values( $post_types ),
				'post_status'    => 'publish',
				'posts_per_page' => 500,
				'fields'         => 'ids',
			)
		);

		foreach ( $sample as $post_id ) {
			if ( '' === (string) get_post_meta( $post_id, $html_title_key, true ) ) {
				++$missing_title;
			}
			if ( '' === (string) get_post_meta( $post_id, $description_key, true ) ) {
				++$missing_desc;
			}
			if ( get_post_meta( $post_id, $noindex_key, true ) ) {
				++$noindexed;
			}
		}

		return array(
			'total_published' => $total,
			'sample_size'     => count( $sample ),
			'missing_title'   => $missing_title,
			'missing_desc'    => $missing_desc,
			'noindexed'       => $noindexed,
		);
	}

	/**
	 * Read the site-verification tag option set (Google/Bing/Pinterest/Yandex/Facebook).
	 *
	 * Backed by the existing `verification_services_codes` option Jetpack already writes.
	 *
	 * @return array
	 */
	private static function get_site_verification() {
		$codes = get_option( 'verification_services_codes' );
		if ( ! is_array( $codes ) ) {
			$codes = array();
		}
		return array(
			'google'    => (string) ( $codes['google'] ?? '' ),
			'bing'      => (string) ( $codes['bing'] ?? '' ),
			'pinterest' => (string) ( $codes['pinterest'] ?? '' ),
			'yandex'    => (string) ( $codes['yandex'] ?? '' ),
			'facebook'  => (string) ( $codes['facebook'] ?? '' ),
		);
	}

	/**
	 * Read the AI crawler toggle state. Defaults to "allowed" for all bots
	 * until the user opts into blocking. Full write path lands in PR 4.
	 *
	 * @return array
	 */
	private static function get_ai_crawlers_state() {
		$stored = get_option( 'jetpack_seo_ai_crawlers', array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		$defaults = array(
			'GPTBot'          => 'allow',
			'ClaudeBot'       => 'allow',
			'Google-Extended' => 'allow',
			'PerplexityBot'   => 'allow',
			'CCBot'           => 'allow',
			'anthropic-ai'    => 'allow',
		);
		return array_merge( $defaults, $stored );
	}
}
