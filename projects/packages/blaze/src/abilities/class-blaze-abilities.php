<?php
/**
 * Jetpack Blaze Abilities Registration.
 *
 * Registers Jetpack Blaze (paid promotion) abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-blaze
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Blaze\Abilities;

use Automattic\Jetpack\Blaze;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;

/**
 * Registers Jetpack Blaze abilities with the WordPress Abilities API.
 *
 * Exposes a small, agent-facing read surface over the Blaze (paid promotion)
 * dashboard so AI agents can answer "how are my campaigns doing?" and
 * "can this post be Blaze-promoted?" through the standard
 * `wp-abilities/v1` REST surface. Writes (campaign creation/edit) are
 * deliberately deferred — those flows still go through the dashboard UI.
 */
class Blaze_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-blaze';
	const ERROR_PREFIX  = 'jetpack_blaze_';

	/**
	 * Post types eligible for Blaze promotion.
	 *
	 * Mirrors the gate inside `Blaze::jetpack_blaze_row_action()` — keep this in
	 * sync with the row-action UI so agents and humans see the same eligible set.
	 */
	const PROMOTABLE_POST_TYPES = array( 'post', 'page', 'product' );

	/**
	 * Allowed campaign status filter values.
	 */
	const CAMPAIGN_STATUSES = array( 'draft', 'approved', 'rejected', 'completed' );

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
			// "Jetpack Blaze" is a product name and should not be translated.
			'label'       => 'Jetpack Blaze',
			'description' => __( 'Abilities for inspecting Jetpack Blaze (paid promotion) campaigns, dashboard state, and per-content eligibility.', 'jetpack-blaze' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-blaze/list-campaigns'           => self::spec_list_campaigns(),
			'jetpack-blaze/get-campaign-eligibility' => self::spec_get_campaign_eligibility(),
			'jetpack-blaze/get-dashboard-summary'    => self::spec_get_dashboard_summary(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-blaze/list-campaigns.
	 */
	private static function spec_list_campaigns(): array {
		return array(
			'label'               => __( 'List Blaze campaigns', 'jetpack-blaze' ),
			'description'         => __( 'List Blaze (paid promotion) campaigns for the site. Returns a paginated array of campaign summaries — each entry is the projected shape { id, content_id, status, spent_budget, total_budget, currency, start_date, end_date, target_url, impressions, clicks }. `content_id` is the promoted post/page ID (0 when the campaign targets a non-post URL). When `campaign_id` is provided, the response is a consolidated-read containing 0 or 1 entries — empty when the id is not found rather than an error. Precondition: site must be connected to WordPress.com.', 'jetpack-blaze' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'status'      => array(
						'type'        => 'string',
						'description' => __( 'Filter by campaign status.', 'jetpack-blaze' ),
						'enum'        => self::CAMPAIGN_STATUSES,
					),
					'page'        => array(
						'type'        => 'integer',
						'description' => __( 'Page number for paginated results.', 'jetpack-blaze' ),
						'minimum'     => 1,
						'default'     => 1,
					),
					'per_page'    => array(
						'type'        => 'integer',
						'description' => __( 'Results per page (1-100).', 'jetpack-blaze' ),
						'minimum'     => 1,
						'maximum'     => 100,
						'default'     => 20,
					),
					'campaign_id' => array(
						'type'        => 'integer',
						'description' => __( 'Consolidated-read: fetch a single campaign by ID. Returns 0 or 1 elements; empty array when not found.', 'jetpack-blaze' ),
						'minimum'     => 1,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'  => 'array',
				'items' => array(
					'type'       => 'object',
					'properties' => array(
						'id'           => array( 'type' => 'integer' ),
						'content_id'   => array( 'type' => 'integer' ),
						'status'       => array( 'type' => 'string' ),
						'spent_budget' => array( 'type' => 'number' ),
						'total_budget' => array( 'type' => 'number' ),
						'currency'     => array( 'type' => 'string' ),
						'start_date'   => array( 'type' => array( 'string', 'null' ) ),
						'end_date'     => array( 'type' => array( 'string', 'null' ) ),
						'target_url'   => array( 'type' => 'string' ),
						'impressions'  => array( 'type' => 'integer' ),
						'clicks'       => array( 'type' => 'integer' ),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'list_campaigns' ),
			'permission_callback' => array( __CLASS__, 'can_manage_blaze' ),
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
	 * Spec: jetpack-blaze/get-campaign-eligibility.
	 */
	private static function spec_get_campaign_eligibility(): array {
		return array(
			'label'               => __( 'Get Blaze campaign eligibility for a post', 'jetpack-blaze' ),
			'description'         => __( 'Return whether a given post/page can be Blaze-promoted right now. Shape: { content_id, eligible, reasons, current_status }. `eligible` is true only when the site supports Blaze, the post exists, is published, has no password, and is one of the supported post types (post, page, product). `reasons` is an array of stable string codes (e.g. `site_not_eligible`, `post_not_found`, `post_not_published`, `post_password_protected`, `post_type_not_supported`) — empty when `eligible` is true. `current_status` is the post status (`publish`, `draft`, ...) or `unknown` when the post does not exist. Read-only, idempotent.', 'jetpack-blaze' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'content_id' ),
				'properties'           => array(
					'content_id' => array(
						'type'        => 'integer',
						'description' => __( 'The post or page ID to check eligibility for.', 'jetpack-blaze' ),
						'minimum'     => 1,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'content_id'     => array( 'type' => 'integer' ),
					'eligible'       => array( 'type' => 'boolean' ),
					'reasons'        => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
					'current_status' => array( 'type' => 'string' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_campaign_eligibility' ),
			'permission_callback' => array( __CLASS__, 'can_manage_blaze' ),
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
	 * Spec: jetpack-blaze/get-dashboard-summary.
	 */
	private static function spec_get_dashboard_summary(): array {
		return array(
			'label'               => __( 'Get Blaze dashboard summary', 'jetpack-blaze' ),
			'description'         => __( 'Return a zero-argument summary of agent-facing Blaze state for the site. Shape: { total_campaigns, active_campaigns, total_spent_30d, currency, supports_blaze, account_credit_balance }. `supports_blaze` reflects the WPCOM `site_supports_blaze` check (true when the site can run campaigns at all). `total_spent_30d` is the sum of recent spend in `currency`; `account_credit_balance` is the unused credit balance on the WordAds account, or null when the credits endpoint is unavailable. Composes the site campaigns + credits WPCOM endpoints — when remote calls fail, counts degrade to zero and `account_credit_balance` to null rather than erroring out. Read-only and idempotent. Precondition: site must be connected to WordPress.com.', 'jetpack-blaze' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'total_campaigns'        => array( 'type' => 'integer' ),
					'active_campaigns'       => array( 'type' => 'integer' ),
					'total_spent_30d'        => array( 'type' => 'number' ),
					'currency'               => array( 'type' => 'string' ),
					'supports_blaze'         => array( 'type' => 'boolean' ),
					'account_credit_balance' => array( 'type' => array( 'number', 'null' ) ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_dashboard_summary' ),
			'permission_callback' => array( __CLASS__, 'can_manage_blaze' ),
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

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Permission: can the current user manage Blaze?
	 *
	 * Mirrors the gate the Blaze REST controllers use — both `REST_Controller`
	 * and `Dashboard_REST_Controller` require `manage_options`. Match exactly so
	 * an agent can only see what the same caller would see through the existing
	 * REST endpoints, not more.
	 *
	 * @return bool
	 */
	public static function can_manage_blaze(): bool {
		return current_user_can( 'manage_options' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: list-campaigns.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function list_campaigns( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$site_id = static::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$query_args = array();
		if ( isset( $input['status'] ) && in_array( $input['status'], self::CAMPAIGN_STATUSES, true ) ) {
			$query_args['status'] = $input['status'];
		}

		// Consolidated-read: when a campaign_id is supplied, project the result to a
		// 0-or-1-element array. Empty array when not found (callers must not see a 404).
		if ( isset( $input['campaign_id'] ) && is_numeric( $input['campaign_id'] ) && (int) $input['campaign_id'] > 0 ) {
			$campaign_id = (int) $input['campaign_id'];
			$response    = static::wpcom_request_as_user(
				sprintf( '/sites/%d/wordads/dsp/api/v1/campaigns/%d', $site_id, $campaign_id )
			);
			if ( is_wp_error( $response ) ) {
				// Distinguish "not found" from other failures — 404 collapses to empty array.
				$status = (int) $response->get_error_data( $response->get_error_code() );
				if ( 404 === $status ) {
					return array();
				}
				return $response;
			}
			$campaign = self::project_campaign( $response );
			return null === $campaign ? array() : array( $campaign );
		}

		$page               = self::clamp_int( $input['page'] ?? 1, 1, PHP_INT_MAX, 1 );
		$per_page           = self::clamp_int( $input['per_page'] ?? 20, 1, 100, 20 );
		$query_args['page'] = $page;
		$query_args['size'] = $per_page;

		$path     = sprintf( '/sites/%d/wordads/dsp/api/v1/campaigns', $site_id );
		$response = static::wpcom_request_as_user( add_query_arg( $query_args, $path ) );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return self::project_campaign_list( $response );
	}

	/**
	 * Execute: get-campaign-eligibility.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function get_campaign_eligibility( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( ! isset( $input['content_id'] ) || ! is_numeric( $input['content_id'] ) || (int) $input['content_id'] <= 0 ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_content_id',
				__( 'A positive content_id is required.', 'jetpack-blaze' )
			);
		}

		$content_id = (int) $input['content_id'];
		$reasons    = array();

		// Site-level gate: mirrors the row-action check in `Blaze::should_initialize()`.
		// We only surface `site_not_eligible` here — finer-grained reasons (no connection,
		// sync disabled, ...) belong to a future connection-status ability category and
		// would just be noise for an agent that already saw it isn't eligible.
		$init = Blaze::should_initialize();
		if ( empty( $init['can_init'] ) ) {
			$reasons[] = 'site_not_eligible';
		}

		$post = get_post( $content_id );
		if ( ! $post ) {
			return array(
				'content_id'     => $content_id,
				'eligible'       => false,
				'reasons'        => array_values( array_unique( array_merge( $reasons, array( 'post_not_found' ) ) ) ),
				'current_status' => 'unknown',
			);
		}

		if ( ! in_array( $post->post_type, self::PROMOTABLE_POST_TYPES, true ) ) {
			$reasons[] = 'post_type_not_supported';
		}
		if ( 'publish' !== $post->post_status ) {
			$reasons[] = 'post_not_published';
		}
		if ( '' !== (string) $post->post_password ) {
			$reasons[] = 'post_password_protected';
		}

		return array(
			'content_id'     => $content_id,
			'eligible'       => empty( $reasons ),
			'reasons'        => array_values( array_unique( $reasons ) ),
			'current_status' => (string) $post->post_status,
		);
	}

	/**
	 * Execute: get-dashboard-summary.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array|WP_Error
	 */
	public static function get_dashboard_summary( $input = null ) {
		unset( $input );

		$site_id = static::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$supports_blaze = (bool) static::site_supports_blaze( $site_id );

		$campaigns_path = sprintf( '/sites/%1$d/wordads/dsp/api/v1/sites/%1$d/campaigns', $site_id );
		$campaigns      = static::wpcom_request_as_user( $campaigns_path );

		$total_campaigns  = 0;
		$active_campaigns = 0;
		$total_spent_30d  = 0.0;
		$currency         = 'USD';

		if ( ! is_wp_error( $campaigns ) ) {
			$list = self::extract_campaign_list( $campaigns );
			foreach ( $list as $row ) {
				++$total_campaigns;
				if ( self::is_active_campaign_status( $row['status'] ?? '' ) ) {
					++$active_campaigns;
				}
				$total_spent_30d += isset( $row['spent_budget'] ) ? (float) $row['spent_budget'] : 0.0;
				if ( ! empty( $row['currency'] ) ) {
					$currency = (string) $row['currency'];
				}
			}
		}

		$credit_balance = null;
		$credits        = static::wpcom_request_as_user(
			sprintf( '/sites/%d/wordads/dsp/api/v1/credits', $site_id )
		);
		if ( ! is_wp_error( $credits ) ) {
			$credit_balance = self::extract_credit_balance( $credits );
		}

		return array(
			'total_campaigns'        => $total_campaigns,
			'active_campaigns'       => $active_campaigns,
			'total_spent_30d'        => (float) $total_spent_30d,
			'currency'               => $currency,
			'supports_blaze'         => $supports_blaze,
			'account_credit_balance' => $credit_balance,
		);
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Project a campaign row from the WordAds DSP response into the public schema.
	 *
	 * @param mixed $row Raw campaign payload from DSP.
	 * @return array|null Projected shape, or null when the row is empty/non-array.
	 */
	private static function project_campaign( $row ): ?array {
		if ( ! is_array( $row ) ) {
			return null;
		}

		// DSP shapes vary slightly across endpoints — defensively read the most
		// common keys with sensible fallbacks rather than picking one canonical
		// name and silently dropping the others.
		$content_id = 0;
		if ( isset( $row['post_id'] ) ) {
			$content_id = (int) $row['post_id'];
		} elseif ( isset( $row['content_id'] ) ) {
			$content_id = (int) $row['content_id'];
		} elseif ( isset( $row['target_post_id'] ) ) {
			$content_id = (int) $row['target_post_id'];
		}

		return array(
			'id'           => isset( $row['campaign_id'] ) ? (int) $row['campaign_id'] : (int) ( $row['id'] ?? 0 ),
			'content_id'   => $content_id,
			'status'       => isset( $row['status'] ) ? (string) $row['status'] : '',
			'spent_budget' => isset( $row['spent_budget'] ) ? (float) $row['spent_budget'] : (float) ( $row['total_budget_used'] ?? 0 ),
			'total_budget' => isset( $row['total_budget'] ) ? (float) $row['total_budget'] : (float) ( $row['budget_cents'] ?? 0 ) / 100,
			'currency'     => isset( $row['currency'] ) ? (string) $row['currency'] : (string) ( $row['display_currency'] ?? '' ),
			'start_date'   => isset( $row['start_date'] ) && '' !== $row['start_date'] ? (string) $row['start_date'] : null,
			'end_date'     => isset( $row['end_date'] ) && '' !== $row['end_date'] ? (string) $row['end_date'] : null,
			'target_url'   => isset( $row['target_url'] ) ? (string) $row['target_url'] : (string) ( $row['target_urn'] ?? '' ),
			'impressions'  => isset( $row['impressions_total'] ) ? (int) $row['impressions_total'] : (int) ( $row['impressions'] ?? 0 ),
			'clicks'       => isset( $row['clicks_total'] ) ? (int) $row['clicks_total'] : (int) ( $row['clicks'] ?? 0 ),
		);
	}

	/**
	 * Project a campaign list payload into an array of campaign rows.
	 *
	 * @param mixed $response The DSP campaigns response (envelope or bare list).
	 * @return array
	 */
	private static function project_campaign_list( $response ): array {
		$rows = self::extract_campaign_list( $response );
		$out  = array();
		foreach ( $rows as $row ) {
			$projected = self::project_campaign( $row );
			if ( null !== $projected ) {
				$out[] = $projected;
			}
		}
		return $out;
	}

	/**
	 * Extract the campaign list from a DSP response envelope.
	 *
	 * DSP wraps campaigns under `campaigns` or `results` for the list endpoints;
	 * some single-campaign reads return a bare object. Normalize to `array<row>`.
	 *
	 * @param mixed $response Raw DSP response.
	 * @return array
	 */
	private static function extract_campaign_list( $response ): array {
		if ( ! is_array( $response ) ) {
			return array();
		}
		if ( isset( $response['campaigns'] ) && is_array( $response['campaigns'] ) ) {
			return $response['campaigns'];
		}
		if ( isset( $response['results'] ) && is_array( $response['results'] ) ) {
			return $response['results'];
		}
		// Bare list (numeric keys) — pass through.
		if ( array_keys( $response ) === range( 0, count( $response ) - 1 ) ) {
			return $response;
		}
		return array();
	}

	/**
	 * Extract a numeric credit balance from a DSP credits response.
	 *
	 * Reads the most common balance fields and falls back to null when none
	 * are present — so an unexpected response shape degrades to "unknown
	 * balance" rather than 0 (which would lie about a real zero balance).
	 *
	 * @param mixed $response Raw DSP credits response.
	 * @return float|null
	 */
	private static function extract_credit_balance( $response ): ?float {
		if ( ! is_array( $response ) ) {
			return null;
		}
		foreach ( array( 'balance', 'available', 'credit_balance', 'amount' ) as $key ) {
			if ( isset( $response[ $key ] ) && is_numeric( $response[ $key ] ) ) {
				return (float) $response[ $key ];
			}
		}
		return null;
	}

	/**
	 * Whether a campaign status counts as "active" for the dashboard summary.
	 *
	 * `approved` is the DSP active-on-market state; `running` is what the UI
	 * displays for the same condition. Both count as active here.
	 *
	 * @param string $status Campaign status string.
	 * @return bool
	 */
	private static function is_active_campaign_status( string $status ): bool {
		return in_array( $status, array( 'approved', 'running', 'active' ), true );
	}

	/**
	 * Resolve the connected site ID, or return a WP_Error agents can act on.
	 *
	 * Extracted as a protected seam so tests can override the connection lookup
	 * without standing up a real Jetpack token fixture.
	 *
	 * @return int|WP_Error
	 */
	protected static function get_site_id() {
		$site_id = Connection_Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'site_not_connected',
				__( 'The site is not connected to WordPress.com. Connect the site before calling Blaze abilities.', 'jetpack-blaze' )
			);
		}
		return (int) $site_id;
	}

	/**
	 * Whether the connected site supports Blaze.
	 *
	 * Extracted as a protected seam so tests can override the remote call
	 * without seeding the underlying transient.
	 *
	 * @param int $site_id Blog ID.
	 * @return bool
	 */
	protected static function site_supports_blaze( int $site_id ): bool {
		return (bool) Blaze::site_supports_blaze( $site_id );
	}

	/**
	 * Query a WordPress.com REST path as the current user, returning the JSON
	 * body on success or a WP_Error on a non-2xx response.
	 *
	 * Extracted as a protected seam so tests can override the transport without
	 * standing up a real connection fixture.
	 *
	 * @param string $path The WPCOM REST path (including leading slash).
	 * @return array|WP_Error
	 */
	protected static function wpcom_request_as_user( string $path ) {
		$response = Client::wpcom_json_api_request_as_user(
			$path,
			'v2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $code < 200 || $code >= 300 ) {
			$message = is_array( $body ) && isset( $body['errorMessage'] )
				? (string) $body['errorMessage']
				: __( 'Blaze data could not be fetched from WordPress.com.', 'jetpack-blaze' );
			return new WP_Error(
				self::ERROR_PREFIX . 'remote_request_failed',
				$message,
				(int) $code
			);
		}

		return is_array( $body ) ? $body : array();
	}

	/**
	 * Clamp an integer into [$min, $max] with a default on bad input.
	 *
	 * @param mixed $raw       Raw input.
	 * @param int   $min       Minimum.
	 * @param int   $max       Maximum.
	 * @param int   $fallback  Default on bad input.
	 * @return int
	 */
	private static function clamp_int( $raw, int $min, int $max, int $fallback ): int {
		if ( ! is_numeric( $raw ) ) {
			return $fallback;
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
}
