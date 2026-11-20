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
use Automattic\Jetpack\Status\Host;
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
 * surface. Twelve abilities wrap the WPCOM Stats, subscriber and WordAds
 * endpoints plus the `stats_options` WP option.
 */
class Stats_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-stats';
	const ERROR_PREFIX  = Settings::ERROR_PREFIX;

	/**
	 * Allowed `type` values for `get-top-content`.
	 */
	const TOP_CONTENT_TYPES = array( 'posts', 'referrers', 'search-terms', 'clicks', 'tags', 'authors', 'countries', 'regions', 'cities', 'browsers', 'platforms', 'screen-sizes', 'utm', 'commenters', 'commented-posts', 'downloads', 'video-plays' );

	/**
	 * `get-top-content` types WordPress.com reads as a number of days ending on a date, mapped to the endpoint path.
	 */
	const DAYS_WINDOW_TYPES = array(
		'browsers'     => 'browser',
		'platforms'    => 'platform',
		'screen-sizes' => 'screensize',
		'utm'          => 'utm',
	);

	/**
	 * `get-top-content` types that rank locations below country, mapped to WordPress.com's geo mode.
	 */
	const LOCATION_TYPES = array(
		'regions' => 'region',
		'cities'  => 'city',
	);

	/**
	 * `get-top-content` types that cover the site's whole history whatever the window asks.
	 */
	const UNDATED_TYPES = array( 'tags', 'commenters', 'commented-posts' );

	/**
	 * UTM parameters, and the combinations of them, WordPress.com groups views by.
	 */
	const UTM_PARAMS = array( 'utm_source,utm_medium', 'utm_campaign,utm_source,utm_medium', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic' );

	/**
	 * Most authors WordPress.com ranks in one `stats/top-authors` response.
	 */
	const TOP_AUTHORS_LIMIT = 20;

	/**
	 * Fields `get-subscribers` can sort by.
	 */
	const SUBSCRIBER_SORTS = array( 'date_subscribed', 'email', 'name', 'plan', 'subscription_status' );

	/**
	 * Kinds of subscriber `get-subscribers` can list.
	 */
	const SUBSCRIBER_FILTERS = array( 'all', 'email_subscriber', 'reader_subscriber', 'paid', 'comp', 'free', 'unconfirmed_subscriber', 'blocked_subscriber' );

	/**
	 * Fields `get-email-stats` can sort by.
	 */
	const EMAIL_SORTS = array( 'post_date', 'opens', 'clicks' );

	/**
	 * The most posts `stats/streak` returns, the cap WordPress.com sets.
	 */
	const STREAK_MAX_POSTS = 10000;

	/**
	 * The most pages `get-video-stats` lists the video played on.
	 */
	const VIDEO_PAGES_LIMIT = 20;

	/**
	 * The `get-email-detail` breakdowns: each `{stat}/{field}` WordPress.com reports for one emailed post.
	 */
	const EMAIL_BREAKDOWNS = array(
		'opens/rate',
		'opens/client',
		'opens/device',
		'opens/country',
		'clicks/rate',
		'clicks/client',
		'clicks/device',
		'clicks/country',
		'clicks/link',
		'clicks/user-content-link',
	);

	/**
	 * Allowed aggregation periods for top-content and video reads.
	 */
	const PERIODS = array( 'day', 'week', 'month', 'year' );

	/**
	 * Allowed aggregation periods for the timeseries whose WordPress.com endpoints also chart quarters.
	 */
	const SERIES_PERIODS = array( 'day', 'week', 'month', 'quarter', 'year' );

	/**
	 * Most UTM values an expanded top-content read lists posts for, one WordPress.com read each.
	 */
	const UTM_EXPAND_MAX = 20;

	/**
	 * Comparison presets, named as in the Stats dashboard's Compare menu.
	 */
	const COMPARE_PRESETS = array( 'previous-period', 'previous-period-match-day-of-week', 'previous-year', 'previous-year-match-day-of-week' );

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
		'posts'           => array(
			'list'  => 'postviews',
			'label' => 'title',
			'value' => 'views',
			'href'  => 'href',
			'id'    => 'id',
		),
		'referrers'       => array(
			// WPCOM `stats/referrers` keys per-day data under `groups`, not `referrers` —
			// each group exposes `name`, `total`, and (sometimes) `url`.
			'list'     => 'groups',
			'label'    => 'name',
			'value'    => 'total',
			'href'     => 'url',
			'children' => 'results',
		),
		'search-terms'    => array(
			'list'  => 'search_terms',
			'label' => 'term',
			'value' => 'views',
		),
		'clicks'          => array(
			'list'     => 'clicks',
			'label'    => array( 'name', 'url' ),
			'value'    => 'views',
			'href'     => 'url',
			'children' => 'children',
		),
		'authors'         => array(
			'list'     => 'authors',
			'label'    => 'name',
			'value'    => 'views',
			'id'       => 'author_id',
			'children' => 'posts',
		),
		'downloads'       => array(
			'list'  => 'files',
			'label' => array( 'filename', 'relative_url' ),
			'value' => array( 'downloads', 'download_count' ),
			'href'  => array( 'download_url', 'relative_url' ),
		),
		'video-plays'     => array(
			'list'  => 'plays',
			'label' => 'title',
			'value' => 'plays',
			'id'    => 'post_id',
		),
		'commenters'      => array(
			'list'  => 'authors',
			'label' => 'name',
			'value' => 'comments',
		),
		'commented-posts' => array(
			'list'  => 'posts',
			'label' => 'name',
			'value' => 'comments',
			'href'  => 'link',
			'id'    => 'id',
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
			'jetpack-stats/get-post-detail'   => self::spec_get_post_detail(),
			'jetpack-stats/get-visits'        => self::spec_get_visits(),
			'jetpack-stats/get-followers'     => self::spec_get_followers(),
			'jetpack-stats/get-author-views'  => self::spec_get_author_views(),
			'jetpack-stats/get-insights'      => self::spec_get_insights(),
			'jetpack-stats/get-email-stats'   => self::spec_get_email_stats(),
			'jetpack-stats/get-email-detail'  => self::spec_get_email_detail(),
			'jetpack-stats/get-video-stats'   => self::spec_get_video_stats(),
			'jetpack-stats/get-subscribers'   => self::spec_get_subscribers(),
			'jetpack-stats/get-ad-stats'      => self::spec_get_ad_stats(),
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
				'Answer "how is my site doing right now?" in one call, from today\'s and recent Stats. With `compare`, `comparison` holds the same four figures for the earlier windows the preset names, as in the Stats dashboard\'s Compare menu: `previous-period` (yesterday, the 7 days before the last 7, the 30 days before the last 30), `previous-period-match-day-of-week` (shifted back by whole weeks), `previous-year` (the same dates a year earlier), `previous-year-match-day-of-week` (52 weeks earlier). `views_week` and `views_month` are rolling totals for the last 7 and 30 days, today included (not calendar weeks or months). `top_post` is today\'s most-viewed post or page (the home page / archives row is skipped, so `id` is always a real post ID); `top_post` and `top_referrer` are null when there is none today. Composes the WPCOM stats/visits, stats/top-posts, and stats/referrers endpoints — if any sub-call fails, `partial` is true and `errors` lists the failed sub-calls: `visits` (every views and visitors field), `top_posts` (`top_post`), `referrers` (`top_referrer`), and `comparison` (every `comparison` figure). Fields fed by a failed sub-call are null, as is a total covering a day WordPress.com did not report, so a 0 is a value WordPress.com reported. If every sub-call fails, returns `jetpack_stats_data_unavailable`. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric and time window in the response — read it before reporting a number. Precondition: the site must be connected to WordPress.com. Results cached for ~5 minutes by WPCOM_Stats — safe to poll.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'compare' => self::compare_schema(),
				),
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
					'top_post'       => array(
						'type'       => array( 'object', 'null' ),
						'properties' => array(
							'id'    => array( 'type' => 'integer' ),
							'title' => array( 'type' => 'string' ),
							'views' => array( 'type' => 'integer' ),
						),
					),
					'top_referrer'   => array(
						'type'       => array( 'object', 'null' ),
						'properties' => array(
							'name'  => array( 'type' => 'string' ),
							'views' => array( 'type' => 'integer' ),
						),
					),
					'comparison'     => array(
						'type'       => 'object',
						'properties' => array(
							'preset'         => array( 'type' => 'string' ),
							'views_today'    => array( 'type' => array( 'integer', 'null' ) ),
							'visitors_today' => array( 'type' => array( 'integer', 'null' ) ),
							'views_week'     => array( 'type' => array( 'integer', 'null' ) ),
							'views_month'    => array( 'type' => array( 'integer', 'null' ) ),
							'windows'        => array(
								'type'                 => 'object',
								// `today`, `week` and `month`, each the dates its figure covers.
								'additionalProperties' => array(
									'type'       => 'object',
									'properties' => array(
										'from' => array( 'type' => 'string' ),
										'to'   => array( 'type' => 'string' ),
									),
								),
							),
						),
					),
					'partial'        => array( 'type' => 'boolean' ),
					'errors'         => self::errors_schema(),
					'definitions'    => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_site_overview' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-top-content.
	 */
	private static function spec_get_top_content(): array {
		return array(
			'label'               => __( 'Get top stats content', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Return the top items for a chosen content type in one filtered call: posts, referrers, search terms, outbound clicks, tags/categories, authors, countries, regions, cities, browsers, platforms (operating systems), screen sizes, UTM campaign values, commenters, commented posts, downloads, or video plays. Every type returns the same item shape. `label` is human-readable (post title, referrer host, search term, place name, browser, etc.); a tags item names every tag and category it groups, and countries WordPress.com cannot place share one item. `value` is the count for that item: views for most types, clicks, comments, downloads or plays where the type says so, and for `screen-sizes` the percent of views. `country` is the ISO country code of a region or city item. `max` caps the items; `max=0` returns every item. With `expand=true`, an item that groups other rows lists them in `children`. Referrers group the pages that sent views (and the Search Engines item each engine), clicks group the links under one domain, authors group their posts, a UTM value lists the posts its views went to, and a tags item lists each tag and category (`type`), which share its views so carry no `value` of their own. Each UTM value\'s posts are a separate WordPress.com read, so with `type=utm` and `expand=true`, `max` must be 1 to 20; if some of those reads fail, those items have no `children`, `partial` is true and `errors` lists `children`. `max` caps each item\'s children too, as WordPress.com does at every level; `max=0` returns them all. `truncated` is true when more items exist than `max` returned; WordPress.com ranks at most 20 authors, so a full authors list is flagged too. `href` is present only when the item has a canonical URL, and is where a link leads rather than WordPress.com\'s href.li redirect. `id` is the post ID on posts and commented-posts items other than the home page / archives row (pass it to jetpack-stats/get-post-views); the author\'s user ID on authors items; the video\'s ID on video-plays items; and the post ID on the posts a UTM value lists. With `num` above 1, items are totals across the `num` periods ending with the one containing `date` (e.g. period=day, num=7 is the last seven days). `utm` groups views by `utm_param`. `tags` ignores `period`, `date` and `num` and covers the seven days ending yesterday; `commenters` and `commented-posts` ignore them too and count every comment ever approved. Regions, cities, browsers, platforms, screen sizes and UTM values need a Stats plan that includes them; on other sites WordPress.com refuses with `stats_error` and says so. `downloads` only works on WordPress.com sites that do not use Jetpack; elsewhere it returns `jetpack_stats_invalid_type`. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric and time window in the response — read it before reporting a number. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'type' ),
				'properties'           => array(
					'type'      => array(
						'type'        => 'string',
						'description' => __( 'Which top-N surface to fetch.', 'jetpack-stats-pkg' ),
						'enum'        => self::TOP_CONTENT_TYPES,
					),
					'period'    => array(
						'type'        => 'string',
						'description' => __( 'Aggregation period.', 'jetpack-stats-pkg' ),
						'enum'        => self::PERIODS,
						'default'     => 'day',
					),
					'date'      => array(
						'type'        => 'string',
						'description' => __( 'End date (YYYY-MM-DD). Defaults to today.', 'jetpack-stats-pkg' ),
						'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
					),
					'num'       => array(
						'type'        => 'integer',
						'description' => __( 'How many prior periods to roll up (1-90).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 1,
					),
					'max'       => array(
						'type'        => 'integer',
						'description' => __( 'Results cap (1-100), or 0 for every item.', 'jetpack-stats-pkg' ),
						'minimum'     => 0,
						'maximum'     => 100,
						'default'     => 20,
					),
					'expand'    => array(
						'type'        => 'boolean',
						'description' => __( 'Also return the rows each item groups, as the Stats dashboard does when a row is opened: the pages and engines under a referrer, the links under a clicked domain, an author\'s posts, and the terms in a tags item.', 'jetpack-stats-pkg' ),
						'default'     => false,
					),
					'utm_param' => array(
						'type'        => 'string',
						'description' => __( 'For `type=utm`: the UTM parameter, or combination of them, to group views by.', 'jetpack-stats-pkg' ),
						'enum'        => self::UTM_PARAMS,
						'default'     => 'utm_source,utm_medium',
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site'        => self::site_schema(),
					'type'        => array( 'type' => 'string' ),
					'period'      => array( 'type' => 'string' ),
					'date'        => array( 'type' => 'string' ),
					'num'         => array( 'type' => 'integer' ),
					'max'         => array( 'type' => 'integer' ),
					'expand'      => array( 'type' => 'boolean' ),
					'utm_param'   => array( 'type' => 'string' ),
					'truncated'   => array( 'type' => 'boolean' ),
					'items'       => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'rank'     => array( 'type' => 'integer' ),
								'label'    => array( 'type' => 'string' ),
								'value'    => array( 'type' => 'integer' ),
								'href'     => array( 'type' => 'string' ),
								'id'       => array( 'type' => 'integer' ),
								'country'  => array( 'type' => 'string' ),
								'children' => array(
									'type'  => 'array',
									'items' => array(
										'type'       => 'object',
										'properties' => array(
											'label'    => array( 'type' => 'string' ),
											'value'    => array( 'type' => 'integer' ),
											'href'     => array( 'type' => 'string' ),
											'id'       => array( 'type' => 'integer' ),
											'type'     => array( 'type' => 'string' ),
											// Rows a child groups in turn, in the same shape.
											'children' => array( 'type' => 'array' ),
										),
										'required'   => array( 'label' ),
									),
								),
							),
							'required'   => array( 'rank', 'label', 'value' ),
						),
					),
					'partial'     => array( 'type' => 'boolean' ),
					'errors'      => self::errors_schema(),
					'definitions' => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_top_content' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-post-detail.
	 */
	private static function spec_get_post_detail(): array {
		$int     = array( 'type' => array( 'integer', 'null' ) );
		$rate    = array( 'type' => array( 'number', 'null' ) );
		$summary = array(
			'type'       => 'object',
			'properties' => array(
				'total'  => $int,
				'unique' => $int,
				'rate'   => $rate,
			),
		);

		return array(
			'label'               => __( 'Get one post\'s stats', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Report everything Stats knows about one post or page, as on the Stats dashboard\'s page for it: all-time `views`, `likes` and `comments` with the most recent ones, the UTM values that brought views to it, and how it did as a newsletter email. `post` names it: title, type (post, page or another type), permalink and publication date. `likes.recent` lists the most recent likers by display name and `comments.recent` the most recent approved comments, each at most `max` long. `utm` ranks the UTM values (grouped by `utm_param`) of the links that opened the post, over all time, top `max` first; it needs a Stats plan that includes UTM, so on other sites it is null, `partial` is true and `errors` lists `utm`. `email.emailed` is false when the post was never sent to subscribers (pages never are), and then every other `email` figure is null rather than 0. When it was sent, `email.sent` is how many subscribers it went to and `opens` and `clicks` hold all-time totals, unique people and rates. Composes several WPCOM endpoints — if one fails, `partial` is true, `errors` lists it (`views`, `likes`, `utm` or `email`) and the fields it feeds are null. Returns `jetpack_stats_post_not_found` when no post or page has that ID. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric in the response — read it before reporting a number. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'post_id' ),
				'properties'           => array(
					'post_id'   => array(
						'type'        => array( 'integer', 'string' ),
						'description' => __( 'The ID of the post or page. Must be positive.', 'jetpack-stats-pkg' ),
					),
					'utm_param' => array(
						'type'        => 'string',
						'description' => __( 'The UTM parameter, or combination of them, to group the post\'s UTM views by.', 'jetpack-stats-pkg' ),
						'enum'        => self::UTM_PARAMS,
						'default'     => 'utm_source,utm_medium',
					),
					'max'       => array(
						'type'        => 'integer',
						'description' => __( 'Cap on each list: recent likes, recent comments and UTM values (1-100).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 100,
						'default'     => 10,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site'        => self::site_schema(),
					'post'        => array(
						'type'       => 'object',
						'properties' => array(
							'id'        => array( 'type' => 'integer' ),
							'title'     => array( 'type' => 'string' ),
							'type'      => array( 'type' => 'string' ),
							'url'       => array( 'type' => 'string' ),
							'published' => array( 'type' => array( 'string', 'null' ) ),
						),
					),
					'views'       => $int,
					'likes'       => array(
						'type'       => 'object',
						'properties' => array(
							'total'  => $int,
							'recent' => array(
								'type'  => array( 'array', 'null' ),
								'items' => array(
									'type'       => 'object',
									'properties' => array(
										'name' => array( 'type' => 'string' ),
									),
								),
							),
						),
					),
					'comments'    => array(
						'type'       => 'object',
						'properties' => array(
							'total'  => array( 'type' => 'integer' ),
							'recent' => array(
								'type'  => 'array',
								'items' => array(
									'type'       => 'object',
									'properties' => array(
										'author'  => array( 'type' => 'string' ),
										'date'    => array( 'type' => 'string' ),
										'excerpt' => array( 'type' => 'string' ),
										'url'     => array( 'type' => 'string' ),
									),
								),
							),
						),
					),
					'utm_param'   => array( 'type' => 'string' ),
					'utm'         => array(
						'type'  => array( 'array', 'null' ),
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'label' => array( 'type' => 'string' ),
								'value' => array( 'type' => 'integer' ),
							),
						),
					),
					'email'       => array(
						'type'       => 'object',
						'properties' => array(
							'emailed' => array( 'type' => array( 'boolean', 'null' ) ),
							'sent'    => $int,
							'opens'   => $summary,
							'clicks'  => $summary,
						),
					),
					'partial'     => array( 'type' => 'boolean' ),
					'errors'      => self::errors_schema(),
					'definitions' => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_post_detail' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-post-views.
	 */
	private static function spec_get_post_views(): array {
		return array(
			'label'               => __( 'Get views for a post', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Return views history for a single post: total views, timeseries of per-period views, and the period metadata. `total_views` is the post\'s all-time view count; when WordPress.com does not report it, it and every `series` value are null. `series` always has `num` rows, oldest first, ending with the period that contains `date`; each row\'s `date` is the first day of its period (weeks start on Monday) and periods with no views are 0. Returns `jetpack_stats_post_not_found` when no post has that ID. Accepts post_id as integer or numeric string (the literal "0" is rejected only because WordPress has no post 0 — any positive numeric value is legal). `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric and time window in the response — read it before reporting a number. Precondition: site must be connected to WordPress.com. Related: call jetpack-stats/get-top-content with type=posts first and pass an item\'s `id` as `post_id`.',
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
						'enum'        => self::SERIES_PERIODS,
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
					'series'      => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'date'  => array( 'type' => 'string' ),
								'views' => array( 'type' => array( 'integer', 'null' ) ),
							),
						),
					),
					'definitions' => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_post_views' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-visits.
	 */
	private static function spec_get_visits(): array {
		return array(
			'label'               => __( 'Get site visits timeseries', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Return a site-level views/visitors/likes/comments timeseries — answers "is traffic trending up?". With `compare`, `comparison.series` holds the same rows for an earlier window, row for row, as in the Stats dashboard\'s Compare menu: `previous-period` (the `num` periods before), `previous-period-match-day-of-week` (daily rows shifted back by whole weeks), `previous-year` (a year earlier; weeks shift 52 weeks), `previous-year-match-day-of-week` (52 weeks earlier). The weekday presets accept only day and week periods. If WordPress.com cannot read the compared window, `comparison.series` is null, `partial` is true and `errors` lists `comparison`. Each row\'s `date` is the first day of its period (weeks start on Monday). Every series row always includes every field listed in the request (no per-row omission); a value WordPress.com did not report, or reported as negative, is null rather than 0. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric and time window in the response — read it before reporting a number. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'period'  => array(
						'type'        => 'string',
						'description' => __( 'Granularity of each data point.', 'jetpack-stats-pkg' ),
						'enum'        => self::SERIES_PERIODS,
						'default'     => 'day',
					),
					'num'     => array(
						'type'        => 'integer',
						'description' => __( 'How many data points to return (1-90).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 30,
					),
					'date'    => array(
						'type'        => 'string',
						'description' => __( 'End date (YYYY-MM-DD). Defaults to today.', 'jetpack-stats-pkg' ),
						'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
					),
					'fields'  => array(
						'type'        => 'array',
						'description' => __( 'Which metrics to include in each row. Defaults to views+visitors.', 'jetpack-stats-pkg' ),
						'items'       => array(
							'type' => 'string',
							'enum' => self::VISIT_FIELDS,
						),
						'default'     => self::DEFAULT_VISIT_FIELDS,
					),
					'compare' => self::compare_schema(),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site'        => self::site_schema(),
					'period'      => array( 'type' => 'string' ),
					'num'         => array( 'type' => 'integer' ),
					'date'        => array( 'type' => 'string' ),
					'fields'      => array(
						'type'  => 'array',
						'items' => array(
							'type' => 'string',
							'enum' => self::VISIT_FIELDS,
						),
					),
					'series'      => self::visits_series_schema(),
					'comparison'  => array(
						'type'       => 'object',
						'properties' => array(
							'preset' => array( 'type' => 'string' ),
							'date'   => array( 'type' => 'string' ),
							'series' => self::visits_series_schema( true ),
						),
					),
					'partial'     => array( 'type' => 'boolean' ),
					'errors'      => self::errors_schema(),
					'definitions' => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_visits' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-followers.
	 */
	private static function spec_get_followers(): array {
		return array(
			'label'               => __( 'Get follower counts', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Return the site\'s follower counts by source — answers "how is my audience growing?" in one call. `email` and `wpcom` are the site\'s email subscribers and WordPress.com followers; `comment` counts people following the comments on every post (following one post\'s comments is not counted), and is reported as unknown through `errors` when WordPress.com does not list that count on its first page; `publicize` is an object, empty when no social connection reports followers. Composes three WPCOM endpoints — if any sub-call fails, `partial` is true and `errors` lists the failed sub-calls: `followers` (`email` and `wpcom`), `comment_followers`, and `publicize_followers`. Counts fed by a failed sub-call are null, `publicize` included, and `total` is null whenever any count is, so a 0 is a value WordPress.com reported. `paid` counts paid subscribers, who are also in `email` or `wpcom`, and is null when the `subscriber_counts` sub-call fails. With `period`, `series` tracks the subscriber count over the last `num` periods, as the Stats dashboard\'s Subscribers chart does; it is null when the `subscriber_history` sub-call fails. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric and time window in the response — read it before reporting a number. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'period' => array(
						'type'        => 'string',
						'description' => __( 'Also chart the subscriber count, one row per period.', 'jetpack-stats-pkg' ),
						'enum'        => self::SERIES_PERIODS,
					),
					'date'   => self::date_schema(),
					'num'    => array(
						'type'        => 'integer',
						'description' => __( 'How many periods to chart, ending with the one containing `date` (1-90).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 30,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site'        => self::site_schema(),
					'total'       => array( 'type' => array( 'integer', 'null' ) ),
					'email'       => array( 'type' => array( 'integer', 'null' ) ),
					'wpcom'       => array( 'type' => array( 'integer', 'null' ) ),
					'comment'     => array( 'type' => array( 'integer', 'null' ) ),
					'paid'        => array( 'type' => array( 'integer', 'null' ) ),
					'publicize'   => array(
						'type'                 => array( 'object', 'null' ),
						// Follower count keyed by service slug.
						'additionalProperties' => array( 'type' => 'integer' ),
					),
					'series'      => array(
						'type'  => array( 'array', 'null' ),
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'date'        => array( 'type' => 'string' ),
								'subscribers' => array( 'type' => 'integer' ),
								'change'      => array( 'type' => 'integer' ),
							),
						),
					),
					'partial'     => array( 'type' => 'boolean' ),
					'errors'      => self::errors_schema(),
					'definitions' => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_followers' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-author-views.
	 */
	private static function spec_get_author_views(): array {
		return array(
			'label'               => __( 'Get views for an author', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Report one author\'s views over time, with the likes and comments their content received in the same window. `series` has one row per period, oldest first; `views`, `likes` and `comments` are totals for the whole window. `views` counts every post and page the author wrote, so it can exceed their authors item, which counts only the site\'s most-viewed posts each day. `content_counts` is the author\'s published content by post type, and `first_content_date` when they first published, in GMT. An author with 50,000 or more posts returns `stats_error`. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric and time window in the response — read it before reporting a number. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'author_id' ),
				'properties'           => array(
					'author_id' => array(
						'type'        => 'integer',
						'description' => __( 'The author\'s user ID, as Stats reports it on a top author.', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
					),
					'period'    => self::period_schema( self::SERIES_PERIODS ),
					'date'      => self::date_schema(),
					'num'       => array(
						'type'        => 'integer',
						'description' => __( 'How many periods, ending with the one containing `date` (1-90).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 30,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site'               => self::site_schema(),
					'author'             => array(
						'type'       => 'object',
						'properties' => array(
							'id'   => array( 'type' => 'integer' ),
							'name' => array( 'type' => 'string' ),
						),
					),
					'period'             => array( 'type' => 'string' ),
					'date'               => array( 'type' => 'string' ),
					'num'                => array( 'type' => 'integer' ),
					'views'              => array( 'type' => 'integer' ),
					'likes'              => array( 'type' => 'integer' ),
					'comments'           => array( 'type' => 'integer' ),
					'series'             => self::visits_series_schema(),
					'content_counts'     => array(
						'type'                 => 'object',
						'additionalProperties' => array( 'type' => 'integer' ),
					),
					'first_content_date' => array( 'type' => array( 'string', 'null' ) ),
					'definitions'        => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_author_views' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-insights.
	 */
	private static function spec_get_insights(): array {
		return array(
			'label'               => __( 'Get site stats insights', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Answer "what does the site\'s history say about its audience?" in one call, as the Stats dashboard\'s Insights page does. `all_time` holds the site\'s lifetime totals and its best day. `busiest` names the hour (0-23, site timezone) that drew the most views over the last 60 days and the weekday that drew the most over the last 10 weeks, each with its share of views. `recent` compares the last 7 and 30 days, both ending yesterday, with the windows just before them. `streak` is the posting streak: the current run of consecutive days with a published post, and the longest run in the last year. `calendar` is the posting calendar behind it, as on the Insights page\'s posting activity: each day of the last year with published posts and how many, oldest first. `years` totals each year\'s published posts and the words, likes and comments on them. `plan_usage` is the views counted toward the site\'s Stats plan this billing month against its limit (`views_limit` null for no limit). Composes five WPCOM endpoints — if any sub-call fails, `partial` is true, `errors` lists the failed sub-calls (`summary`, `insights`, `highlights`, `streak`, `usage`), and the fields they feed are null; `years` comes with `insights`, and `calendar` with `streak`. If every sub-call fails, returns `jetpack_stats_data_unavailable`. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric and time window in the response — read it before reporting a number. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site'        => self::site_schema(),
					'all_time'    => array(
						'type'       => array( 'object', 'null' ),
						'properties' => array(
							'views'          => array( 'type' => 'integer' ),
							'visitors'       => array( 'type' => 'integer' ),
							'posts'          => array( 'type' => 'integer' ),
							'comments'       => array( 'type' => 'integer' ),
							'shares'         => array( 'type' => 'integer' ),
							'best_day'       => array( 'type' => array( 'string', 'null' ) ),
							'best_day_views' => array( 'type' => 'integer' ),
						),
					),
					'busiest'     => array(
						'type'       => array( 'object', 'null' ),
						'properties' => array(
							'hour'                => array( 'type' => 'integer' ),
							'hour_percent'        => array( 'type' => 'number' ),
							'day_of_week'         => array( 'type' => 'string' ),
							'day_of_week_percent' => array( 'type' => 'number' ),
						),
					),
					'recent'      => array(
						'type'                 => array( 'object', 'null' ),
						// Keyed by window: the last and previous 7 days, and the last and previous 30.
						'additionalProperties' => array(
							'type'       => 'object',
							'properties' => array(
								'from'     => array( 'type' => 'string' ),
								'to'       => array( 'type' => 'string' ),
								'views'    => array( 'type' => 'integer' ),
								'visitors' => array( 'type' => 'integer' ),
								'likes'    => array( 'type' => 'integer' ),
								'comments' => array( 'type' => 'integer' ),
							),
						),
					),
					'streak'      => array(
						'type'       => array( 'object', 'null' ),
						'properties' => array(
							'current_length' => array( 'type' => 'integer' ),
							'longest_length' => array( 'type' => 'integer' ),
							'longest_start'  => array( 'type' => 'string' ),
							'longest_end'    => array( 'type' => 'string' ),
						),
					),
					'calendar'    => array(
						'type'       => array( 'object', 'null' ),
						'properties' => array(
							'from' => array( 'type' => 'string' ),
							'to'   => array( 'type' => 'string' ),
							'days' => array(
								'type'  => 'array',
								'items' => array(
									'type'       => 'object',
									'properties' => array(
										'date'  => array( 'type' => 'string' ),
										'posts' => array( 'type' => 'integer' ),
									),
								),
							),
						),
					),
					'years'       => array(
						'type'  => array( 'array', 'null' ),
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'year'     => array( 'type' => 'string' ),
								'posts'    => array( 'type' => 'integer' ),
								'words'    => array( 'type' => 'integer' ),
								'likes'    => array( 'type' => 'integer' ),
								'comments' => array( 'type' => 'integer' ),
							),
						),
					),
					'plan_usage'  => array(
						'type'       => array( 'object', 'null' ),
						'properties' => array(
							'plan'         => array( 'type' => array( 'string', 'null' ) ),
							'views'        => array( 'type' => 'integer' ),
							'views_limit'  => array( 'type' => array( 'integer', 'null' ) ),
							'period_start' => array( 'type' => 'string' ),
							'period_end'   => array( 'type' => 'string' ),
							'over_limit'   => array( 'type' => 'boolean' ),
						),
					),
					'partial'     => array( 'type' => 'boolean' ),
					'errors'      => self::errors_schema(),
					'definitions' => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_insights' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-email-stats.
	 */
	private static function spec_get_email_stats(): array {
		return array(
			'label'               => __( 'Get newsletter email stats', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Report how the posts the site sent to subscribers as emails performed: for each post, the emails sent, opens and clicks, as on the Stats dashboard\'s Emails page. Posts come newest first unless `sort` says otherwise; `max` caps them. `opens` and `clicks` count every open and click; `unique_opens` and `unique_clicks` count people, and `open_rate` and `click_rate` are percents of `sent`. With `start_date` (and optionally `end_date`, up to 31 days apart) `opens` and `clicks` cover only those days, while the unique counts and rates stay all-time; without them every figure is all-time. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric and time window in the response — read it before reporting a number. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'sort'       => array(
						'type'        => 'string',
						'description' => __( 'Sort posts by send date, opens or clicks.', 'jetpack-stats-pkg' ),
						'enum'        => self::EMAIL_SORTS,
						'default'     => 'post_date',
					),
					'order'      => array(
						'type'        => 'string',
						'description' => __( 'Sort direction: highest or newest first (`desc`) or the reverse.', 'jetpack-stats-pkg' ),
						'enum'        => array( 'desc', 'asc' ),
						'default'     => 'desc',
					),
					'max'        => array(
						'type'        => 'integer',
						'description' => __( 'Posts cap (1-100).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 100,
						'default'     => 10,
					),
					'start_date' => array(
						'type'        => 'string',
						'description' => __( 'First day to count opens and clicks for (YYYY-MM-DD).', 'jetpack-stats-pkg' ),
						'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
					),
					'end_date'   => array(
						'type'        => 'string',
						'description' => __( 'Last day to count opens and clicks for (YYYY-MM-DD). Defaults to today when `start_date` is given.', 'jetpack-stats-pkg' ),
						'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site'        => self::site_schema(),
					'start_date'  => array( 'type' => 'string' ),
					'end_date'    => array( 'type' => 'string' ),
					'posts'       => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'id'            => array( 'type' => 'integer' ),
								'title'         => array( 'type' => 'string' ),
								'href'          => array( 'type' => 'string' ),
								'date'          => array( 'type' => 'string' ),
								'sent'          => array( 'type' => 'integer' ),
								'opens'         => array( 'type' => 'integer' ),
								'unique_opens'  => array( 'type' => 'integer' ),
								'open_rate'     => array( 'type' => 'number' ),
								'clicks'        => array( 'type' => 'integer' ),
								'unique_clicks' => array( 'type' => 'integer' ),
								'click_rate'    => array( 'type' => 'number' ),
							),
						),
					),
					'definitions' => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_email_stats' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-email-detail.
	 */
	private static function spec_get_email_detail(): array {
		$rows = array(
			'type'  => array( 'array', 'null' ),
			'items' => array(
				'type'       => 'object',
				'properties' => array(
					'label' => array( 'type' => 'string' ),
					'value' => array( 'type' => 'integer' ),
				),
			),
		);
		$rate = array( 'type' => array( 'number', 'null' ) );
		$int  = array( 'type' => array( 'integer', 'null' ) );

		return array(
			'label'               => __( 'Get one newsletter email\'s stats', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Break down how one post the site sent to subscribers as an email performed, over all time since it was sent, as on the Stats dashboard\'s page for that email. `sent` is how many subscribers it went to. `opens` and `clicks` each hold the `total` count, the `unique` people, the `rate` (unique people as a percent of `sent`), and label/value rows ranked by count: `by_client` (mail app), `by_device` (operating system) and `by_country`. Each list holds its top `max` rows, so it can add up to less than `total`. `clicks.by_link` ranks the links clicked: a link in the post by its URL, and the email\'s own links by name (post title, like, comment, unsubscribe and the like). Composes ten WPCOM endpoints — if any sub-call fails, `partial` is true, `errors` lists the failed sub-calls by `{stat}/{field}` (such as `opens/rate` or `clicks/link`), and the fields they feed are null. If every sub-call fails, returns `jetpack_stats_data_unavailable`; an unknown post returns `jetpack_stats_post_not_found`. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric in the response — read it before reporting a number. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'post_id' ),
				'properties'           => array(
					'post_id' => array(
						'type'        => array( 'integer', 'string' ),
						'description' => __( 'The ID of the post the site emailed, as email stats report it. Must be positive.', 'jetpack-stats-pkg' ),
					),
					'max'     => array(
						'type'        => 'integer',
						'description' => __( 'Rows cap for each breakdown (1-100).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 100,
						'default'     => 10,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site'        => self::site_schema(),
					'post_id'     => array( 'type' => 'integer' ),
					'sent'        => $int,
					'opens'       => array(
						'type'       => 'object',
						'properties' => array(
							'total'      => $int,
							'unique'     => $int,
							'rate'       => $rate,
							'by_client'  => $rows,
							'by_device'  => $rows,
							'by_country' => $rows,
						),
					),
					'clicks'      => array(
						'type'       => 'object',
						'properties' => array(
							'total'      => $int,
							'unique'     => $int,
							'rate'       => $rate,
							'by_client'  => $rows,
							'by_device'  => $rows,
							'by_country' => $rows,
							'by_link'    => $rows,
						),
					),
					'partial'     => array( 'type' => 'boolean' ),
					'errors'      => self::errors_schema(),
					'definitions' => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_email_detail' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-video-stats.
	 */
	private static function spec_get_video_stats(): array {
		return array(
			'label'               => __( 'Get plays for a video', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Read how often one video was played over time, and where, as on the Stats dashboard\'s page for that video. `total_plays` adds up the window\'s plays. `pages` lists up to 20 pages the video was played on; a page on this site carries its `post_id` and `title`, and one elsewhere has them null. `series` has one row per period, oldest first, ending with the period that contains `date`; each row\'s `date` is the first day of its period (weeks start on Monday). Returns `jetpack_stats_video_not_found` when no video has that ID. `site` is the WordPress.com blog ID and home URL of the site whose Stats were read. `definitions` explains, in plain words, each metric and time window in the response — read it before reporting a number. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'video_id' ),
				'properties'           => array(
					'video_id' => array(
						'type'        => array( 'integer', 'string' ),
						'description' => __( 'The video\'s attachment ID, as video-plays top content items report it. Must be positive.', 'jetpack-stats-pkg' ),
					),
					'period'   => array(
						'type'        => 'string',
						'description' => __( 'Aggregation period.', 'jetpack-stats-pkg' ),
						'enum'        => self::PERIODS,
						'default'     => 'day',
					),
					'num'      => array(
						'type'        => 'integer',
						'description' => __( 'How many periods to include (1-90).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 30,
					),
					'date'     => array(
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
					'video_id'    => array( 'type' => 'integer' ),
					'title'       => array( 'type' => 'string' ),
					'period'      => array( 'type' => 'string' ),
					'num'         => array( 'type' => 'integer' ),
					'date'        => array( 'type' => 'string' ),
					'total_plays' => array( 'type' => 'integer' ),
					'series'      => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'date'  => array( 'type' => 'string' ),
								'plays' => array( 'type' => 'integer' ),
							),
						),
					),
					'pages'       => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'url'     => array( 'type' => 'string' ),
								'post_id' => array( 'type' => array( 'integer', 'null' ) ),
								'title'   => array( 'type' => array( 'string', 'null' ) ),
							),
						),
					),
					'definitions' => self::definitions_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_video_stats' ),
			'permission_callback' => array( __CLASS__, 'can_view_stats' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-subscribers.
	 */
	private static function spec_get_subscribers(): array {
		return array(
			'label'               => __( 'List subscribers', 'jetpack-stats-pkg' ),
			'description'         => __(
				'List the people subscribed to the site, one page at a time, newest first unless `sort` says otherwise — the Subscribers page of the Stats dashboard. Each subscriber carries their email address, so treat the list as personal data: report counts and names unless the site owner asks for addresses. `email_subscriber` is true for someone who gets posts by email rather than only in the Reader; `status` is WordPress.com\'s subscription status. `total` counts every subscriber the `filter` and `search` match, across all pages. Only users who can manage the site may list subscribers. `site` is the WordPress.com blog ID and home URL of the site whose subscribers were read. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'page'     => array(
						'type'        => 'integer',
						'description' => __( 'Page of results, from 1.', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'default'     => 1,
					),
					'per_page' => array(
						'type'        => 'integer',
						'description' => __( 'Subscribers per page (1-100).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 100,
						'default'     => 20,
					),
					'search'   => array(
						'type'        => 'string',
						'description' => __( 'Match subscribers by name or email address.', 'jetpack-stats-pkg' ),
					),
					'filter'   => array(
						'type'        => 'string',
						'description' => __( 'Which subscribers to list: email subscribers, Reader-only followers, paid, complimentary, free, unconfirmed, or blocked.', 'jetpack-stats-pkg' ),
						'enum'        => self::SUBSCRIBER_FILTERS,
						'default'     => 'all',
					),
					'sort'     => array(
						'type'        => 'string',
						'description' => __( 'Sort subscribers by subscription date, email, name, plan or status.', 'jetpack-stats-pkg' ),
						'enum'        => self::SUBSCRIBER_SORTS,
						'default'     => 'date_subscribed',
					),
					'order'    => array(
						'type'        => 'string',
						'description' => __( 'Sort direction: newest or last first (`desc`) or the reverse.', 'jetpack-stats-pkg' ),
						'enum'        => array( 'desc', 'asc' ),
						'default'     => 'desc',
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site'        => self::site_schema(),
					'total'       => array( 'type' => 'integer' ),
					'page'        => array( 'type' => 'integer' ),
					'pages'       => array( 'type' => 'integer' ),
					'subscribers' => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'subscription_id'  => array( 'type' => 'integer' ),
								'user_id'          => array( 'type' => array( 'integer', 'null' ) ),
								'name'             => array( 'type' => 'string' ),
								'email'            => array( 'type' => 'string' ),
								'url'              => array( 'type' => 'string' ),
								'subscribed_at'    => array( 'type' => 'string' ),
								'status'           => array( 'type' => 'string' ),
								'email_subscriber' => array( 'type' => 'boolean' ),
							),
						),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_subscribers' ),
			'permission_callback' => array( __CLASS__, 'can_manage_settings' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-ad-stats.
	 */
	private static function spec_get_ad_stats(): array {
		return array(
			'label'               => __( 'Get ad stats', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Report the site\'s WordAds performance, as on the Stats dashboard\'s Ads page: ad impressions, revenue and CPM per period, and the earnings WordAds has recorded by month. `series` has one row per period, oldest first, ending with the one containing `date`; `revenue` is in US dollars and `cpm` is revenue per thousand impressions. `earnings.total` is everything the site has earned, `earnings.owed` the part not yet paid out, and `earnings.months` each month\'s amount, newest first. Composes two WPCOM endpoints — if one fails, `partial` is true, `errors` names it (`stats` or `earnings`), and what it feeds is null; if both fail, returns `jetpack_stats_data_unavailable`. A site not in WordAds reports empty figures. Only users who can manage the site or its ads may read them. `site` is the WordPress.com blog ID and home URL of the site whose ads were read. Precondition: site must be connected to WordPress.com.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'period' => self::period_schema( self::SERIES_PERIODS ),
					'date'   => self::date_schema(),
					'num'    => array(
						'type'        => 'integer',
						'description' => __( 'How many periods, ending with the one containing `date` (1-90).', 'jetpack-stats-pkg' ),
						'minimum'     => 1,
						'maximum'     => 90,
						'default'     => 30,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'site'     => self::site_schema(),
					'period'   => array( 'type' => 'string' ),
					'date'     => array( 'type' => 'string' ),
					'num'      => array( 'type' => 'integer' ),
					'series'   => array(
						'type'  => array( 'array', 'null' ),
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'date'        => array( 'type' => 'string' ),
								'impressions' => array( 'type' => 'integer' ),
								'revenue'     => array( 'type' => 'number' ),
								'cpm'         => array( 'type' => 'number' ),
							),
						),
					),
					'earnings' => array(
						'type'       => array( 'object', 'null' ),
						'properties' => array(
							'total'  => array( 'type' => 'number' ),
							'owed'   => array( 'type' => 'number' ),
							'months' => array(
								'type'  => 'array',
								'items' => array(
									'type'       => 'object',
									'properties' => array(
										'month'  => array( 'type' => 'string' ),
										'amount' => array( 'type' => 'number' ),
										'paid'   => array( 'type' => 'boolean' ),
									),
								),
							),
						),
					),
					'partial'  => array( 'type' => 'boolean' ),
					'errors'   => self::errors_schema(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_ad_stats' ),
			'permission_callback' => array( __CLASS__, 'can_view_ads' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/get-settings.
	 */
	private static function spec_get_settings(): array {
		return array(
			'label'               => __( 'Get Stats settings', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Read the current Jetpack Stats settings: who sees the Stats admin bar + menu, whose visits are counted, and DNT behavior. `roles` is an array of role slugs that can view Stats; `count_roles` is an array of role slugs whose visits are counted. Call jetpack-stats/update-settings to change any of these.',
				'jetpack-stats-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => self::settings_output_properties(),
			),
			'execute_callback'    => array( __CLASS__, 'get_settings' ),
			'permission_callback' => array( __CLASS__, 'can_manage_settings' ),
			'meta'                => self::reader_meta(),
		);
	}

	/**
	 * Spec: jetpack-stats/update-settings.
	 */
	private static function spec_update_settings(): array {
		return array(
			'label'               => __( 'Update Stats settings', 'jetpack-stats-pkg' ),
			'description'         => __(
				'Update one or more Jetpack Stats settings. All fields are optional; only fields present in the call are written, and unrelated keys are preserved. Idempotent — setting a value to its current state returns changed=false. Role slugs added to `roles` or `count_roles` must be registered roles on the site; unknown slugs return jetpack_stats_invalid_role. A slug that is already saved is kept even when its role no longer exists. Narrowing `roles` can revoke Stats access for whole groups of users — confirm with the user before removing roles.',
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
					'destructive' => true,
					'idempotent'  => true,
				),
				'public'       => true,
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
	 * Ads permission: manage_options or activate_wordads, as on the Stats dashboard's Ads page.
	 *
	 * @return bool
	 */
	public static function can_view_ads(): bool {
		return current_user_can( 'manage_options' ) || current_user_can( 'activate_wordads' ); // phpcs:ignore WordPress.WP.Capabilities.Unknown -- WordPress.com grants it to the site's ad managers.
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
		$input  = is_array( $input ) ? $input : array();
		$preset = self::pick_compare( $input['compare'] ?? null );
		if ( is_wp_error( $preset ) ) {
			return $preset;
		}
		$stats = self::get_wpcom_stats();
		$today = self::today();
		$day   = array(
			'period' => 'day',
			'date'   => $today,
		);

		// A few rows, so a post can be found below the home page / archives row.
		$post_rows = 10;

		$subcalls = array(
			'visits'    => $stats->get_visits(
				array(
					'unit'        => 'day',
					'quantity'    => 30,
					'date'        => $today,
					'stat_fields' => 'views,visitors',
				)
			),
			'top_posts' => $stats->get_top_posts( $day + array( 'max' => $post_rows ) ),
			'referrers' => $stats->get_referrers( $day + array( 'max' => 1 ) ),
		);

		$windows = null === $preset ? array() : self::overview_compare_windows( $today, $preset );
		if ( $windows ) {
			// One read covers the earliest to the latest day the compared windows need.
			$first                  = min( array_column( $windows, 'from' ) );
			$last                   = max( array_column( $windows, 'to' ) );
			$subcalls['comparison'] = $stats->get_visits(
				array(
					'unit'        => 'day',
					'quantity'    => self::days_between( $first, $last ) + 1,
					'date'        => $last,
					'stat_fields' => 'views,visitors',
				)
			);
		}

		$composed = self::compose_subcalls(
			$subcalls,
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
		$top_post = self::first_post( self::rank_and_cap( self::top_content_rows( 'posts', $values['top_posts'] ), $post_rows ) );
		$top_ref  = self::rank_and_cap( self::top_content_rows( 'referrers', $values['referrers'] ), 1 )[0] ?? null;

		$out = array(
			'site'           => self::site(),
			'date'           => $today,
			'views_today'    => $last_day['views'] ?? null,
			'visitors_today' => $last_day['visitors'] ?? null,
			'views_week'     => self::sum_or_null( array_slice( $days, -7 ), 'views' ),
			'views_month'    => self::sum_or_null( $days, 'views' ),
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
			'definitions'    => self::definitions( array( 'date', 'views', 'visitors', 'views_today', 'visitors_today', 'views_week', 'views_month', 'top_post', 'top_referrer' ) ),
		);

		if ( null !== $preset && $windows ) {
			$out['comparison']                = self::overview_comparison( $preset, $windows, $values['comparison'], in_array( 'comparison', $errors, true ) );
			$out['definitions']['comparison'] = self::definition_texts()['comparison_overview'];
		}

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

		// WordPress.com answers stats/file-downloads with a 404 for every Jetpack-connected site.
		if ( 'downloads' === $input['type'] && ! ( new Host() )->is_wpcom_simple() ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'invalid_type',
				__( 'WordPress.com does not keep file download stats for Jetpack-connected sites. Choose another type.', 'jetpack-stats-pkg' )
			);
		}

		$type   = $input['type'];
		$period = self::pick_period( $input['period'] ?? null );
		$date   = self::resolve_date( $input['date'] ?? null );
		$num    = self::clamp_int( $input['num'] ?? 1, 1, 90, 1 );
		$max    = self::clamp_int( $input['max'] ?? 20, 0, 100, 20 );
		$expand = true === ( $input['expand'] ?? false );
		if ( is_wp_error( $date ) ) {
			return $date;
		}

		$utm_param = isset( $input['utm_param'] ) && in_array( $input['utm_param'], self::UTM_PARAMS, true ) ? $input['utm_param'] : self::UTM_PARAMS[0];
		// Each UTM value's posts are a separate read, so an expanded list stays short.
		$utm_posts = 'utm' === $type && $expand;
		if ( $utm_posts && ( 0 === $max || $max > self::UTM_EXPAND_MAX ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'invalid_max',
				sprintf(
					/* translators: %d: the largest `max` an expanded UTM list accepts. */
					__( 'With type=utm and expand=true, `max` must be between 1 and %d.', 'jetpack-stats-pkg' ),
					self::UTM_EXPAND_MAX
				)
			);
		}

		$args = array(
			'period' => $period,
			'date'   => $date,
			// WordPress.com returns every row for max=0; otherwise one extra row shows whether the list was cut.
			'max'    => 0 === $max ? 0 : $max + 1,
		);
		if ( isset( self::DAYS_WINDOW_TYPES[ $type ] ) ) {
			// These endpoints take the window as a number of days ending on a date.
			$window = self::summary_window( $period, $num, $date );
			$args   = array(
				'date' => $window['date'],
				'days' => $window['num'],
				'max'  => $args['max'],
			);
		} elseif ( $num > 1 ) {
			// Without `summarize`, WPCOM returns each period separately and only the first would be read.
			// Several summarized endpoints ignore `period` and read `num` as days, so ask for the days the periods cover.
			$args = array_merge( $args, self::summary_window( $period, $num, $date ) );
		}

		$stats = self::get_wpcom_stats();
		$raw   = self::fetch_top_content_raw( $stats, $type, $args, $utm_param );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		$summarized = isset( $args['summarize'] );
		$rows       = self::top_content_rows( $type, $raw, $summarized );
		$errors     = array();
		if ( $utm_posts ) {
			$values = array_slice( array_keys( is_array( $raw['top_utm_values'] ?? null ) ? $raw['top_utm_values'] : array() ), 0, $max );
			foreach ( $values as $i => $value ) {
				$posts = $stats->get_utm_top_posts( $utm_param, (string) $value, array( 'max' => $max ) + $args );
				if ( is_wp_error( $posts ) ) {
					$errors = array( 'children' );
					continue;
				}
				$rows[ $i ]['children'] = self::utm_post_rows( $posts );
			}
		}
		// Countries drops and folds rows, so whether WordPress.com held more is read from its own list.
		$sent = 'countries' === $type ? count( self::rows_at( self::first_period_block( $raw, $summarized ), 'views' ) ) : count( $rows );
		// WordPress.com stops at its authors cap without saying whether more authors had views.
		$capped = 'authors' === $type && $sent >= self::TOP_AUTHORS_LIMIT && ( 0 === $max || $max >= self::TOP_AUTHORS_LIMIT );

		$out = array(
			'site'        => self::site(),
			'type'        => $type,
			'period'      => $period,
			'date'        => $date,
			'num'         => $num,
			'max'         => $max,
			'expand'      => $expand,
			'truncated'   => $capped || ( $max > 0 && $sent > $max ),
			'items'       => self::rank_and_cap( $rows, $max, $expand ),
			'definitions' => self::top_content_definitions( $type, $expand ),
		);
		if ( 'utm' === $type ) {
			$out['utm_param'] = $utm_param;
		}
		if ( ! empty( $errors ) ) {
			$out['partial'] = true;
			$out['errors']  = $errors;
		}
		return $out;
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
		$period  = self::pick_period( $input['period'] ?? null, self::SERIES_PERIODS );
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
			'definitions' => self::definitions( array( 'total_views', 'series', 'views' ) ),
		);
	}

	/**
	 * Execute: get-post-detail.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_post_detail( $input = null ) {
		$input = is_array( $input ) ? $input : array();
		if ( ! isset( $input['post_id'] ) || ! is_numeric( $input['post_id'] ) || (int) $input['post_id'] <= 0 ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_post_id',
				__( 'A positive post_id is required.', 'jetpack-stats-pkg' )
			);
		}
		$post_id   = (int) $input['post_id'];
		$max       = self::clamp_int( $input['max'] ?? 10, 1, 100, 10 );
		$utm_param = isset( $input['utm_param'] ) && in_array( $input['utm_param'], self::UTM_PARAMS, true ) ? $input['utm_param'] : self::UTM_PARAMS[0];
		$post      = get_post( $post_id );
		// WPCOM answers an unknown post with zeros, which would read as a post nobody saw.
		if ( ! $post ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'post_not_found',
				__( 'No post exists with that post_id.', 'jetpack-stats-pkg' ),
				array( 'status' => 404 )
			);
		}

		// Only posts go out as newsletters, so a page's email figures need no request.
		$emailable = 'post' === $post->post_type;
		$stats     = self::get_wpcom_stats();
		$results   = array(
			'views' => $stats->get_post_views( $post_id ),
			'likes' => $stats->get_post_likes( $post_id ),
			'utm'   => $stats->get_utm_views(
				$utm_param,
				array(
					'post_id' => $post_id,
					'days'    => -1,
					'max'     => $max,
				)
			),
		);
		if ( $emailable ) {
			$results['email/opens']  = $stats->get_email_breakdown( $post_id, 'opens', 'rate' );
			$results['email/clicks'] = $stats->get_email_breakdown( $post_id, 'clicks', 'rate' );
		}
		$composed = self::compose_subcalls(
			$results,
			__( 'Stats for that post could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-stats-pkg' )
		);
		if ( is_wp_error( $composed ) ) {
			return $composed;
		}
		$values = $composed['values'];
		$errors = array_values( array_unique( preg_replace( '#/.*$#', '', $composed['errors'] ) ) );
		$failed = static function ( string $tag ) use ( $errors ): bool {
			return in_array( $tag, $errors, true );
		};

		$likes = array(
			'total'  => null,
			'recent' => null,
		);
		if ( ! $failed( 'likes' ) ) {
			$likers = array();
			foreach ( array_slice( self::rows_at( $values['likes'], 'likes' ), 0, $max ) as $liker ) {
				$likers[] = array( 'name' => html_entity_decode( (string) ( $liker['name'] ?? '' ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
			}
			$likes = array(
				'total'  => self::count_or_null( $values['likes']['found'] ?? null ),
				'recent' => $likers,
			);
		}

		$comments = array();
		foreach ( get_comments(
			array(
				'post_id' => $post_id,
				'status'  => 'approve',
				'type'    => 'comment',
				'number'  => $max,
				'orderby' => 'comment_date_gmt',
				'order'   => 'DESC',
			)
		) as $comment ) {
			$comments[] = array(
				'author'  => (string) $comment->comment_author,
				'date'    => (string) mysql2date( 'c', $comment->comment_date ),
				'excerpt' => wp_trim_words( wp_strip_all_tags( $comment->comment_content ), 30 ),
				'url'     => (string) get_comment_link( $comment ),
			);
		}

		$email = array(
			'emailed' => false,
			'sent'    => null,
			'opens'   => self::email_summary( null ),
			'clicks'  => self::email_summary( null ),
		);
		if ( $emailable && $failed( 'email' ) ) {
			$email['emailed'] = null;
		} elseif ( $emailable ) {
			$opens  = $values['email/opens'];
			$clicks = $values['email/clicks'];
			// The Stats dashboard's own test: a post nobody was sent, opened or clicked was never emailed.
			if ( 0 < self::as_int( $opens, 'total_sends' ) + self::as_int( $opens, 'total_opens' ) + self::as_int( $clicks, 'total_clicks' ) ) {
				$email = array(
					'emailed' => true,
					'sent'    => self::as_int( $opens, 'total_sends' ),
					'opens'   => self::email_summary( array( $opens['total_opens'] ?? 0, $opens['unique_opens'] ?? 0, $opens['opens_rate'] ?? 0 ) ),
					'clicks'  => self::email_summary( array( $clicks['total_clicks'] ?? 0, $clicks['unique_clicks'] ?? 0, $clicks['clicks_rate'] ?? 0 ) ),
				);
			}
		}

		$published = in_array( $post->post_status, array( 'publish', 'private' ), true ) ? (string) mysql2date( 'c', $post->post_date ) : null;
		$out       = array(
			'site'        => self::site(),
			'post'        => array(
				'id'        => $post_id,
				'title'     => html_entity_decode( $post->post_title, ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'type'      => $post->post_type,
				'url'       => (string) get_permalink( $post ),
				'published' => $published,
			),
			'views'       => $failed( 'views' ) ? null : self::count_or_null( $values['views']['views'] ?? null ),
			'likes'       => $likes,
			'comments'    => array(
				'total'  => (int) get_comments_number( $post ),
				'recent' => $comments,
			),
			'utm_param'   => $utm_param,
			'utm'         => $failed( 'utm' ) ? null : array_slice( self::value_map_rows( $values['utm']['top_utm_values'] ?? null ), 0, $max ),
			'email'       => $email,
			'partial'     => ! empty( $errors ),
			'definitions' => self::definitions( array( 'post_detail', 'sent' ) ),
		);
		if ( ! empty( $errors ) ) {
			$out['errors'] = $errors;
		}
		return $out;
	}

	/**
	 * An email's all-time opens or clicks: total, unique people and rate as a percent, or every figure null.
	 *
	 * @param array|null $figures `[ total, unique, rate as a fraction ]`, or null when unknown or never emailed.
	 * @return array{total: int|null, unique: int|null, rate: float|null}
	 */
	private static function email_summary( ?array $figures ): array {
		return array(
			'total'  => null === $figures ? null : (int) $figures[0],
			'unique' => null === $figures ? null : (int) $figures[1],
			'rate'   => null === $figures ? null : round( (float) $figures[2] * 100, 2 ),
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

		$period = self::pick_period( $input['period'] ?? null, self::SERIES_PERIODS );
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

		$preset = self::pick_compare( $input['compare'] ?? null );
		if ( is_wp_error( $preset ) ) {
			return $preset;
		}
		$compare_date = null === $preset ? null : self::compare_end_date( $date, $preset, $period, $num );
		if ( is_wp_error( $compare_date ) ) {
			return $compare_date;
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

		$out = array(
			'site'   => self::site(),
			'period' => $period,
			'num'    => $num,
			'date'   => $date,
			'fields' => $fields,
			'series' => self::normalize_visits_series( $raw, $fields ),
		);

		$out['definitions'] = self::definitions( array_merge( array( 'series' ), $fields ) );
		if ( null !== $compare_date ) {
			// The same periods, shifted back by whole periods, so row i compares with row i.
			$compare_raw                      = $stats->get_visits( array( 'date' => $compare_date ) + $args );
			$out['comparison']                = array(
				'preset' => $preset,
				'date'   => $compare_date,
				'series' => is_wp_error( $compare_raw ) ? null : self::normalize_visits_series( $compare_raw, $fields ),
			);
			$out['definitions']['comparison'] = self::definition_texts()['comparison_series'];
			if ( is_wp_error( $compare_raw ) ) {
				$out['partial'] = true;
				$out['errors']  = array( 'comparison' );
			}
		}

		return $out;
	}

	/**
	 * Execute: get-followers.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array|WP_Error
	 */
	public static function get_followers( $input = null ) {
		$input  = is_array( $input ) ? $input : array();
		$period = isset( $input['period'] ) && in_array( $input['period'], self::SERIES_PERIODS, true ) ? $input['period'] : null;
		$date   = self::resolve_date( $input['date'] ?? null );
		if ( is_wp_error( $date ) ) {
			return $date;
		}
		$stats = self::get_wpcom_stats();

		$calls = array(
			'followers'           => $stats->get_followers(
				array(
					'type' => 'all',
					'max'  => 1,
				)
			),
			'comment_followers'   => $stats->get_comment_followers(),
			'publicize_followers' => $stats->get_publicize_followers(),
			'subscriber_counts'   => $stats->get_subscriber_counts(),
		);
		if ( null !== $period ) {
			$calls['subscriber_history'] = $stats->get_subscriber_history(
				array(
					'unit'     => $period,
					'quantity' => self::clamp_int( $input['num'] ?? 30, 1, 90, 30 ),
					'date'     => $date,
				)
			);
		}

		$composed = self::compose_subcalls(
			$calls,
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

		$out   = array(
			'site'      => self::site(),
			'total'     => $total,
			'email'     => $email,
			'wpcom'     => $wpcom,
			'comment'   => $comment,
			// An empty PHP array would encode as `[]`, not the object the schema promises.
			'publicize' => null === $publicize_by_service ? null : (object) $publicize_by_service,
			'paid'      => in_array( 'subscriber_counts', $errors, true ) ? null : self::count_or_null( $composed['values']['subscriber_counts']['counts']['paid_subscribers'] ?? null ),
		);
		$terms = array( 'total', 'email', 'wpcom', 'comment', 'publicize', 'paid' );
		if ( null !== $period ) {
			$out['series'] = in_array( 'subscriber_history', $errors, true ) ? null : self::subscriber_series( $composed['values']['subscriber_history'] );
			$terms[]       = 'subscriber_series';
		}
		$out['partial']     = ! empty( $errors );
		$out['definitions'] = self::definitions( $terms );

		if ( ! empty( $errors ) ) {
			$out['errors'] = $errors;
		}

		return $out;
	}

	/**
	 * Execute: get-author-views.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_author_views( $input = null ) {
		$input = is_array( $input ) ? $input : array();
		if ( ! isset( $input['author_id'] ) || ! is_numeric( $input['author_id'] ) || (int) $input['author_id'] <= 0 ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_author_id',
				__( 'A positive author_id is required.', 'jetpack-stats-pkg' )
			);
		}

		$author_id = (int) $input['author_id'];
		$period    = self::pick_period( $input['period'] ?? null, self::SERIES_PERIODS );
		$num       = self::clamp_int( $input['num'] ?? 30, 1, 90, 30 );
		$date      = self::resolve_date( $input['date'] ?? null );
		if ( is_wp_error( $date ) ) {
			return $date;
		}

		$raw = self::get_wpcom_stats()->get_author_views(
			$author_id,
			array(
				'period' => $period,
				'date'   => $date,
				'num'    => $num,
			)
		);
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		$counts = array();
		foreach ( (array) ( $raw['content_counts'] ?? array() ) as $post_type => $count ) {
			$counts[ (string) $post_type ] = (int) $count;
		}

		return array(
			'site'               => self::site(),
			'author'             => array(
				'id'   => $author_id,
				'name' => html_entity_decode( (string) ( $raw['author']['name'] ?? '' ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
			),
			'period'             => $period,
			'date'               => $date,
			'num'                => $num,
			'views'              => self::as_int( $raw, 'views' ),
			'likes'              => self::as_int( $raw, 'likes' ),
			'comments'           => self::as_int( $raw, 'comments' ),
			'series'             => self::normalize_visits_series( $raw, array( 'views' ) ),
			// An empty PHP array would encode as `[]`, not the object the schema promises.
			'content_counts'     => (object) $counts,
			'first_content_date' => is_string( $raw['first_content_date'] ?? null ) ? $raw['first_content_date'] : null,
			'definitions'        => self::definitions( array( 'views', 'author_views', 'series' ) ),
		);
	}

	/**
	 * Execute: get-insights.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array|WP_Error
	 */
	public static function get_insights( $input = null ) {
		unset( $input );
		$stats = self::get_wpcom_stats();
		$today = self::today();
		// The streaks are found among the calendar's days, so it needs every post of the year.
		$calendar_from = gmdate( 'Y-m-d', strtotime( $today . ' -1 year +1 day' ) );

		$composed = self::compose_subcalls(
			array(
				'summary'    => $stats->get_stats(),
				'insights'   => $stats->get_insights(),
				'highlights' => $stats->get_highlights(),
				'streak'     => $stats->get_streak(
					array(
						'startDate' => $calendar_from,
						'endDate'   => $today,
						'max'       => self::STREAK_MAX_POSTS,
					)
				),
				'usage'      => $stats->get_stats_usage(),
			),
			__( 'Stats insights could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-stats-pkg' )
		);
		if ( is_wp_error( $composed ) ) {
			return $composed;
		}
		$values = $composed['values'];
		$errors = $composed['errors'];
		$failed = static function ( string $tag ) use ( $errors ): bool {
			return in_array( $tag, $errors, true );
		};

		$summary  = is_array( $values['summary']['stats'] ?? null ) ? $values['summary']['stats'] : array();
		$insights = $values['insights'];
		$usage    = $values['usage'];

		$recent = array();
		foreach ( array(
			'last_7_days'      => 'past_seven_days',
			'previous_7_days'  => 'between_past_eight_and_fifteen_days',
			'last_30_days'     => 'past_thirty_days',
			'previous_30_days' => 'between_past_thirty_one_and_sixty_days',
		) as $key => $wpcom_key ) {
			$window         = is_array( $values['highlights'][ $wpcom_key ] ?? null ) ? $values['highlights'][ $wpcom_key ] : array();
			$recent[ $key ] = array(
				'from'     => (string) ( $window['range']['start'] ?? '' ),
				'to'       => (string) ( $window['range']['end'] ?? '' ),
				'views'    => self::as_int( $window, 'views' ),
				'visitors' => self::as_int( $window, 'visitors' ),
				'likes'    => self::as_int( $window, 'likes' ),
				'comments' => self::as_int( $window, 'comments' ),
			);
		}

		$years = array();
		foreach ( self::rows_at( $insights, 'years' ) as $year ) {
			$years[] = array(
				'year'     => (string) ( $year['year'] ?? '' ),
				'posts'    => self::as_int( $year, 'total_posts' ),
				'words'    => self::as_int( $year, 'total_words' ),
				'likes'    => self::as_int( $year, 'total_likes' ),
				'comments' => self::as_int( $year, 'total_comments' ),
			);
		}

		$calendar = $failed( 'streak' ) ? null : self::posting_calendar( $values['streak'], $calendar_from, $today );

		$weekdays = array( 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' );
		$weekday  = (int) ( $insights['highest_day_of_week'] ?? -1 );

		$out = array(
			'site'        => self::site(),
			'all_time'    => $failed( 'summary' ) ? null : array(
				'views'          => self::as_int( $summary, 'views' ),
				'visitors'       => self::as_int( $summary, 'visitors' ),
				'posts'          => self::as_int( $summary, 'posts' ),
				'comments'       => self::as_int( $summary, 'comments' ),
				'shares'         => self::as_int( $summary, 'shares' ),
				'best_day'       => is_string( $summary['views_best_day'] ?? null ) && '' !== $summary['views_best_day'] ? $summary['views_best_day'] : null,
				'best_day_views' => self::as_int( $summary, 'views_best_day_total' ),
			),
			'busiest'     => $failed( 'insights' ) || ! isset( $weekdays[ $weekday ] ) ? null : array(
				'hour'                => self::as_int( $insights, 'highest_hour' ),
				'hour_percent'        => round( (float) ( $insights['highest_hour_percent'] ?? 0 ), 1 ),
				'day_of_week'         => $weekdays[ $weekday ],
				'day_of_week_percent' => round( (float) ( $insights['highest_day_percent'] ?? 0 ), 1 ),
			),
			'recent'      => $failed( 'highlights' ) ? null : $recent,
			'streak'      => null === $calendar ? null : self::streak_summary( $calendar['days'], $today ),
			'calendar'    => $calendar,
			'years'       => $failed( 'insights' ) ? null : $years,
			'plan_usage'  => $failed( 'usage' ) ? null : array(
				'plan'         => is_string( $usage['current_tier']['slug'] ?? null ) ? $usage['current_tier']['slug'] : null,
				'views'        => self::as_int( is_array( $usage['current_usage'] ?? null ) ? $usage['current_usage'] : array(), 'views_count' ),
				'views_limit'  => self::count_or_null( $usage['views_limit'] ?? null ),
				'period_start' => (string) ( $usage['current_usage']['current_start'] ?? '' ),
				'period_end'   => (string) ( $usage['current_usage']['next_start'] ?? '' ),
				'over_limit'   => true === ( $usage['is_over_limit'] ?? false ),
			),
			'partial'     => ! empty( $errors ),
			'definitions' => self::definitions( array( 'views', 'visitors', 'all_time', 'busiest', 'recent', 'streak', 'calendar', 'years', 'plan_usage' ) ),
		);
		if ( ! empty( $errors ) ) {
			$out['errors'] = $errors;
		}
		return $out;
	}

	/**
	 * Execute: get-email-stats.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_email_stats( $input = null ) {
		$input = is_array( $input ) ? $input : array();
		$args  = array(
			'quantity'   => self::clamp_int( $input['max'] ?? 10, 1, 100, 10 ),
			'sort_field' => isset( $input['sort'] ) && in_array( $input['sort'], self::EMAIL_SORTS, true ) ? $input['sort'] : 'post_date',
			'sort_order' => 'asc' === ( $input['order'] ?? null ) ? 'asc' : 'desc',
		);
		foreach ( array( 'start_date', 'end_date' ) as $key ) {
			if ( isset( $input[ $key ] ) ) {
				$day = self::resolve_date( $input[ $key ] );
				if ( is_wp_error( $day ) || '' === $input[ $key ] ) {
					return new WP_Error(
						self::ERROR_PREFIX . 'invalid_date',
						/* translators: %s: the input field name. */
						sprintf( __( '`%s` must be a real day in YYYY-MM-DD format, such as 2026-04-23.', 'jetpack-stats-pkg' ), $key )
					);
				}
				$args[ $key ] = $day;
			}
		}

		$raw = self::get_wpcom_stats()->get_email_summary( $args );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		$posts = array();
		foreach ( self::rows_at( $raw, 'posts' ) as $row ) {
			$posts[] = array(
				'id'            => self::as_int( $row, 'id' ),
				'title'         => html_entity_decode( (string) ( $row['title'] ?? '' ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'href'          => (string) ( $row['href'] ?? '' ),
				'date'          => (string) ( $row['date'] ?? '' ),
				'sent'          => self::as_int( $row, 'total_sends' ),
				'opens'         => self::as_int( $row, 'opens' ),
				'unique_opens'  => self::as_int( $row, 'unique_opens' ),
				'open_rate'     => (float) ( $row['opens_rate'] ?? 0 ),
				'clicks'        => self::as_int( $row, 'clicks' ),
				'unique_clicks' => self::as_int( $row, 'unique_clicks' ),
				'click_rate'    => (float) ( $row['clicks_rate'] ?? 0 ),
			);
		}

		$out = array( 'site' => self::site() );
		foreach ( array( 'start_date', 'end_date' ) as $key ) {
			if ( is_string( $raw[ $key ] ?? null ) ) {
				$out[ $key ] = $raw[ $key ];
			}
		}
		$out['posts']       = $posts;
		$out['definitions'] = self::definitions( array( 'sent', 'opens', 'clicks', 'email_rates', isset( $out['start_date'] ) ? 'email_window' : 'email_all_time' ) );
		return $out;
	}

	/**
	 * Execute: get-email-detail.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_email_detail( $input = null ) {
		$input = is_array( $input ) ? $input : array();
		if ( ! isset( $input['post_id'] ) || ! is_numeric( $input['post_id'] ) || (int) $input['post_id'] <= 0 ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_post_id',
				__( 'A positive post_id is required.', 'jetpack-stats-pkg' )
			);
		}
		$post_id = (int) $input['post_id'];
		$max     = self::clamp_int( $input['max'] ?? 10, 1, 100, 10 );
		// WPCOM answers an unknown post with zeros, which would read as an email nobody opened.
		if ( ! get_post( $post_id ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'post_not_found',
				__( 'No post exists with that post_id.', 'jetpack-stats-pkg' ),
				array( 'status' => 404 )
			);
		}

		$stats   = self::get_wpcom_stats();
		$results = array();
		foreach ( self::EMAIL_BREAKDOWNS as $breakdown ) {
			list( $stat, $field )  = explode( '/', $breakdown );
			$results[ $breakdown ] = $stats->get_email_breakdown( $post_id, $stat, $field );
		}
		$composed = self::compose_subcalls(
			$results,
			__( 'Stats for that email could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-stats-pkg' )
		);
		if ( is_wp_error( $composed ) ) {
			return $composed;
		}
		$values  = $composed['values'];
		$errors  = $composed['errors'];
		$rows    = static function ( string $breakdown, string $key, callable $label ) use ( $values, $errors, $max ): ?array {
			if ( in_array( $breakdown, $errors, true ) ) {
				return null;
			}
			$block = is_array( $values[ $breakdown ][ $key ] ?? null ) ? $values[ $breakdown ][ $key ] : array();
			return self::email_rows( self::rows_at( $block, 'data' ), $label, $max );
		};
		$as_is   = static function ( string $value ): string {
			return $value;
		};
		$country = static function ( string $breakdown ) use ( $values ): callable {
			$names   = is_array( $values[ $breakdown ]['countries-info'] ?? null ) ? $values[ $breakdown ]['countries-info'] : array();
			$unknown = __( 'Unknown', 'jetpack-stats-pkg' );
			return static function ( string $code ) use ( $names, $unknown ): string {
				$name = $names[ $code ]['country_full'] ?? null;
				return is_string( $name ) && '' !== $name ? $name : $unknown;
			};
		};
		$rate    = static function ( string $breakdown, string $total, string $unique, string $rate ) use ( $values, $errors ): array {
			if ( in_array( $breakdown, $errors, true ) ) {
				return array(
					'total'  => null,
					'unique' => null,
					'rate'   => null,
				);
			}
			$raw = $values[ $breakdown ];
			return array(
				'total'  => self::as_int( $raw, $total ),
				'unique' => self::as_int( $raw, $unique ),
				'rate'   => round( (float) ( $raw[ $rate ] ?? 0 ) * 100, 2 ),
			);
		};

		// The email's own links come by name; `user_link` totals the post's links, which come by URL.
		$link_names = array(
			'post-url'            => __( 'Post title', 'jetpack-stats-pkg' ),
			'header-post'         => __( 'Post header', 'jetpack-stats-pkg' ),
			'like-post'           => __( 'Like', 'jetpack-stats-pkg' ),
			'comment-post'        => __( 'Comment', 'jetpack-stats-pkg' ),
			'reader-url'          => __( 'Read in the Reader', 'jetpack-stats-pkg' ),
			'manage-subscription' => __( 'Manage subscription', 'jetpack-stats-pkg' ),
			'remove-subscription' => __( 'Unsubscribe', 'jetpack-stats-pkg' ),
		);
		$links      = null;
		if ( ! in_array( 'clicks/link', $errors, true ) || ! in_array( 'clicks/user-content-link', $errors, true ) ) {
			$links = self::email_rows(
				array_merge(
					self::rows_at( is_array( $values['clicks/link']['links'] ?? null ) ? $values['clicks/link']['links'] : array(), 'data' ),
					self::rows_at( is_array( $values['clicks/user-content-link']['user-content-links'] ?? null ) ? $values['clicks/user-content-link']['user-content-links'] : array(), 'data' )
				),
				static function ( string $link ) use ( $link_names ): ?string {
					return 'user_link' === $link ? null : ( $link_names[ $link ] ?? $link );
				},
				$max
			);
		}

		$sent = null;
		foreach ( array( 'opens/rate', 'clicks/rate' ) as $breakdown ) {
			if ( null === $sent && ! in_array( $breakdown, $errors, true ) ) {
				$sent = self::as_int( $values[ $breakdown ], 'total_sends' );
			}
		}

		$out = array(
			'site'        => self::site(),
			'post_id'     => $post_id,
			'sent'        => $sent,
			'opens'       => $rate( 'opens/rate', 'total_opens', 'unique_opens', 'opens_rate' ) + array(
				'by_client'  => $rows( 'opens/client', 'clients', $as_is ),
				'by_device'  => $rows( 'opens/device', 'devices', $as_is ),
				'by_country' => $rows( 'opens/country', 'countries', $country( 'opens/country' ) ),
			),
			'clicks'      => $rate( 'clicks/rate', 'total_clicks', 'unique_clicks', 'clicks_rate' ) + array(
				'by_client'  => $rows( 'clicks/client', 'clients', $as_is ),
				'by_device'  => $rows( 'clicks/device', 'devices', $as_is ),
				'by_country' => $rows( 'clicks/country', 'countries', $country( 'clicks/country' ) ),
				'by_link'    => $links,
			),
			'partial'     => ! empty( $errors ),
			'definitions' => self::definitions( array( 'sent', 'email_detail' ) ),
		);
		if ( ! empty( $errors ) ) {
			$out['errors'] = $errors;
		}
		return $out;
	}

	/**
	 * Execute: get-video-stats.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_video_stats( $input = null ) {
		$input = is_array( $input ) ? $input : array();
		if ( ! isset( $input['video_id'] ) || ! is_numeric( $input['video_id'] ) || (int) $input['video_id'] <= 0 ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_video_id',
				__( 'A positive video_id is required.', 'jetpack-stats-pkg' )
			);
		}
		$video_id = (int) $input['video_id'];
		$period   = self::pick_period( $input['period'] ?? null );
		$num      = self::clamp_int( $input['num'] ?? 30, 1, 90, 30 );
		$date     = self::resolve_date( $input['date'] ?? null );
		if ( is_wp_error( $date ) ) {
			return $date;
		}
		$video = get_post( $video_id );
		if ( ! $video || 'attachment' !== $video->post_type ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'video_not_found',
				__( 'No video exists with that video_id.', 'jetpack-stats-pkg' ),
				array( 'status' => 404 )
			);
		}

		$raw = self::get_wpcom_stats()->get_video_details(
			$video_id,
			array(
				'statType' => 'plays',
				'period'   => $period,
				'num'      => $num,
				'date'     => $date,
			)
		);
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		$fields = is_array( $raw['fields'] ?? null ) ? $raw['fields'] : array();
		$column = array_search( 'plays', $fields, true );
		$series = array();
		foreach ( self::rows_at( $raw, 'data' ) as $row ) {
			$series[] = array(
				'date'  => (string) ( $row[0] ?? '' ),
				'plays' => false === $column ? 0 : (int) ( $row[ $column ] ?? 0 ),
			);
		}
		$pages = array();
		foreach ( array_slice( self::rows_at( $raw, 'pages_detail' ), 0, self::VIDEO_PAGES_LIMIT ) as $page ) {
			$pages[] = array(
				'url'     => (string) ( $page['url'] ?? '' ),
				'post_id' => isset( $page['post_id'] ) ? (int) $page['post_id'] : null,
				'title'   => isset( $page['title'] ) ? html_entity_decode( (string) $page['title'], ENT_QUOTES | ENT_HTML5, 'UTF-8' ) : null,
			);
		}

		return array(
			'site'        => self::site(),
			'video_id'    => $video_id,
			'title'       => get_the_title( $video ),
			'period'      => $period,
			'num'         => $num,
			'date'        => $date,
			'total_plays' => self::as_int( is_array( $raw['total'] ?? null ) ? $raw['total'] : array(), 'plays' ),
			'series'      => $series,
			'pages'       => $pages,
			'definitions' => self::definitions( array( 'video_plays', 'series' ) ),
		);
	}

	/**
	 * Execute: get-subscribers.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_subscribers( $input = null ) {
		$input = is_array( $input ) ? $input : array();
		$args  = array(
			'page'       => self::clamp_int( $input['page'] ?? 1, 1, PHP_INT_MAX, 1 ),
			'per_page'   => self::clamp_int( $input['per_page'] ?? 20, 1, 100, 20 ),
			'sort'       => isset( $input['sort'] ) && in_array( $input['sort'], self::SUBSCRIBER_SORTS, true ) ? $input['sort'] : 'date_subscribed',
			'sort_order' => 'asc' === ( $input['order'] ?? null ) ? 'asc' : 'desc',
		);
		if ( isset( $input['filter'] ) && in_array( $input['filter'], self::SUBSCRIBER_FILTERS, true ) && 'all' !== $input['filter'] ) {
			$args['filter'] = $input['filter'];
		}
		if ( isset( $input['search'] ) && is_string( $input['search'] ) && '' !== trim( $input['search'] ) ) {
			$args['search'] = trim( $input['search'] );
		}

		$raw = self::get_wpcom_stats()->get_subscribers( $args );
		if ( is_wp_error( $raw ) ) {
			return $raw;
		}

		$subscribers = array();
		foreach ( self::rows_at( $raw, 'subscribers' ) as $row ) {
			$user_id       = self::as_int( $row, 'user_id' );
			$subscribers[] = array(
				'subscription_id'  => self::as_int( $row, 'subscription_id' ),
				'user_id'          => $user_id > 0 ? $user_id : null,
				'name'             => html_entity_decode( (string) ( $row['display_name'] ?? '' ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ),
				'email'            => (string) ( $row['email_address'] ?? '' ),
				'url'              => (string) ( $row['url'] ?? '' ),
				'subscribed_at'    => (string) ( $row['date_subscribed'] ?? '' ),
				'status'           => (string) ( $row['subscription_status'] ?? '' ),
				'email_subscriber' => true === ( $row['is_email_subscriber'] ?? false ),
			);
		}

		return array(
			'site'        => self::site(),
			'total'       => self::as_int( $raw, 'total' ),
			'page'        => $args['page'],
			'pages'       => self::as_int( $raw, 'pages' ),
			'subscribers' => $subscribers,
		);
	}

	/**
	 * Execute: get-ad-stats.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_ad_stats( $input = null ) {
		$input  = is_array( $input ) ? $input : array();
		$period = self::pick_period( $input['period'] ?? null, self::SERIES_PERIODS );
		$num    = self::clamp_int( $input['num'] ?? 30, 1, 90, 30 );
		$date   = self::resolve_date( $input['date'] ?? null );
		if ( is_wp_error( $date ) ) {
			return $date;
		}

		$stats    = self::get_wpcom_stats();
		$composed = self::compose_subcalls(
			array(
				'stats'    => $stats->get_wordads_stats(
					array(
						'unit'     => $period,
						'quantity' => $num,
						'date'     => $date,
					)
				),
				'earnings' => $stats->get_wordads_earnings(),
			),
			__( 'WordAds data could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-stats-pkg' )
		);
		if ( is_wp_error( $composed ) ) {
			return $composed;
		}
		$errors = $composed['errors'];

		$series = null;
		if ( ! in_array( 'stats', $errors, true ) ) {
			$raw    = $composed['values']['stats'];
			$fields = array_flip( is_array( $raw['fields'] ?? null ) ? $raw['fields'] : array() );
			$series = array();
			foreach ( is_array( $raw['data'] ?? null ) ? $raw['data'] : array() as $row ) {
				if ( ! is_array( $row ) ) {
					continue;
				}
				$series[] = array(
					'date'        => self::period_start_date( (string) ( $row[ $fields['period'] ?? 0 ] ?? '' ) ),
					'impressions' => (int) ( $row[ $fields['impressions'] ?? 1 ] ?? 0 ),
					'revenue'     => round( (float) ( $row[ $fields['revenue'] ?? 2 ] ?? 0 ), 2 ),
					'cpm'         => round( (float) ( $row[ $fields['cpm'] ?? 3 ] ?? 0 ), 2 ),
				);
			}
		}

		$earnings = null;
		if ( ! in_array( 'earnings', $errors, true ) ) {
			$raw    = is_array( $composed['values']['earnings']['earnings'] ?? null ) ? $composed['values']['earnings']['earnings'] : array();
			$months = array();
			// WordAds, sponsored posts and adjustments each list amounts by `YYYY-MM`; a month is paid once every part of it is.
			foreach ( array( 'wordads', 'sponsored', 'adjustment' ) as $network ) {
				foreach ( self::rows_at( $raw, $network ) as $month => $row ) {
					$month            = (string) $month;
					$paid             = 1 === (int) ( $row['status'] ?? 0 );
					$months[ $month ] = array(
						'month'  => $month,
						'amount' => ( $months[ $month ]['amount'] ?? 0 ) + (float) ( $row['amount'] ?? 0 ),
						'paid'   => ( $months[ $month ]['paid'] ?? true ) && $paid,
					);
				}
			}
			krsort( $months );
			foreach ( $months as $month => $row ) {
				$months[ $month ]['amount'] = round( $row['amount'], 2 );
			}
			$earnings = array(
				'total'  => round( (float) ( $raw['total_earnings'] ?? 0 ), 2 ),
				'owed'   => round( (float) ( $raw['total_amount_owed'] ?? 0 ), 2 ),
				'months' => array_values( $months ),
			);
		}

		$out = array(
			'site'     => self::site(),
			'period'   => $period,
			'date'     => $date,
			'num'      => $num,
			'series'   => $series,
			'earnings' => $earnings,
			'partial'  => ! empty( $errors ),
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
	 * @param mixed $raw     Raw input value.
	 * @param array $allowed The periods the ability accepts.
	 * @return string One of `$allowed`.
	 */
	private static function pick_period( $raw, array $allowed = self::PERIODS ): string {
		return is_string( $raw ) && in_array( $raw, $allowed, true ) ? $raw : 'day';
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
	 * @param array       $args      Pre-built `{ period, date, max, num?, summarize? }` args, or `{ date, days, max }` for
	 *                               the DAYS_WINDOW_TYPES — `tags` takes only `max`, and the comment types none.
	 * @param string      $utm_param UTM parameter or combination, for `utm`.
	 * @return array|WP_Error
	 */
	private static function fetch_top_content_raw( WPCOM_Stats $stats, string $type, array $args, string $utm_param = '' ) {
		if ( isset( self::LOCATION_TYPES[ $type ] ) ) {
			return $stats->get_views_by_location( self::LOCATION_TYPES[ $type ], $args );
		}
		if ( 'utm' === $type ) {
			return $stats->get_utm_views( $utm_param, $args );
		}
		if ( isset( self::DAYS_WINDOW_TYPES[ $type ] ) ) {
			return $stats->get_device_views( self::DAYS_WINDOW_TYPES[ $type ], $args );
		}

		switch ( $type ) {
			case 'commenters':
			case 'commented-posts':
				return $stats->get_top_comments();
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
	 * Project a WPCOM top-content response into label/value rows, in WordPress.com's order.
	 *
	 * Most `type` values follow the `days -> <date> -> <list-key>` shape (or
	 * `summary -> <list-key>` when summarized) and project through
	 * `TOP_CONTENT_MAP`. `tags` and `countries` are special-cased.
	 *
	 * @param string $type       Content type enum.
	 * @param array  $raw        Raw WPCOM response.
	 * @param bool   $summarized Whether the request asked WPCOM to `summarize`.
	 * @return array List of { label, value, href?, id? } rows.
	 */
	private static function top_content_rows( string $type, array $raw, bool $summarized = false ): array {
		if ( 'tags' === $type ) {
			return self::tag_rows( $raw );
		}

		$day_data = self::first_period_block( $raw, $summarized );

		if ( 'countries' === $type ) {
			return self::country_rows( $day_data, self::rows_at( $raw, 'country-info' ) );
		}
		if ( isset( self::LOCATION_TYPES[ $type ] ) ) {
			return self::location_rows( $day_data );
		}
		if ( isset( self::DAYS_WINDOW_TYPES[ $type ] ) ) {
			return self::value_map_rows( $raw[ 'utm' === $type ? 'top_utm_values' : 'top_values' ] ?? null );
		}
		if ( in_array( $type, array( 'commenters', 'commented-posts' ), true ) ) {
			// These lists are not split into periods.
			$day_data = $raw;
		}

		$map = self::TOP_CONTENT_MAP[ $type ] ?? null;
		if ( null === $map ) {
			return array();
		}

		$rows = array();
		foreach ( self::rows_at( $day_data, $map['list'] ) as $row ) {
			$rows[] = array(
				'label'    => self::pick_field( $row, $map['label'] ),
				'value'    => self::pick_field( $row, $map['value'] ),
				'href'     => isset( $map['href'] ) ? self::pick_field( $row, $map['href'] ) : null,
				'id'       => isset( $map['id'] ) ? self::pick_field( $row, $map['id'] ) : null,
				'children' => isset( $map['children'] ) ? self::child_rows( $row[ $map['children'] ] ?? null ) : array(),
			);
		}
		return $rows;
	}

	/**
	 * Project the rows a referrer, click or author row groups, and the rows those group in turn.
	 *
	 * A referrer group with nothing under it reports `results` as `{ views }` rather than a list, so it has none.
	 *
	 * @param mixed $list Raw list of `{ name|title, url, views, children? }`, or anything else for none.
	 * @return array Rows of `{ label, value, href, children }`.
	 */
	private static function child_rows( $list ): array {
		if ( ! is_array( $list ) || array_values( $list ) !== $list ) {
			return array();
		}
		$rows = array();
		foreach ( array_filter( $list, 'is_array' ) as $row ) {
			$rows[] = array(
				'label'    => self::pick_field( $row, array( 'name', 'title', 'url' ) ),
				'value'    => $row['views'] ?? 0,
				'href'     => self::pick_field( $row, 'url' ),
				'children' => self::child_rows( $row['children'] ?? null ),
			);
		}
		return $rows;
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
				'label'    => implode( ', ', array_column( $terms, 'name' ) ),
				'value'    => $row['views'] ?? 0,
				'href'     => 1 === count( $terms ) ? ( array_column( $terms, 'link' )[0] ?? null ) : null,
				'children' => 1 === count( $terms ) ? array() : array_map(
					function ( $term ) {
						return array(
							'label' => $term['name'] ?? '',
							'href'  => $term['link'] ?? null,
							'type'  => $term['type'] ?? null,
						);
					},
					array_values( $terms )
				),
			);
		}
		return $rows;
	}

	/**
	 * Project WordPress.com's `[ name, count ]` email rows into the top `$max` label/value rows, most first.
	 *
	 * Rows whose names share a label merge; a null label drops the row.
	 *
	 * @param array    $tuples `[ name, count ]` rows.
	 * @param callable $label  Maps a row's name to its label, or null to drop it.
	 * @param int      $max    Rows cap.
	 * @return array
	 */
	private static function email_rows( array $tuples, callable $label, int $max ): array {
		$values = array();
		foreach ( $tuples as $tuple ) {
			if ( ! is_array( $tuple ) || ! isset( $tuple[0] ) ) {
				continue;
			}
			$name = $label( (string) $tuple[0] );
			if ( null !== $name ) {
				$values[ $name ] = ( $values[ $name ] ?? 0 ) + (int) ( $tuple[1] ?? 0 );
			}
		}
		arsort( $values );

		$rows = array();
		foreach ( array_slice( $values, 0, $max, true ) as $name => $value ) {
			$rows[] = array(
				'label' => (string) $name,
				'value' => $value,
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
	 * Project a `stats/location-views/{region,city}` period block into label/value rows.
	 *
	 * @param array $day_data Period block holding the `views` rows of `{ location, views, country_code }`.
	 * @return array
	 */
	private static function location_rows( array $day_data ): array {
		$rows = array();
		foreach ( self::rows_at( $day_data, 'views' ) as $row ) {
			$rows[] = array(
				'label'   => (string) ( $row['location'] ?? '' ),
				'value'   => $row['views'] ?? 0,
				'country' => $row['country_code'] ?? null,
			);
		}
		return $rows;
	}

	/**
	 * Project a WordPress.com `{ value: count }` map into label/value rows, in its order.
	 *
	 * A UTM combination is keyed by the JSON list of its values, which reads as `google / cpc`.
	 *
	 * @param mixed $map Map of value => count, or anything else for none.
	 * @return array
	 */
	private static function value_map_rows( $map ): array {
		if ( ! is_array( $map ) ) {
			return array();
		}
		$rows = array();
		foreach ( $map as $label => $count ) {
			$label  = (string) $label;
			$values = json_decode( $label, true );
			$rows[] = array(
				'label' => is_array( $values ) ? implode( ' / ', array_map( 'strval', $values ) ) : $label,
				'value' => (int) round( (float) $count ),
			);
		}
		return $rows;
	}

	/**
	 * Project the posts one UTM value's views went to.
	 *
	 * @param array $raw `stats/utm/<param>/top_posts` response.
	 * @return array Rows of `{ label, value, href, id }`.
	 */
	private static function utm_post_rows( array $raw ): array {
		$rows = array();
		foreach ( self::rows_at( $raw, 'top_posts' ) as $post ) {
			$rows[] = array(
				'label' => (string) ( $post['title'] ?? '' ),
				'value' => (int) ( $post['views'] ?? 0 ),
				'href'  => $post['href'] ?? null,
				'id'    => (int) ( $post['id'] ?? 0 ),
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
	 * @param array $items Items from rank_and_cap().
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
	 * @param array $rows   Rows of `{ label, value, href?, id?, children? }`.
	 * @param int   $max    Result cap; 0 keeps every row.
	 * @param bool  $expand Whether to keep each row's `children`.
	 * @return array Items of `{ rank, label, value, href?, id?, children? }`.
	 */
	private static function rank_and_cap( array $rows, int $max, bool $expand = false ): array {
		$items = array();
		foreach ( 0 === $max ? $rows : array_slice( $rows, 0, $max ) as $i => $row ) {
			$item = array( 'rank' => $i + 1 ) + self::item( $row );
			$id   = (int) ( $row['id'] ?? 0 );
			if ( $id > 0 ) {
				$item['id'] = $id;
			}
			if ( $expand && ! empty( $row['children'] ) ) {
				$item['children'] = self::child_items( $row['children'], $max );
			}
			$items[] = $item;
		}
		return $items;
	}

	/**
	 * Turn child rows into items, nested as WordPress.com nests them.
	 *
	 * WordPress.com caps every level at the requested `max`, which is one more than the cap asked for.
	 *
	 * @param array $rows Rows of `{ label, value?, href?, id?, type?, children? }`.
	 * @param int   $max  Cap per level; 0 keeps every row.
	 * @return array Items of `{ label, value?, href?, id?, type?, children? }`.
	 */
	private static function child_items( array $rows, int $max ): array {
		$items = array();
		foreach ( 0 === $max ? $rows : array_slice( $rows, 0, $max ) as $row ) {
			$item = self::item( $row );
			if ( (int) ( $row['id'] ?? 0 ) > 0 ) {
				$item['id'] = (int) $row['id'];
			}
			if ( ! empty( $row['type'] ) ) {
				$item['type'] = (string) $row['type'];
			}
			if ( ! empty( $row['children'] ) ) {
				$item['children'] = self::child_items( $row['children'], $max );
			}
			$items[] = $item;
		}
		return $items;
	}

	/**
	 * The label, value and href of one row; a row without a `value` key (a term in a tags item) gets none.
	 *
	 * @param array $row Row of `{ label, value?, href? }`.
	 * @return array
	 */
	private static function item( array $row ): array {
		// WordPress.com sends titles and names HTML-encoded.
		$item = array( 'label' => html_entity_decode( (string) ( $row['label'] ?? '' ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		if ( array_key_exists( 'value', $row ) ) {
			$item['value'] = (int) ( $row['value'] ?? 0 );
		}
		if ( ! empty( $row['country'] ) ) {
			$item['country'] = (string) $row['country'];
		}
		if ( isset( $row['href'] ) && '' !== $row['href'] ) {
			// Links off a WordPress.com site go through the href.li redirector; report where they lead.
			$item['href'] = (string) preg_replace( '#^https?://href\.li/\?#', '', (string) $row['href'] );
		}
		return $item;
	}

	/**
	 * Project a `stats/subscribers` response into `{ date, subscribers, change }` rows, oldest first.
	 *
	 * WordPress.com lists the periods newest first.
	 *
	 * @param array $raw Raw response: `{ fields: [ period, subscribers, subscribers_change ], data: [ [ … ] ] }`.
	 * @return array
	 */
	private static function subscriber_series( array $raw ): array {
		$fields = array_flip( is_array( $raw['fields'] ?? null ) ? $raw['fields'] : array() );
		$series = array();
		foreach ( is_array( $raw['data'] ?? null ) ? $raw['data'] : array() as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$series[] = array(
				'date'        => self::period_start_date( (string) ( $row[ $fields['period'] ?? 0 ] ?? '' ) ),
				'subscribers' => (int) ( $row[ $fields['subscribers'] ?? 1 ] ?? 0 ),
				'change'      => (int) ( $row[ $fields['subscribers_change'] ?? 2 ] ?? 0 ),
			);
		}
		usort(
			$series,
			static function ( $a, $b ) {
				return strcmp( $a['date'], $b['date'] );
			}
		);
		return $series;
	}

	/**
	 * Count the posts the site published each day, from the WPCOM streak response.
	 *
	 * WPCOM keys each publish time, as a Unix timestamp, to the posts published then.
	 *
	 * @param array  $streak Raw WPCOM streak response: `{ data: { timestamp: posts } }`.
	 * @param string $from   First day asked for, YYYY-MM-DD.
	 * @param string $to     Last day asked for, YYYY-MM-DD.
	 * @return array `{ from, to, days: [ { date, posts } ] }`, days oldest first.
	 */
	private static function posting_calendar( array $streak, string $from, string $to ): array {
		$counts = array();
		$posts  = 0;
		foreach ( is_array( $streak['data'] ?? null ) ? $streak['data'] : array() as $timestamp => $count ) {
			$day            = wp_date( 'Y-m-d', (int) $timestamp );
			$counts[ $day ] = ( $counts[ $day ] ?? 0 ) + (int) $count;
			$posts         += (int) $count;
		}
		ksort( $counts );
		// At the cap WPCOM drops the oldest posts, so the calendar starts at the oldest day it returned.
		if ( $posts >= self::STREAK_MAX_POSTS ) {
			$from = (string) array_key_first( $counts );
		}

		$days = array();
		foreach ( $counts as $date => $count ) {
			$days[] = array(
				'date'  => (string) $date,
				'posts' => $count,
			);
		}
		return array(
			'from' => $from,
			'to'   => $to,
			'days' => $days,
		);
	}

	/**
	 * Find the current and longest posting streaks among the calendar's days.
	 *
	 * The current run counts only while it reaches today or yesterday.
	 *
	 * @param array  $days  The calendar's `{ date, posts }` days, oldest first.
	 * @param string $today The site's today, YYYY-MM-DD.
	 * @return array `{ current_length, longest_length, longest_start, longest_end }`.
	 */
	private static function streak_summary( array $days, string $today ): array {
		$longest = array(
			'longest_length' => 0,
			'longest_start'  => '',
			'longest_end'    => '',
		);
		$run     = 0;
		$start   = '';
		$last    = '';
		foreach ( $days as $day ) {
			$date = $day['date'];
			$run  = '' !== $last && gmdate( 'Y-m-d', strtotime( $last . ' +1 day' ) ) === $date ? $run + 1 : 1;
			if ( 1 === $run ) {
				$start = $date;
			}
			if ( $run > $longest['longest_length'] ) {
				$longest = array(
					'longest_length' => $run,
					'longest_start'  => $start,
					'longest_end'    => $date,
				);
			}
			$last = $date;
		}
		$ongoing = '' !== $last && $last >= gmdate( 'Y-m-d', strtotime( $today . ' -1 day' ) );

		return array( 'current_length' => $ongoing ? $run : 0 ) + $longest;
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
	 * @param string $period One of self::SERIES_PERIODS.
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
			'day'     => '-1 day',
			'week'    => '-7 days',
			'month'   => '-1 month',
			'quarter' => '-3 months',
			'year'    => '-1 year',
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
	 * Input schema for `compare`.
	 *
	 * @return array
	 */
	private static function compare_schema(): array {
		return array(
			'type'        => 'string',
			'description' => __( 'Also return the same figures for an earlier window, as the Stats dashboard\'s Compare menu does: the window just before, the window just before shifted by whole weeks so weekdays line up, the same dates a year earlier, or 52 weeks earlier so weekdays line up.', 'jetpack-stats-pkg' ),
			'enum'        => self::COMPARE_PRESETS,
		);
	}

	/**
	 * Resolve the `compare` input.
	 *
	 * @param mixed $raw Raw input value.
	 * @return string|null|WP_Error A preset, null when none was asked for, or jetpack_stats_invalid_compare.
	 */
	private static function pick_compare( $raw ) {
		if ( null === $raw || '' === $raw ) {
			return null;
		}
		if ( is_string( $raw ) && in_array( $raw, self::COMPARE_PRESETS, true ) ) {
			return $raw;
		}
		return new WP_Error(
			self::ERROR_PREFIX . 'invalid_compare',
			sprintf(
				/* translators: %s: comma-separated list of valid compare values. */
				__( 'Unknown `compare` preset. Valid values: %s.', 'jetpack-stats-pkg' ),
				implode( ', ', self::COMPARE_PRESETS )
			)
		);
	}

	/**
	 * End date of the window a preset compares with, for `num` periods ending with the one containing `date`.
	 *
	 * The shifts are the dashboard's: the previous period steps back by the window's length, a weekday
	 * match rounds that up to whole weeks, the previous year keeps the calendar date and a weekday-matched
	 * year steps back 52 weeks. Weeks, months, quarters and years step back whole periods. WordPress.com ends the
	 * last row on `date`, so shifting `date` itself ends both last rows at the same point in their period.
	 * Weeks already line up by weekday; months and years cannot.
	 *
	 * @param string $date   YYYY-MM-DD.
	 * @param string $preset One of self::COMPARE_PRESETS.
	 * @param string $period One of self::SERIES_PERIODS.
	 * @param int    $num    Number of periods in the window.
	 * @return string|WP_Error YYYY-MM-DD, or jetpack_stats_invalid_compare for a weekday match on months, quarters or years.
	 */
	private static function compare_end_date( string $date, string $preset, string $period, int $num ) {
		$day       = \DateTimeImmutable::createFromFormat( '!Y-m-d', $date, new \DateTimeZone( 'UTC' ) );
		$by_week   = in_array( $preset, array( 'previous-period-match-day-of-week', 'previous-year-match-day-of-week' ), true );
		$prev_year = in_array( $preset, array( 'previous-year', 'previous-year-match-day-of-week' ), true );

		if ( $by_week && in_array( $period, array( 'month', 'quarter', 'year' ), true ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'invalid_compare',
				__( 'Months, quarters and years cannot line up by weekday. Use previous-period or previous-year.', 'jetpack-stats-pkg' )
			);
		}

		switch ( $period ) {
			case 'day':
				if ( 'previous-year' === $preset ) {
					return self::months_earlier( $day, 12 )->format( 'Y-m-d' );
				}
				$days = $prev_year ? 364 : ( $by_week ? (int) ceil( $num / 7 ) * 7 : $num );
				return $day->modify( "-{$days} days" )->format( 'Y-m-d' );
			case 'week':
				return $day->modify( '-' . ( $prev_year ? 52 : $num ) . ' weeks' )->format( 'Y-m-d' );
		}

		$length = array(
			'month'   => 1,
			'quarter' => 3,
			'year'    => 12,
		)[ $period ];
		$months = $prev_year ? 12 : $length * $num;
		return self::months_earlier( $day, $months )->format( 'Y-m-d' );
	}

	/**
	 * The same day some months earlier, clamped to that month's length; a month's last day stays its last.
	 *
	 * @param \DateTimeImmutable $day    Day.
	 * @param int                $months Months to step back.
	 * @return \DateTimeImmutable
	 */
	private static function months_earlier( \DateTimeImmutable $day, int $months ): \DateTimeImmutable {
		$first = $day->modify( 'first day of this month' )->modify( "-{$months} months" );
		$last  = (int) $first->format( 't' );
		$date  = (int) $day->format( 'j' ) === (int) $day->format( 't' ) ? $last : min( (int) $day->format( 'j' ), $last );
		return $first->setDate( (int) $first->format( 'Y' ), (int) $first->format( 'n' ), $date );
	}

	/**
	 * The windows the overview compares today, the last 7 days and the last 30 days with.
	 *
	 * @param string $today  YYYY-MM-DD.
	 * @param string $preset One of self::COMPARE_PRESETS.
	 * @return array<string, array{from: string, to: string, days: int}> Keyed `today`, `week`, `month`.
	 */
	private static function overview_compare_windows( string $today, string $preset ): array {
		$windows = array();
		foreach ( array(
			'today' => 1,
			'week'  => 7,
			'month' => 30,
		) as $name => $days ) {
			$to               = (string) self::compare_end_date( $today, $preset, 'day', $days );
			$windows[ $name ] = array(
				'from' => \DateTimeImmutable::createFromFormat( '!Y-m-d', $to, new \DateTimeZone( 'UTC' ) )->modify( '-' . ( $days - 1 ) . ' days' )->format( 'Y-m-d' ),
				'to'   => $to,
				'days' => $days,
			);
		}
		return $windows;
	}

	/**
	 * The overview's figures for the compared windows, read from one daily `stats/visits` response.
	 *
	 * @param string $preset  One of self::COMPARE_PRESETS.
	 * @param array  $windows From overview_compare_windows().
	 * @param array  $raw     Daily `stats/visits` response covering every window.
	 * @param bool   $failed  Whether that read failed.
	 * @return array
	 */
	private static function overview_comparison( string $preset, array $windows, array $raw, bool $failed ): array {
		$rows = $failed ? array() : self::normalize_visits_series( $raw, array( 'views', 'visitors' ) );
		$in   = array();
		foreach ( $windows as $name => $window ) {
			$in[ $name ] = array_filter(
				$rows,
				function ( $row ) use ( $window ) {
					return $row['date'] >= $window['from'] && $row['date'] <= $window['to'];
				}
			);
			// A window WordPress.com did not report every day of has no total.
			if ( count( $in[ $name ] ) !== $window['days'] ) {
				$in[ $name ] = array();
			}
		}

		return array(
			'preset'         => $preset,
			'views_today'    => self::sum_or_null( $in['today'], 'views' ),
			'visitors_today' => self::sum_or_null( $in['today'], 'visitors' ),
			'views_week'     => self::sum_or_null( $in['week'], 'views' ),
			'views_month'    => self::sum_or_null( $in['month'], 'views' ),
			'windows'        => array_map(
				function ( $window ) {
					return array(
						'from' => $window['from'],
						'to'   => $window['to'],
					);
				},
				$windows
			),
		);
	}

	/**
	 * Whole days from one date to a later one.
	 *
	 * @param string $from YYYY-MM-DD.
	 * @param string $to   YYYY-MM-DD.
	 * @return int
	 */
	private static function days_between( string $from, string $to ): int {
		$utc = new \DateTimeZone( 'UTC' );
		return (int) \DateTimeImmutable::createFromFormat( '!Y-m-d', $from, $utc )->diff( \DateTimeImmutable::createFromFormat( '!Y-m-d', $to, $utc ) )->days;
	}

	/**
	 * First day of the period containing a date; weeks start on Monday, as in WordPress.com Stats.
	 *
	 * @param string $date   YYYY-MM-DD.
	 * @param string $period One of self::SERIES_PERIODS.
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
			case 'quarter':
				return $day->setDate( (int) $day->format( 'Y' ), 3 * intdiv( (int) $day->format( 'n' ) - 1, 3 ) + 1, 1 );
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
				'date' => self::period_start_date( (string) ( $row[ $date_idx ] ?? '' ) ),
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
	 * Turn a `stats/visits` period label into the first day of its period.
	 *
	 * Weeks come labelled with their Monday as `2026W10W19`; every other period already is a YYYY-MM-DD date.
	 *
	 * @param string $label Period label from WordPress.com.
	 * @return string
	 */
	private static function period_start_date( string $label ): string {
		return (string) preg_replace( '/^(\d{4})W(\d{2})W(\d{2})$/', '$1-$2-$3', $label );
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
	 * Output schema for a visits `series`: one row per period, carrying every name in `fields`.
	 *
	 * @param bool $nullable Whether the series is null when WordPress.com could not be read.
	 * @return array
	 */
	private static function visits_series_schema( bool $nullable = false ): array {
		return array(
			'type'  => $nullable ? array( 'array', 'null' ) : 'array',
			'items' => array(
				'type'                 => 'object',
				'properties'           => array(
					'date' => array( 'type' => 'string' ),
				),
				'additionalProperties' => array( 'type' => array( 'integer', 'null' ) ),
			),
		);
	}

	/**
	 * Output schema for `errors`: the names of the WordPress.com sub-calls that failed.
	 *
	 * @return array
	 */
	private static function errors_schema(): array {
		return array(
			'type'  => 'array',
			'items' => array( 'type' => 'string' ),
		);
	}

	/**
	 * Plain-language meaning of each metric and time window the readers return, keyed by term.
	 *
	 * The readers' numbers differ in window (a day, a rolling week, all time) and in what they count,
	 * and agents misread them without this: a 7-day rolling total reported as "this week", or daily
	 * visitors added up as if they were unique people.
	 *
	 * @return array<string, string>
	 */
	private static function definition_texts(): array {
		return array(
			'views'                 => __( 'A view is one load of a page on the site in a browser that runs the Stats script. Feeds, previews, embeds and API reads are not views; logged-in visits count only for the roles chosen in the Stats settings; bots that run JavaScript can be counted.', 'jetpack-stats-pkg' ),
			'visitors'              => __( 'Visitors are the unique browsers seen in one row\'s period. Each row counts its own uniques, so adding rows together overcounts people who came back; there is no unique total across rows.', 'jetpack-stats-pkg' ),
			'likes'                 => __( 'Likes given to the site\'s posts during the row\'s period.', 'jetpack-stats-pkg' ),
			'comments'              => __( 'Comments posted on the site during the row\'s period.', 'jetpack-stats-pkg' ),
			'series'                => __( 'One row per period (day, week from Monday to Sunday, month, quarter from January, April, July or October, or year) in the site\'s timezone, oldest first. A row\'s `date` is the first day of its period; the last row is the period containing the requested `date`, so it may be incomplete.', 'jetpack-stats-pkg' ),
			'date'                  => __( 'Today in the site\'s timezone.', 'jetpack-stats-pkg' ),
			'views_today'           => __( 'Views so far today, in the site\'s timezone.', 'jetpack-stats-pkg' ),
			'visitors_today'        => __( 'Unique visitors so far today, in the site\'s timezone.', 'jetpack-stats-pkg' ),
			'views_week'            => __( 'Views over the last 7 days, today included: a rolling total, not the calendar week.', 'jetpack-stats-pkg' ),
			'views_month'           => __( 'Views over the last 30 days, today included: a rolling total, not the calendar month.', 'jetpack-stats-pkg' ),
			'streak'                => __( 'Consecutive days with at least one published post, in the site\'s timezone. The current streak is 0 unless it reaches today or yesterday; the longest is the longest within the last year.', 'jetpack-stats-pkg' ),
			'calendar'              => __( 'Days from `from` to `to` (the last year, today included, in the site\'s timezone) on which the site published posts, with how many; a day missing from `days` had none. Counts published posts only, not pages.', 'jetpack-stats-pkg' ),
			'top_post'              => __( 'The post or page with the most views today, not counting the home page.', 'jetpack-stats-pkg' ),
			'top_referrer'          => __( 'The referrer that sent the most views today.', 'jetpack-stats-pkg' ),
			'total_views'           => __( 'All-time views of the post since it was published, not limited to the series window.', 'jetpack-stats-pkg' ),
			'window_top_content'    => __( 'Item values are totals across the `num` periods ending with the one containing `date`, in the site\'s timezone. The current period may be incomplete.', 'jetpack-stats-pkg' ),
			'window_tags'           => __( 'Tags and categories cover the seven days ending yesterday, whatever `period`, `date` and `num` say.', 'jetpack-stats-pkg' ),
			'value_posts'           => __( 'An item\'s `value` is the views of that post or page; the home page and archives share one item.', 'jetpack-stats-pkg' ),
			'value_referrers'       => __( 'An item\'s `value` is the views that arrived from that referrer.', 'jetpack-stats-pkg' ),
			'value_search-terms'    => __( 'An item\'s `value` is the views from searches for that term. Search engines hide most terms, so this list is a small sample.', 'jetpack-stats-pkg' ),
			'value_clicks'          => __( 'An item\'s `value` is the clicks on links leading off the site to that destination.', 'jetpack-stats-pkg' ),
			'children_referrers'    => __( 'An item\'s `children` are the pages, apps or search engines within that referrer that sent the views, each with its own `value`; a child can group further rows. Each item lists at most `max` children, its top ones, so they can add up to less than the item.', 'jetpack-stats-pkg' ),
			'children_clicks'       => __( 'An item\'s `children` are the links under that domain that were clicked, each with its own `value`. Each item lists at most `max` children, its top ones, so they can add up to less than the item.', 'jetpack-stats-pkg' ),
			'children_tags'         => __( 'An item\'s `children` are the tags and categories it groups. Posts filed under all of them share the item\'s `value`, so a child has none of its own.', 'jetpack-stats-pkg' ),
			'value_tags'            => __( 'An item\'s `value` is the views of posts filed under those tags and categories.', 'jetpack-stats-pkg' ),
			'value_authors'         => __( 'An item\'s `value` is the views of that author\'s posts and pages.', 'jetpack-stats-pkg' ),
			'value_countries'       => __( 'An item\'s `value` is the views from visitors in that country.', 'jetpack-stats-pkg' ),
			'value_regions'         => __( 'An item\'s `value` is the views from visitors in that region; `country` is the region\'s country.', 'jetpack-stats-pkg' ),
			'value_cities'          => __( 'An item\'s `value` is the views from visitors in that city; `country` is the city\'s country. Cities that share a name within a country share one item.', 'jetpack-stats-pkg' ),
			'value_browsers'        => __( 'An item\'s `value` is the views from that browser.', 'jetpack-stats-pkg' ),
			'value_platforms'       => __( 'An item\'s `value` is the views from that operating system.', 'jetpack-stats-pkg' ),
			'value_screen-sizes'    => __( 'An item\'s `value` is the percent of views from screens of that size, rounded to a whole number: a share, not a count.', 'jetpack-stats-pkg' ),
			'value_utm'             => __( 'An item\'s `value` is the views of pages opened from a link tagged with those UTM values, listed in the order `utm_param` names them.', 'jetpack-stats-pkg' ),
			'value_commenters'      => __( 'An item\'s `value` is every approved comment that person has left on the site. WordPress.com picks the people from the latest 2,000 comments, so a long-quiet commenter can be missing.', 'jetpack-stats-pkg' ),
			'value_commented-posts' => __( 'An item\'s `value` is the approved comments on that post. WordPress.com ranks the latest 1,000 published posts.', 'jetpack-stats-pkg' ),
			'window_comments'       => __( 'Comment counts cover the site\'s whole history, whatever `period`, `date` and `num` say.', 'jetpack-stats-pkg' ),
			'children_utm'          => __( 'An item\'s `children` are the posts and pages opened from links tagged with those UTM values, each with its own `value` of views and, for a post, its `id`. Each item lists at most `max` children, its top ones, so they can add up to less than the item.', 'jetpack-stats-pkg' ),
			'children_authors'      => __( 'An item\'s `children` are the author\'s posts and pages that had views, each with its own `value`. Each item lists at most `max` children, its top ones, so they can add up to less than the item.', 'jetpack-stats-pkg' ),
			'value_downloads'       => __( 'An item\'s `value` is the downloads of that file.', 'jetpack-stats-pkg' ),
			'value_video-plays'     => __( 'An item\'s `value` is the plays of that video.', 'jetpack-stats-pkg' ),
			'total'                 => __( 'The sum of `email`, `wpcom`, `comment` and every `publicize` count. One person following in several ways is counted once for each, and the total is null when any count is unknown.', 'jetpack-stats-pkg' ),
			'email'                 => __( 'People subscribed to the site by email, now.', 'jetpack-stats-pkg' ),
			'wpcom'                 => __( 'WordPress.com users following the site in the Reader, now.', 'jetpack-stats-pkg' ),
			'comment'               => __( 'People following the comments on every post, now. Following one post\'s comments is not counted.', 'jetpack-stats-pkg' ),
			'publicize'             => __( 'Followers of each connected social media account, now.', 'jetpack-stats-pkg' ),
			'author_views'          => __( 'The author\'s `views` are views of every post and page they wrote, in any status; `likes` and `comments` are those their content received in the same window, not all time.', 'jetpack-stats-pkg' ),
			'all_time'              => __( 'Totals since the site started counting Stats: views, unique visitors summed day by day, published posts, approved comments and social shares. `best_day` is the day with the most views ever.', 'jetpack-stats-pkg' ),
			'busiest'               => __( 'The hour of the day (in the site\'s timezone) with the most views over the last 60 days, and the weekday with the most over the last 10 weeks, each with its percent of the views in that span.', 'jetpack-stats-pkg' ),
			'recent'                => __( 'The last 7 and 30 days end yesterday, so today is not included; each `previous_` window is the same number of days just before. Visitors are unique within each window.', 'jetpack-stats-pkg' ),
			'years'                 => __( 'Each year\'s published posts, the words in them, and the likes and comments those posts have received since.', 'jetpack-stats-pkg' ),
			'plan_usage'            => __( 'Views counted toward the site\'s Stats plan from `period_start` up to `period_end`, when the count resets. `views_limit` is null when the plan has no limit.', 'jetpack-stats-pkg' ),
			'sent'                  => __( '`sent` is how many subscribers the post was emailed to.', 'jetpack-stats-pkg' ),
			'opens'                 => __( '`opens` counts every time the email was opened, including repeat opens by one person; `unique_opens` counts people. Mail apps that load images automatically or block them make opens approximate.', 'jetpack-stats-pkg' ),
			'clicks'                => __( '`clicks` counts every click on a link in the email; `unique_clicks` counts people.', 'jetpack-stats-pkg' ),
			'email_rates'           => __( '`open_rate` and `click_rate` are unique opens and unique clicks as a percent of `sent`, over all time.', 'jetpack-stats-pkg' ),
			'email_window'          => __( '`opens` and `clicks` count only the days from `start_date` to `end_date`; unique counts and rates are all-time.', 'jetpack-stats-pkg' ),
			'email_all_time'        => __( 'Every figure covers all time since the post was sent.', 'jetpack-stats-pkg' ),
			'video_plays'           => __( '`plays` counts each time the video was started, wherever it was played: on the site or embedded elsewhere. `total_plays` adds up the `series` rows.', 'jetpack-stats-pkg' ),
			'post_detail'           => __( '`views`, `likes` and `comments` cover all time since the post was published; `comments` counts approved comments only. `utm` counts views of the post opened from links tagged with those UTM values, over all time. `email` covers all time since the post was sent: `total` counts every open or click, repeat ones by one person included, `unique` counts people, and `rate` is `unique` as a percent of `sent`; mail apps that load images automatically or block them make opens approximate.', 'jetpack-stats-pkg' ),
			'email_detail'          => __( 'Every figure covers all time since the post was sent. `total` counts every open or click, repeat ones by one person included, and `unique` counts people; `rate` is `unique` as a percent of `sent`. Mail apps that load images automatically or block them make opens approximate. `by_client` is the mail app, `by_device` the operating system and `by_country` where the email was opened or clicked; each row counts opens or clicks, not people.', 'jetpack-stats-pkg' ),
			'paid'                  => __( 'People with a paid subscription to the site, now. They are also counted in `email` or `wpcom`.', 'jetpack-stats-pkg' ),
			'subscriber_series'     => __( 'One row per period, oldest first: `subscribers` is the count at the end of the period and `change` the net gain or loss during it.', 'jetpack-stats-pkg' ),
			'comparison_series'     => __( 'The same figures for the window `compare` names, ending on `comparison.date`: row i of `comparison.series` is the earlier period matching row i of `series`. Weeks, months and years shift by whole periods, so a previous year of weeks is 52 weeks earlier, and both last rows end at the same point in their period.', 'jetpack-stats-pkg' ),
			'comparison_overview'   => __( 'The same figures for the windows `compare` names, listed in `comparison.windows`: today, the 7 days and the 30 days, each shifted back. The current figures include today so far while the compared windows are whole days, so early in the day today trails its comparison. A figure is null when WordPress.com did not report every day of its window.', 'jetpack-stats-pkg' ),
		);
	}

	/**
	 * The definitions block for a response.
	 *
	 * @param string[] $terms Terms the response uses, in order.
	 * @return array<string, string>
	 */
	private static function definitions( array $terms ): array {
		return array_intersect_key( self::definition_texts(), array_flip( $terms ) );
	}

	/**
	 * The definitions block for get-top-content: what an item's `value` counts for this type, and the window it covers.
	 *
	 * @param string $type   Content type enum.
	 * @param bool   $expand Whether the items carry `children`.
	 * @return array<string, string>
	 */
	private static function top_content_definitions( string $type, bool $expand = false ): array {
		$texts  = self::definition_texts();
		$window = 'window_top_content';
		if ( 'tags' === $type ) {
			$window = 'window_tags';
		} elseif ( in_array( $type, self::UNDATED_TYPES, true ) ) {
			$window = 'window_comments';
		}
		$out = array(
			'value' => $texts[ 'value_' . $type ],
			'items' => $texts[ $window ],
		);
		if ( $expand && isset( $texts[ 'children_' . $type ] ) ) {
			$out['children'] = $texts[ 'children_' . $type ];
		}
		// Clicks, comments, downloads and plays are not views.
		if ( ! in_array( $type, array( 'clicks', 'commenters', 'commented-posts', 'downloads', 'video-plays' ), true ) ) {
			$out['views'] = $texts['views'];
		}
		return $out;
	}

	/**
	 * Output schema for `definitions`.
	 *
	 * @return array
	 */
	private static function definitions_schema(): array {
		return array(
			'type'                 => 'object',
			'additionalProperties' => array( 'type' => 'string' ),
		);
	}

	/**
	 * Input schema for `period`.
	 *
	 * @param array $periods The periods the ability accepts.
	 * @return array
	 */
	private static function period_schema( array $periods = self::PERIODS ): array {
		return array(
			'type'        => 'string',
			'description' => __( 'Aggregation period.', 'jetpack-stats-pkg' ),
			'enum'        => $periods,
			'default'     => 'day',
		);
	}

	/**
	 * Input schema for `date`.
	 *
	 * @return array
	 */
	private static function date_schema(): array {
		return array(
			'type'        => 'string',
			'description' => __( 'End date (YYYY-MM-DD). Defaults to today.', 'jetpack-stats-pkg' ),
			'pattern'     => '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
		);
	}

	/**
	 * The `meta` of a read-only ability, public over MCP.
	 *
	 * @return array
	 */
	private static function reader_meta(): array {
		return array(
			'annotations'  => array(
				'readonly'    => true,
				'destructive' => false,
				'idempotent'  => true,
			),
			'public'       => true,
			'show_in_rest' => true,
			'mcp'          => array(
				'public' => true,
				'type'   => 'tool',
			),
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
