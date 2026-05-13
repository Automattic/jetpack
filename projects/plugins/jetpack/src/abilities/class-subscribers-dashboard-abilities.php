<?php
/**
 * Jetpack Subscribers Dashboard Abilities Registration
 *
 * Registers Subscribers Dashboard abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_REST_Request;

/**
 * Registers Subscribers Dashboard abilities with the WordPress Abilities API.
 *
 * Exposes read access to the site's subscriber list and totals, plus a
 * single-item and bulk delete, by delegating to the existing
 * `WPCOM_REST_API_V2_Endpoint_Subscribers_List` controller (the same one the
 * dashboard React UI calls). Keeping the abilities as a thin wrapper means
 * the controller stays the single source of truth for permission gates,
 * pagination semantics, and the WPCOM proxy shape — and lets agents and the
 * dashboard share identical results.
 *
 * Only registered when the `rsm_jetpack_ui_modernization_newsletter` filter
 * returns true, mirroring the controller's own registration gate.
 */
class Subscribers_Dashboard_Abilities extends Registrar {

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return 'jetpack-subscribers';
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			'label'       => __( 'Jetpack Subscribers', 'jetpack' ),
			'description' => __( 'Abilities for inspecting and managing newsletter subscribers via the Subscribers Dashboard.', 'jetpack' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-subscribers/list-subscribers'        => array(
				'label'               => __( 'List newsletter subscribers', 'jetpack' ),
				'description'         => __( 'Return a page of the site\'s subscribers (free + paid, email + WPCOM). Mirrors the Subscribers Dashboard list view: page/per_page pagination, optional search, optional filters[] (e.g. "email_subscriber", "wpcom_subscriber", "paid", "unconfirmed"), and a sort/sort_order pair. The response passes through the WPCOM `/sites/{id}/subscribers` body unchanged so callers see the same shape the dashboard renders. These abilities are only registered when the newsletter modernization filter is on; if they are absent from wp_get_abilities() the modernization rollout has not reached this site yet.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'page'       => array(
							'type'        => 'integer',
							'minimum'     => 1,
							'default'     => 1,
							'description' => __( '1-based page number.', 'jetpack' ),
						),
						'per_page'   => array(
							'type'        => 'integer',
							'minimum'     => 1,
							'maximum'     => 100,
							'default'     => 10,
							'description' => __( 'Subscribers per page (1-100).', 'jetpack' ),
						),
						'search'     => array(
							'type'        => 'string',
							'default'     => '',
							'description' => __( 'Optional case-insensitive substring match against subscriber name or email.', 'jetpack' ),
						),
						'sort'       => array(
							'type'        => 'string',
							'enum'        => array( 'date_subscribed', 'name', 'plan', 'subscription_status' ),
							'default'     => 'date_subscribed',
							'description' => __( 'Sort column.', 'jetpack' ),
						),
						'sort_order' => array(
							'type'        => 'string',
							'enum'        => array( 'asc', 'desc' ),
							'default'     => 'desc',
							'description' => __( 'Sort direction.', 'jetpack' ),
						),
						'filters'    => array(
							'type'        => 'array',
							'items'       => array( 'type' => 'string' ),
							'default'     => array( 'all' ),
							'description' => __( 'Filter slugs passed through to WPCOM, e.g. ["all"], ["email_subscriber"], ["paid"].', 'jetpack' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'        => 'object',
					'description' => __( 'WPCOM `/sites/{id}/subscribers` response (passthrough). Typically includes `subscribers` and `total` keys.', 'jetpack' ),
				),
				'execute_callback'    => array( __CLASS__, 'list_subscribers' ),
				'permission_callback' => array( __CLASS__, 'can_manage_subscribers' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-subscribers/get-summary'             => array(
				'label'               => __( 'Get subscriber totals summary', 'jetpack' ),
				'description'         => __( 'Zero-arg summary of the site\'s subscriber counts (totals across email/WPCOM/paid/unconfirmed buckets). Passthrough of the WPCOM `/sites/{id}/subscribers/counts` response. Read-only and idempotent.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'        => 'object',
					'description' => __( 'WPCOM `/sites/{id}/subscribers/counts` response (passthrough).', 'jetpack' ),
				),
				'execute_callback'    => array( __CLASS__, 'get_summary' ),
				'permission_callback' => array( __CLASS__, 'can_manage_subscribers' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-subscribers/delete-subscriber'       => array(
				'label'               => __( 'Delete a subscriber', 'jetpack' ),
				'description'         => __( 'Remove a single subscriber. A subscriber on WP.com is the union of up to three records: a wpcom follower (user_id), an email-only follower (email_subscription_id), and zero or more paid memberships (paid_subscription_ids). Provide whichever identifiers apply to the subscriber returned by list-subscribers — at least one is required. The underlying remove call is best-effort per step and surfaces partial failures in `errors`. Returns { ok, errors } where ok is true only when every step succeeded. Destructive.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'user_id'               => array(
							'type'        => 'integer',
							'minimum'     => 0,
							'default'     => 0,
							'description' => __( 'WPCOM follower user id. 0 (or omit) when the subscriber is email-only.', 'jetpack' ),
						),
						'email_subscription_id' => array(
							'type'        => 'integer',
							'minimum'     => 0,
							'default'     => 0,
							'description' => __( 'Email follower subscription id. 0 (or omit) when the subscriber is WPCOM-only.', 'jetpack' ),
						),
						'paid_subscription_ids' => array(
							'type'        => 'array',
							'items'       => array( 'type' => 'string' ),
							'default'     => array(),
							'description' => __( 'Memberships subscription ids to cancel before removal. Empty when the subscriber has no paid plans.', 'jetpack' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'ok'     => array( 'type' => 'boolean' ),
						'errors' => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'step'  => array( 'type' => 'string' ),
									'id'    => array( 'type' => 'string' ),
									'error' => array( 'type' => 'string' ),
								),
							),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'delete_subscriber' ),
				'permission_callback' => array( __CLASS__, 'can_manage_subscribers' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => true,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-subscribers/bulk-delete-subscribers' => array(
				'label'               => __( 'Bulk-delete subscribers', 'jetpack' ),
				'description'         => __( 'Delete up to 100 subscribers in a single call. Each item is processed via the same per-subscriber remove flow as jetpack-subscribers/delete-subscriber; partial failures are reported per item in `failed[]` while successful removals appear in `deleted[]`. The aggregate `ok` is true only when every item succeeded. Destructive.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'subscribers' ),
					'properties'           => array(
						'subscribers' => array(
							'type'        => 'array',
							'minItems'    => 1,
							'maxItems'    => 100,
							'description' => __( 'List of per-subscriber identifier objects (same shape as jetpack-subscribers/delete-subscriber input).', 'jetpack' ),
							'items'       => array(
								'type'                 => 'object',
								'properties'           => array(
									'user_id' => array(
										'type'    => 'integer',
										'minimum' => 0,
										'default' => 0,
									),
									'email_subscription_id' => array(
										'type'    => 'integer',
										'minimum' => 0,
										'default' => 0,
									),
									'paid_subscription_ids' => array(
										'type'    => 'array',
										'items'   => array( 'type' => 'string' ),
										'default' => array(),
									),
								),
								'additionalProperties' => false,
							),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'ok'      => array( 'type' => 'boolean' ),
						'deleted' => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'index'   => array( 'type' => 'integer' ),
									'user_id' => array( 'type' => 'integer' ),
									'email_subscription_id' => array( 'type' => 'integer' ),
								),
							),
						),
						'failed'  => array(
							'type'  => 'array',
							'items' => array(
								'type'       => 'object',
								'properties' => array(
									'index'  => array( 'type' => 'integer' ),
									'errors' => array(
										'type'  => 'array',
										'items' => array(
											'type'       => 'object',
											'properties' => array(
												'step'  => array( 'type' => 'string' ),
												'id'    => array( 'type' => 'string' ),
												'error' => array( 'type' => 'string' ),
											),
										),
									),
								),
							),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'bulk_delete_subscribers' ),
				'permission_callback' => array( __CLASS__, 'can_manage_subscribers' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => true,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	/**
	 * Permission check — `manage_options` matches the wp-admin Subscribers menu cap
	 * and the underlying REST controller's gate.
	 */
	public static function can_manage_subscribers(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Execute: list subscribers. Thin wrapper around the existing
	 * `/wpcom/v2/subscribers/list` controller so the abilities surface and the
	 * dashboard UI return identical results.
	 *
	 * @param array|null $input Ability input.
	 * @return array|\WP_Error
	 */
	public static function list_subscribers( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/subscribers/list' );
		foreach (
			array(
				'page',
				'per_page',
				'search',
				'sort',
				'sort_order',
				'filters',
			) as $param
		) {
			if ( array_key_exists( $param, $input ) ) {
				$request->set_param( $param, $input[ $param ] );
			}
		}

		return static::dispatch( $request );
	}

	/**
	 * Execute: summary totals. Thin wrapper around `/wpcom/v2/subscribers/totals`.
	 *
	 * @param array|null $input Ignored (zero-arg).
	 * @return array|\WP_Error
	 */
	public static function get_summary( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/subscribers/totals' );
		return static::dispatch( $request );
	}

	/**
	 * Execute: delete a single subscriber via the existing per-subscriber remove
	 * flow on the REST controller. Preserves the controller's partial-failure
	 * shape (`{ ok, errors }`) so callers can distinguish full success from
	 * partial success.
	 *
	 * @param array|null $input Ability input.
	 * @return array|\WP_Error
	 */
	public static function delete_subscriber( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$user_id               = isset( $input['user_id'] ) ? (int) $input['user_id'] : 0;
		$email_subscription_id = isset( $input['email_subscription_id'] ) ? (int) $input['email_subscription_id'] : 0;
		$paid_subscription_ids = isset( $input['paid_subscription_ids'] ) && is_array( $input['paid_subscription_ids'] )
			? array_values( $input['paid_subscription_ids'] )
			: array();

		if ( ! $user_id && ! $email_subscription_id && empty( $paid_subscription_ids ) ) {
			return new \WP_Error(
				'jetpack_subscribers_delete_invalid',
				__( 'Provide at least one identifier (user_id, email_subscription_id, or paid_subscription_ids) for the subscriber to delete.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/subscribers/remove' );
		$request->set_param( 'user_id', $user_id );
		$request->set_param( 'email_subscription_id', $email_subscription_id );
		$request->set_param( 'paid_subscription_ids', $paid_subscription_ids );

		return static::dispatch( $request );
	}

	/**
	 * Execute: bulk delete. Iterates over the singular delete because the
	 * underlying WPCOM API does not expose a bulk endpoint, and we want the
	 * same per-step partial-failure visibility users get from the single-item
	 * dashboard delete.
	 *
	 * Capped at 100 by the input schema. The cap matches the dashboard's
	 * pagination ceiling and keeps the operation bounded in a single request.
	 *
	 * @param array|null $input Ability input.
	 * @return array|\WP_Error
	 */
	public static function bulk_delete_subscribers( $input = null ) {
		$input = is_array( $input ) ? $input : array();
		if ( ! isset( $input['subscribers'] ) || ! is_array( $input['subscribers'] ) || empty( $input['subscribers'] ) ) {
			return new \WP_Error(
				'jetpack_subscribers_bulk_delete_empty',
				__( 'Provide a non-empty subscribers[] array.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$deleted = array();
		$failed  = array();

		foreach ( $input['subscribers'] as $index => $entry ) {
			$entry  = is_array( $entry ) ? $entry : array();
			$result = static::delete_subscriber( $entry );

			$user_id               = isset( $entry['user_id'] ) ? (int) $entry['user_id'] : 0;
			$email_subscription_id = isset( $entry['email_subscription_id'] ) ? (int) $entry['email_subscription_id'] : 0;

			if ( is_wp_error( $result ) ) {
				$failed[] = array(
					'index'  => (int) $index,
					'errors' => array(
						array(
							'step'  => 'dispatch',
							'id'    => '',
							'error' => $result->get_error_message(),
						),
					),
				);
				continue;
			}

			$ok          = isset( $result['ok'] ) ? (bool) $result['ok'] : false;
			$step_errors = isset( $result['errors'] ) && is_array( $result['errors'] ) ? $result['errors'] : array();

			if ( $ok && empty( $step_errors ) ) {
				$deleted[] = array(
					'index'                 => (int) $index,
					'user_id'               => $user_id,
					'email_subscription_id' => $email_subscription_id,
				);
			} else {
				$failed[] = array(
					'index'  => (int) $index,
					'errors' => $step_errors,
				);
			}
		}

		return array(
			'ok'      => empty( $failed ),
			'deleted' => $deleted,
			'failed'  => $failed,
		);
	}

	/**
	 * Dispatch a `WP_REST_Request` through the REST server and normalize the
	 * response into the ability return shape. Extracted as a protected seam so
	 * tests can stub the REST hop without booting the full server.
	 *
	 * @param WP_REST_Request $request Request to dispatch.
	 * @return array|\WP_Error
	 */
	protected static function dispatch( WP_REST_Request $request ) {
		$response = rest_do_request( $request );

		if ( $response->is_error() ) {
			return $response->as_error();
		}

		$data = $response->get_data();
		return is_array( $data ) ? $data : array( 'data' => $data );
	}
}
