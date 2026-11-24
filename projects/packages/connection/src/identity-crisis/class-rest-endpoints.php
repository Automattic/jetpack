<?php
/**
 * Identity_Crisis REST endpoints of the Connection package.
 *
 * @package  automattic/jetpack-connection
 */

namespace Automattic\Jetpack\IdentityCrisis;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication;
use Jetpack_Options;
use Jetpack_XMLRPC_Server;
use WP_Error;
use WP_HTTP_Response;
use WP_REST_Server;

/**
 * This class will handle Identity Crisis Endpoints
 *
 * @since automattic/jetpack-identity-crisis:0.2.0
 * @since 2.9.0
 */
class REST_Endpoints {

	/**
	 * Initialize REST routes.
	 */
	public static function initialize_rest_api() {

		// Confirm that a site in identity crisis should be in staging mode.
		register_rest_route(
			'jetpack/v4',
			'/identity-crisis/confirm-safe-mode',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::confirm_safe_mode',
				'permission_callback' => __CLASS__ . '::identity_crisis_mitigation_permission_check',
			)
		);

		// Handles the request to migrate stats and subscribers during an identity crisis.
		register_rest_route(
			'jetpack/v4',
			'identity-crisis/migrate',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::migrate_stats_and_subscribers',
				'permission_callback' => __CLASS__ . '::identity_crisis_mitigation_permission_check',
			)
		);

		// IDC resolve: create an entirely new shadow site for this URL.
		register_rest_route(
			'jetpack/v4',
			'/identity-crisis/start-fresh',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::start_fresh_connection',
				'permission_callback' => __CLASS__ . '::identity_crisis_mitigation_permission_check',
				'args'                => array(
					'from'         => array(
						'description' => __( 'Indicates where the registration action was triggered for tracking/segmentation purposes', 'jetpack-connection' ),
						'type'        => 'string',
					),
					'redirect_uri' => array(
						'description' => __( 'URI of the admin page where the user should be redirected after connection flow', 'jetpack-connection' ),
						'type'        => 'string',
					),
				),
			)
		);

		// Fetch URL and secret for IDC check.
		register_rest_route(
			'jetpack/v4',
			'/identity-crisis/idc-url-validation',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( static::class, 'validate_urls_and_set_secret' ),
				'permission_callback' => array( static::class, 'url_secret_permission_check' ),
			)
		);

		// Fetch URL verification secret.
		register_rest_route(
			'jetpack/v4',
			'/identity-crisis/url-secret',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( static::class, 'fetch_url_secret' ),
				'permission_callback' => array( static::class, 'url_secret_permission_check' ),
			)
		);

		// Fetch URL verification secret.
		register_rest_route(
			'jetpack/v4',
			'/identity-crisis/compare-url-secret',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( static::class, 'compare_url_secret' ),
				'permission_callback' => array( static::class, 'compare_url_secret_permission_check' ),
				'args'                => array(
					'secret' => array(
						'description' => __( 'URL secret to compare to the ones stored in the database.', 'jetpack-connection' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
			)
		);
	}

	/**
	 * Handles identity crisis mitigation, confirming safe mode for this site.
	 *
	 * @since 0.2.0
	 * @since-jetpack 4.4.0
	 *
	 * @return bool | WP_Error True if option is properly set.
	 */
	public static function confirm_safe_mode() {
		// Read the option's true DB state, not a stale cached copy: on sites with
		// a persistent object cache, a prior un-confirm (the admin-bar "clear
		// confirmation" action deletes jetpack_safe_mode_confirmed) can leave a
		// lingering cached value that would make update_option() below see the new
		// value as unchanged and report a false failure.
		self::flush_jetpack_option_cache( 'jetpack_safe_mode_confirmed' );

		// update_option() returns false both when the write fails and when the
		// value is already set, so treat an already-confirmed option as success.
		if (
			Jetpack_Options::get_option( 'safe_mode_confirmed' )
			|| Jetpack_Options::update_option( 'safe_mode_confirmed', true )
		) {
			return rest_ensure_response(
				array(
					'code' => 'success',
				)
			);
		}

		return new WP_Error(
			'error_setting_jetpack_safe_mode',
			esc_html__( 'Could not confirm safe mode.', 'jetpack-connection' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Flush any cached copy of a Jetpack option so a subsequent read reflects the
	 * option's true state in the database.
	 *
	 * Jetpack options are stored as autoloaded `jetpack_*` WordPress options, so
	 * bust both the individual key and the autoloaded-options cache to keep
	 * persistent object caches from returning a stale value across requests.
	 *
	 * @since 8.7.0
	 *
	 * @param string $option The prefixed option name (e.g. `jetpack_safe_mode_confirmed`).
	 */
	private static function flush_jetpack_option_cache( $option ) {
		wp_cache_delete( $option, 'options' );
		wp_cache_delete( 'alloptions', 'options' );
	}

	/**
	 * Flush any cached copy of the sync_error_idc option so a subsequent read
	 * reflects the option's true state in the database.
	 *
	 * @since 8.7.0
	 */
	private static function flush_sync_error_idc_cache() {
		self::flush_jetpack_option_cache( 'jetpack_sync_error_idc' );
	}

	/**
	 * Handles identity crisis mitigation, migrating stats and subscribers from old url to this, new url.
	 *
	 * @since 0.2.0
	 * @since-jetpack 4.4.0
	 *
	 * @return bool | WP_Error True if option is properly set.
	 */
	public static function migrate_stats_and_subscribers() {
		// Read the option's true DB state, not a stale cached copy: on sites with
		// a persistent object cache, a prior successful migrate (or an IDC
		// revalidation) may have already removed the option while a cached value
		// lingers, which would otherwise make the delete below report a false
		// failure.
		self::flush_sync_error_idc_cache();

		if ( Jetpack_Options::get_option( 'sync_error_idc' ) ) {
			Jetpack_Options::delete_option( 'sync_error_idc' );

			// delete_option() returns false both when the write fails and when
			// there is nothing to delete, so re-read (cache-busted) and only treat
			// a still-present option as a real failure.
			self::flush_sync_error_idc_cache();

			if ( Jetpack_Options::get_option( 'sync_error_idc' ) ) {
				return new WP_Error(
					'error_deleting_sync_error_idc',
					esc_html__( 'Could not delete sync error option.', 'jetpack-connection' ),
					array( 'status' => 500 )
				);
			}
		}

		if ( Jetpack_Options::get_option( 'migrate_for_idc' ) || Jetpack_Options::update_option( 'migrate_for_idc', true ) ) {
			return rest_ensure_response(
				array(
					'code' => 'success',
				)
			);
		}
		return new WP_Error(
			'error_setting_jetpack_migrate',
			esc_html__( 'Could not confirm migration.', 'jetpack-connection' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * This IDC resolution will disconnect the site and re-connect to a completely new
	 * and separate shadow site than the original.
	 *
	 * It will first will disconnect the site without phoning home as to not disturb the production site.
	 * It then builds a fresh connection URL and sends it back along with the response.
	 *
	 * @since 0.2.0
	 * @since-jetpack 4.4.0
	 * @since 9.18.3 Accepts `from`, reported to WordPress.com for the registration and the authorization.
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function start_fresh_connection( $request ) {
		/**
		 * Fires when Users have requested through Identity Crisis for the connection to be reset.
		 * Should be used to disconnect any connections and reset options.
		 *
		 * @since 0.2.0
		 */
		do_action( 'jetpack_idc_disconnect' );

		$connection = new Connection_Manager();

		// Before registering, so the registration is attributed too, as in the connection/register endpoint.
		$from = (string) $request->get_param( 'from' );
		if ( '' !== $from ) {
			$connection->add_register_request_param( 'from', $from );
		}

		$result = $connection->try_registration( true, true );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$redirect_uri = $request->get_param( 'redirect_uri' ) ? admin_url( $request->get_param( 'redirect_uri' ) ) : null;

		/**
		 * Filters the connection url that users should be redirected to for re-establishing their connection.
		 *
		 * The data must be an http(s) URL; anything else makes the endpoint return a `start_fresh_missing_connection_url` error.
		 *
		 * @since 0.2.0
		 *
		 * @param \WP_REST_Response|WP_Error    $connection_url Connection URL user should be redirected to.
		 */
		$response = apply_filters( 'jetpack_idc_authorization_url', rest_ensure_response( $connection->get_authorization_url( null, $redirect_uri, $from ) ) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		// The Safe Mode screens send the browser to whatever comes back, so it must be a web address.
		$url = $response instanceof WP_HTTP_Response ? $response->get_data() : $response;
		if ( ! is_string( $url ) || ! in_array( strtolower( (string) wp_parse_url( $url, PHP_URL_SCHEME ) ), array( 'http', 'https' ), true ) ) {
			return new WP_Error(
				'start_fresh_missing_connection_url',
				esc_html__( 'Jetpack could not get the address to connect this site to WordPress.com.', 'jetpack-connection' ),
				array( 'status' => 500 )
			);
		}

		return $response;
	}

	/**
	 * Verify that user can mitigate an identity crisis.
	 *
	 * @since 0.2.0
	 * @since-jetpack 4.4.0
	 *
	 * @return true|WP_Error True if the user has capability 'jetpack_disconnect', an error object otherwise.
	 */
	public static function identity_crisis_mitigation_permission_check() {
		if ( current_user_can( 'jetpack_disconnect' ) ) {
			return true;
		}
		$error_msg = esc_html__(
			'You do not have the correct user permissions to perform this action. Please contact your site admin if you think this is a mistake.',
			'jetpack-connection'
		);

		return new WP_Error( 'invalid_user_permission_identity_crisis', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Endpoint for URL validation and creating a secret.
	 *
	 * @since 0.18.0
	 *
	 * @return array
	 */
	public static function validate_urls_and_set_secret() {
		$xmlrpc_server = new Jetpack_XMLRPC_Server();
		$result        = $xmlrpc_server->validate_urls_for_idc_mitigation();

		return $result;
	}

	/**
	 * Endpoint for fetching the existing secret.
	 *
	 * @return WP_Error|\WP_REST_Response
	 */
	public static function fetch_url_secret() {
		$secret = new URL_Secret();

		if ( ! $secret->exists() ) {
			return new WP_Error( 'missing_url_secret', esc_html__( 'URL secret does not exist.', 'jetpack-connection' ) );
		}

		return rest_ensure_response(
			array(
				'code' => 'success',
				'data' => array(
					'secret'     => $secret->get_secret(),
					'expires_at' => $secret->get_expires_at(),
				),
			)
		);
	}

	/**
	 * Endpoint for comparing the existing secret.
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return WP_Error|\WP_REST_Response
	 */
	public static function compare_url_secret( $request ) {
		$match = false;

		$storage = new URL_Secret();

		if ( $storage->exists() ) {
			$remote_secret = $request->get_param( 'secret' );
			$match         = $remote_secret && hash_equals( $storage->get_secret(), $remote_secret );
		}

		return rest_ensure_response(
			array(
				'code'  => 'success',
				'match' => $match,
			)
		);
	}

	/**
	 * Verify url_secret create/fetch permissions (valid blog token authentication).
	 *
	 * @return true|WP_Error
	 */
	public static function url_secret_permission_check() {
		return Rest_Authentication::is_signed_with_blog_token()
			? true
			: new WP_Error(
				'invalid_user_permission_identity_crisis',
				esc_html__( 'You do not have the correct user permissions to perform this action.', 'jetpack-connection' ),
				array( 'status' => rest_authorization_required_code() )
			);
	}

	/**
	 * The endpoint is only available on non-connected sites.
	 * use `/identity-crisis/url-secret` for connected sites.
	 *
	 * @return true|WP_Error
	 */
	public static function compare_url_secret_permission_check() {
		return ( new Connection_Manager() )->is_connected()
			? new WP_Error(
				'invalid_connection_status',
				esc_html__( 'The endpoint is not available on connected sites.', 'jetpack-connection' ),
				array( 'status' => 403 )
			)
			: true;
	}
}
