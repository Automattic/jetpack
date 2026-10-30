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
use Jetpack_Options;
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
	 * `{ rank, label, value, href?, id? }` shape. A field given as a list of keys
	 * reads the first of them that is set and not ''.
	 * `countries` (needs `country-info` join) and `tags` (rows that group
	 * several terms, no `days` envelope) are special-cased in the callback.
	 */
	const TOP_CONTENT_MAP = array(
		'posts'        => array(
			'list'  => 'postviews',
			'label' => 'title',
			'value' => 'views',
			'href'  => 'href',
			'id'    => 'id',
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
				'Return a single zero-argument snapshot answering "how is my site doing right now?" — today\'s views/visitors, views over the last 7 and 30 days, the current posting streak, today\'s top post, and today\'s top referrer. Shape: { site: { id, url }, date, views_today, visitors_today, views_week, views_month, streak: { current_length, longest_length, longest_start, longest_end }, top_post: { id, title, views }, top_referrer: { name, views }, partial: bool, errors?: [string] }. `views_week` and `views_month` are rolling totals for the last 7 and 30 days, today included (not calendar weeks or months). `streak.current_length` is 0 unless the latest posting streak reaches today or yesterday. `top_post` is today\'s most-viewed post or page (the home page / archives row is skipped, so `id` is always a real post ID); `top_post` and `top_referrer` are null when there is none today. Composes the WPCOM stats/visits, stats/streak, stats/top-posts, and stats/referrers endpoints — if any sub-call fails, `partial` is true and `errors` lists the failed sub-calls: `visits` (every views and visitors field), `streak`, `top_posts` (`top_post`), and `referrers` (`top_referrer`). Fields fed by a failed sub-call are null, `streak` included, as is a total covering a day WordPress.com did not report, so a 0 is a value WordPress.com reported. If every sub-call fails, returns `jetpack_stats_data_unavailable`. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. Precondition: the site must be connected to WordPress.com. Results cached for ~5 minutes by WPCOM_Stats — safe to poll.',
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
					'site'           => self::site_schema(),
					'views_today'    => array( 'type' => array( 'integer', 'null' ) ),
					'visitors_today' => array( 'type' => array( 'integer', 'null' ) ),
					'views_week'     => array( 'type' => array( 'integer', 'null' ) ),
					'views_month'    => array( 'type' => array( 'integer', 'null' ) ),
					'streak'         => array( 'type' => array( 'object', 'null' ) ),
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
				'Return the top items for a chosen content type — posts, referrers, search terms, outbound clicks, tags/categories, authors, countries, downloads, or video plays — in one filtered call. Replaces nine atomic WPCOM endpoints with a single ability. Uniform shape: { site: { id, url }, type, period, date, num, max, items: [ { rank, label, value, href?, id? } ] } — agents MUST NOT see a different shape per type. `label` is human-readable (post title, referrer host, search term, country name, etc.); a tags item names every tag and category it groups, and countries WordPress.com cannot place share one item. `value` is the view/hit count for that item. `href` is present only when the item has a canonical URL. `id` is the post ID on posts items other than the home page / archives row — pass it to jetpack-stats/get-post-views. With `num` above 1, items are totals across the `num` periods ending with the one containing `date` (e.g. period=day, num=7 is the last seven days). `tags` ignores `period`, `date` and `num` and covers the seven days ending yesterday. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. Precondition: site must be connected to WordPress.com.',
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
					'site'   => self::site_schema(),
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
				'Return views history for a single post: total views, timeseries of per-period views, and the period metadata. Shape: { site: { id, url }, post_id, total_views, period, num, date, series: [ { date, views } ] }. `total_views` is the post\'s all-time view count; when WordPress.com does not report it, it and every `series` value are null. `series` always has `num` rows, oldest first, ending with the period that contains `date`; each row\'s `date` is the first day of its period (weeks start on Monday) and periods with no views are 0. Returns `jetpack_stats_post_not_found` when no post has that ID. Accepts post_id as integer or numeric string (the literal "0" is rejected only because WordPress has no post 0 — any positive numeric value is legal). `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. Precondition: site must be connected to WordPress.com. Related: call jetpack-stats/get-top-content with type=posts first and pass an item\'s `id` as `post_id`.',
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
					'site'        => self::site_schema(),
					'post_id'     => array( 'type' => 'integer' ),
					'total_views' => array( 'type' => array( 'integer', 'null' ) ),
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
				'Return a site-level views/visitors/likes/comments timeseries — answers "is traffic trending up?". Shape: { site: { id, url }, period, num, date, fields, series: [ { date, views, visitors, likes, comments } ] }. Every series row always includes every field listed in the request (no per-row omission); a value WordPress.com did not report, or reported as negative, is null rather than 0. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'period' => array(
						'type'        => 'string',
						'description' => __( 'Granularity of each data point.', 'jetpack-stats-pkg' ),
						'enum'        => self::PERIODS,
						'default'     => 'day',
					),
					'num'    => array(
						'type'        => 'integer',
						'description' => __( 'How many data points to return (1-90).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 30,
					),
					'date'   => array(
						'type'        => 'string',
						'description' => __( 'End date (YYYY-MM-DD). Defaults to today.', 'jetpack-stats-pkg' ),
						'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
					),
					'fields' => array(
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
					'site'   => self::site_schema(),
					'period' => array( 'type' => 'string' ),
					'num'    => array( 'type' => 'integer' ),
					'date'   => array( 'type' => 'string' ),
					'fields' => array( 'type' => 'array' ),
					'series' => array( 'type' => 'array' ),
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
				'Return a breakdown of follower counts across email, WordPress.com, comment, and publicize (per-service) — answers "how is my audience growing?" in one call. Shape: { site: { id, url }, total, email, wpcom, comment, publicize: { <service>: count }, partial: bool, errors?: [string] }. `email` and `wpcom` are the site\'s email subscribers and WordPress.com followers; `comment` counts people following the comments on every post (following one post\'s comments is not counted), and is reported as unknown through `errors` when WordPress.com does not list that count on its first page; `publicize` is an object, empty when no social connection reports followers. Composes three WPCOM endpoints — if any sub-call fails, `partial` is true and `errors` lists the failed sub-calls: `followers` (`email` and `wpcom`), `comment_followers`, and `publicize_followers`. Counts fed by a failed sub-call are null, `publicize` included, and `total` is null whenever any count is, so a 0 is a value WordPress.com reported. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. Precondition: site must be connected to WordPress.com.',
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
					'site'      => self::site_schema(),
					'total'     => array( 'type' => array( 'integer', 'null' ) ),
					'email'     => array( 'type' => array( 'integer', 'null' ) ),
					'wpcom'     => array( 'type' => array( 'integer', 'null' ) ),
					'comment'   => array( 'type' => array( 'integer', 'null' ) ),
					'publicize' => array( 'type' => array( 'object', 'null' ) ),
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
			'permission_callback' => array( __CLASS__, 'can_manage_settings' ),
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
	 * Settings permission, for reads and writes: manage_options, as on the Stats settings screen.
	 *
	 * The `stats_options` WP option includes the very roles that gate `view_stats`,
	 * so users who can only view stats must not read or change it.
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
		$today = self::today();
		$day   = array(
			'period' => 'day',
			'date'   => $today,
		);

		// A few rows, so a post can be found below the home page / archives row.
		$post_rows = 10;

		$composed = self::compose_subcalls(
			array(
				'visits'    => $stats->get_visits(
					array(
						'unit'        => 'day',
						'quantity'    => 30,
						'date'        => $today,
						'stat_fields' => 'views,visitors',
					)
				),
				'streak'    => $stats->get_streak(),
				'top_posts' => $stats->get_top_posts( $day + array( 'max' => $post_rows ) ),
				'referrers' => $stats->get_referrers( $day + array( 'max' => 1 ) ),
			),
			__( 'Stats data could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-stats-pkg' )
		);
		if ( is_wp_error( $composed ) ) {
			return $composed;
		}
		$values = $composed['values'];
		$errors = $composed['errors'];

		// The series ends today, so its last row is today and its last 7 rows are the last 7 days.
		$days     = self::normalize_visits_series( $values['visits'], array( 'views', 'visitors' ) );
		$last_day = end( $days );
		$last_day = false === $last_day ? array() : $last_day;
		$top_post = self::first_post( self::normalize_top_content_items( 'posts', $values['top_posts'], $post_rows ) );
		$top_ref  = self::normalize_top_content_items( 'referrers', $values['referrers'], 1 )[0] ?? null;

		$out = array(
			'site'           => self::site(),
			'date'           => $today,
			'views_today'    => $last_day['views'] ?? null,
			'visitors_today' => $last_day['visitors'] ?? null,
			'views_week'     => self::sum_or_null( array_slice( $days, -7 ), 'views' ),
			'views_month'    => self::sum_or_null( $days, 'views' ),
			'streak'         => in_array( 'streak', $errors, true ) ? null : self::extract_streak_summary( $values['streak'], $today ),
			'top_post'       => null === $top_post ? null : array(
				'id'    => $top_post['id'],
				'title' => $top_post['label'],
				'views' => $top_post['value'],
			),
			'top_referrer'   => null === $top_ref ? null : array(
				'name'  => $top_ref['label'],
				'views' => $top_ref['value'],
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
		$date   = self::resolve_date( $input['date'] ?? null );
		$num    = self::clamp_int( $input['num'] ?? 1, 1, 90, 1 );
		$max    = self::clamp_int( $input['max'] ?? 20, 1, 100, 20 );
		if ( is_wp_error( $date ) ) {
			return $date;
		}

		$args = array(
			'period' => $period,
			'date'   => $date,
			'max'    => $max,
		);
		// Without `summarize`, WPCOM returns each period separately and only the first would be read.
		// Several summarized endpoints ignore `period` and read `num` as days, so ask for the days the periods cover.
		if ( $num > 1 ) {
			$args = array_merge( $args, self::summary_window( $period, $num, $date ) );
		}

		$stats = self::get_wpcom_stats();
		$raw   = self::fetch_top_content_raw( $stats, $type, $args );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		$items = self::normalize_top_content_items( $type, $raw, $max, isset( $args['summarize'] ) );

		return array(
			'site'   => self::site(),
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
		$date    = self::resolve_date( $input['date'] ?? null );
		if ( is_wp_error( $date ) ) {
			return $date;
		}

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

		$total  = self::count_or_null( $raw['views'] ?? null );
		$series = self::bucket_daily_views( self::extract_post_views_series( $raw ), $period, $num, $date );
		if ( null === $total ) {
			// A body without the post's total is not one whose days can be read as zero.
			foreach ( $series as $i => $row ) {
				$series[ $i ]['views'] = null;
			}
		}

		return array(
			'site'        => self::site(),
			'post_id'     => $post_id,
			'total_views' => $total,
			'period'      => $period,
			'num'         => $num,
			'date'        => $date,
			'series'      => $series,
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

		$period = self::pick_period( $input['period'] ?? null );
		$num    = self::clamp_int( $input['num'] ?? 30, 1, 90, 30 );
		$date   = self::resolve_date( $input['date'] ?? null );
		if ( is_wp_error( $date ) ) {
			return $date;
		}

		// Pass user input FIRST to array_intersect so caller-supplied field order is preserved.
		$fields = isset( $input['fields'] ) && is_array( $input['fields'] )
			? array_values( array_intersect( $input['fields'], self::VISIT_FIELDS ) )
			: array();
		if ( empty( $fields ) ) {
			$fields = self::DEFAULT_VISIT_FIELDS;
		}

		$args = array(
			'unit'        => $period,
			'quantity'    => $num,
			'date'        => $date,
			'stat_fields' => implode( ',', $fields ),
		);

		$stats = self::get_wpcom_stats();
		$raw   = $stats->get_visits( $args );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		return array(
			'site'   => self::site(),
			'period' => $period,
			'num'    => $num,
			'date'   => $date,
			'fields' => $fields,
			'series' => self::normalize_visits_series( $raw, $fields ),
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
		$email   = self::count_or_null( $followers['total_email'] ?? null );
		$wpcom   = self::count_or_null( $followers['total_wpcom'] ?? null );
		$comment = null;
		if ( ! in_array( 'comment_followers', $errors, true ) ) {
			$comment = self::all_posts_comment_followers( $comment_followers );
			if ( null === $comment ) {
				$errors[] = 'comment_followers';
			}
		}

		$publicize_by_service = null;
		if ( ! in_array( 'publicize_followers', $errors, true ) ) {
			$publicize_by_service = array();
			foreach ( self::rows_at( $publicize, 'services' ) as $row ) {
				if ( isset( $row['service'] ) && isset( $row['followers'] ) ) {
					$publicize_by_service[ (string) $row['service'] ] = (int) $row['followers'];
				}
			}
		}

		$total = null;
		if ( null !== $email && null !== $wpcom && null !== $comment && null !== $publicize_by_service ) {
			$total = $email + $wpcom + $comment + array_sum( $publicize_by_service );
		}

		$out = array(
			'site'      => self::site(),
			'total'     => $total,
			'email'     => $email,
			'wpcom'     => $wpcom,
			'comment'   => $comment,
			// An empty PHP array would encode as `[]`, not the object the schema promises.
			'publicize' => null === $publicize_by_service ? null : (object) $publicize_by_service,
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
	 * An array result is kept as-is. Anything else — a WP_Error, or the decoded
	 * body of a response that was not a JSON object — is replaced with `[]` and
	 * its key recorded under `errors`. Returns `jetpack_stats_data_unavailable`
	 * if every sub-call failed.
	 *
	 * @param array  $named_results       Map of error-tag => sub-call result.
	 * @param string $all_failed_message  Message for the all-failed WP_Error.
	 * @return array{values: array<string, array>, errors: string[]}|WP_Error
	 */
	private static function compose_subcalls( array $named_results, string $all_failed_message ) {
		$values = array();
		$errors = array();
		foreach ( $named_results as $tag => $result ) {
			if ( is_array( $result ) ) {
				$values[ $tag ] = $result;
			} else {
				$errors[]       = (string) $tag;
				$values[ $tag ] = array();
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
	 * @param array       $args  Pre-built `{ period, date, max, num?, summarize? }` args — `tags` takes only `max`.
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
	 * Most `type` values follow the `days -> <date> -> <list-key>` shape (or
	 * `summary -> <list-key>` when summarized) and project through
	 * `TOP_CONTENT_MAP`. `tags` and `countries` are special-cased.
	 *
	 * @param string $type       Content type enum.
	 * @param array  $raw        Raw WPCOM response.
	 * @param int    $max        Result cap.
	 * @param bool   $summarized Whether the request asked WPCOM to `summarize`.
	 * @return array List of { rank, label, value, href?, id? } items.
	 */
	private static function normalize_top_content_items( string $type, array $raw, int $max, bool $summarized = false ): array {
		if ( 'tags' === $type ) {
			return self::rank_and_cap( self::tag_rows( $raw ), $max );
		}

		$day_data = self::first_period_block( $raw, $summarized );

		if ( 'countries' === $type ) {
			return self::rank_and_cap( self::country_rows( $day_data, self::rows_at( $raw, 'country-info' ) ), $max );
		}

		$map = self::TOP_CONTENT_MAP[ $type ] ?? null;
		if ( null === $map ) {
			return array();
		}

		$rows = array();
		foreach ( self::rows_at( $day_data, $map['list'] ) as $row ) {
			$rows[] = array(
				'label' => self::pick_field( $row, $map['label'] ),
				'value' => self::pick_field( $row, $map['value'] ),
				'href'  => isset( $map['href'] ) ? self::pick_field( $row, $map['href'] ) : null,
				'id'    => isset( $map['id'] ) ? self::pick_field( $row, $map['id'] ) : null,
			);
		}
		return self::rank_and_cap( $rows, $max );
	}

	/**
	 * Project `stats/tags` rows, which carry no `days` envelope, into label/value rows.
	 *
	 * Each row groups one or more tags and categories under a shared view count, so
	 * its label names them all; only a single-term row has one URL to link to.
	 *
	 * @param array $raw Raw WPCOM response: `{ tags: [ { tags: [ { type, name, link } ], views } ] }`.
	 * @return array
	 */
	private static function tag_rows( array $raw ): array {
		$rows = array();
		foreach ( self::rows_at( $raw, 'tags' ) as $row ) {
			$terms  = self::rows_at( $row, 'tags' );
			$rows[] = array(
				'label' => implode( ', ', array_column( $terms, 'name' ) ),
				'value' => $row['views'] ?? 0,
				'href'  => 1 === count( $terms ) ? ( array_column( $terms, 'link' )[0] ?? null ) : null,
			);
		}
		return $rows;
	}

	/**
	 * Project a `stats/country-views` period block into label/value rows named by `country-info`.
	 *
	 * Codes WordPress.com cannot name (AP and the legacy UK get `country_full: false`, and `-` marks
	 * a failed lookup) share one "Unknown" row; the A1, A2 and ZZ pseudo-codes name no place and are dropped.
	 *
	 * @param array $day_data     Period block holding the `views` rows.
	 * @param array $country_info Map of country code => `{ country_full }`.
	 * @return array
	 */
	private static function country_rows( array $day_data, array $country_info ): array {
		$unknown = __( 'Unknown', 'jetpack-stats-pkg' );
		$views   = array();
		foreach ( self::rows_at( $day_data, 'views' ) as $row ) {
			$code = (string) ( $row['country_code'] ?? '' );
			if ( in_array( $code, array( 'A1', 'A2', 'ZZ' ), true ) ) {
				continue;
			}
			$name            = $country_info[ $code ]['country_full'] ?? null;
			$label           = is_string( $name ) && '' !== $name ? $name : $unknown;
			$views[ $label ] = ( $views[ $label ] ?? 0 ) + (int) ( $row['views'] ?? 0 );
		}
		// Folding rows into "Unknown" can lift it above rows WordPress.com ranked higher.
		arsort( $views );

		$rows = array();
		foreach ( $views as $label => $value ) {
			$rows[] = array(
				'label' => (string) $label,
				'value' => $value,
			);
		}
		return $rows;
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
	 * Return the first posts item that is a post or page, skipping the home page / archives row.
	 *
	 * @param array $items Items from normalize_top_content_items().
	 * @return array|null
	 */
	private static function first_post( array $items ): ?array {
		foreach ( $items as $item ) {
			if ( isset( $item['id'] ) ) {
				return $item;
			}
		}
		return null;
	}

	/**
	 * Return the rows of the list (or the entries of the map) at `$key`, skipping any that are not arrays.
	 *
	 * @param array  $arr Array holding the list.
	 * @param string $key Key of the list.
	 * @return array[]
	 */
	private static function rows_at( array $arr, string $key ): array {
		$list = $arr[ $key ] ?? null;
		return is_array( $list ) ? array_filter( $list, 'is_array' ) : array();
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
	 * Cap rows and turn them into ranked items, dropping empty `href`s and non-positive `id`s.
	 *
	 * @param array $rows Rows of `{ label, value, href?, id? }`.
	 * @param int   $max  Result cap.
	 * @return array Items of `{ rank, label, value, href?, id? }`.
	 */
	private static function rank_and_cap( array $rows, int $max ): array {
		$items = array();
		foreach ( array_slice( $rows, 0, $max ) as $i => $row ) {
			$item = array(
				'rank'  => $i + 1,
				// WordPress.com sends titles and names HTML-encoded.
				'label' => html_entity_decode( (string) ( $row['label'] ?? '' ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'value' => (int) ( $row['value'] ?? 0 ),
			);
			if ( isset( $row['href'] ) && '' !== $row['href'] ) {
				$item['href'] = (string) $row['href'];
			}
			$id = (int) ( $row['id'] ?? 0 );
			if ( $id > 0 ) {
				$item['id'] = $id;
			}
			$items[] = $item;
		}
		return $items;
	}

	/**
	 * Extract a compact streak summary from the WPCOM streak response.
	 *
	 * WPCOM's `current` is the latest run of posting days even when it ended long ago, so it only counts
	 * as current when it ends today or yesterday.
	 *
	 * @param array  $streak Raw WPCOM streak response: `{ streak: { long: { start, end, length }, current: { … } } }`.
	 * @param string $today  The site's today, YYYY-MM-DD.
	 * @return array Compact `{ current_length, longest_length, longest_start, longest_end }`.
	 */
	private static function extract_streak_summary( array $streak, string $today ): array {
		$runs      = $streak['streak'] ?? array();
		$yesterday = gmdate( 'Y-m-d', strtotime( $today . ' -1 day' ) );
		$ongoing   = (string) ( $runs['current']['end'] ?? '' ) >= $yesterday;
		return array(
			'current_length' => $ongoing ? (int) ( $runs['current']['length'] ?? 0 ) : 0,
			'longest_length' => (int) ( $runs['long']['length'] ?? 0 ),
			'longest_start'  => (string) ( $runs['long']['start'] ?? '' ),
			'longest_end'    => (string) ( $runs['long']['end'] ?? '' ),
		);
	}

	/**
	 * Count the people following the comments on every post.
	 *
	 * WordPress.com lists them as an "All Posts" row with id 0. Each other row counts one post's
	 * followers, so summing rows counts people twice, and `total` counts rows rather than people.
	 * Rows are ranked by followers, 20 to a page, so the "All Posts" row can sit on a later page.
	 *
	 * @param array $raw Raw WPCOM comment-followers response (first page).
	 * @return int|null Null when the row may be on a later page, so the count is unknown.
	 */
	private static function all_posts_comment_followers( array $raw ): ?int {
		foreach ( self::rows_at( $raw, 'posts' ) as $row ) {
			if ( isset( $row['id'] ) && 0 === (int) $row['id'] ) {
				return self::as_int( $row, 'followers' );
			}
		}
		return self::as_int( $raw, 'pages' ) > 1 ? null : 0;
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
	 * @return array Rows of `{ date, views }`, oldest first, each dated by its period's first day.
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
	 * The days covering `$num` periods ending with the one containing `$date`, as summarized request args.
	 *
	 * With `summarize=1`, WPCOM's top-posts, referrers, clicks, country-views and video-plays ignore `period`
	 * and read `num` as days, and top-authors and file-downloads return nothing for longer periods. Every one
	 * of them totals `num` days ending on `date`, so the window is sent that way. The last period runs to its
	 * end or to today, whichever is first, unless `$date` itself is later.
	 *
	 * @param string $period One of self::PERIODS.
	 * @param int    $num    Number of periods, 2 or more.
	 * @param string $date   YYYY-MM-DD inside the last period.
	 * @return array `{ period: 'day', date, num, summarize: 1 }`.
	 */
	private static function summary_window( string $period, int $num, string $date ): array {
		$utc        = new \DateTimeZone( 'UTC' );
		$requested  = \DateTimeImmutable::createFromFormat( '!Y-m-d', $date, $utc );
		$today      = \DateTimeImmutable::createFromFormat( '!Y-m-d', self::today(), $utc );
		$last_start = self::period_start( $date, $period );
		$first      = $last_start->modify( '-' . ( $num - 1 ) . ' ' . $period );
		$end        = max( $requested, min( $last_start->modify( '+1 ' . $period . ' -1 day' ), $today ) );

		return array(
			'period'    => 'day',
			'date'      => $end->format( 'Y-m-d' ),
			'num'       => (int) $first->diff( $end )->days + 1,
			'summarize' => 1,
		);
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
				$entry[ $field ] = self::count_or_null( null === $idx ? null : ( $row[ $idx ] ?? null ) );
			}
			$series[] = $entry;
		}
		return $series;
	}

	/**
	 * Resolve the `date` input, defaulting to today when it is absent.
	 *
	 * @param mixed $raw Raw input value.
	 * @return string|WP_Error YYYY-MM-DD, or jetpack_stats_invalid_date when it is not a real day.
	 */
	private static function resolve_date( $raw ) {
		if ( null === $raw || '' === $raw ) {
			return self::today();
		}
		if ( is_string( $raw ) && 1 === preg_match( '/^(\d{4})-(\d{2})-(\d{2})\z/', $raw, $m ) && checkdate( (int) $m[2], (int) $m[3], (int) $m[1] ) ) {
			return $raw;
		}
		return new WP_Error(
			self::ERROR_PREFIX . 'invalid_date',
			__( 'The `date` must be a real day in YYYY-MM-DD format, such as 2026-04-23.', 'jetpack-stats-pkg' )
		);
	}

	/**
	 * Return today in the site's timezone, which is how WordPress.com Stats splits days.
	 *
	 * Not wp_date(): plugins filter its output into other calendars.
	 *
	 * @return string YYYY-MM-DD.
	 */
	private static function today(): string {
		return current_time( 'Y-m-d' );
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
	 * Read a count WordPress.com reported, or null when it did not report one.
	 *
	 * A negative count is never a real one, so treat it as unknown too.
	 *
	 * @param mixed $raw Raw value.
	 * @return int|null
	 */
	private static function count_or_null( $raw ): ?int {
		return is_numeric( $raw ) && (int) $raw >= 0 ? (int) $raw : null;
	}

	/**
	 * Total a field over rows, or null when there are none or any of them is unknown.
	 *
	 * Every row must carry the field, as normalize_visits_series() rows do.
	 *
	 * @param array  $rows  Rows of `{ <field>: int|null }`.
	 * @param string $field Field to total.
	 * @return int|null
	 */
	private static function sum_or_null( array $rows, string $field ): ?int {
		$values = array_column( $rows, $field );
		if ( empty( $rows ) || in_array( null, $values, true ) ) {
			return null;
		}
		return (int) array_sum( $values );
	}

	/**
	 * The site whose Stats a response reports, so an agent can confirm it read the site it asked for.
	 *
	 * `id` is the WordPress.com blog ID WPCOM_Stats queries.
	 *
	 * @return array{id: int, url: string}
	 */
	private static function site(): array {
		return array(
			'id'  => (int) Jetpack_Options::get_option( 'id' ),
			'url' => home_url(),
		);
	}

	/**
	 * Output schema for `site`.
	 *
	 * @return array
	 */
	private static function site_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'id'  => array( 'type' => 'integer' ),
				'url' => array( 'type' => 'string' ),
			),
		);
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
