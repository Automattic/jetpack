<?php
/**
 * Sets up the Connection REST API endpoints.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Status;
use Jetpack_XMLRPC_Server;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Registers the REST routes for Connections.
 */
class REST_Connector {
	/**
	 * The Connection Manager.
	 *
	 * @var Manager
	 */
	private $connection;

	/**
	 * This property stores the localized "Insufficient Permissions" error message.
	 *
	 * @var string Generic error message when user is not allowed to perform an action.
	 */
	private static $user_permissions_error_msg;

	const JETPACK__DEBUGGER_PUBLIC_KEY = "\r\n" . '-----BEGIN PUBLIC KEY-----' . "\r\n"
	. 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAm+uLLVoxGCY71LS6KFc6' . "\r\n"
	. '1UnF6QGBAsi5XF8ty9kR3/voqfOkpW+gRerM2Kyjy6DPCOmzhZj7BFGtxSV2ZoMX' . "\r\n"
	. '9ZwWxzXhl/Q/6k8jg8BoY1QL6L2K76icXJu80b+RDIqvOfJruaAeBg1Q9NyeYqLY' . "\r\n"
	. 'lEVzN2vIwcFYl+MrP/g6Bc2co7Jcbli+tpNIxg4Z+Hnhbs7OJ3STQLmEryLpAxQO' . "\r\n"
	. 'q8cbhQkMx+FyQhxzSwtXYI/ClCUmTnzcKk7SgGvEjoKGAmngILiVuEJ4bm7Q1yok' . "\r\n"
	. 'xl9+wcfW6JAituNhml9dlHCWnn9D3+j8pxStHihKy2gVMwiFRjLEeD8K/7JVGkb/' . "\r\n"
	. 'EwIDAQAB' . "\r\n"
	. '-----END PUBLIC KEY-----' . "\r\n";

	/**
	 * Constructor.
	 *
	 * @param Manager $connection The Connection Manager.
	 */
	public function __construct( Manager $connection ) {
		$this->connection = $connection;

		self::$user_permissions_error_msg = esc_html__(
			'You do not have the correct user permissions to perform this action.
			Please contact your site admin if you think this is a mistake.',
			'jetpack'
		);

		if ( ! $this->connection->has_connected_owner() ) {
			// Register a site.
			register_rest_route(
				'jetpack/v4',
				'/verify_registration',
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'verify_registration' ),
					'permission_callback' => '__return_true',
				)
			);
		}

		// Authorize a remote user.
		register_rest_route(
			'jetpack/v4',
			'/remote_authorize',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::remote_authorize',
				'permission_callback' => '__return_true',
			)
		);

		// Get current connection status of Jetpack.
		register_rest_route(
			'jetpack/v4',
			'/connection',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::connection_status',
				'permission_callback' => '__return_true',
			)
		);

		// Get list of plugins that use the Jetpack connection.
		register_rest_route(
			'jetpack/v4',
			'/connection/plugins',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_connection_plugins' ),
				'permission_callback' => __CLASS__ . '::connection_plugins_permission_check',
			)
		);

		// Full or partial reconnect in case of connection issues.
		register_rest_route(
			'jetpack/v4',
			'/connection/reconnect',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'connection_reconnect' ),
				'permission_callback' => __CLASS__ . '::jetpack_reconnect_permission_check',
			)
		);

		// Register the site (get `blog_token`).
		register_rest_route(
			'jetpack/v4',
			'/connection/register',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'connection_register' ),
				'permission_callback' => __CLASS__ . '::jetpack_register_permission_check',
				'args'                => array(
					'from'               => array(
						'description' => 'Indicates where the registration action was triggered for tracking/segmetnation purposes',
						'type'        => 'string',
					),
					'registration_nonce' => array(
						'description' => 'The registration nonce',
						'type'        => 'string',
					),
				),
			)
		);
	}

	/**
	 * Handles verification that a site is registered.
	 *
	 * @since 5.4.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return string|WP_Error
	 */
	public function verify_registration( WP_REST_Request $request ) {
		$registration_data = array( $request['secret_1'], $request['state'] );

		return $this->connection->handle_registration( $registration_data );
	}

	/**
	 * Handles verification that a site is registered
	 *
	 * @since 5.4.0
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array|wp-error
	 */
	public static function remote_authorize( $request ) {
		$xmlrpc_server = new Jetpack_XMLRPC_Server();
		$result        = $xmlrpc_server->remote_authorize( $request );

		if ( is_a( $result, 'IXR_Error' ) ) {
			$result = new WP_Error( $result->code, $result->message );
		}

		return $result;
	}

	/**
	 * Get connection status for this Jetpack site.
	 *
	 * @since 4.3.0
	 *
	 * @param bool $rest_response Should we return a rest response or a simple array. Default to rest response.
	 *
	 * @return WP_REST_Response|array Connection information.
	 */
	public static function connection_status( $rest_response = true ) {
		$status     = new Status();
		$connection = new Manager();

		$connection_status = array(
			'isActive'          => $connection->is_active(), // TODO deprecate this.
			'isStaging'         => $status->is_staging_site(),
			'isRegistered'      => $connection->is_connected(),
			'hasConnectedOwner' => $connection->has_connected_owner(),
			'offlineMode'       => array(
				'isActive'        => $status->is_offline_mode(),
				'constant'        => defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG,
				'url'             => $status->is_local_site(),
				/** This filter is documented in packages/status/src/class-status.php */
				'filter'          => ( apply_filters( 'jetpack_development_mode', false ) || apply_filters( 'jetpack_offline_mode', false ) ), // jetpack_development_mode is deprecated.
				'wpLocalConstant' => defined( 'WP_LOCAL_DEV' ) && WP_LOCAL_DEV,
			),
			'isPublic'          => '1' == get_option( 'blog_public' ), // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
		);

		/**
		 * Filters the connection status data.
		 *
		 * @since 9.6.0
		 *
		 * @param array An array containing the connection status data.
		 */
		$connection_status = apply_filters( 'jetpack_connection_status', $connection_status );

		if ( $rest_response ) {
			return rest_ensure_response(
				$connection_status
			);
		} else {
			return $connection_status;
		}
	}

	/**
	 * Get plugins connected to the Jetpack.
	 *
	 * @since 8.6.0
	 *
	 * @return WP_REST_Response|WP_Error Response or error object, depending on the request result.
	 */
	public function get_connection_plugins() {
		$plugins = $this->connection->get_connected_plugins();

		if ( is_wp_error( $plugins ) ) {
			return $plugins;
		}

		array_walk(
			$plugins,
			function ( &$data, $slug ) {
				$data['slug'] = $slug;
			}
		);

		return rest_ensure_response( array_values( $plugins ) );
	}

	/**
	 * Verify that user can view Jetpack admin page and can activate plugins.
	 *
	 * @since 8.8.0
	 *
	 * @return bool|WP_Error Whether user has the capability 'activate_plugins'.
	 */
	public static function activate_plugins_permission_check() {
		if ( current_user_can( 'activate_plugins' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_activate_plugins', self::get_user_permissions_error_msg(), array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Permission check for the connection_plugins endpoint
	 *
	 * @return bool|WP_Error
	 */
	public static function connection_plugins_permission_check() {
		if ( true === static::activate_plugins_permission_check() ) {
			return true;
		}

		if ( true === static::is_request_signed_by_jetpack_debugger() ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_activate_plugins', self::get_user_permissions_error_msg(), array( 'status' => rest_authorization_required_code() ) );

	}

	/**
	 * Verifies if the request was signed with the Jetpack Debugger key
	 *
	 * @param string|null $pub_key The public key used to verify the signature. Default is the Jetpack Debugger key. This is used for testing purposes.
	 *
	 * @return bool
	 */
	public static function is_request_signed_by_jetpack_debugger( $pub_key = null ) {
		 // phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['signature'], $_GET['timestamp'], $_GET['url'], $_GET['rest_route'] ) ) {
			return false;
		}

		// signature timestamp must be within 5min of current time.
		if ( abs( time() - (int) $_GET['timestamp'] ) > 300 ) {
			return false;
		}

		$signature = base64_decode( $_GET['signature'] ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode

		$signature_data = wp_json_encode(
			array(
				'rest_route' => $_GET['rest_route'],
				'timestamp'  => (int) $_GET['timestamp'],
				'url'        => wp_unslash( $_GET['url'] ),
			)
		);

		if (
			! function_exists( 'openssl_verify' )
			|| 1 !== openssl_verify(
				$signature_data,
				$signature,
				$pub_key ? $pub_key : static::JETPACK__DEBUGGER_PUBLIC_KEY
			)
		) {
			return false;
		}

		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		return true;
	}

	/**
	 * Verify that user is allowed to disconnect Jetpack.
	 *
	 * @since 8.8.0
	 *
	 * @return bool|WP_Error Whether user has the capability 'jetpack_disconnect'.
	 */
	public static function jetpack_reconnect_permission_check() {
		if ( current_user_can( 'jetpack_reconnect' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_jetpack_disconnect', self::get_user_permissions_error_msg(), array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Returns generic error message when user is not allowed to perform an action.
	 *
	 * @return string The error message.
	 */
	public static function get_user_permissions_error_msg() {
		return self::$user_permissions_error_msg;
	}

	/**
	 * The endpoint tried to partially or fully reconnect the website to WP.com.
	 *
	 * @since 8.8.0
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function connection_reconnect() {
		$response = array();

		$next = null;

		$result = $this->connection->restore();

		if ( is_wp_error( $result ) ) {
			$response = $result;
		} elseif ( is_string( $result ) ) {
			$next = $result;
		} else {
			$next = true === $result ? 'completed' : 'failed';
		}

		switch ( $next ) {
			case 'authorize':
				$response['status']       = 'in_progress';
				$response['authorizeUrl'] = $this->connection->get_authorization_url();
				break;
			case 'completed':
				$response['status'] = 'completed';
				/**
				 * Action fired when reconnection has completed successfully.
				 *
				 * @since 9.0.0
				 */
				do_action( 'jetpack_reconnection_completed' );
				break;
			case 'failed':
				$response = new WP_Error( 'Reconnect failed' );
				break;
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Verify that user is allowed to connect Jetpack.
	 *
	 * @since 9.7.0
	 *
	 * @return bool|WP_Error Whether user has the capability 'jetpack_connect'.
	 */
	public static function jetpack_register_permission_check() {
		if ( current_user_can( 'jetpack_connect' ) ) {
			return true;
		}

		return new WP_Error( 'invalid_user_permission_jetpack_connect', self::get_user_permissions_error_msg(), array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * The endpoint tried to partially or fully reconnect the website to WP.com.
	 *
	 * @since 7.7.0
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function connection_register( $request ) {
		if ( ! wp_verify_nonce( $request->get_param( 'registration_nonce' ), 'jetpack-registration-nonce' ) ) {
			return new WP_Error( 'invalid_nonce', __( 'Unable to verify your request.', 'jetpack' ), array( 'status' => 403 ) );
		}

		if ( isset( $request['from'] ) ) {
			$this->connection->add_register_request_param( 'from', (string) $request['from'] );
		}
		$result = $this->connection->try_registration();

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( class_exists( 'Jetpack' ) ) {
			$authorize_url = \Jetpack::build_authorize_url( false, ! $request->get_param( 'no_iframe' ) );
		} else {
			if ( ! $request->get_param( 'no_iframe' ) ) {
				add_filter( 'jetpack_use_iframe_authorization_flow', '__return_true' );
			}

			$authorize_url = $this->connection->get_authorization_url();

			if ( ! $request->get_param( 'no_iframe' ) ) {
				remove_filter( 'jetpack_use_iframe_authorization_flow', '__return_true' );
			}
		}

		return rest_ensure_response(
			array(
				'authorizeUrl' => $authorize_url,
			)
		);
	}

}
