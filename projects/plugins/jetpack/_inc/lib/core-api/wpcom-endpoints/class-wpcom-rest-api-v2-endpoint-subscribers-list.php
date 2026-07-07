<?php
/**
 * Subscribers List REST endpoint.
 *
 * Proxies the WP.com `/wpcom/v2/sites/{blog_id}/subscribers` endpoint so the
 * Subscribers Dashboard wp-admin page can render a live DataViews table on
 * Jetpack-connected self-hosted sites.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Subscribers_List
 */
class WPCOM_REST_API_V2_Endpoint_Subscribers_List extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'subscribers/list';

		// On WPCOM the matching endpoint is registered via the wpcom-rest-api-v2 plugin loader,
		// where it talks to subscriber storage directly.
		$this->wpcom_is_wpcom_only_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 *
	 * Gated behind the same `rsm_jetpack_ui_modernization_newsletter` filter the dashboard UI uses
	 * (mirrors `Automattic\Jetpack\Newsletter\Settings::MODERNIZATION_FILTER`). Checked here, on
	 * `rest_api_init`, so theme-added filters have a chance to land before the gate evaluates.
	 *
	 * The filter defaults on for every site; hosts can opt out with
	 * `add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_false' )`.
	 */
	public function register_routes() {
		if ( ! apply_filters( 'rsm_jetpack_ui_modernization_newsletter', true ) ) {
			return;
		}

		register_rest_route(
			$this->namespace,
			'/subscribers/add',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'add_subscribers' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'emails' => array(
							'type'              => 'array',
							'items'             => array( 'type' => 'string' ),
							'required'          => true,
							'validate_callback' => function ( $value ) {
								return is_array( $value ) && count( $value ) > 0;
							},
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/subscribers/remove',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'remove_subscriber' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'user_id'               => array(
							'type'    => 'integer',
							'default' => 0,
							'minimum' => 0,
						),
						'email_subscription_id' => array(
							'type'    => 'integer',
							'default' => 0,
							'minimum' => 0,
						),
						'paid_subscription_ids' => array(
							'type'    => 'array',
							'items'   => array( 'type' => 'string' ),
							'default' => array(),
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/subscribers/individual',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_subscriber_individual' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'subscription_id' => array(
							'type'    => 'integer',
							'default' => 0,
							'minimum' => 0,
						),
						'user_id'         => array(
							'type'    => 'integer',
							'default' => 0,
							'minimum' => 0,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/subscribers/individual-stats',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_subscriber_stats' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'subscription_id' => array(
							'type'    => 'integer',
							'default' => 0,
							'minimum' => 0,
						),
						'user_id'         => array(
							'type'    => 'integer',
							'default' => 0,
							'minimum' => 0,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/subscribers/import',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_import_jobs' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/subscribers/import/reset-state',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'reset_import_state' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/subscribers/totals',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_subscriber_totals' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_subscribers' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'page'           => array(
							'type'    => 'integer',
							'default' => 1,
							'minimum' => 1,
						),
						'per_page'       => array(
							'type'    => 'integer',
							'default' => 10,
							'minimum' => 1,
							'maximum' => 100,
						),
						'sort'           => array(
							'type'    => 'string',
							'default' => 'date_subscribed',
							'enum'    => array( 'date_subscribed', 'name', 'plan', 'subscription_status' ),
						),
						'sort_order'     => array(
							'type'    => 'string',
							'default' => 'desc',
							'enum'    => array( 'asc', 'desc' ),
						),
						'search'         => array(
							'type'    => 'string',
							'default' => '',
						),
						'filters'        => array(
							'type'    => 'array',
							'items'   => array( 'type' => 'string' ),
							'default' => array( 'all' ),
						),
						'use_new_helper' => array(
							'type'    => 'boolean',
							'default' => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/subscribers/products',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_memberships_products' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/subscribers/comp',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'add_comp' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'user_id'       => array(
							'type'     => 'integer',
							'required' => true,
							'minimum'  => 1,
						),
						'plan_id'       => array(
							'type'     => 'integer',
							'required' => true,
							'minimum'  => 1,
						),
						'no_expiration' => array(
							'type'    => 'boolean',
							'default' => false,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/subscribers/remove-comp',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'remove_comp' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'comp_id' => array(
							'type'     => 'integer',
							'required' => true,
							'minimum'  => 1,
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check — manage_options matches the wp-admin Subscribers menu cap.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'authorization_required',
				__( 'You are not allowed to view subscribers for this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Proxy GET /wpcom/v2/sites/{blog_id}/subscribers.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_subscribers( $request ) {
		$blog_id = Connection_Manager::get_site_id();

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$query = array(
			'page'           => (int) $request->get_param( 'page' ),
			'per_page'       => (int) $request->get_param( 'per_page' ),
			'sort'           => (string) $request->get_param( 'sort' ),
			'sort_order'     => (string) $request->get_param( 'sort_order' ),
			'use_new_helper' => $request->get_param( 'use_new_helper' ) ? 'true' : 'false',
		);

		$search = (string) $request->get_param( 'search' );
		if ( '' !== $search ) {
			$query['search'] = $search;
		}

		$query_string = http_build_query( $query );

		$filters = (array) $request->get_param( 'filters' );
		foreach ( $filters as $filter ) {
			$query_string .= '&' . rawurlencode( 'filters[]' ) . '=' . rawurlencode( (string) $filter );
		}

		$path = sprintf( '/sites/%d/subscribers?%s', (int) $blog_id, $query_string );

		$response = Client::wpcom_json_api_request_as_user(
			$path,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			return new WP_Error(
				'subscribers_list_failed',
				is_array( $body ) && isset( $body['message'] ) ? $body['message'] : __( 'Could not fetch subscribers.', 'jetpack' ),
				array( 'status' => $status )
			);
		}

		return rest_ensure_response( $body );
	}

	/**
	 * Proxy GET /wpcom/v2/sites/{blog_id}/subscribers/counts.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_subscriber_totals() {
		$blog_id = Connection_Manager::get_site_id();

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/subscribers/counts', (int) $blog_id ),
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			return new WP_Error(
				'subscribers_totals_failed',
				is_array( $body ) && isset( $body['message'] ) ? $body['message'] : __( 'Could not fetch subscriber totals.', 'jetpack' ),
				array( 'status' => $status )
			);
		}

		return rest_ensure_response( $body );
	}

	/**
	 * Remove a subscriber by cancelling any paid subscriptions and deleting both the WPCOM
	 * follower and email follower records, mirroring Calypso's `useSubscriberRemoveMutation`.
	 *
	 * Proxies to the consolidated wpcom `/sites/{blog_id}/subscribers/remove` (v2) endpoint, which
	 * runs all three steps in-process after switching to the blog and returns an aggregated
	 * `{ ok, errors }` result. Forwarded as the current user (not the blog token): the wpcom/v2
	 * authorization layer maps the Jetpack user token to the wpcom user, so the endpoint's
	 * `manage_options` gate evaluates against the acting admin — unlike the classic v1.1 `/rest`
	 * API, which left the request with no current user.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function remove_subscriber( $request ) {
		$blog_id = Connection_Manager::get_site_id();

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$user_id               = (int) $request->get_param( 'user_id' );
		$email_subscription_id = (int) $request->get_param( 'email_subscription_id' );
		$paid_subscription_ids = array_values(
			array_filter( array_map( 'strval', (array) $request->get_param( 'paid_subscription_ids' ) ) )
		);

		if ( ! $user_id && ! $email_subscription_id && empty( $paid_subscription_ids ) ) {
			return new WP_Error(
				'subscribers_remove_invalid',
				__( 'No subscriber identifiers were provided.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/subscribers/remove', (int) $blog_id ),
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
			),
			wp_json_encode(
				array(
					'user_id'               => $user_id,
					'email_subscription_id' => $email_subscription_id,
					'paid_subscription_ids' => $paid_subscription_ids,
				),
				JSON_UNESCAPED_SLASHES
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			return new WP_Error(
				'subscribers_remove_failed',
				is_array( $body ) && isset( $body['message'] ) ? $body['message'] : __( 'Could not remove the subscriber.', 'jetpack' ),
				array( 'status' => $status )
			);
		}

		return rest_ensure_response( $body );
	}

	/**
	 * Proxy GET /wpcom/v2/sites/{blog_id}/subscribers/individual.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_subscriber_individual( $request ) {
		$blog_id         = Connection_Manager::get_site_id();
		$subscription_id = (int) $request->get_param( 'subscription_id' );
		$user_id         = (int) $request->get_param( 'user_id' );

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! $subscription_id && ! $user_id ) {
			return new WP_Error(
				'subscriber_individual_missing_id',
				__( 'Provide either a subscription_id or a user_id.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$type  = $user_id ? 'wpcom' : 'email';
		$query = $user_id
			? sprintf( 'user_id=%d&type=%s', $user_id, rawurlencode( $type ) )
			: sprintf( 'subscription_id=%d&type=%s', $subscription_id, rawurlencode( $type ) );

		return $this->wpcom_get( sprintf( '/sites/%d/subscribers/individual?%s', (int) $blog_id, $query ) );
	}

	/**
	 * Proxy GET /wpcom/v2/sites/{blog_id}/individual-subscriber-stats.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_subscriber_stats( $request ) {
		$blog_id         = Connection_Manager::get_site_id();
		$subscription_id = (int) $request->get_param( 'subscription_id' );
		$user_id         = (int) $request->get_param( 'user_id' );

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! $subscription_id && ! $user_id ) {
			return new WP_Error(
				'subscriber_stats_missing_id',
				__( 'Provide either a subscription_id or a user_id.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		$query = $user_id
			? sprintf( 'user_id=%d', $user_id )
			: sprintf( 'subscription_id=%d', $subscription_id );

		return $this->wpcom_get( sprintf( '/sites/%d/individual-subscriber-stats?%s', (int) $blog_id, $query ) );
	}

	/**
	 * Add subscribers by email — proxies to `/sites/{blog_id}/subscribers/import` (v2), the same
	 * async import job Calypso's Add Subscribers modal starts. Addresses are imported directly as
	 * subscribers (no invitation email); WP.com processes the job in the background and emails the
	 * importing user a "Subscriber import completed" summary when it finishes.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function add_subscribers( $request ) {
		$blog_id = Connection_Manager::get_site_id();

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$emails = (array) $request->get_param( 'emails' );
		$emails = array_values(
			array_filter(
				array_map( 'sanitize_email', $emails ),
				static function ( $email ) {
					return is_email( $email );
				}
			)
		);

		if ( empty( $emails ) ) {
			return new WP_Error(
				'subscribers_add_no_valid_emails',
				__( 'Provide at least one valid email address.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		// JSON body, not the form encoding Calypso submits: WP.com's Jetpack signature verifier
		// canonicalizes `application/x-www-form-urlencoded` bodies differently from the Jetpack
		// client (it re-encodes the parsed array as JSON before hashing), so a form-encoded POST
		// fails the body-hash check and arrives unauthenticated (user 0) — surfacing as a 401
		// `invalid_capabilities`. JSON bodies hash identically on both sides, and the endpoint
		// reads its params from either encoding. `parse_only => false` runs the import rather
		// than only validating the payload.
		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/subscribers/import', (int) $blog_id ),
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
			),
			wp_json_encode(
				array(
					'emails'     => $emails,
					'parse_only' => false,
				),
				JSON_UNESCAPED_SLASHES
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		// A successful import start carries the async job id as `upload_id`. Mirror Calypso, which
		// treats any response without one as a failure even when the HTTP status is 2xx.
		if ( $status >= 400 || ! is_array( $body ) || empty( $body['upload_id'] ) ) {
			return new WP_Error(
				'subscribers_add_failed',
				$this->get_wpcom_error_message( $body, __( 'Could not add subscribers.', 'jetpack' ) ),
				array( 'status' => $status >= 400 ? $status : 400 )
			);
		}

		return rest_ensure_response( $body );
	}

	/**
	 * Proxy GET /wpcom/v2/sites/{blog_id}/subscribers/import — the site's subscriber import jobs,
	 * newest first. The dashboard polls this while the Add Subscribers modal is open so it can
	 * show the "import in progress" / stale-import notices (WP.com runs one import per site at a
	 * time).
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_import_jobs() {
		$blog_id = Connection_Manager::get_site_id();

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		return $this->wpcom_get( sprintf( '/sites/%d/subscribers/import', (int) $blog_id ) );
	}

	/**
	 * POST /wpcom/v2/subscribers/import/reset-state — cancel stuck (pending / importing)
	 * subscriber import jobs, mirroring Calypso's stale-import "Cancel import" action
	 * (`useSubscriberImportStatusReset`). Proxies to the wpcom
	 * `/sites/{blog_id}/subscribers/import/reset_state` endpoint and returns its
	 * `{ reset_count }` body.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function reset_import_state() {
		$blog_id = Connection_Manager::get_site_id();

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/subscribers/import/reset_state', (int) $blog_id ),
			'2',
			array( 'method' => 'POST' ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			return new WP_Error(
				'subscribers_reset_import_failed',
				$this->get_wpcom_error_message( $body, __( 'Could not cancel the import.', 'jetpack' ) ),
				array( 'status' => $status )
			);
		}

		return rest_ensure_response( $body );
	}

	/**
	 * Proxy GET /wpcom/v2/sites/{blog_id}/memberships/products?type=all&is_editable=true — the
	 * paid newsletter / membership tiers configured on this site. Used by the Comp-a-subscription
	 * plan picker so the modal can offer "comp this subscriber on plan X".
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_memberships_products() {
		$blog_id = Connection_Manager::get_site_id();

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		return $this->wpcom_get(
			sprintf(
				'/sites/%d/memberships/products?type=all&is_editable=true',
				(int) $blog_id
			)
		);
	}

	/**
	 * POST /wpcom/v2/subscribers/comp — issue a complimentary subscription on a paid membership
	 * product for a single subscriber. Mirrors Calypso's `requestAddComp` thunk, which POSTs to
	 * `/sites/{id}/memberships/comps/{user_id}/{plan_id}`.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function add_comp( $request ) {
		$blog_id = Connection_Manager::get_site_id();

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$user_id       = (int) $request->get_param( 'user_id' );
		$plan_id       = (int) $request->get_param( 'plan_id' );
		$no_expiration = (bool) $request->get_param( 'no_expiration' );

		$body = $no_expiration
			? wp_json_encode( array( 'no_expiration' => true ), JSON_UNESCAPED_SLASHES )
			: null;

		$response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/memberships/comps/%d/%d',
				(int) $blog_id,
				$user_id,
				$plan_id
			),
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
			),
			$body,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		// The Memberships API can report a failure either with an HTTP error status or with a 2xx
		// response carrying an `error` payload (e.g. "User has already been comped this plan"), so
		// treat both as failures and surface the upstream message rather than a generic one.
		if ( $status >= 400 || ( is_array( $body ) && ! empty( $body['error'] ) ) ) {
			return new WP_Error(
				'subscribers_comp_failed',
				$this->get_wpcom_error_message( $body, __( 'Could not comp the subscription.', 'jetpack' ) ),
				array( 'status' => $status >= 400 ? $status : 400 )
			);
		}

		return rest_ensure_response( $body );
	}

	/**
	 * POST /wpcom/v2/subscribers/remove-comp — revoke a complimentary subscription. Mirrors
	 * Calypso's `requestDeleteComp`, which DELETEs
	 * `/sites/{id}/memberships/comp/{compId}` (singular `comp`).
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function remove_comp( $request ) {
		$blog_id = Connection_Manager::get_site_id();

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$comp_id = (int) $request->get_param( 'comp_id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/memberships/comp/%d',
				(int) $blog_id,
				$comp_id
			),
			'2',
			array( 'method' => 'DELETE' ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		// Mirror add_comp: the Memberships API can report a failure with an error status or with a
		// 2xx response that carries an `error` payload, so treat both as failures.
		if ( $status >= 400 || ( is_array( $body ) && ! empty( $body['error'] ) ) ) {
			return new WP_Error(
				'subscribers_remove_comp_failed',
				$this->get_wpcom_error_message( $body, __( 'Could not remove the comp.', 'jetpack' ) ),
				array( 'status' => $status >= 400 ? $status : 400 )
			);
		}

		return rest_ensure_response( $body );
	}

	/**
	 * Extract the most specific human-readable error message from a wpcom Memberships API response
	 * body. The Memberships endpoints nest the reason under `error.message` (e.g. "User has already
	 * been comped this plan"); fall back to a top-level `message`, a string `error`, then the default.
	 *
	 * @param mixed  $body            Decoded response body.
	 * @param string $default_message Fallback used when the body carries no message.
	 * @return string Error message.
	 */
	private function get_wpcom_error_message( $body, $default_message ) {
		if ( is_array( $body ) ) {
			if ( isset( $body['error']['message'] ) && is_string( $body['error']['message'] ) ) {
				return $body['error']['message'];
			}
			if ( isset( $body['message'] ) && is_string( $body['message'] ) ) {
				return $body['message'];
			}
			if ( isset( $body['error'] ) && is_string( $body['error'] ) ) {
				return $body['error'];
			}
		}

		return $default_message;
	}

	/**
	 * Helper: GET a wpcom v2 path on this site as the current user. Returns the parsed JSON
	 * response or a WP_Error.
	 *
	 * @param string $path Path under `/wpcom/v2`, including any query string.
	 * @return WP_REST_Response|WP_Error
	 */
	private function wpcom_get( $path ) {
		$response = Client::wpcom_json_api_request_as_user(
			$path,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			return new WP_Error(
				'wpcom_call_failed',
				is_array( $body ) && isset( $body['message'] ) ? $body['message'] : __( 'WP.com call failed.', 'jetpack' ),
				array( 'status' => $status )
			);
		}

		return rest_ensure_response( $body );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Subscribers_List' );
