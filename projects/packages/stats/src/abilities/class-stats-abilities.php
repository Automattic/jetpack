<?php
/**
 * Jetpack Stats Abilities Registration.
 *
 * Registers Jetpack Stats abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-stats
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Stats\Abilities;

use Automattic\Jetpack\Stats\Options;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;

/**
 * Registers Jetpack Stats abilities with the WordPress Abilities API.
 *
 * Exposes a small, consolidated surface for reading Jetpack Stats traffic
 * insights and managing site-level Stats configuration so AI agents can
 * answer site-owner questions through the standard `wp-abilities/v1` REST
 * surface. Seven abilities wrap ~25 atomic WPCOM Stats endpoints plus the
 * `stats_options` WP option.
 */
class Stats_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-stats';
	const ERROR_PREFIX  = 'jetpack_stats_';

	/**
	 * Whitelist of stats_options keys exposed via the config abilities.
	 *
	 * Internal keys (`blog_id`, `notices`, `views`, `collapse_nudges`,
	 * `version`, `odyssey_stats_changed_at`) are deliberately excluded —
	 * agents can't act on them and they'd bloat the response.
	 */
	const CONFIG_KEYS = array( 'admin_bar', 'roles', 'count_roles', 'do_not_track', 'enable_odyssey_stats' );

	/**
	 * Subset of CONFIG_KEYS whose values are boolean.
	 *
	 * Read + write paths coerce to bool before comparison/emit so agents
	 * never see `1`/`"true"` drift in place of real booleans.
	 */
	const CONFIG_BOOL_KEYS = array( 'admin_bar', 'do_not_track', 'enable_odyssey_stats' );

	/**
	 * Allowed `type` values for `get-top-content`.
	 */
	const TOP_CONTENT_TYPES = array( 'posts', 'referrers', 'search-terms', 'clicks', 'tags', 'authors', 'countries', 'downloads', 'video-plays' );

	/**
	 * Allowed aggregation periods for timeseries + top-content reads.
	 */
	const PERIODS = array( 'day', 'week', 'month', 'year' );

	/**
	 * Normalization table for `get-top-content`.
	 *
	 * Each entry describes how to project a WPCOM `days -> <date> -> <list>`
	 * array of rows into the uniform `{ rank, label, value, href? }` shape.
	 * `countries` (needs `country-info` join) and `tags` (flat `tags` array,
	 * no `days` envelope) are special-cased in the callback.
	 */
	const TOP_CONTENT_MAP = array(
		'posts'        => array(
			'list'  => 'postviews',
			'label' => 'title',
			'value' => 'views',
			'href'  => 'href',
		),
		'referrers'    => array(
			'list'  => 'referrers',
			'label' => 'name',
			'value' => 'views',
		),
		'search-terms' => array(
			'list'  => 'search_terms',
			'label' => 'term',
			'value' => 'views',
		),
		'clicks'       => array(
			'list'           => 'clicks',
			'label'          => 'name',
			'value'          => 'views',
			'href'           => 'url',
			'label_fallback' => 'url',
		),
		'authors'      => array(
			'list'  => 'authors',
			'label' => 'name',
			'value' => 'views',
		),
		'downloads'    => array(
			'list'           => 'files',
			'label'          => 'filename',
			'value'          => 'download_count',
			'href'           => 'relative_url',
			'label_fallback' => 'relative_url',
		),
		'video-plays'  => array(
			'list'  => 'plays',
			'label' => 'title',
			'value' => 'plays',
		),
	);

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack Stats',
			'description' => __( 'Abilities for reading Jetpack Stats traffic insights and managing site-level Stats configuration.', 'jetpack-stats' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-stats/get-site-overview' => self::spec_get_site_overview(),
			'jetpack-stats/get-top-content'   => self::spec_get_top_content(),
			'jetpack-stats/get-post-views'    => self::spec_get_post_views(),
			'jetpack-stats/get-visits'        => self::spec_get_visits(),
			'jetpack-stats/get-followers'     => self::spec_get_followers(),
			'jetpack-stats/get-stats-config'  => self::spec_get_stats_config(),
			'jetpack-stats/set-stats-config'  => self::spec_set_stats_config(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-stats/get-site-overview.
	 */
	private static function spec_get_site_overview(): array {
		return array(
			'label'               => __( 'Get site stats overview', 'jetpack-stats' ),
			'description'         => __(
				'Return a single zero-argument snapshot answering "how is my site doing right now?" — today\'s views/visitors, this week/month totals, the current posting streak, today\'s top post, and top referrer. Shape: { date, views_today, visitors_today, views_week, views_month, streak: { current_length, longest_length, longest_start, longest_end }, top_post: { id, title, views }, top_referrer: { name, views }, partial: bool, errors?: [string] }. Composes the WPCOM stats/summary, stats/highlights, and stats/streak endpoints — if any sub-call fails, `partial` is true and `errors` lists the failed sub-calls; missing data is never silently substituted with zeros. Precondition: the site must be connected to WordPress.com; a disconnected site returns jetpack_stats_not_connected. Results cached for ~5 minutes by WPCOM_Stats — safe to poll.',
				'jetpack-stats'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'date'           => array( 'type' => 'string' ),
					'views_today'    => array( 'type' => 'integer' ),
					'visitors_today' => array( 'type' => 'integer' ),
					'views_week'     => array( 'type' => 'integer' ),
					'views_month'    => array( 'type' => 'integer' ),
					'streak'         => array( 'type' => 'object' ),
					'top_post'       => array( 'type' => array( 'object', 'null' ) ),
					'top_referrer'   => array( 'type' => array( 'object', 'null' ) ),
					'partial'        => array( 'type' => 'boolean' ),
					'errors'         => array( 'type' => 'array' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_site_overview' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-stats/get-top-content.
	 */
	private static function spec_get_top_content(): array {
		return array(
			'label'               => __( 'Get top stats content', 'jetpack-stats' ),
			'description'         => __(
				'Return the top items for a chosen content type — posts, referrers, search terms, outbound clicks, tags/categories, authors, countries, downloads, or video plays — in one filtered call. Replaces nine atomic WPCOM endpoints with a single ability. Uniform shape: { type, period, date, num, max, items: [ { rank, label, value, href? } ] } — agents MUST NOT see a different shape per type. `label` is human-readable (post title, referrer host, search term, country name, etc.). `value` is the view/hit count for that item. `href` is present only when the item has a canonical URL. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'type' ),
				'properties'           => array(
					'type'   => array(
						'type'        => 'string',
						'description' => __( 'Which top-N surface to fetch.', 'jetpack-stats' ),
						'enum'        => self::TOP_CONTENT_TYPES,
					),
					'period' => array(
						'type'        => 'string',
						'description' => __( 'Aggregation period.', 'jetpack-stats' ),
						'enum'        => self::PERIODS,
						'default'     => 'day',
					),
					'date'   => array(
						'type'        => 'string',
						'description' => __( 'End date (YYYY-MM-DD). Defaults to today.', 'jetpack-stats' ),
						'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
					),
					'num'    => array(
						'type'        => 'integer',
						'description' => __( 'How many prior periods to roll up (1-90).', 'jetpack-stats' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 1,
					),
					'max'    => array(
						'type'        => 'integer',
						'description' => __( 'Results cap (1-100).', 'jetpack-stats' ),
						'minimum'     => 1,
						'maximum'     => 100,
						'default'     => 20,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'type'   => array( 'type' => 'string' ),
					'period' => array( 'type' => 'string' ),
					'date'   => array( 'type' => 'string' ),
					'num'    => array( 'type' => 'integer' ),
					'max'    => array( 'type' => 'integer' ),
					'items'  => array( 'type' => 'array' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_top_content' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-stats/get-post-views.
	 */
	private static function spec_get_post_views(): array {
		return array(
			'label'               => __( 'Get views for a post', 'jetpack-stats' ),
			'description'         => __(
				'Return views history for a single post: total views, timeseries of per-period views, and the period metadata. Shape: { post_id, total_views, period, num, date, series: [ { date, views } ] }. Accepts post_id as integer or numeric string (the literal "0" is rejected only because WordPress has no post 0 — any positive numeric value is legal). Precondition: site must be connected to WordPress.com. Related: call jetpack-stats/get-top-content with type=posts first to discover which posts to drill into.',
				'jetpack-stats'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'post_id' ),
				'properties'           => array(
					'post_id' => array(
						'type'        => array( 'integer', 'string' ),
						'description' => __( 'The post ID to fetch views for. Must be positive.', 'jetpack-stats' ),
					),
					'period'  => array(
						'type'        => 'string',
						'description' => __( 'Aggregation period.', 'jetpack-stats' ),
						'enum'        => self::PERIODS,
						'default'     => 'day',
					),
					'num'     => array(
						'type'        => 'integer',
						'description' => __( 'How many prior periods to include (1-90).', 'jetpack-stats' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 30,
					),
					'date'    => array(
						'type'        => 'string',
						'description' => __( 'End date (YYYY-MM-DD). Defaults to today.', 'jetpack-stats' ),
						'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'post_id'     => array( 'type' => 'integer' ),
					'total_views' => array( 'type' => 'integer' ),
					'period'      => array( 'type' => 'string' ),
					'num'         => array( 'type' => 'integer' ),
					'date'        => array( 'type' => 'string' ),
					'series'      => array( 'type' => 'array' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_post_views' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-stats/get-visits.
	 */
	private static function spec_get_visits(): array {
		return array(
			'label'               => __( 'Get site visits timeseries', 'jetpack-stats' ),
			'description'         => __(
				'Return a site-level views/visitors/likes/comments timeseries — answers "is traffic trending up?". Shape: { unit, quantity, date, fields, series: [ { date, views, visitors, likes, comments } ] }. Every series row always includes every field listed in the request (no per-row omission). Precondition: site must be connected to WordPress.com.',
				'jetpack-stats'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'unit'     => array(
						'type'        => 'string',
						'description' => __( 'Granularity of each data point.', 'jetpack-stats' ),
						'enum'        => self::PERIODS,
						'default'     => 'day',
					),
					'quantity' => array(
						'type'        => 'integer',
						'description' => __( 'How many data points to return (1-90).', 'jetpack-stats' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 30,
					),
					'date'     => array(
						'type'        => 'string',
						'description' => __( 'End date (YYYY-MM-DD). Defaults to today.', 'jetpack-stats' ),
						'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
					),
					'fields'   => array(
						'type'        => 'array',
						'description' => __( 'Which metrics to include in each row. Defaults to views+visitors.', 'jetpack-stats' ),
						'items'       => array(
							'type' => 'string',
							'enum' => array( 'views', 'visitors', 'likes', 'comments' ),
						),
						'default'     => array( 'views', 'visitors' ),
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'unit'     => array( 'type' => 'string' ),
					'quantity' => array( 'type' => 'integer' ),
					'date'     => array( 'type' => 'string' ),
					'fields'   => array( 'type' => 'array' ),
					'series'   => array( 'type' => 'array' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_visits' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-stats/get-followers.
	 */
	private static function spec_get_followers(): array {
		return array(
			'label'               => __( 'Get follower counts', 'jetpack-stats' ),
			'description'         => __(
				'Return a breakdown of follower counts across email, WordPress.com, comment, and publicize (per-service) — answers "how is my audience growing?" in one call. Shape: { total, email, wpcom, comment, publicize: { <service>: count }, partial: bool, errors?: [string] }. Composes three WPCOM endpoints — if any sub-call fails, `partial` is true and `errors` lists the failed sub-calls; missing sources are NOT substituted with zero. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'total'     => array( 'type' => 'integer' ),
					'email'     => array( 'type' => 'integer' ),
					'wpcom'     => array( 'type' => 'integer' ),
					'comment'   => array( 'type' => 'integer' ),
					'publicize' => array( 'type' => 'object' ),
					'partial'   => array( 'type' => 'boolean' ),
					'errors'    => array( 'type' => 'array' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_followers' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-stats/get-stats-config.
	 */
	private static function spec_get_stats_config(): array {
		return array(
			'label'               => __( 'Get Stats configuration', 'jetpack-stats' ),
			'description'         => __(
				'Read the current Jetpack Stats configuration: who sees the Stats admin bar + menu, whose visits are counted, DNT behavior, and Odyssey Stats enablement. Shape: { admin_bar, roles, count_roles, do_not_track, enable_odyssey_stats }. `roles` is an array of role slugs that can view Stats; `count_roles` is an array of role slugs whose visits are counted. Call jetpack-stats/set-stats-config to change any of these.',
				'jetpack-stats'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => self::config_output_properties(),
			),
			'execute_callback'    => array( __CLASS__, 'get_stats_config' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-stats/set-stats-config.
	 */
	private static function spec_set_stats_config(): array {
		return array(
			'label'               => __( 'Set Stats configuration', 'jetpack-stats' ),
			'description'         => __(
				'Update one or more Jetpack Stats configuration fields. All fields are optional; only fields present in the call are written, and unrelated keys are preserved. Idempotent — setting a value to its current state returns changed=false. Shape: { changed, config: { admin_bar, roles, count_roles, do_not_track, enable_odyssey_stats } }. Role slugs in `roles` and `count_roles` are validated against the site\'s registered roles; unknown slugs return jetpack_stats_invalid_role. Narrowing `roles` can revoke Stats access for whole groups of users — confirm with the user before removing roles.',
				'jetpack-stats'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'admin_bar'            => array(
						'type'        => 'boolean',
						'description' => __( 'Whether to show the Stats item in the admin bar for users who can view Stats.', 'jetpack-stats' ),
					),
					'roles'                => array(
						'type'        => 'array',
						'description' => __( 'Role slugs that can view Stats. Must be non-empty; each slug must be a registered role.', 'jetpack-stats' ),
						'items'       => array( 'type' => 'string' ),
						'minItems'    => 1,
					),
					'count_roles'          => array(
						'type'        => 'array',
						'description' => __( 'Role slugs whose visits are counted. May be empty (count visits from all users).', 'jetpack-stats' ),
						'items'       => array( 'type' => 'string' ),
					),
					'do_not_track'         => array(
						'type'        => 'boolean',
						'description' => __( 'Whether to honor the browser Do Not Track header.', 'jetpack-stats' ),
					),
					'enable_odyssey_stats' => array(
						'type'        => 'boolean',
						'description' => __( 'Whether to render the Odyssey Stats dashboard.', 'jetpack-stats' ),
					),
				),
				'additionalProperties' => false,
				'minProperties'        => 1,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'changed' => array( 'type' => 'boolean' ),
					'config'  => array(
						'type'       => 'object',
						'properties' => self::config_output_properties(),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'set_stats_config' ),
			'permission_callback' => array( __CLASS__, 'can_manage_stats_config' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Output schema properties shared by get-stats-config and set-stats-config's `config` field.
	 */
	private static function config_output_properties(): array {
		return array(
			'admin_bar'            => array( 'type' => 'boolean' ),
			'roles'                => array(
				'type'  => 'array',
				'items' => array( 'type' => 'string' ),
			),
			'count_roles'          => array(
				'type'  => 'array',
				'items' => array( 'type' => 'string' ),
			),
			'do_not_track'         => array( 'type' => 'boolean' ),
			'enable_odyssey_stats' => array( 'type' => 'boolean' ),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Read-side permission: view_stats.
	 *
	 * The Stats package's `Main::map_meta_caps` maps `view_stats` to the
	 * user's `read` capability when their role is listed in
	 * `stats_options['roles']`. Honored on self-hosted sites.
	 *
	 * @return bool
	 */
	public static function can_view_stats(): bool {
		return current_user_can( 'view_stats' );
	}

	/**
	 * Write-side permission: manage_options.
	 *
	 * Stats configuration writes modify the `stats_options` WP option,
	 * which includes the very roles that gate `view_stats`. Guard with the
	 * site-admin capability, not `view_stats`, so readers can't escalate.
	 *
	 * @return bool
	 */
	public static function can_manage_stats_config(): bool {
		return current_user_can( 'manage_options' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: get-site-overview.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array|WP_Error
	 */
	public static function get_site_overview( $input = null ) {
		unset( $input );
		$stats = self::get_wpcom_stats();

		$summary    = $stats->get_stats_summary();
		$highlights = $stats->get_highlights();
		$streak     = $stats->get_streak();

		$errors = array();
		if ( is_wp_error( $summary ) ) {
			$errors[] = 'summary';
			$summary  = array();
		}
		if ( is_wp_error( $highlights ) ) {
			$errors[]   = 'highlights';
			$highlights = array();
		}
		if ( is_wp_error( $streak ) ) {
			$errors[] = 'streak';
			$streak   = array();
		}

		// If every sub-call failed, surface a single WP_Error instead of an all-null response.
		if ( count( $errors ) === 3 ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'data_unavailable',
				__( 'Stats data could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-stats' )
			);
		}

		$highlights_today    = isset( $highlights['today'] ) && is_array( $highlights['today'] ) ? $highlights['today'] : array();
		$highlights_top_post = isset( $highlights_today['top_post'] ) && is_array( $highlights_today['top_post'] )
			? $highlights_today['top_post']
			: null;

		$out = array(
			'date'           => isset( $summary['date'] ) ? (string) $summary['date'] : ( isset( $highlights_today['date'] ) ? (string) $highlights_today['date'] : '' ),
			'views_today'    => self::as_int( $summary, 'views' ),
			'visitors_today' => self::as_int( $summary, 'visitors' ),
			'views_week'     => self::as_int( $summary, 'period_total_views' ),
			'views_month'    => isset( $highlights_today['views_month'] ) ? (int) $highlights_today['views_month'] : 0,
			'streak'         => self::extract_streak_summary( $streak ),
			'top_post'       => null === $highlights_top_post ? null : array(
				'id'    => isset( $highlights_top_post['id'] ) ? (int) $highlights_top_post['id'] : 0,
				'title' => isset( $highlights_top_post['title'] ) ? (string) $highlights_top_post['title'] : '',
				'views' => isset( $highlights_top_post['views'] ) ? (int) $highlights_top_post['views'] : 0,
			),
			'top_referrer'   => self::extract_top_referrer( $highlights_today ),
			'partial'        => ! empty( $errors ),
		);

		if ( ! empty( $errors ) ) {
			$out['errors'] = $errors;
		}

		return $out;
	}

	/**
	 * Execute: get-top-content.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_top_content( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( ! isset( $input['type'] ) || ! in_array( $input['type'], self::TOP_CONTENT_TYPES, true ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_type',
				sprintf(
					/* translators: %s: comma-separated list of valid type values. */
					__( 'A `type` is required. Valid values: %s.', 'jetpack-stats' ),
					implode( ', ', self::TOP_CONTENT_TYPES )
				)
			);
		}

		$type   = $input['type'];
		$period = isset( $input['period'] ) && in_array( $input['period'], self::PERIODS, true ) ? $input['period'] : 'day';
		$date   = self::sanitize_date( $input['date'] ?? null );
		$num    = self::clamp_int( $input['num'] ?? 1, 1, 90, 1 );
		$max    = self::clamp_int( $input['max'] ?? 20, 1, 100, 20 );

		$args = array(
			'period' => $period,
			'date'   => $date,
			'num'    => $num,
			'max'    => $max,
		);

		$stats = self::get_wpcom_stats();
		$raw   = self::fetch_top_content_raw( $stats, $type, $args );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		$items = self::normalize_top_content_items( $type, $raw, $max );

		return array(
			'type'   => $type,
			'period' => $period,
			'date'   => $date,
			'num'    => $num,
			'max'    => $max,
			'items'  => $items,
		);
	}

	/**
	 * Execute: get-post-views.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_post_views( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		// Use isset()+is_numeric() — NOT empty() — so the literal "0" is rejected by the `> 0` check, not by a truthiness accident.
		if ( ! isset( $input['post_id'] ) || ! is_numeric( $input['post_id'] ) || (int) $input['post_id'] <= 0 ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_post_id',
				__( 'A positive post_id is required.', 'jetpack-stats' )
			);
		}

		$post_id = (int) $input['post_id'];
		$period  = isset( $input['period'] ) && in_array( $input['period'], self::PERIODS, true ) ? $input['period'] : 'day';
		$num     = self::clamp_int( $input['num'] ?? 30, 1, 90, 30 );
		$date    = self::sanitize_date( $input['date'] ?? null );

		$args = array(
			'period' => $period,
			'num'    => $num,
			'date'   => $date,
		);

		$stats = self::get_wpcom_stats();
		$raw   = $stats->get_post_views( $post_id, $args );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		return array(
			'post_id'     => $post_id,
			'total_views' => isset( $raw['views'] ) ? (int) $raw['views'] : 0,
			'period'      => $period,
			'num'         => $num,
			'date'        => $date,
			'series'      => self::extract_post_views_series( $raw ),
		);
	}

	/**
	 * Execute: get-visits.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_visits( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$unit     = isset( $input['unit'] ) && in_array( $input['unit'], self::PERIODS, true ) ? $input['unit'] : 'day';
		$quantity = self::clamp_int( $input['quantity'] ?? 30, 1, 90, 30 );
		$date     = self::sanitize_date( $input['date'] ?? null );

		$allowed_fields = array( 'views', 'visitors', 'likes', 'comments' );
		// Preserve the caller's order — array_intersect returns keys from its FIRST argument,
		// so pass the user input first. Then filter out anything not in the allowed set.
		$fields = isset( $input['fields'] ) && is_array( $input['fields'] ) && ! empty( $input['fields'] )
			? array_values( array_intersect( $input['fields'], $allowed_fields ) )
			: array( 'views', 'visitors' );
		if ( empty( $fields ) ) {
			$fields = array( 'views', 'visitors' );
		}

		$args = array(
			'unit'        => $unit,
			'quantity'    => $quantity,
			'date'        => $date,
			'stat_fields' => implode( ',', $fields ),
		);

		$stats = self::get_wpcom_stats();
		$raw   = $stats->get_visits( $args );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		return array(
			'unit'     => $unit,
			'quantity' => $quantity,
			'date'     => $date,
			'fields'   => $fields,
			'series'   => self::normalize_visits_series( $raw, $fields ),
		);
	}

	/**
	 * Execute: get-followers.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array|WP_Error
	 */
	public static function get_followers( $input = null ) {
		unset( $input );
		$stats = self::get_wpcom_stats();

		$followers         = $stats->get_followers();
		$comment_followers = $stats->get_comment_followers();
		$publicize         = $stats->get_publicize_followers();

		$errors = array();
		if ( is_wp_error( $followers ) ) {
			$errors[]  = 'followers';
			$followers = array();
		}
		if ( is_wp_error( $comment_followers ) ) {
			$errors[]          = 'comment_followers';
			$comment_followers = array();
		}
		if ( is_wp_error( $publicize ) ) {
			$errors[]  = 'publicize_followers';
			$publicize = array();
		}

		if ( count( $errors ) === 3 ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'data_unavailable',
				__( 'Follower data could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-stats' )
			);
		}

		$email = 0;
		$wpcom = 0;
		if ( isset( $followers['subscribers'] ) && is_array( $followers['subscribers'] ) ) {
			foreach ( $followers['subscribers'] as $sub ) {
				if ( isset( $sub['type'] ) && 'email' === $sub['type'] ) {
					$email += isset( $sub['value'] ) ? (int) $sub['value'] : 0;
				} elseif ( isset( $sub['type'] ) && 'wpcom' === $sub['type'] ) {
					$wpcom += isset( $sub['value'] ) ? (int) $sub['value'] : 0;
				}
			}
		} else {
			$email = isset( $followers['email'] ) ? (int) $followers['email'] : 0;
			$wpcom = isset( $followers['wpcom'] ) ? (int) $followers['wpcom'] : 0;
		}

		$comment = isset( $comment_followers['total'] ) ? (int) $comment_followers['total'] : 0;

		$publicize_by_service = array();
		if ( isset( $publicize['services'] ) && is_array( $publicize['services'] ) ) {
			foreach ( $publicize['services'] as $row ) {
				if ( isset( $row['service'] ) && isset( $row['followers'] ) ) {
					$publicize_by_service[ (string) $row['service'] ] = (int) $row['followers'];
				}
			}
		}

		$total = $email + $wpcom + $comment + array_sum( $publicize_by_service );

		$out = array(
			'total'     => $total,
			'email'     => $email,
			'wpcom'     => $wpcom,
			'comment'   => $comment,
			'publicize' => $publicize_by_service,
			'partial'   => ! empty( $errors ),
		);

		if ( ! empty( $errors ) ) {
			$out['errors'] = $errors;
		}

		return $out;
	}

	/**
	 * Execute: get-stats-config.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_stats_config( $input = null ) {
		unset( $input );
		return self::config_snapshot();
	}

	/**
	 * Execute: set-stats-config.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function set_stats_config( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		// At least one of the whitelisted keys must be present.
		$provided = array_intersect_key( $input, array_flip( self::CONFIG_KEYS ) );
		if ( empty( $provided ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_config_field',
				sprintf(
					/* translators: %s: comma-separated list of writable field names. */
					__( 'Provide at least one of: %s.', 'jetpack-stats' ),
					implode( ', ', self::CONFIG_KEYS )
				)
			);
		}

		// Validate role slugs against registered roles — but only load the role list
		// if the caller is actually writing a role field. Boolean-only writes skip
		// the wp_roles() resolution entirely.
		$known_roles = null;
		foreach ( array( 'roles', 'count_roles' ) as $role_field ) {
			if ( ! array_key_exists( $role_field, $provided ) ) {
				continue;
			}
			if ( null === $known_roles ) {
				$known_roles = array_keys( wp_roles()->roles );
			}
			if ( ! is_array( $provided[ $role_field ] ) ) {
				return new WP_Error(
					self::ERROR_PREFIX . 'invalid_' . $role_field,
					sprintf(
						/* translators: %s: the offending field name. */
						__( 'Field `%s` must be an array of role slugs.', 'jetpack-stats' ),
						$role_field
					)
				);
			}
			$sanitized = array();
			foreach ( $provided[ $role_field ] as $role ) {
				if ( ! is_string( $role ) || '' === $role ) {
					return new WP_Error(
						self::ERROR_PREFIX . 'invalid_role',
						sprintf(
							/* translators: 1: field name, 2: comma-separated list of valid role slugs. */
							__( 'Role slugs in `%1$s` must be non-empty strings. Known roles: %2$s.', 'jetpack-stats' ),
							$role_field,
							implode( ', ', $known_roles )
						)
					);
				}
				if ( ! in_array( $role, $known_roles, true ) ) {
					return new WP_Error(
						self::ERROR_PREFIX . 'invalid_role',
						sprintf(
							/* translators: 1: unknown role slug, 2: field name, 3: comma-separated list of valid role slugs. */
							__( 'Unknown role `%1$s` in `%2$s`. Known roles: %3$s.', 'jetpack-stats' ),
							$role,
							$role_field,
							implode( ', ', $known_roles )
						)
					);
				}
				$sanitized[] = $role;
			}
			$provided[ $role_field ] = array_values( array_unique( $sanitized ) );
		}

		$before  = self::config_snapshot();
		$changes = array();
		foreach ( $provided as $key => $value ) {
			if ( in_array( $key, self::CONFIG_BOOL_KEYS, true ) ) {
				$value = (bool) $value;
			}
			$current = $before[ $key ] ?? null;
			if ( $current === $value ) {
				continue;
			}
			$changes[ $key ] = $value;
		}

		// `changed` is derived from the POST-WRITE snapshot, not from `$changes` alone —
		// if update_option fails or refuses to persist for any reason (DB error,
		// serialization mismatch), we must not claim a change that didn't happen.
		if ( ! empty( $changes ) ) {
			// One merged write instead of N get+update cycles via set_option.
			Options::set_options( $changes );
		}

		$after = self::config_snapshot();

		return array(
			'changed' => $after !== $before,
			'config'  => $after,
		);
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Build a whitelisted snapshot of the current Stats configuration.
	 *
	 * @return array
	 */
	private static function config_snapshot(): array {
		$options = Options::get_options();
		$out     = array();
		foreach ( self::CONFIG_KEYS as $key ) {
			$raw = $options[ $key ] ?? null;
			if ( in_array( $key, self::CONFIG_BOOL_KEYS, true ) ) {
				$out[ $key ] = (bool) $raw;
			} elseif ( in_array( $key, array( 'roles', 'count_roles' ), true ) ) {
				$out[ $key ] = is_array( $raw ) ? array_values( $raw ) : array();
			} else {
				$out[ $key ] = $raw;
			}
		}
		return $out;
	}

	/**
	 * Return a WPCOM_Stats instance. Filterable for tests.
	 *
	 * @return WPCOM_Stats
	 */
	protected static function get_wpcom_stats(): WPCOM_Stats {
		/**
		 * Filters the WPCOM_Stats instance used by the Stats abilities.
		 *
		 * Primarily for tests — production code should not override this
		 * filter. Swapping the instance lets tests intercept the WPCOM
		 * client calls without hitting the network.
		 *
		 * @since $$next-version$$
		 *
		 * @param WPCOM_Stats $wpcom_stats The default instance.
		 */
		$instance = apply_filters( 'jetpack_stats_abilities_wpcom_stats', new WPCOM_Stats() );
		return $instance instanceof WPCOM_Stats ? $instance : new WPCOM_Stats();
	}

	/**
	 * Dispatch top-content raw fetch to the right WPCOM_Stats method.
	 *
	 * @param WPCOM_Stats $stats Client.
	 * @param string      $type  Content type enum.
	 * @param array       $args  Pre-built `{ period, date, num, max }` args — ignored for `tags` which takes only `max`.
	 * @return array|WP_Error
	 */
	private static function fetch_top_content_raw( WPCOM_Stats $stats, string $type, array $args ) {
		switch ( $type ) {
			case 'posts':
				return $stats->get_top_posts( $args );
			case 'referrers':
				return $stats->get_referrers( $args );
			case 'search-terms':
				return $stats->get_search_terms( $args );
			case 'clicks':
				return $stats->get_clicks( $args );
			case 'tags':
				// get_tags has a narrower arg surface — pass only `max`.
				return $stats->get_tags( array( 'max' => $args['max'] ) );
			case 'authors':
				return $stats->get_top_authors( $args );
			case 'countries':
				return $stats->get_views_by_country( $args );
			case 'downloads':
				return $stats->get_file_downloads( $args );
			case 'video-plays':
				return $stats->get_video_plays( $args );
		}

		return new WP_Error( self::ERROR_PREFIX . 'invalid_type', __( 'Unknown top-content type.', 'jetpack-stats' ) );
	}

	/**
	 * Normalize a WPCOM top-content response into the uniform item shape.
	 *
	 * Most `type` values follow the `days -> <first-day> -> <list-key>` shape
	 * and project through `TOP_CONTENT_MAP`. `tags` (flat `tags` array, no
	 * `days` envelope) and `countries` (needs `country-info` code-to-name
	 * join) are special-cased.
	 *
	 * @param string $type Content type enum.
	 * @param array  $raw  Raw WPCOM response.
	 * @param int    $max  Result cap.
	 * @return array List of { rank, label, value, href? } items.
	 */
	private static function normalize_top_content_items( string $type, array $raw, int $max ): array {
		if ( 'tags' === $type ) {
			$rows = array();
			$tags = isset( $raw['tags'] ) && is_array( $raw['tags'] ) ? $raw['tags'] : array();
			foreach ( $tags as $tag ) {
				$rows[] = array(
					'label' => isset( $tag['tag'] ) ? (string) $tag['tag'] : '',
					'value' => isset( $tag['views'] ) ? (int) $tag['views'] : 0,
				);
			}
			return self::rank_and_cap( $rows, $max );
		}

		$day_data = self::first_day( $raw );

		if ( 'countries' === $type ) {
			$rows         = array();
			$list         = isset( $day_data['views'] ) && is_array( $day_data['views'] ) ? $day_data['views'] : array();
			$country_info = isset( $raw['country-info'] ) && is_array( $raw['country-info'] ) ? $raw['country-info'] : array();
			foreach ( $list as $v ) {
				$code   = isset( $v['country_code'] ) ? (string) $v['country_code'] : '';
				$rows[] = array(
					'label' => (string) ( $country_info[ $code ]['country_full'] ?? $code ),
					'value' => isset( $v['views'] ) ? (int) $v['views'] : 0,
				);
			}
			return self::rank_and_cap( $rows, $max );
		}

		$map = self::TOP_CONTENT_MAP[ $type ] ?? null;
		if ( null === $map ) {
			return array();
		}

		$rows = array();
		$list = isset( $day_data[ $map['list'] ] ) && is_array( $day_data[ $map['list'] ] ) ? $day_data[ $map['list'] ] : array();
		foreach ( $list as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$label = isset( $row[ $map['label'] ] ) && '' !== $row[ $map['label'] ] ? (string) $row[ $map['label'] ] : '';
			if ( '' === $label && isset( $map['label_fallback'] ) && isset( $row[ $map['label_fallback'] ] ) ) {
				$label = (string) $row[ $map['label_fallback'] ];
			}
			$entry = array(
				'label' => $label,
				'value' => isset( $row[ $map['value'] ] ) ? (int) $row[ $map['value'] ] : 0,
			);
			if ( isset( $map['href'] ) && isset( $row[ $map['href'] ] ) ) {
				$entry['href'] = (string) $row[ $map['href'] ];
			}
			$rows[] = $entry;
		}
		return self::rank_and_cap( $rows, $max );
	}

	/**
	 * Pick the first `days` entry from a WPCOM days-keyed response.
	 *
	 * Different top-content endpoints key their per-day data under `days`
	 * (posts, referrers, authors, countries, ...) or `days -> <date>`; a few
	 * flatten it entirely (tags). This helper handles the common case.
	 *
	 * @param array $raw Raw WPCOM response.
	 * @return array The first day's sub-array, or [].
	 */
	private static function first_day( array $raw ): array {
		if ( ! isset( $raw['days'] ) || ! is_array( $raw['days'] ) || empty( $raw['days'] ) ) {
			return array();
		}
		$first = reset( $raw['days'] );
		return is_array( $first ) ? $first : array();
	}

	/**
	 * Rank, cap, and strip null href fields.
	 *
	 * @param array $rows Unranked rows.
	 * @param int   $max  Result cap.
	 * @return array Ranked + capped rows with `rank` injected.
	 */
	private static function rank_and_cap( array $rows, int $max ): array {
		$rows = array_slice( $rows, 0, $max );
		$out  = array();
		foreach ( $rows as $i => $row ) {
			$entry = array(
				'rank'  => $i + 1,
				'label' => isset( $row['label'] ) ? (string) $row['label'] : '',
				'value' => isset( $row['value'] ) ? (int) $row['value'] : 0,
			);
			if ( isset( $row['href'] ) && '' !== $row['href'] ) {
				$entry['href'] = $row['href'];
			}
			$out[] = $entry;
		}
		return $out;
	}

	/**
	 * Extract a compact streak summary from the WPCOM streak response.
	 *
	 * @param array $streak Raw WPCOM streak response.
	 * @return array Compact `{ current_length, longest_length, longest_start, longest_end }`.
	 */
	private static function extract_streak_summary( array $streak ): array {
		$data = isset( $streak['streak'] ) && is_array( $streak['streak'] ) ? $streak['streak'] : array();
		return array(
			'current_length' => isset( $data['currentStreakLength'] ) ? (int) $data['currentStreakLength'] : 0,
			'longest_length' => isset( $data['longestStreakLength'] ) ? (int) $data['longestStreakLength'] : 0,
			'longest_start'  => isset( $data['longestStreakStart'] ) ? (string) $data['longestStreakStart'] : '',
			'longest_end'    => isset( $data['longestStreakEnd'] ) ? (string) $data['longestStreakEnd'] : '',
		);
	}

	/**
	 * Extract the top referrer from a highlights `today` block.
	 *
	 * @param array $today Highlights today block.
	 * @return array|null { name, views } or null.
	 */
	private static function extract_top_referrer( array $today ): ?array {
		$list = isset( $today['top_referrers'] ) && is_array( $today['top_referrers'] ) ? $today['top_referrers'] : array();
		if ( empty( $list ) ) {
			return null;
		}
		$first = $list[0];
		if ( ! is_array( $first ) ) {
			return null;
		}
		return array(
			'name'  => isset( $first['name'] ) ? (string) $first['name'] : '',
			'views' => isset( $first['views'] ) ? (int) $first['views'] : 0,
		);
	}

	/**
	 * Extract a post-views series from the WPCOM get_post_views response.
	 *
	 * WPCOM returns `data` as a list of `[date, views]` tuples under the
	 * `fields` header. We normalize to `[{ date, views }]`.
	 *
	 * @param array $raw Raw WPCOM response.
	 * @return array
	 */
	private static function extract_post_views_series( array $raw ): array {
		if ( ! isset( $raw['data'] ) || ! is_array( $raw['data'] ) ) {
			return array();
		}

		$fields    = isset( $raw['fields'] ) && is_array( $raw['fields'] ) ? $raw['fields'] : array( 'period', 'views' );
		$date_idx  = array_search( 'period', $fields, true );
		$views_idx = array_search( 'views', $fields, true );
		if ( false === $date_idx || false === $views_idx ) {
			// If either column is missing from the WPCOM response, the positional
			// fallback is unsafe (we might collide date/views on column 0). Drop
			// to empty rather than emit lies.
			return array();
		}

		$series = array();
		foreach ( $raw['data'] as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$series[] = array(
				'date'  => isset( $row[ $date_idx ] ) ? (string) $row[ $date_idx ] : '',
				'views' => isset( $row[ $views_idx ] ) ? (int) $row[ $views_idx ] : 0,
			);
		}
		return $series;
	}

	/**
	 * Normalize the WPCOM get_visits response into `[{ date, <field>: int, ... }]`.
	 *
	 * @param array $raw    Raw WPCOM response.
	 * @param array $fields Requested metric fields.
	 * @return array
	 */
	private static function normalize_visits_series( array $raw, array $fields ): array {
		if ( ! isset( $raw['data'] ) || ! is_array( $raw['data'] ) ) {
			return array();
		}

		$raw_fields = isset( $raw['fields'] ) && is_array( $raw['fields'] ) ? $raw['fields'] : array();
		$field_idx  = array();
		foreach ( $raw_fields as $idx => $name ) {
			$field_idx[ (string) $name ] = $idx;
		}
		$date_idx = $field_idx['period'] ?? 0;

		$series = array();
		foreach ( $raw['data'] as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$entry = array(
				'date' => isset( $row[ $date_idx ] ) ? (string) $row[ $date_idx ] : '',
			);
			foreach ( $fields as $field ) {
				$idx             = $field_idx[ $field ] ?? null;
				$entry[ $field ] = ( null !== $idx && isset( $row[ $idx ] ) ) ? (int) $row[ $idx ] : 0;
			}
			$series[] = $entry;
		}
		return $series;
	}

	/**
	 * Normalize a candidate date string. Returns today's date (UTC) on bad input.
	 *
	 * @param mixed $raw Raw input value.
	 * @return string YYYY-MM-DD.
	 */
	private static function sanitize_date( $raw ): string {
		if ( is_string( $raw ) && 1 === preg_match( '/^\d{4}-\d{2}-\d{2}$/', $raw ) ) {
			return $raw;
		}
		return gmdate( 'Y-m-d' );
	}

	/**
	 * Clamp an integer into [$min, $max] with a default on bad input.
	 *
	 * @param mixed $raw     Raw input.
	 * @param int   $min     Minimum.
	 * @param int   $max     Maximum.
	 * @param int   $default Default on bad input.
	 * @return int
	 */
	private static function clamp_int( $raw, int $min, int $max, int $default ): int {
		if ( ! is_numeric( $raw ) ) {
			return $default;
		}
		$v = (int) $raw;
		if ( $v < $min ) {
			return $min;
		}
		if ( $v > $max ) {
			return $max;
		}
		return $v;
	}

	/**
	 * Safely read an int field from an array.
	 *
	 * @param array  $arr Array.
	 * @param string $key Key.
	 * @return int
	 */
	private static function as_int( array $arr, string $key ): int {
		return isset( $arr[ $key ] ) ? (int) $arr[ $key ] : 0;
	}
}
