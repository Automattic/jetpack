<?php
/**
 * Jetpack Search Abilities Registration.
 *
 * Registers Jetpack Search abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-search
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Search\Abilities;

use Automattic\Jetpack\Search\AI_Answers;
use Automattic\Jetpack\Search\Classic_Search;
use Automattic\Jetpack\Search\Module_Control;
use Automattic\Jetpack\Search\Options;
use Automattic\Jetpack\Search\Plan;
use Automattic\Jetpack\Search\Stats;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;

/**
 * Registers Jetpack Search abilities with the WordPress Abilities API.
 *
 * Exposes a small read-only surface that lets agents answer "what is my
 * Search configuration / usage / plan?" and run an actual site search through
 * the standard `wp-abilities/v1` REST surface. Writes (re-index, settings
 * updates) are intentionally deferred — this batch ships reads only.
 *
 * Registration is gated by {@see Registrar::init()} behind the
 * `jetpack_wp_abilities_enabled` filter and is wired up from the Jetpack
 * plugin's Search module file, so it only loads when the Jetpack Search
 * module is active. Other consumers of the package do not pick these up yet.
 */
class Search_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-search';
	const ERROR_PREFIX  = 'jetpack_search_';

	/**
	 * Whitelisted Customberg/Customizer setting keys exposed in get-settings
	 * under the `customizations` envelope.
	 *
	 * Mirrors {@see \Automattic\Jetpack\Search\Settings::settings_register()} —
	 * the writable surface for instant-search look-and-feel. Bool/string types
	 * are inferred at runtime from the registered option, not duplicated here.
	 */
	const CUSTOMIZATION_KEYS = array(
		'color_theme',
		'result_format',
		'default_sort',
		'overlay_trigger',
		'excluded_post_types',
		'highlight_color',
		'enable_sort',
		'inf_scroll',
		'filtering_opens_overlay',
		'show_post_date',
		'show_product_price',
		'show_powered_by',
	);

	/**
	 * Upper bound for the search-site `per_page` parameter.
	 */
	const MAX_PER_PAGE = 50;

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
			'label'       => 'Jetpack Search',
			'description' => __( 'Abilities for reading Jetpack Search configuration, usage and plan info, and running a site search.', 'jetpack-search-pkg' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-search/get-settings' => self::spec_get_settings(),
			'jetpack-search/get-stats'    => self::spec_get_stats(),
			'jetpack-search/search-site'  => self::spec_search_site(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-search/get-settings.
	 */
	private static function spec_get_settings(): array {
		return array(
			'label'               => __( 'Get Jetpack Search settings', 'jetpack-search-pkg' ),
			'description'         => __(
				'Return the current Jetpack Search configuration as a single snapshot. Shape: { module_active: bool, instant_search_enabled: bool, supported_post_types: [string], customizations: { color_theme, result_format, default_sort, overlay_trigger, excluded_post_types: [string], highlight_color, enable_sort, inf_scroll, filtering_opens_overlay, show_post_date, show_product_price, show_powered_by }, ai_answers_enabled: bool }. `supported_post_types` lists the post types that participate in search (public, not excluded from search, and not in the excluded_post_types deny-list). Read-only and idempotent; writes are not exposed in this batch. Pair with jetpack-search/get-stats to learn the plan tier, supported features and request usage, and jetpack-search/search-site to run an actual search.',
				'jetpack-search-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'module_active'          => array( 'type' => 'boolean' ),
					'instant_search_enabled' => array( 'type' => 'boolean' ),
					'supported_post_types'   => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
					'customizations'         => array( 'type' => 'object' ),
					'ai_answers_enabled'     => array( 'type' => 'boolean' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_settings' ),
			'permission_callback' => array( __CLASS__, 'can_manage_search' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool',
				),
			),
		);
	}

	/**
	 * Spec: jetpack-search/get-stats.
	 *
	 * Consolidates request usage for the current billing period together with
	 * the plan tier and feature flags. (Replaces the previously separate
	 * get-stats + get-plan-info abilities.)
	 */
	private static function spec_get_stats(): array {
		return array(
			'label'               => __( 'Get Jetpack Search usage and plan', 'jetpack-search-pkg' ),
			'description'         => __(
				'Return Jetpack Search request usage for the current billing period together with the plan tier and the features the current plan supports. Shape: { requests_this_period: int, period_start: string, period_end: string, plan_records_included: int, plan_overage: bool, overage_count: int, tier: string, plan_slug: string, supports_instant_search: bool, supports_ai_answers: bool, billing_period: string }. Usage is sourced from WordPress.com — precondition: the site must be connected to WordPress.com and have a Search plan; returns `jetpack_search_data_unavailable` when the remote call fails. `tier` is the cached pricing tier (a WPCOM tier slug, or empty string when no tier is set). `billing_period` is one of `monthly`, `yearly`, or empty when unknown. Read-only and safe to poll; usage is not cached locally so each call hits WPCOM, while the plan portion reads the locally cached plan record.',
				'jetpack-search-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'requests_this_period'    => array( 'type' => 'integer' ),
					'period_start'            => array( 'type' => 'string' ),
					'period_end'              => array( 'type' => 'string' ),
					'plan_records_included'   => array( 'type' => 'integer' ),
					'plan_overage'            => array( 'type' => 'boolean' ),
					'overage_count'           => array( 'type' => 'integer' ),
					'tier'                    => array( 'type' => 'string' ),
					'plan_slug'               => array( 'type' => 'string' ),
					'supports_instant_search' => array( 'type' => 'boolean' ),
					'supports_ai_answers'     => array( 'type' => 'boolean' ),
					'billing_period'          => array( 'type' => 'string' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_stats' ),
			'permission_callback' => array( __CLASS__, 'can_manage_search' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool',
				),
			),
		);
	}

	/**
	 * Spec: jetpack-search/search-site.
	 *
	 * Runs an actual search against the site's Jetpack Search index by
	 * delegating to {@see Classic_Search::search()}, the same WordPress.com
	 * Elasticsearch path the Search module uses for front-end queries.
	 */
	private static function spec_search_site(): array {
		return array(
			'label'               => __( 'Search the site with Jetpack Search', 'jetpack-search-pkg' ),
			'description'         => __(
				'Run a search against the site using Jetpack Search (the WordPress.com Elasticsearch index). Input: { query: string (required, the search phrase), per_page?: int 1-50 (default 10), page?: int >= 1 (default 1), post_types?: [string] (optional, restrict to these post type slugs) }. Output: { total: int (total matching results), results: [ { id: int, title: string, url: string, type: string, date: string } ] }. Precondition: the site must be connected to WordPress.com and have an active Jetpack Search plan; returns `jetpack_search_unavailable` when the search request fails. Read-only and idempotent.',
				'jetpack-search-pkg'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'query' ),
				'properties'           => array(
					'query'      => array(
						'type'        => 'string',
						'minLength'   => 1,
						'description' => __( 'The search phrase.', 'jetpack-search-pkg' ),
					),
					'per_page'   => array(
						'type'        => 'integer',
						'minimum'     => 1,
						'maximum'     => self::MAX_PER_PAGE,
						'default'     => 10,
						'description' => __( 'Number of results to return per page (1-50).', 'jetpack-search-pkg' ),
					),
					'page'       => array(
						'type'        => 'integer',
						'minimum'     => 1,
						'default'     => 1,
						'description' => __( 'Page of results to return, 1-based.', 'jetpack-search-pkg' ),
					),
					'post_types' => array(
						'type'        => 'array',
						'items'       => array( 'type' => 'string' ),
						'description' => __( 'Restrict the search to these post type slugs.', 'jetpack-search-pkg' ),
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'total'   => array( 'type' => 'integer' ),
					'results' => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'id'    => array( 'type' => 'integer' ),
								'title' => array( 'type' => 'string' ),
								'url'   => array( 'type' => 'string' ),
								'type'  => array( 'type' => 'string' ),
								'date'  => array( 'type' => 'string' ),
							),
						),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'search_site' ),
			'permission_callback' => array( __CLASS__, 'can_search_site' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool',
				),
			),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Permission: matches REST_Controller::require_admin_privilege_callback().
	 *
	 * The Search admin REST routes (`/search/settings`, `/search/stats`,
	 * `/search/plan`) gate on `manage_options`. Keep the config/usage
	 * abilities aligned with the controller so an agent that can call one
	 * surface can call the other.
	 *
	 * @return bool
	 */
	public static function can_manage_search(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Permission: matches the `/jetpack/v4/search` REST route.
	 *
	 * The site-search REST endpoint
	 * ({@see \Automattic\Jetpack\Search\REST_Controller::get_search_results()})
	 * is registered with an `is_user_logged_in` permission callback. Mirror it
	 * so the ability is reachable by exactly the same callers as the route it
	 * backs.
	 *
	 * @return bool
	 */
	public static function can_search_site(): bool {
		return is_user_logged_in();
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: get-settings.
	 *
	 * Mirrors {@see \Automattic\Jetpack\Search\REST_Controller::get_settings()}
	 * but reshapes the response: instead of returning the raw legacy field set
	 * (with `experience`/`swap_classic_to_inline_search`), we return the high-
	 * signal fields an agent actually consumes — module + instant-search state,
	 * the post types participating in search, the customization knobs, and the
	 * AI Answers flag.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_settings( $input = null ) {
		unset( $input );

		$module_control = self::get_module_control();

		return array(
			'module_active'          => (bool) $module_control->is_active(),
			'instant_search_enabled' => (bool) $module_control->is_instant_search_enabled(),
			'supported_post_types'   => self::get_supported_post_types(),
			'customizations'         => self::get_customizations(),
			'ai_answers_enabled'     => (bool) AI_Answers::is_enabled(),
		);
	}

	/**
	 * Execute: get-stats.
	 *
	 * Pulls the latest-month request usage from `/jetpack-search/stats` (via
	 * {@see Stats::get_stats_from_wpcom()}) and merges the plan tier / feature
	 * flags from the cached plan info ({@see Plan::get_plan_info()}). The
	 * dashboard's `state.sitePlan.plan_usage` shape is the canonical
	 * reference: `num_requests_3m` is an array of
	 * `{ num_requests, start_date, end_date }` objects (current period first);
	 * `must_upgrade` flips when overage hits; `num_records` is the indexed
	 * record count.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array|WP_Error
	 */
	public static function get_stats( $input = null ) {
		unset( $input );

		$response = self::get_stats_client()->get_stats_from_wpcom();
		$body     = self::decode_remote_response( $response );
		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$plan_usage = isset( $body['plan_usage'] ) && is_array( $body['plan_usage'] ) ? $body['plan_usage'] : array();

		// `num_requests_3m` is the canonical shape; fall back to flat fields if
		// a future-proof variant emerges from WPCOM.
		$latest = array();
		if ( isset( $plan_usage['num_requests_3m'][0] ) && is_array( $plan_usage['num_requests_3m'][0] ) ) {
			$latest = $plan_usage['num_requests_3m'][0];
		}

		$plan_info       = self::get_plan_client()->get_plan_info();
		$plan_info_array = is_array( $plan_info ) ? $plan_info : array();
		$subscription    = isset( $plan_info_array['effective_subscription'] ) && is_array( $plan_info_array['effective_subscription'] )
			? $plan_info_array['effective_subscription']
			: array();

		return array(
			'requests_this_period'    => self::pick_int( array( $latest, $plan_usage ), array( 'num_requests' ) ),
			'period_start'            => self::pick_string( array( $latest, $plan_usage ), array( 'start_date', 'period_start' ) ),
			'period_end'              => self::pick_string( array( $latest, $plan_usage ), array( 'end_date', 'period_end' ) ),
			'plan_records_included'   => self::pick_int(
				array( $plan_info_array, $body, $plan_usage ),
				array( 'record_limit', 'plan_records_included', 'monthly_search_request_limit' )
			),
			'plan_overage'            => ! empty( $plan_usage['must_upgrade'] ),
			'overage_count'           => self::pick_int( array( $plan_usage ), array( 'overage_records', 'months_over_plan_records_limit' ) ),
			'tier'                    => isset( $plan_info_array['tier'] ) && is_string( $plan_info_array['tier'] ) ? $plan_info_array['tier'] : '',
			'plan_slug'               => isset( $subscription['product_slug'] ) ? (string) $subscription['product_slug'] : '',
			'supports_instant_search' => ! empty( $plan_info_array['supports_instant_search'] ),
			'supports_ai_answers'     => ! empty( $plan_info_array['supports_ai_answers'] ) || (bool) AI_Answers::is_enabled(),
			'billing_period'          => self::normalize_billing_period( $plan_info_array, $subscription ),
		);
	}

	/**
	 * Execute: search-site.
	 *
	 * Delegates to {@see Classic_Search::search()} — the same WordPress.com
	 * Elasticsearch path the Search module uses for front-end queries — and
	 * reshapes the raw API response into a compact result list. We do not
	 * reimplement search; we only build the Elasticsearch args and project the
	 * hits.
	 *
	 * @param array|null $input Ability input. Validated against input_schema.
	 * @return array|WP_Error
	 */
	public static function search_site( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$query = isset( $input['query'] ) ? (string) $input['query'] : '';
		if ( '' === trim( $query ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'invalid_query',
				__( 'A non-empty `query` is required.', 'jetpack-search-pkg' )
			);
		}

		$per_page = isset( $input['per_page'] ) ? (int) $input['per_page'] : 10;
		$per_page = max( 1, min( self::MAX_PER_PAGE, $per_page ) );

		$page = isset( $input['page'] ) ? (int) $input['page'] : 1;
		$page = max( 1, $page );

		$es_args = array(
			'query' => $query,
			'size'  => $per_page,
			'from'  => ( $page - 1 ) * $per_page,
		);

		if ( ! empty( $input['post_types'] ) && is_array( $input['post_types'] ) ) {
			$post_types = array_values( array_filter( array_map( 'sanitize_key', $input['post_types'] ) ) );
			if ( ! empty( $post_types ) ) {
				$es_args['filter'] = array(
					'terms' => array( 'post_type' => $post_types ),
				);
			}
		}

		$response = self::get_search_client()->search( $es_args );

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'unavailable',
				__( 'The search request could not be completed. Confirm the site is connected to WordPress.com and has an active Jetpack Search plan, then try again.', 'jetpack-search-pkg' )
			);
		}

		// Classic_Search::search() json-decodes the API body as an associative
		// array, though its docblock advertises the looser object|WP_Error.
		// Normalise defensively so the projection below is array-safe.
		$response = (array) $response;

		$results = isset( $response['results'] ) && is_array( $response['results'] ) ? $response['results'] : array();
		$hits    = isset( $results['hits'] ) && is_array( $results['hits'] ) ? $results['hits'] : array();

		$total = 0;
		if ( isset( $results['total'] ) && is_numeric( $results['total'] ) ) {
			$total = (int) $results['total'];
		}

		return array(
			'total'   => $total,
			'results' => array_map( array( __CLASS__, 'shape_hit' ), $hits ),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Project a single Elasticsearch hit to the ability's result shape.
	 *
	 * Hits from the WordPress.com search API carry a `fields` envelope keyed
	 * by document field name (e.g. `post_id`, `title.default`, `permalink.url.raw`).
	 *
	 * @param mixed $hit Raw hit from `results.hits`.
	 * @return array
	 */
	private static function shape_hit( $hit ): array {
		$fields = is_array( $hit ) && isset( $hit['fields'] ) && is_array( $hit['fields'] ) ? $hit['fields'] : array();

		return array(
			'id'    => (int) self::first_scalar( $fields, array( 'post_id', 'blog_post_id' ) ),
			'title' => (string) self::first_scalar( $fields, array( 'title.default', 'title' ) ),
			'url'   => (string) self::first_scalar( $fields, array( 'permalink.url.raw', 'permalink.url', 'permalink' ) ),
			'type'  => (string) self::first_scalar( $fields, array( 'post_type' ) ),
			'date'  => (string) self::first_scalar( $fields, array( 'date', 'date_gmt' ) ),
		);
	}

	/**
	 * Return the first scalar value found across the given field keys.
	 *
	 * Search-API field values are frequently single-element arrays.
	 *
	 * @param array    $fields Hit `fields` map.
	 * @param string[] $keys   Ordered keys to try.
	 * @return mixed Scalar value or empty string.
	 */
	private static function first_scalar( array $fields, array $keys ) {
		foreach ( $keys as $key ) {
			if ( ! array_key_exists( $key, $fields ) ) {
				continue;
			}
			$value = $fields[ $key ];
			if ( is_array( $value ) ) {
				$value = reset( $value );
			}
			if ( is_scalar( $value ) ) {
				return $value;
			}
		}
		return '';
	}

	/**
	 * Resolve the configured supported (searchable) post types.
	 *
	 * Mirrors the logic in {@see \Automattic\Jetpack\Search\Helper::generate_initial_javascript_state()}:
	 * start with public post types that aren't `exclude_from_search`, then
	 * remove anything listed in the `excluded_post_types` option — unless that
	 * would yield an empty list (a no-op safeguard the JS state uses too).
	 *
	 * @return string[]
	 */
	private static function get_supported_post_types(): array {
		$post_types = array_values(
			get_post_types(
				array(
					'exclude_from_search' => false,
					'public'              => true,
				)
			)
		);

		$excluded_raw        = get_option( Options::OPTION_PREFIX . 'excluded_post_types', '' );
		$excluded_post_types = is_string( $excluded_raw ) && '' !== $excluded_raw
			? array_filter( array_map( 'trim', explode( ',', $excluded_raw ) ) )
			: array();

		if ( empty( $excluded_post_types ) ) {
			return $post_types;
		}

		$filtered = array_values( array_diff( $post_types, $excluded_post_types ) );
		// If the deny-list would empty the surface, ignore it — matches the JS state behavior.
		return empty( $filtered ) ? $post_types : $filtered;
	}

	/**
	 * Build the customization snapshot from registered Search options.
	 *
	 * Reads each whitelisted option directly. Booleans normalise to PHP bools
	 * (the stored shape is "1"/"0" / true/false depending on write path);
	 * strings stay as strings. `excluded_post_types` is split into an array
	 * for parity with `supported_post_types`.
	 *
	 * @return array<string, mixed>
	 */
	private static function get_customizations(): array {
		$prefix = Options::OPTION_PREFIX;
		$bools  = array(
			'enable_sort',
			'inf_scroll',
			'filtering_opens_overlay',
			'show_post_date',
			'show_product_price',
			'show_powered_by',
		);

		$out = array();
		foreach ( self::CUSTOMIZATION_KEYS as $key ) {
			$raw = get_option( $prefix . $key, null );

			if ( 'excluded_post_types' === $key ) {
				$out[ $key ] = is_string( $raw ) && '' !== $raw
					? array_values( array_filter( array_map( 'trim', explode( ',', $raw ) ) ) )
					: array();
				continue;
			}

			if ( in_array( $key, $bools, true ) ) {
				$out[ $key ] = self::coerce_bool( $raw );
				continue;
			}

			$out[ $key ] = null === $raw ? '' : (string) $raw;
		}

		return $out;
	}

	/**
	 * Normalise a Search option that may be stored as bool, "1"/"0", or "".
	 *
	 * @param mixed $value Raw option value.
	 * @return bool
	 */
	private static function coerce_bool( $value ): bool {
		if ( is_bool( $value ) ) {
			return $value;
		}
		if ( is_int( $value ) ) {
			return 0 !== $value;
		}
		if ( is_string( $value ) ) {
			return '1' === $value || 'true' === strtolower( $value );
		}
		return false;
	}

	/**
	 * Decode a Search WPCOM proxy response into an associative array, or
	 * surface a WP_Error with the `jetpack_search_data_unavailable` code.
	 *
	 * @param array|\WP_Error|null $response Raw response from
	 *                                       `wpcom_json_api_request_as_blog`.
	 * @return array|WP_Error
	 */
	private static function decode_remote_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'data_unavailable',
				__( 'Search data could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-search-pkg' )
			);
		}

		if ( ! is_array( $response ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'data_unavailable',
				__( 'Search data could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-search-pkg' )
			);
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code || ! is_array( $body ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'data_unavailable',
				__( 'Search data could not be fetched from WordPress.com. Confirm the site is connected and try again.', 'jetpack-search-pkg' )
			);
		}

		return $body;
	}

	/**
	 * Best-effort billing-period normalisation.
	 *
	 * Plan info from WPCOM exposes a `bill_period` (days, e.g. "365") on each
	 * subscription, plus a `default_upgrade_bill_period` ("yearly" / "monthly")
	 * at the top level. We prefer the explicit text field and fall back to
	 * matching the days against known terms.
	 *
	 * @param array $plan_info    Cached plan info.
	 * @param array $subscription `effective_subscription` from $plan_info.
	 * @return string `monthly`, `yearly`, or empty.
	 */
	private static function normalize_billing_period( array $plan_info, array $subscription ): string {
		if ( isset( $subscription['bill_period_label'] ) && is_string( $subscription['bill_period_label'] ) ) {
			$lower = strtolower( $subscription['bill_period_label'] );
			if ( in_array( $lower, array( 'monthly', 'yearly' ), true ) ) {
				return $lower;
			}
		}

		if ( isset( $subscription['bill_period'] ) && is_numeric( $subscription['bill_period'] ) ) {
			$days = (int) $subscription['bill_period'];
			if ( $days >= 28 && $days <= 31 ) {
				return 'monthly';
			}
			if ( $days >= 360 && $days <= 366 ) {
				return 'yearly';
			}
		}

		if ( isset( $plan_info['default_upgrade_bill_period'] ) && is_string( $plan_info['default_upgrade_bill_period'] ) ) {
			$lower = strtolower( $plan_info['default_upgrade_bill_period'] );
			if ( in_array( $lower, array( 'monthly', 'yearly' ), true ) ) {
				return $lower;
			}
		}

		return '';
	}

	/**
	 * Pick the first integer-coercible value across (source, key) combinations.
	 *
	 * @param array[]  $sources Ordered list of array sources.
	 * @param string[] $keys    Ordered list of keys to try on each source.
	 * @return int
	 */
	private static function pick_int( array $sources, array $keys ): int {
		foreach ( $sources as $source ) {
			if ( ! is_array( $source ) ) {
				continue;
			}
			foreach ( $keys as $key ) {
				if ( isset( $source[ $key ] ) && is_numeric( $source[ $key ] ) ) {
					return (int) $source[ $key ];
				}
			}
		}
		return 0;
	}

	/**
	 * Pick the first non-empty string across (source, key) combinations.
	 *
	 * @param array[]  $sources Ordered list of array sources.
	 * @param string[] $keys    Ordered list of keys to try on each source.
	 * @return string
	 */
	private static function pick_string( array $sources, array $keys ): string {
		foreach ( $sources as $source ) {
			if ( ! is_array( $source ) ) {
				continue;
			}
			foreach ( $keys as $key ) {
				if ( isset( $source[ $key ] ) && is_string( $source[ $key ] ) && '' !== $source[ $key ] ) {
					return $source[ $key ];
				}
			}
		}
		return '';
	}

	/**
	 * Return a Module_Control instance. Filterable for tests.
	 *
	 * @return Module_Control
	 */
	protected static function get_module_control(): Module_Control {
		/**
		 * Filters the Module_Control instance used by the Search abilities.
		 *
		 * @since 0.58.0
		 *
		 * @param Module_Control $module_control The default instance.
		 */
		$instance = apply_filters( 'jetpack_search_abilities_module_control', new Module_Control() );
		return $instance instanceof Module_Control ? $instance : new Module_Control();
	}

	/**
	 * Return a Plan instance. Filterable for tests.
	 *
	 * @return Plan
	 */
	protected static function get_plan_client(): Plan {
		/**
		 * Filters the Plan instance used by the Search abilities.
		 *
		 * @since 0.58.0
		 *
		 * @param Plan $plan The default instance.
		 */
		$instance = apply_filters( 'jetpack_search_abilities_plan', new Plan() );
		return $instance instanceof Plan ? $instance : new Plan();
	}

	/**
	 * Return a Stats instance. Filterable for tests.
	 *
	 * @return Stats
	 */
	protected static function get_stats_client(): Stats {
		/**
		 * Filters the Stats instance used by the Search abilities.
		 *
		 * @since 0.58.0
		 *
		 * @param Stats $stats The default instance.
		 */
		$instance = apply_filters( 'jetpack_search_abilities_stats', new Stats() );
		return $instance instanceof Stats ? $instance : new Stats();
	}

	/**
	 * Return a Classic_Search instance. Filterable for tests.
	 *
	 * Classic_Search is the package's WordPress.com Elasticsearch client; the
	 * search-site ability delegates to its `search()` method rather than
	 * reimplementing the query path.
	 *
	 * @return Classic_Search
	 */
	protected static function get_search_client(): Classic_Search {
		/**
		 * Filters the Classic_Search instance used by the search-site ability.
		 *
		 * @since 0.58.0
		 *
		 * @param Classic_Search $search The default instance.
		 */
		// Classic_Search::instance() resolves the blog ID itself via
		// Helper::get_wpcom_site_id() when none is passed.
		$instance = apply_filters( 'jetpack_search_abilities_search', Classic_Search::instance() );
		return $instance instanceof Classic_Search ? $instance : Classic_Search::instance();
	}
}
