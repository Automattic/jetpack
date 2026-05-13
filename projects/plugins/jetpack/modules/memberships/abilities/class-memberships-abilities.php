<?php
/**
 * Jetpack Memberships Abilities Registration
 *
 * Registers Jetpack Memberships (paid newsletter / paid content) abilities with
 * the WordPress Abilities API so AI agents can read paid-membership plans and
 * subscribers through the standard `wp-abilities/v1` REST surface.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack;
use Jetpack_Options;

/**
 * Registers Jetpack Memberships abilities with the WordPress Abilities API.
 *
 * Read-only surface today: filtered reads for plans and subscribers. Writes
 * (create / update / delete plan, comp / cancel subscription) are deferred —
 * destructive operations go behind a separate ability set with their own
 * permission checks and tests.
 */
class Memberships_Abilities extends Registrar {

	/**
	 * Maximum `per_page` value accepted by list abilities. Mirrors the
	 * `WPCOM_REST_API_V2_Endpoint_Subscribers_List` cap so we don't surface a
	 * larger page than the upstream WP.com endpoint honors.
	 */
	private const MAX_PER_PAGE = 100;

	/**
	 * Default `per_page` value when the caller omits it. Matches the agent
	 * ergonomics guidance (small enough to fit a typical response window).
	 */
	private const DEFAULT_PER_PAGE = 20;

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return 'jetpack-memberships';
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" and "Memberships" are product names and should not be translated.
			'label'       => 'Jetpack Memberships',
			'description' => __( 'Abilities for reading Jetpack Memberships paid plans and subscribers.', 'jetpack' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		$plan_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'                    => array( 'type' => 'integer' ),
				'title'                 => array( 'type' => 'string' ),
				'price'                 => array( 'type' => 'number' ),
				'currency'              => array( 'type' => 'string' ),
				'interval'              => array(
					'type'        => 'string',
					'description' => __( 'Billing interval, e.g. "1 month", "1 year", "one-time".', 'jetpack' ),
				),
				'active'                => array( 'type' => 'boolean' ),
				'subscriber_count'      => array( 'type' => 'integer' ),
				'connected_destination' => array(
					'type'        => 'string',
					'description' => __( 'Type of the paid-content target, e.g. "newsletter" or "site".', 'jetpack' ),
				),
			),
		);

		$subscriber_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'              => array( 'type' => 'integer' ),
				'email'           => array( 'type' => 'string' ),
				'display_name'    => array( 'type' => 'string' ),
				'plan_id'         => array( 'type' => 'integer' ),
				'status'          => array(
					'type' => 'string',
					'enum' => array( 'active', 'cancelled' ),
				),
				'subscribed_at'   => array(
					'type'        => 'string',
					'description' => __( 'ISO-8601 date the subscription started, or empty string when unknown.', 'jetpack' ),
				),
				'last_payment_at' => array(
					'type'        => 'string',
					'description' => __( 'ISO-8601 date of the most recent payment, or empty string when unknown.', 'jetpack' ),
				),
			),
		);

		return array(
			'jetpack-memberships/list-plans'       => array(
				'label'               => __( 'List Jetpack Memberships plans', 'jetpack' ),
				'description'         => __(
					'Return paid membership plans (subscription tiers) as an array. Each element has { id, title, price, currency, interval, active, subscriber_count, connected_destination }. Pass plan_id to filter to a single plan — unknown ids yield an empty array (not an error). Pass active=true to include only published / live plans. Supports page (default 1) and per_page (default 20, max 100) for pagination. Requires an active Jetpack connection. Read-only and idempotent.',
					'jetpack'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'additionalProperties' => false,
					'properties'           => array(
						'active'   => array(
							'type'        => 'boolean',
							'description' => __( 'When set, only return plans matching this active state.', 'jetpack' ),
						),
						'plan_id'  => array(
							'type'        => 'integer',
							'minimum'     => 1,
							'description' => __( 'Return a single plan by id. Unknown ids yield an empty array.', 'jetpack' ),
						),
						'page'     => array(
							'type'    => 'integer',
							'minimum' => 1,
							'default' => 1,
						),
						'per_page' => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => self::MAX_PER_PAGE,
							'default' => self::DEFAULT_PER_PAGE,
						),
					),
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $plan_schema,
				),
				'execute_callback'    => array( __CLASS__, 'list_plans' ),
				'permission_callback' => array( __CLASS__, 'can_view_plans' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-memberships/list-subscribers' => array(
				'label'               => __( 'List Jetpack Memberships subscribers', 'jetpack' ),
				'description'         => __(
					'Return paid-membership subscribers as an array. Each element has { id, email, display_name, plan_id, status, subscribed_at, last_payment_at }. Pass plan_id to scope to a single plan; pass status="active"|"cancelled"|"all" (default "active"). Supports page (default 1) and per_page (default 20, max 100). Requires an active Jetpack connection. Read-only and idempotent. Use jetpack-memberships/list-plans first to enumerate plan ids.',
					'jetpack'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'additionalProperties' => false,
					'properties'           => array(
						'plan_id'  => array(
							'type'        => 'integer',
							'minimum'     => 1,
							'description' => __( 'Scope results to a single plan id. Unknown ids yield an empty array.', 'jetpack' ),
						),
						'status'   => array(
							'type'    => 'string',
							'enum'    => array( 'active', 'cancelled', 'all' ),
							'default' => 'active',
						),
						'page'     => array(
							'type'    => 'integer',
							'minimum' => 1,
							'default' => 1,
						),
						'per_page' => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => self::MAX_PER_PAGE,
							'default' => self::DEFAULT_PER_PAGE,
						),
					),
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $subscriber_schema,
				),
				'execute_callback'    => array( __CLASS__, 'list_subscribers' ),
				'permission_callback' => array( __CLASS__, 'can_view_subscribers' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	/**
	 * Permission check for the plans read. Matches the wpcom-endpoints
	 * `get_status_permission_check` on the Memberships endpoint — anyone who
	 * can author posts can see the catalog of paid plans configured on the
	 * site.
	 */
	public static function can_view_plans(): bool {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Permission check for the subscribers read. Matches the
	 * `WPCOM_REST_API_V2_Endpoint_Subscribers_List::permission_check` cap
	 * (`manage_options`) — the subscriber list is admin-only on wpcom and on
	 * the modernized Subscribers wp-admin screen.
	 */
	public static function can_view_subscribers(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Execute: list paid membership plans.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function list_plans( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$blog_id = self::get_connected_blog_id();
		if ( $blog_id instanceof \WP_Error ) {
			return $blog_id;
		}

		$page     = isset( $input['page'] ) ? max( 1, (int) $input['page'] ) : 1;
		$per_page = self::resolve_per_page( $input );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/memberships/products?type=all', $blog_id ),
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$body = self::decode_wpcom_response( $response, 'jetpack_memberships_plans_unavailable' );
		if ( $body instanceof \WP_Error ) {
			return $body;
		}

		$products = isset( $body['products'] ) && is_array( $body['products'] ) ? $body['products'] : array();

		// Filter to a single plan when plan_id is provided. The literal string
		// '0' shouldn't get here (schema enforces minimum: 1), but use
		// isset()+type-check rather than empty() to be safe against future
		// schema changes that loosen the minimum.
		$plan_id = isset( $input['plan_id'] ) ? (int) $input['plan_id'] : 0;
		if ( $plan_id > 0 ) {
			$products = array_values(
				array_filter(
					$products,
					static function ( $product ) use ( $plan_id ) {
						return is_array( $product ) && isset( $product['id'] ) && (int) $product['id'] === $plan_id;
					}
				)
			);
		}

		if ( array_key_exists( 'active', $input ) ) {
			$want_active = (bool) $input['active'];
			$products    = array_values(
				array_filter(
					$products,
					static function ( $product ) use ( $want_active ) {
						$is_active = isset( $product['status'] ) && 'active' === $product['status'];
						return $is_active === $want_active;
					}
				)
			);
		}

		// Paginate after filtering so per_page bounds the final shape.
		$offset = ( $page - 1 ) * $per_page;
		$slice  = array_slice( $products, $offset, $per_page );

		return array_map( array( __CLASS__, 'shape_plan' ), $slice );
	}

	/**
	 * Execute: list paid-membership subscribers.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function list_subscribers( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$blog_id = self::get_connected_blog_id();
		if ( $blog_id instanceof \WP_Error ) {
			return $blog_id;
		}

		$page     = isset( $input['page'] ) ? max( 1, (int) $input['page'] ) : 1;
		$per_page = self::resolve_per_page( $input );
		$plan_id  = isset( $input['plan_id'] ) ? (int) $input['plan_id'] : 0;
		$status   = isset( $input['status'] ) && is_string( $input['status'] )
			? $input['status']
			: 'active';

		$query = array(
			'page'     => $page,
			'per_page' => $per_page,
			'type'     => 'paid',
		);
		if ( $plan_id > 0 ) {
			$query['plan_id'] = $plan_id;
		}
		if ( 'all' !== $status ) {
			$query['filters'] = $status; // 'active' or 'cancelled' — passed through to wpcom.
		}

		$path = sprintf( '/sites/%d/subscribers?%s', $blog_id, http_build_query( $query ) );

		$response = Client::wpcom_json_api_request_as_user(
			$path,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		$body = self::decode_wpcom_response( $response, 'jetpack_memberships_subscribers_unavailable' );
		if ( $body instanceof \WP_Error ) {
			return $body;
		}

		$subscribers = isset( $body['subscribers'] ) && is_array( $body['subscribers'] )
			? $body['subscribers']
			: array();

		return array_map( array( __CLASS__, 'shape_subscriber' ), $subscribers );
	}

	/**
	 * Resolve `per_page` from input, clamped to [1, MAX_PER_PAGE].
	 *
	 * Schema defaults are not auto-injected, so callers that omit per_page
	 * fall through to DEFAULT_PER_PAGE here.
	 *
	 * @param array $input Input array.
	 * @return int
	 */
	private static function resolve_per_page( array $input ): int {
		$raw = isset( $input['per_page'] ) ? (int) $input['per_page'] : self::DEFAULT_PER_PAGE;
		if ( $raw < 1 ) {
			return self::DEFAULT_PER_PAGE;
		}
		return min( $raw, self::MAX_PER_PAGE );
	}

	/**
	 * Resolve the current blog's wpcom site id, or return a steering error.
	 *
	 * @return int|\WP_Error Positive integer site id, or WP_Error when not connected.
	 */
	private static function get_connected_blog_id() {
		if ( ! class_exists( 'Jetpack' ) || ! Jetpack::is_connection_ready() ) {
			return new \WP_Error(
				'jetpack_memberships_not_connected',
				__( 'Memberships data is only available on Jetpack-connected sites. Connect Jetpack and retry.', 'jetpack' )
			);
		}

		$site_id = (int) Jetpack_Options::get_option( 'id' );
		if ( $site_id <= 0 ) {
			return new \WP_Error(
				'jetpack_memberships_not_connected',
				__( 'No Jetpack site ID is registered. Connect Jetpack and retry.', 'jetpack' )
			);
		}

		return $site_id;
	}

	/**
	 * Decode a wpcom JSON-API response into an array, mapping transport and
	 * HTTP errors into a WP_Error with the supplied code.
	 *
	 * @param mixed  $response   Result of `Client::wpcom_json_api_request_as_user`.
	 * @param string $error_code Steering error code to use on failure.
	 * @return array|\WP_Error
	 */
	private static function decode_wpcom_response( $response, string $error_code ) {
		if ( is_wp_error( $response ) ) {
			return new \WP_Error( $error_code, $response->get_error_message() );
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		if ( $status < 200 || $status >= 300 ) {
			return new \WP_Error(
				$error_code,
				/* translators: %d: HTTP status code returned by WordPress.com. */
				sprintf( __( 'WordPress.com returned an unexpected status (%d). Retry shortly.', 'jetpack' ), $status )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		return is_array( $body ) ? $body : array();
	}

	/**
	 * Shape a wpcom membership product into the public ability response.
	 *
	 * Kept narrow: we surface exactly the keys promised by the ability's
	 * output_schema rather than the raw upstream product dump, which carries
	 * Stripe IDs and internal flags the agent can't act on.
	 *
	 * @param mixed $product Raw product entry from the wpcom response.
	 * @return array
	 */
	private static function shape_plan( $product ): array {
		$product = is_array( $product ) ? $product : array();
		return array(
			'id'                    => isset( $product['id'] ) ? (int) $product['id'] : 0,
			'title'                 => isset( $product['title'] ) ? (string) $product['title'] : '',
			'price'                 => isset( $product['price'] ) ? (float) $product['price'] : 0.0,
			'currency'              => isset( $product['currency'] ) ? (string) $product['currency'] : '',
			'interval'              => isset( $product['interval'] ) ? (string) $product['interval'] : '',
			'active'                => isset( $product['status'] ) && 'active' === $product['status'],
			'subscriber_count'      => isset( $product['subscriber_count'] ) ? (int) $product['subscriber_count'] : 0,
			'connected_destination' => isset( $product['connected_destination'] ) ? (string) $product['connected_destination'] : '',
		);
	}

	/**
	 * Shape a wpcom subscriber row into the public ability response.
	 *
	 * @param mixed $subscriber Raw subscriber entry from the wpcom response.
	 * @return array
	 */
	private static function shape_subscriber( $subscriber ): array {
		$subscriber = is_array( $subscriber ) ? $subscriber : array();

		// Status normalization: wpcom historically returns "active" or
		// "cancelled" for paid subscriptions, occasionally "inactive" for
		// expired free trials. Map non-active to "cancelled" so the output
		// schema's enum stays tight.
		$raw_status = isset( $subscriber['status'] ) ? (string) $subscriber['status'] : 'active';
		$status     = 'active' === $raw_status ? 'active' : 'cancelled';

		return array(
			'id'              => isset( $subscriber['user_id'] )
				? (int) $subscriber['user_id']
				: ( isset( $subscriber['id'] ) ? (int) $subscriber['id'] : 0 ),
			'email'           => isset( $subscriber['email_address'] )
				? (string) $subscriber['email_address']
				: ( isset( $subscriber['email'] ) ? (string) $subscriber['email'] : '' ),
			'display_name'    => isset( $subscriber['display_name'] ) ? (string) $subscriber['display_name'] : '',
			'plan_id'         => isset( $subscriber['plan_id'] ) ? (int) $subscriber['plan_id'] : 0,
			'status'          => $status,
			'subscribed_at'   => isset( $subscriber['date_subscribed'] ) ? (string) $subscriber['date_subscribed'] : '',
			'last_payment_at' => isset( $subscriber['last_payment_date'] ) ? (string) $subscriber['last_payment_date'] : '',
		);
	}
}
