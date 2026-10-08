<?php
/**
 * Jetpack Stats Abilities Registration.
 *
 * Registers Jetpack Stats abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats\Abilities;

use Automattic\Jetpack\Stats\Settings;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers Jetpack Stats abilities with the WordPress Abilities API.
 *
 * Exposes a small, consolidated surface for reading Jetpack Stats traffic
 * insights and managing site-level Stats settings so AI agents can
 * answer site-owner questions through the standard `wp-abilities/v1` REST
 * surface. Seven abilities wrap ~25 atomic WPCOM Stats endpoints plus the
 * `stats_options` WP option.
 */
class Stats_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-stats';
	const ERROR_PREFIX  = Settings::ERROR_PREFIX;

	/**
	 * Allowed `type` values for `get-top-content`.
	 */
	const TOP_CONTENT_TYPES = array( 'posts', 'referrers', 'search-terms', 'clicks', 'tags', 'authors', 'countries', 'downloads', 'video-plays' );

	/**
	 * Allowed aggregation periods for timeseries + top-content reads.
	 */
	const PERIODS = array( 'day', 'week', 'month', 'year' );

	/**
	 * Allowed metric fields for `get-visits`.
	 */
	const VISIT_FIELDS = array( 'views', 'visitors', 'likes', 'comments' );

	/**
	 * Default metric fields for `get-visits` when the caller omits `fields`.
	 */
	const DEFAULT_VISIT_FIELDS = array( 'views', 'visitors' );

	/**
	 * Normalization table for `get-top-content`.
	 *
	 * Each entry describes how to project a WPCOM `days -> <date> -> <list>`
	 * (or `summary -> <list>`) array of rows into the uniform
	 * `{ rank, label, value, href? }` shape. A field given as a list of keys
	 * takes the first key that is present on the row.
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
			// WPCOM `stats/referrers` keys per-day data under `groups`, not `referrers` —
			// each group exposes `name`, `total`, and (sometimes) `url`.
			'list'  => 'groups',
			'label' => 'name',
			'value' => 'total',
			'href'  => 'url',
		),
		'search-terms' => array(
			'list'  => 'search_terms',
			'label' => 'term',
			'value' => 'views',
		),
		'clicks'       => array(
			'list'  => 'clicks',
			'label' => array( 'name', 'url' ),
			'value' => 'views',
			'href'  => 'url',
		),
		'authors'      => array(
			'list'  => 'authors',
			'label' => 'name',
			'value' => 'views',
		),
		'downloads'    => array(
			'list'  => 'files',
			'label' => array( 'filename', 'relative_url' ),
			'value' => array( 'downloads', 'download_count' ),
			'href'  => array( 'download_url', 'relative_url' ),
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
			'description' => __( 'Abilities for reading Jetpack Stats traffic insights and managing site-level Stats settings.', 'jetpack-stats-pkg' ),
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
			'jetpack-stats/get-settings'      => self::spec_get_settings(),
			'jetpack-stats/update-settings'   => self::spec_update_settings(),
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
			'label'               => __( 'Get site stats overview', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Return a single zero-argument snapshot answering "how is my site doing right now?" — today\'s views/visitors, views over the last 7 and 30 days, the current posting streak, today\'s top post, and today\'s top referrer. Shape: { date, views_today, visitors_today, views_week, views_month, streak: { current_length, longest_length, longest_start, longest_end }, top_post: { id, title, views }, top_referrer: { name, views }, partial: bool, errors?: [string] }. `views_week` and `views_month` are rolling totals for the last 7 and 30 days, today included (not calendar weeks or months). `top_post` is today\'s most-viewed post or page (the home page / archives row is skipped, so `id` is always a real post ID); `top_post` and `top_referrer` are null when there is none today. Composes the WPCOM stats/summary, stats/visits, stats/streak, stats/top-posts, and stats/referrers endpoints — if any sub-call fails, `partial` is true and `errors` lists the failed sub-calls (`summary`, `visits`, `streak`, `top_posts`, `referrers`); when `partial` is true, count fields owned by the failed sub-call(s) are placeholder zeros rather than confirmed counts (cross-reference `errors` before treating a `0` as authoritative). If every sub-call fails, returns `jetpack_stats_data_unavailable`. Precondition: the site must be connected to WordPress.com. Results cached for ~5 minutes by WPCOM_Stats — safe to poll.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
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
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool', // default is already "tool", but can be explicit.
				),
			),
		);
	}

	/**
	 * Spec: jetpack-stats/get-top-content.
	 */
	private static function spec_get_top_content(): array {
		return array(
			'label'               => __( 'Get top stats content', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Return the top items for a chosen content type — posts, referrers, search terms, outbound clicks, tags/categories, authors, countries, downloads, or video plays — in one filtered call. Replaces nine atomic WPCOM endpoints with a single ability. Uniform shape: { type, period, date, num, max, items: [ { rank, label, value, href? } ] } — agents MUST NOT see a different shape per type. `label` is human-readable (post title, referrer host, search term, country name, etc.). `value` is the view/hit count for that item. `href` is present only when the item has a canonical URL. With `num` above 1, items are totals across the `num` periods ending with the one containing `date` (e.g. period=day, num=7 is the last seven days). `tags` ignores `period`, `date` and `num`. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'type' ),
				'properties'           => array(
					'type'   => array(
						'type'        => 'string',
						'description' => __( 'Which top-N surface to fetch.', 'jetpack-stats-pkg' ),
						'enum'        => self::TOP_CONTENT_TYPES,
					),
					'period' => array(
						'type'        => 'string',
						'description' => __( 'Aggregation period.', 'jetpack-stats-pkg' ),
						'enum'        => self::PERIODS,
						'default'     => 'day',
					),
					'date'   => array(
						'type'        => 'string',
						'description' => __( 'End date (YYYY-MM-DD). Defaults to today.', 'jetpack-stats-pkg' ),
						'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
					),
					'num'    => array(
						'type'        => 'integer',
						'description' => __( 'How many prior periods to roll up (1-90).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 1,
					),
					'max'    => array(
						'type'        => 'integer',
						'description' => __( 'Results cap (1-100).', 'jetpack-stats-pkg' ),
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
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool', // default is already "tool", but can be explicit.
				),
			),
		);
	}

	/**
	 * Spec: jetpack-stats/get-post-views.
	 */
	private static function spec_get_post_views(): array {
		return array(
			'label'               => __( 'Get views for a post', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Return views history for a single post: total views, timeseries of per-period views, and the period metadata. Shape: { post_id, total_views, period, num, date, series: [ { date, views } ] }. `total_views` is the post\'s all-time view count. `series` always has `num` rows, oldest first, ending with the period that contains `date`; each row\'s `date` is the first day of its period (weeks start on Monday) and periods with no views are 0. Returns `jetpack_stats_post_not_found` when no post has that ID. Accepts post_id as integer or numeric string (the literal "0" is rejected only because WordPress has no post 0 — any positive numeric value is legal). Precondition: site must be connected to WordPress.com. Related: call jetpack-stats/get-top-content with type=posts first to discover which posts to drill into.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'post_id' ),
				'properties'           => array(
					'post_id' => array(
						'type'        => array( 'integer', 'string' ),
						'description' => __( 'The post ID to fetch views for. Must be positive.', 'jetpack-stats-pkg' ),
					),
					'period'  => array(
						'type'        => 'string',
						'description' => __( 'Aggregation period.', 'jetpack-stats-pkg' ),
						'enum'        => self::PERIODS,
						'default'     => 'day',
					),
					'num'     => array(
						'type'        => 'integer',
						'description' => __( 'How many prior periods to include (1-90).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 30,
					),
					'date'    => array(
						'type'        => 'string',
						'description' => __( 'End date (YYYY-MM-DD). Defaults to today.', 'jetpack-stats-pkg' ),
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
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool', // default is already "tool", but can be explicit.
				),
			),
		);
	}

	/**
	 * Spec: jetpack-stats/get-visits.
	 */
	private static function spec_get_visits(): array {
		return array(
			'label'               => __( 'Get site visits timeseries', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Return a site-level views/visitors/likes/comments timeseries — answers "is traffic trending up?". Shape: { unit, quantity, date, fields, series: [ { date, views, visitors, likes, comments } ] }. Every series row always includes every field listed in the request (no per-row omission). Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'unit'     => array(
						'type'        => 'string',
						'description' => __( 'Granularity of each data point.', 'jetpack-stats-pkg' ),
						'enum'        => self::PERIODS,
						'default'     => 'day',
					),
					'quantity' => array(
						'type'        => 'integer',
						'description' => __( 'How many data points to return (1-90).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 30,
					),
					'date'     => array(
						'type'        => 'string',
						'description' => __( 'End date (YYYY-MM-DD). Defaults to today.', 'jetpack-stats-pkg' ),
						'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
					),
					'fields'   => array(
						'type'        => 'array',
						'description' => __( 'Which metrics to include in each row. Defaults to views+visitors.', 'jetpack-stats-pkg' ),
						'items'       => array(
							'type' => 'string',
							'enum' => self::VISIT_FIELDS,
						),
						'default'     => self::DEFAULT_VISIT_FIELDS,
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
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool', // default is already "tool", but can be explicit.
				),
			),
		);
	}

	/**
	 * Spec: jetpack-stats/get-followers.
	 */
	private static function spec_get_followers(): array {
		return array(
			'label'               => __( 'Get follower counts', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Return a breakdown of follower counts across email, WordPress.com, comment, and publicize (per-service) — answers "how is my audience growing?" in one call. Shape: { total, email, wpcom, comment, publicize: { <service>: count }, partial: bool, errors?: [string] }. `email` and `wpcom` are the site\'s email subscribers and WordPress.com followers; `publicize` is an object, empty when no social connection reports followers. Composes three WPCOM endpoints — if any sub-call fails, `partial` is true and `errors` lists the failed sub-calls; when `partial` is true, source counts owned by the failed sub-call(s) are placeholder zeros rather than confirmed zero counts (cross-reference `errors` before treating a `0` as authoritative). Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
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
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool', // default is already "tool", but can be explicit.
				),
			),
		);
	}

	/**
	 * Spec: jetpack-stats/get-settings.
	 */
	private static function spec_get_settings(): array {
		return array(
			'label'               => __( 'Get Stats settings', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Read the current Jetpack Stats settings: who sees the Stats admin bar + menu, whose visits are counted, and DNT behavior. Shape: { admin_bar, roles, count_roles, do_not_track }. `roles` is an array of role slugs that can view Stats; `count_roles` is an array of role slugs whose visits are counted. Call jetpack-stats/update-settings to change any of these.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => self::settings_output_properties(),
			),
			'execute_callback'    => array( __CLASS__, 'get_settings' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool', // default is already "tool", but can be explicit.
				),
			),
		);
	}

	/**
	 * Spec: jetpack-stats/update-settings.
	 */
	private static function spec_update_settings(): array {
		return array(
			'label'               => __( 'Update Stats settings', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Update one or more Jetpack Stats settings. All fields are optional; only fields present in the call are written, and unrelated keys are preserved. Idempotent — setting a value to its current state returns changed=false. Shape: { changed, settings: { admin_bar, roles, count_roles, do_not_track } }. Role slugs added to `roles` or `count_roles` must be registered roles on the site; unknown slugs return jetpack_stats_invalid_role. A slug that is already saved is kept even when its role no longer exists. Narrowing `roles` can revoke Stats access for whole groups of users — confirm with the user before removing roles.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'admin_bar'    => array(
						'type'        => 'boolean',
						'description' => __( 'Whether to show the Stats item in the admin bar for users who can view Stats.', 'jetpack-stats-pkg' ),
					),
					'roles'        => array(
						'type'        => 'array',
						'description' => __( 'Role slugs that can view Stats. Must be non-empty; each added slug must be a registered role. `administrator` is always kept.', 'jetpack-stats-pkg' ),
						'items'       => array( 'type' => 'string' ),
						'minItems'    => 1,
					),
					'count_roles'  => array(
						'type'        => 'array',
						'description' => __( 'Role slugs whose visits are counted. May be empty (count visits from all users).', 'jetpack-stats-pkg' ),
						'items'       => array( 'type' => 'string' ),
					),
					'do_not_track' => array(
						'type'        => 'boolean',
						'description' => __( 'Whether to honor the browser Do Not Track header.', 'jetpack-stats-pkg' ),
					),
				),
				'additionalProperties' => false,
				'minProperties'        => 1,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'changed'  => array( 'type' => 'boolean' ),
					'settings' => array(
						'type'       => 'object',
						'properties' => self::settings_output_properties(),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'update_settings' ),
			'permission_callback' => array( __CLASS__, 'can_manage_settings' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool', // default is already "tool", but can be explicit.
				),
			),
		);
	}

	/**
	 * Output schema properties shared by get-settings and update-settings' `settings` field.
	 */
	private static function settings_output_properties(): array {
		return array(
			'admin_bar'    => array( 'type' => 'boolean' ),
			'roles'        => array(
				'type'  => 'array',
				'items' => array( 'type' => 'string' ),
			),
			'count_roles'  => array(
				'type'  => 'array',
				'items' => array( 'type' => 'string' ),
			),
			'do_not_track' => array( 'type' => 'boolean' ),
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
	public static function can_manage_settings(): bool {
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
		$today = self::sanitize_date( null );
		$day   = array(
			'period' => 'day',
			'date'   => $today,
		);

		$composed = self::compose_subcalls(
			array(
				'summary'   => $stats->get_stats_summary(),
				'visits'    => $stats->get_visits(
					array(
						'unit'        => 'day',
						'quantity'    => 30,
						'date'        => $today,
						'stat_fields' => 'views',
					)
				),
				'streak'    => $stats->get_streak(),
				// A few rows, so a post can be found below the home page / archives row.
				'top_posts' => $stats->get_top_posts( $day + array( 'max' => 10 ) ),
				'referrers' => $stats->get_referrers( $day + array( 'max' => 1 ) ),
			),
			__( 'Stats data could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-stats-pkg' )
		);
		if ( is_wp_error( $composed ) ) {
			return $composed;
		}
		$values = $composed['values'];
		$errors = $composed['errors'];

		$daily_views = array_column( self::normalize_visits_series( $values['visits'], array( 'views' ) ), 'views' );
		$top_post    = self::first_row(
			$values['top_posts'],
			'postviews',
			static function ( array $row ): bool {
				return isset( $row['id'] ) && (int) $row['id'] > 0;
			}
		);
		$top_ref     = self::first_row( $values['referrers'], 'groups' );

		$out = array(
			'date'           => self::first_string( array( $values['summary'], array( 'date' => $today ) ), 'date' ),
			'views_today'    => self::as_int( $values['summary'], 'views' ),
			'visitors_today' => self::as_int( $values['summary'], 'visitors' ),
			// The series ends today, so its last 7 rows are the last 7 days.
			'views_week'     => (int) array_sum( array_slice( $daily_views, -7 ) ),
			'views_month'    => (int) array_sum( $daily_views ),
			'streak'         => self::extract_streak_summary( $values['streak'] ),
			'top_post'       => null === $top_post ? null : array(
				'id'    => self::as_int( $top_post, 'id' ),
				'title' => isset( $top_post['title'] ) ? (string) $top_post['title'] : '',
				'views' => self::as_int( $top_post, 'views' ),
			),
			'top_referrer'   => null === $top_ref ? null : array(
				'name'  => isset( $top_ref['name'] ) ? (string) $top_ref['name'] : '',
				'views' => self::as_int( $top_ref, 'total' ),
			),
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
					__( 'A `type` is required. Valid values: %s.', 'jetpack-stats-pkg' ),
					implode( ', ', self::TOP_CONTENT_TYPES )
				)
			);
		}

		$type   = $input['type'];
		$period = self::pick_period( $input['period'] ?? null );
		$date   = self::sanitize_date( $input['date'] ?? null );
		$num    = self::clamp_int( $input['num'] ?? 1, 1, 90, 1 );
		$max    = self::clamp_int( $input['max'] ?? 20, 1, 100, 20 );

		$args = array(
			'period' => $period,
			'date'   => $date,
			'max'    => $max,
		);
		// Without `summarize`, WPCOM returns each period separately and only the first would be read.
		if ( $num > 1 ) {
			$args['num']       = $num;
			$args['summarize'] = 1;
		}

		$stats = self::get_wpcom_stats();
		$raw   = self::fetch_top_content_raw( $stats, $type, $args );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		$items = self::normalize_top_content_items( $type, $raw, $max, isset( $args['summarize'] ) );

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
				__( 'A positive post_id is required.', 'jetpack-stats-pkg' )
			);
		}

		$post_id = (int) $input['post_id'];
		$period  = self::pick_period( $input['period'] ?? null );
		$num     = self::clamp_int( $input['num'] ?? 30, 1, 90, 30 );
		$date    = self::sanitize_date( $input['date'] ?? null );

		// WPCOM answers an unknown post with the same generic failure as an outage.
		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'post_not_found',
				__( 'No post exists with that post_id.', 'jetpack-stats-pkg' ),
				array( 'status' => 404 )
			);
		}

		// The endpoint takes no period or date: `data` is every day since publication.
		$stats = self::get_wpcom_stats();
		$raw   = $stats->get_post_views( $post_id );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		return array(
			'post_id'     => $post_id,
			'total_views' => isset( $raw['views'] ) ? (int) $raw['views'] : 0,
			'period'      => $period,
			'num'         => $num,
			'date'        => $date,
			'series'      => self::bucket_daily_views( self::extract_post_views_series( $raw ), $period, $num, $date ),
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

		$unit     = self::pick_period( $input['unit'] ?? null );
		$quantity = self::clamp_int( $input['quantity'] ?? 30, 1, 90, 30 );
		$date     = self::sanitize_date( $input['date'] ?? null );

		// Pass user input FIRST to array_intersect so caller-supplied field order is preserved.
		$fields = isset( $input['fields'] ) && is_array( $input['fields'] )
			? array_values( array_intersect( $input['fields'], self::VISIT_FIELDS ) )
			: array();
		if ( empty( $fields ) ) {
			$fields = self::DEFAULT_VISIT_FIELDS;
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

		$composed = self::compose_subcalls(
			array(
				'followers'           => $stats->get_followers(
					array(
						'type' => 'all',
						'max'  => 1,
					)
				),
				'comment_followers'   => $stats->get_comment_followers(),
				'publicize_followers' => $stats->get_publicize_followers(),
			),
			__( 'Follower data could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-stats-pkg' )
		);
		if ( is_wp_error( $composed ) ) {
			return $composed;
		}
		$followers         = $composed['values']['followers'];
		$comment_followers = $composed['values']['comment_followers'];
		$publicize         = $composed['values']['publicize_followers'];
		$errors            = $composed['errors'];

		// The counts are totals on the response; `subscribers` is only a page of rows.
		$email   = self::as_int( $followers, 'total_email' );
		$wpcom   = self::as_int( $followers, 'total_wpcom' );
		$comment = self::as_int( $comment_followers, 'total' );

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
			// An empty PHP array would encode as `[]`, not the object the schema promises.
			'publicize' => (object) $publicize_by_service,
			'partial'   => ! empty( $errors ),
		);

		if ( ! empty( $errors ) ) {
			$out['errors'] = $errors;
		}

		return $out;
	}

	/**
	 * Execute: get-settings.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_settings( $input = null ) {
		unset( $input );
		return Settings::get( Settings::KEYS );
	}

	/**
	 * Execute: update-settings.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function update_settings( $input = null ) {
		return Settings::update( is_array( $input ) ? $input : array(), Settings::KEYS );
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Compose multiple WPCOM sub-call results into a partial-tolerant envelope.
	 *
	 * Each named result is either an array (kept as-is) or a WP_Error
	 * (replaced with `[]` and its key recorded under `errors`). Returns
	 * `jetpack_stats_data_unavailable` if every sub-call failed.
	 *
	 * @param array  $named_results       Map of error-tag => array|WP_Error.
	 * @param string $all_failed_message  Message for the all-failed WP_Error.
	 * @return array{values: array, errors: array}|WP_Error
	 */
	private static function compose_subcalls( array $named_results, string $all_failed_message ) {
		$values = array();
		$errors = array();
		foreach ( $named_results as $tag => $result ) {
			if ( is_wp_error( $result ) ) {
				$errors[]       = (string) $tag;
				$values[ $tag ] = array();
			} else {
				$values[ $tag ] = $result;
			}
		}

		if ( count( $errors ) === count( $named_results ) ) {
			return new WP_Error( self::ERROR_PREFIX . 'data_unavailable', $all_failed_message );
		}

		return array(
			'values' => $values,
			'errors' => $errors,
		);
	}

	/**
	 * Return the first non-empty string at `$key` across the given source arrays.
	 *
	 * @param array[] $sources Ordered list of arrays to probe.
	 * @param string  $key     Key to read from each array.
	 * @return string
	 */
	private static function first_string( array $sources, string $key ): string {
		foreach ( $sources as $source ) {
			if ( isset( $source[ $key ] ) && '' !== $source[ $key ] ) {
				return (string) $source[ $key ];
			}
		}
		return '';
	}

	/**
	 * Resolve an aggregation period from raw input, defaulting to `day`.
	 *
	 * @param mixed $raw Raw input value.
	 * @return string One of self::PERIODS.
	 */
	private static function pick_period( $raw ): string {
		return is_string( $raw ) && in_array( $raw, self::PERIODS, true ) ? $raw : 'day';
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
		 * @since 0.19.0
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

		return new WP_Error( self::ERROR_PREFIX . 'invalid_type', __( 'Unknown top-content type.', 'jetpack-stats-pkg' ) );
	}

	/**
	 * Normalize a WPCOM top-content response into the uniform item shape.
	 *
	 * Most `type` values follow the `days -> <first-day> -> <list-key>` shape
	 * and project through `TOP_CONTENT_MAP`. `tags` (flat `tags` array, no
	 * `days` envelope) and `countries` (needs `country-info` code-to-name
	 * join) are special-cased.
	 *
	 * @param string $type       Content type enum.
	 * @param array  $raw        Raw WPCOM response.
	 * @param int    $max        Result cap.
	 * @param bool   $summarized Whether the request asked WPCOM to `summarize`.
	 * @return array List of { rank, label, value, href? } items.
	 */
	private static function normalize_top_content_items( string $type, array $raw, int $max, bool $summarized = false ): array {
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

		$day_data = self::first_period_block( $raw, $summarized );

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
			$entry = array(
				'label' => (string) self::pick_field( $row, $map['label'] ),
				'value' => (int) self::pick_field( $row, $map['value'] ),
			);
			$href  = isset( $map['href'] ) ? self::pick_field( $row, $map['href'] ) : null;
			if ( null !== $href ) {
				$entry['href'] = (string) $href;
			}
			$rows[] = $entry;
		}
		return self::rank_and_cap( $rows, $max );
	}

	/**
	 * Return the block of a WPCOM list response that holds the rows to report.
	 *
	 * A `summarize=1` request totals the periods under `summary` (`days -> summary`
	 * for video plays); otherwise each period sits under `days -> <date>`, and a
	 * single-period request has exactly one of those.
	 *
	 * @param array $raw        Raw WPCOM response.
	 * @param bool  $summarized Whether the request asked WPCOM to `summarize`.
	 * @return array The period block, or [].
	 */
	private static function first_period_block( array $raw, bool $summarized = false ): array {
		if ( $summarized ) {
			$summary = ! empty( $raw['summary'] ) ? $raw['summary'] : ( $raw['days']['summary'] ?? array() );
			return is_array( $summary ) ? $summary : array();
		}
		if ( ! isset( $raw['days'] ) || ! is_array( $raw['days'] ) || empty( $raw['days'] ) ) {
			return array();
		}
		$first = reset( $raw['days'] );
		return is_array( $first ) ? $first : array();
	}

	/**
	 * Return the first row of a list in a WPCOM list response, or null when there is none.
	 *
	 * @param array         $raw      Raw WPCOM response.
	 * @param string        $list_key Key of the list inside the period block (e.g. `postviews`).
	 * @param callable|null $accept   Optional test a row must pass.
	 * @return array|null
	 */
	private static function first_row( array $raw, string $list_key, ?callable $accept = null ): ?array {
		$list = self::first_period_block( $raw )[ $list_key ] ?? null;
		foreach ( is_array( $list ) ? $list : array() as $row ) {
			if ( is_array( $row ) && ( null === $accept || $accept( $row ) ) ) {
				return $row;
			}
		}
		return null;
	}

	/**
	 * Read the first of the given keys that is present and non-empty on a row.
	 *
	 * @param array           $row  Row from a WPCOM list.
	 * @param string|string[] $keys Key, or keys in order of preference.
	 * @return mixed|null
	 */
	private static function pick_field( array $row, $keys ) {
		foreach ( (array) $keys as $key ) {
			if ( isset( $row[ $key ] ) && '' !== $row[ $key ] ) {
				return $row[ $key ];
			}
		}
		return null;
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
	 * Total a daily views series into the `$num` periods ending with the one containing `$date`.
	 *
	 * @param array  $daily  Rows of `{ date: YYYY-MM-DD, views }`.
	 * @param string $period One of self::PERIODS.
	 * @param int    $num    Number of periods to return.
	 * @param string $date   YYYY-MM-DD inside the last period.
	 * @return array Rows of `{ date, views }`, oldest first, keyed by each period's first day.
	 */
	private static function bucket_daily_views( array $daily, string $period, int $num, string $date ): array {
		$start = self::period_start( $date, $period );
		if ( null === $start ) {
			return array();
		}

		$step   = array(
			'day'   => '-1 day',
			'week'  => '-7 days',
			'month' => '-1 month',
			'year'  => '-1 year',
		)[ $period ];
		$totals = array();
		for ( $i = 0; $i < $num; $i++ ) {
			$totals[ $start->format( 'Y-m-d' ) ] = 0;
			$start                               = $start->modify( $step );
		}

		foreach ( $daily as $row ) {
			$row_start = self::period_start( $row['date'], $period );
			$key       = null === $row_start ? null : $row_start->format( 'Y-m-d' );
			if ( null !== $key && isset( $totals[ $key ] ) ) {
				$totals[ $key ] += (int) $row['views'];
			}
		}

		$series = array();
		foreach ( array_reverse( $totals, true ) as $day => $views ) {
			$series[] = array(
				'date'  => $day,
				'views' => $views,
			);
		}
		return $series;
	}

	/**
	 * First day of the period containing a date; weeks start on Monday, as in WordPress.com Stats.
	 *
	 * @param string $date   YYYY-MM-DD.
	 * @param string $period One of self::PERIODS.
	 * @return \DateTimeImmutable|null Null when the date cannot be parsed.
	 */
	private static function period_start( string $date, string $period ): ?\DateTimeImmutable {
		$day = \DateTimeImmutable::createFromFormat( '!Y-m-d', $date, new \DateTimeZone( 'UTC' ) );
		if ( false === $day ) {
			return null;
		}

		switch ( $period ) {
			case 'week':
				return $day->modify( '-' . ( (int) $day->format( 'N' ) - 1 ) . ' days' );
			case 'month':
				return $day->modify( 'first day of this month' );
			case 'year':
				return $day->setDate( (int) $day->format( 'Y' ), 1, 1 );
		}
		return $day;
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
	 * Normalize a candidate date string. Returns the site's today on bad input, since WPCOM Stats days are site-local.
	 *
	 * @param mixed $raw Raw input value.
	 * @return string YYYY-MM-DD.
	 */
	private static function sanitize_date( $raw ): string {
		if ( is_string( $raw ) && 1 === preg_match( '/^(\d{4})-(\d{2})-(\d{2})$/', $raw, $m ) && checkdate( (int) $m[2], (int) $m[3], (int) $m[1] ) ) {
			return $raw;
		}
		return wp_date( 'Y-m-d' );
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
