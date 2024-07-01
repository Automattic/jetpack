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
					'redirect_uri' => array(
						'description' => __( 'URI of the admin page where the user should be redirected after connection flow', 'jetpack-idc' ),
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
						'description' => __( 'URL secret to compare to the ones stored in the database.', 'jetpack-idc' ),
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
		$updated = Jetpack_Options::update_option( 'safe_mode_confirmed', true );
		if ( $updated ) {
			return rest_ensure_response(
				array(
					'code' => 'success',
				)
			);
		}

		return new WP_Error(
			'error_setting_jetpack_safe_mode',
			esc_html__( 'Could not confirm safe mode.', 'jetpack-idc' ),
			array( 'status' => 500 )
		);
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
		if ( Jetpack_Options::get_option( 'sync_error_idc' ) && ! Jetpack_Options::delete_option( 'sync_error_idc' ) ) {
			return new WP_Error(
				'error_deleting_sync_error_idc',
				esc_html__( 'Could not delete sync error option.', 'jetpack-idc' ),
				array( 'status' => 500 )
			);
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
			esc_html__( 'Could not confirm migration.', 'jetpack-idc' ),
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
		$result     = $connection->try_registration( true );

		// early return if site registration fails.
		if ( ! $result || is_wp_error( $result ) ) {
			return rest_ensure_response( $result );
		}

		$redirect_uri = $request->get_param( 'redirect_uri' ) ? admin_url( $request->get_param( 'redirect_uri' ) ) : null;

		/**
		 * Filters the connection url that users should be redirected to for re-establishing their connection.
		 *
		 * @since 0.2.0
		 *
		 * @param \WP_REST_Response|WP_Error    $connection_url Connection URL user should be redirected to.
		 */
		return apply_filters( 'jetpack_idc_authorization_url', rest_ensure_response( $connection->get_authorization_url( null, $redirect_uri ) ) );
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
			'You do not have the correct user permissions to perform this action.
			Please contact your site admin if you think this is a mistake.',
			'jetpack-idc'
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
			return new WP_Error( 'missing_url_secret', esc_html__( 'URL secret does not exist.', 'jetpack-idc' ) );
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
				esc_html__( 'You do not have the correct user permissions to perform this action.', 'jetpack-idc' ),
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
				esc_html__( 'The endpoint is not available on connected sites.', 'jetpack-idc' ),
				array( 'status' => 403 )
			)
			: true;
	}
}
