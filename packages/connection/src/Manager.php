<?php
/**
 * The Jetpack Connection manager class file.
 *
 * @package jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Tracking;

/**
 * The Jetpack Connection Manager class that is used as a single gateway between WordPress.com
 * and Jetpack.
 */
class Manager implements Manager_Interface {

	const SECRETS_MISSING        = 'secrets_missing';
	const SECRETS_EXPIRED        = 'secrets_expired';
	const SECRETS_OPTION_NAME    = 'jetpack_secrets';
	const MAGIC_NORMAL_TOKEN_KEY = ';normal;';
	const JETPACK_MASTER_USER    = true;

	/**
	 * The procedure that should be run to generate secrets.
	 *
	 * @var Callable
	 */
	protected $secret_callable;

	/**
	 * A copy of the raw POST data for signature verification purposes.
	 *
	 * @var String
	 */
	protected $raw_post_data;

	/**
	 * Verification data needs to be stored to properly verify everything.
	 *
	 * @var Object
	 */
	private $xmlrpc_verification = null;

	/**
	 * Initializes required listeners. This is done separately from the constructors
	 * because some objects sometimes need to instantiate separate objects of this class.
	 *
	 * @todo Implement a proper nonce verification.
	 */
	public function init() {

		$is_jetpack_xmlrpc_request = $this->setup_xmlrpc_handlers(
			$_GET,
			$this->is_active(),
			$this->verify_xml_rpc_signature()
		);

		// All the XMLRPC functionality has been moved into setup_xmlrpc_handlers.
		if (
			! $is_jetpack_xmlrpc_request
			&& is_admin()
			&& isset( $_POST['action'] ) // phpcs:ignore WordPress.Security.NonceVerification
			&& (
				'jetpack_upload_file' === $_POST['action']  // phpcs:ignore WordPress.Security.NonceVerification
				|| 'jetpack_update_file' === $_POST['action']  // phpcs:ignore WordPress.Security.NonceVerification
			)
		) {
			$this->require_jetpack_authentication();
			$this->add_remote_request_handlers();
			return;
		}

		if ( $this->is_active() ) {
			add_action( 'login_form_jetpack_json_api_authorization', array( &$this, 'login_form_json_api_authorization' ) );
			add_filter( 'xmlrpc_methods', array( $this, 'public_xmlrpc_methods' ) );
		} else {
			add_action( 'rest_api_init', array( $this, 'initialize_rest_api_registration_connector' ) );
		}
	}

	/**
	 * Sets up the XMLRPC request handlers.
	 *
	 * @param Array                  $request_params incoming request parameters.
	 * @param Boolean                $is_active whether the connection is currently active.
	 * @param Boolean                $is_signed whether the signature check has been successful.
	 * @param \Jetpack_XMLRPC_Server $xmlrpc_server (optional) an instance of the server to use instead of instantiating a new one.
	 */
	public function setup_xmlrpc_handlers(
		$request_params,
		$is_active,
		$is_signed,
		\Jetpack_XMLRPC_Server $xmlrpc_server = null
	) {
		if (
			! isset( $request_params['for'] )
			|| 'jetpack' !== $request_params['for']
		) {
			return false;
		}

		// Alternate XML-RPC, via ?for=jetpack&jetpack=comms.
		if (
			isset( $request_params['jetpack'] )
			&& 'comms' === $request_params['jetpack']
		) {
			if ( ! Constants::is_defined( 'XMLRPC_REQUEST' ) ) {
				// Use the real constant here for WordPress' sake.
				define( 'XMLRPC_REQUEST', true );
			}

			add_action( 'template_redirect', array( $this, 'alternate_xmlrpc' ) );

			add_filter( 'xmlrpc_methods', array( $this, 'remove_non_jetpack_xmlrpc_methods' ), 1000 );
		}

		if ( ! Constants::get_constant( 'XMLRPC_REQUEST' ) ) {
			return false;
		}
		// Display errors can cause the XML to be not well formed.
		@ini_set( 'display_errors', false ); // phpcs:ignore

		if ( $xmlrpc_server ) {
			$this->xmlrpc_server = $xmlrpc_server;
		} else {
			$this->xmlrpc_server = new \Jetpack_XMLRPC_Server();
		}

		$this->require_jetpack_authentication();

		if ( $is_active ) {
			// Hack to preserve $HTTP_RAW_POST_DATA.
			add_filter( 'xmlrpc_methods', array( $this, 'xmlrpc_methods' ) );

			if ( $is_signed ) {
				// The actual API methods.
				add_filter( 'xmlrpc_methods', array( $this->xmlrpc_server, 'xmlrpc_methods' ) );
			} else {
				// The jetpack.authorize method should be available for unauthenticated users on a site with an
				// active Jetpack connection, so that additional users can link their account.
				add_filter( 'xmlrpc_methods', array( $this->xmlrpc_server, 'authorize_xmlrpc_methods' ) );
			}
		} else {
			// The bootstrap API methods.
			add_filter( 'xmlrpc_methods', array( $this->xmlrpc_server, 'bootstrap_xmlrpc_methods' ) );

			if ( $is_signed ) {
				// The jetpack Provision method is available for blog-token-signed requests.
				add_filter( 'xmlrpc_methods', array( $this->xmlrpc_server, 'provision_xmlrpc_methods' ) );
			} else {
				new XMLRPC_Connector( $this );
			}
		}

		add_filter( 'xmlrpc_blog_options', array( $this, 'xmlrpc_options' ) );

		add_action( 'jetpack_clean_nonces', array( $this, 'clean_nonces' ) );
		if ( ! wp_next_scheduled( 'jetpack_clean_nonces' ) ) {
			wp_schedule_event( time(), 'hourly', 'jetpack_clean_nonces' );
		}

		// Now that no one can authenticate, and we're whitelisting all XML-RPC methods, force enable_xmlrpc on.
		add_filter( 'pre_option_enable_xmlrpc', '__return_true' );

		return true;
	}

	/**
	 * Initializes the REST API connector on the init hook.
	 */
	public function initialize_rest_api_registration_connector() {
		new REST_Connector( $this );
	}

	/**
	 * Initializes all needed hooks and request handlers. Handles API calls, upload
	 * requests, authentication requests. Also XMLRPC options requests.
	 * Fallback XMLRPC is also a bridge, but probably can be a class that inherits
	 * this one. Among other things it should strip existing methods.
	 *
	 * @param Array $methods an array of API method names for the Connection to accept and
	 *                       pass on to existing callables. It's possible to specify whether
	 *                       each method should be available for unauthenticated calls or not.
	 * @see Jetpack::__construct
	 */
	public function initialize( $methods ) {
		$methods;
	}

	/**
	 * Since a lot of hosts use a hammer approach to "protecting" WordPress sites,
	 * and just blanket block all requests to /xmlrpc.php, or apply other overly-sensitive
	 * security/firewall policies, we provide our own alternate XML RPC API endpoint
	 * which is accessible via a different URI. Most of the below is copied directly
	 * from /xmlrpc.php so that we're replicating it as closely as possible.
	 *
	 * @todo Tighten $wp_xmlrpc_server_class a bit to make sure it doesn't do bad things.
	 */
	public function alternate_xmlrpc() {
		// phpcs:disable PHPCompatibility.Variables.RemovedPredefinedGlobalVariables.http_raw_post_dataDeprecatedRemoved
		// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited
		global $HTTP_RAW_POST_DATA;

		// Some browser-embedded clients send cookies. We don't want them.
		$_COOKIE = array();

		// A fix for mozBlog and other cases where '<?xml' isn't on the very first line.
		if ( isset( $HTTP_RAW_POST_DATA ) ) {
			$HTTP_RAW_POST_DATA = trim( $HTTP_RAW_POST_DATA );
		}

		// phpcs:enable

		include_once ABSPATH . 'wp-admin/includes/admin.php';
		include_once ABSPATH . WPINC . '/class-IXR.php';
		include_once ABSPATH . WPINC . '/class-wp-xmlrpc-server.php';

		/**
		 * Filters the class used for handling XML-RPC requests.
		 *
		 * @since 3.1.0
		 *
		 * @param string $class The name of the XML-RPC server class.
		 */
		$wp_xmlrpc_server_class = apply_filters( 'wp_xmlrpc_server_class', 'wp_xmlrpc_server' );
		$wp_xmlrpc_server       = new $wp_xmlrpc_server_class();

		// Fire off the request.
		nocache_headers();
		$wp_xmlrpc_server->serve_request();

		exit;
	}

	/**
	 * Removes all XML-RPC methods that are not `jetpack.*`.
	 * Only used in our alternate XML-RPC endpoint, where we want to
	 * ensure that Core and other plugins' methods are not exposed.
	 *
	 * @param array $methods a list of registered WordPress XMLRPC methods.
	 * @return array filtered $methods
	 */
	public function remove_non_jetpack_xmlrpc_methods( $methods ) {
		$jetpack_methods = array();

		foreach ( $methods as $method => $callback ) {
			if ( 0 === strpos( $method, 'jetpack.' ) ) {
				$jetpack_methods[ $method ] = $callback;
			}
		}

		return $jetpack_methods;
	}

	/**
	 * Removes all other authentication methods not to allow other
	 * methods to validate unauthenticated requests.
	 */
	public function require_jetpack_authentication() {
		// Don't let anyone authenticate.
		$_COOKIE = array();
		remove_all_filters( 'authenticate' );
		remove_all_actions( 'wp_login_failed' );

		if ( $this->is_active() ) {
			// Allow Jetpack authentication.
			add_filter( 'authenticate', array( $this, 'authenticate_jetpack' ), 10, 3 );
		}
	}

	/**
	 * Authenticates XML-RPC and other requests from the Jetpack Server
	 *
	 * @param WP_User|Mixed $user user object if authenticated.
	 * @param String        $username username.
	 * @param String        $password password string.
	 * @return WP_User|Mixed authenticated user or error.
	 */
	public function authenticate_jetpack( $user, $username, $password ) {
		if ( is_a( $user, '\\WP_User' ) ) {
			return $user;
		}

		$token_details = $this->verify_xml_rpc_signature();

		if ( ! $token_details ) {
			return $user;
		}

		if ( 'user' !== $token_details['type'] ) {
			return $user;
		}

		if ( ! $token_details['user_id'] ) {
			return $user;
		}

		nocache_headers();

		return new \WP_User( $token_details['user_id'] );
	}

	/**
	 * Verifies the signature of the current request.
	 *
	 * @return false|array
	 */
	public function verify_xml_rpc_signature() {
		if ( is_null( $this->xmlrpc_verification ) ) {
			$this->xmlrpc_verification = $this->internal_verify_xml_rpc_signature();

			if ( is_wp_error( $this->xmlrpc_verification ) ) {
				/**
				 * Action for logging XMLRPC signature verification errors. This data is sensitive.
				 *
				 * Error codes:
				 * - malformed_token
				 * - malformed_user_id
				 * - unknown_token
				 * - could_not_sign
				 * - invalid_nonce
				 * - signature_mismatch
				 *
				 * @since 7.5.0
				 *
				 * @param WP_Error $signature_verification_error The verification error
				 */
				do_action( 'jetpack_verify_signature_error', $this->xmlrpc_verification );
			}
		}

		return is_wp_error( $this->xmlrpc_verification ) ? false : $this->xmlrpc_verification;
	}

	/**
	 * Verifies the signature of the current request.
	 *
	 * This function has side effects and should not be used. Instead,
	 * use the memoized version `->verify_xml_rpc_signature()`.
	 *
	 * @internal
	 */
	private function internal_verify_xml_rpc_signature() {
		// It's not for us.
		if ( ! isset( $_GET['token'] ) || empty( $_GET['signature'] ) ) {
			return false;
		}

		$signature_details = array(
			'token'     => isset( $_GET['token'] ) ? wp_unslash( $_GET['token'] ) : '',
			'timestamp' => isset( $_GET['timestamp'] ) ? wp_unslash( $_GET['timestamp'] ) : '',
			'nonce'     => isset( $_GET['nonce'] ) ? wp_unslash( $_GET['nonce'] ) : '',
			'body_hash' => isset( $_GET['body-hash'] ) ? wp_unslash( $_GET['body-hash'] ) : '',
			'method'    => wp_unslash( $_SERVER['REQUEST_METHOD'] ),
			'url'       => wp_unslash( $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ), // Temp - will get real signature URL later.
			'signature' => isset( $_GET['signature'] ) ? wp_unslash( $_GET['signature'] ) : '',
		);

		@list( $token_key, $version, $user_id ) = explode( ':', wp_unslash( $_GET['token'] ) );
		if (
			empty( $token_key )
		||
			empty( $version ) || strval( JETPACK__API_VERSION ) !== $version
		) {
			return new \WP_Error( 'malformed_token', 'Malformed token in request', compact( 'signature_details' ) );
		}

		if ( '0' === $user_id ) {
			$token_type = 'blog';
			$user_id    = 0;
		} else {
			$token_type = 'user';
			if ( empty( $user_id ) || ! ctype_digit( $user_id ) ) {
				return new \WP_Error(
					'malformed_user_id',
					'Malformed user_id in request',
					compact( 'signature_details' )
				);
			}
			$user_id = (int) $user_id;

			$user = new \WP_User( $user_id );
			if ( ! $user || ! $user->exists() ) {
				return new \WP_Error(
					'unknown_user',
					sprintf( 'User %d does not exist', $user_id ),
					compact( 'signature_details' )
				);
			}
		}

		$token = $this->get_access_token( $user_id, $token_key, false );
		if ( is_wp_error( $token ) ) {
			$token->add_data( compact( 'signature_details' ) );
			return $token;
		} elseif ( ! $token ) {
			return new \WP_Error(
				'unknown_token',
				sprintf( 'Token %s:%s:%d does not exist', $token_key, $version, $user_id ),
				compact( 'signature_details' )
			);
		}

		$jetpack_signature = new \Jetpack_Signature( $token->secret, (int) \Jetpack_Options::get_option( 'time_diff' ) );
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		if ( isset( $_POST['_jetpack_is_multipart'] ) ) {
			$post_data   = $_POST;
			$file_hashes = array();
			foreach ( $post_data as $post_data_key => $post_data_value ) {
				if ( 0 !== strpos( $post_data_key, '_jetpack_file_hmac_' ) ) {
					continue;
				}
				$post_data_key                 = substr( $post_data_key, strlen( '_jetpack_file_hmac_' ) );
				$file_hashes[ $post_data_key ] = $post_data_value;
			}

			foreach ( $file_hashes as $post_data_key => $post_data_value ) {
				unset( $post_data[ "_jetpack_file_hmac_{$post_data_key}" ] );
				$post_data[ $post_data_key ] = $post_data_value;
			}

			ksort( $post_data );

			$body = http_build_query( stripslashes_deep( $post_data ) );
		} elseif ( is_null( $this->raw_post_data ) ) {
			$body = file_get_contents( 'php://input' );
		} else {
			$body = null;
		}
		// phpcs:enable

		$signature = $jetpack_signature->sign_current_request(
			array( 'body' => is_null( $body ) ? $this->raw_post_data : $body )
		);

		$signature_details['url'] = $jetpack_signature->current_request_url;

		if ( ! $signature ) {
			return new \WP_Error(
				'could_not_sign',
				'Unknown signature error',
				compact( 'signature_details' )
			);
		} elseif ( is_wp_error( $signature ) ) {
			return $signature;
		}

		$timestamp = (int) $_GET['timestamp'];
		$nonce     = stripslashes( (string) $_GET['nonce'] );

		// Use up the nonce regardless of whether the signature matches.
		if ( ! $this->add_nonce( $timestamp, $nonce ) ) {
			return new \WP_Error(
				'invalid_nonce',
				'Could not add nonce',
				compact( 'signature_details' )
			);
		}

		// Be careful about what you do with this debugging data.
		// If a malicious requester has access to the expected signature,
		// bad things might be possible.
		$signature_details['expected'] = $signature;

		if ( ! hash_equals( $signature, $_GET['signature'] ) ) {
			return new \WP_Error(
				'signature_mismatch',
				'Signature mismatch',
				compact( 'signature_details' )
			);
		}

		/**
		 * Action for additional token checking.
		 *
		 * @since 7.7.0
		 *
		 * @param Array $post_data request data.
		 * @param Array $token_data token data.
		 */
		return apply_filters(
			'jetpack_signature_check_token',
			array(
				'type'      => $token_type,
				'token_key' => $token_key,
				'user_id'   => $token->external_user_id,
			),
			$token,
			$this->raw_post_data
		);
	}

	/**
	 * Returns true if the current site is connected to WordPress.com.
	 *
	 * @return Boolean is the site connected?
	 */
	public function is_active() {
		return (bool) $this->get_access_token( self::JETPACK_MASTER_USER );
	}

	/**
	 * Returns true if the user with the specified identifier is connected to
	 * WordPress.com.
	 *
	 * @param Integer|Boolean $user_id the user identifier.
	 * @return Boolean is the user connected?
	 */
	public function is_user_connected( $user_id = false ) {
		$user_id = false === $user_id ? get_current_user_id() : absint( $user_id );
		if ( ! $user_id ) {
			return false;
		}

		return (bool) $this->get_access_token( $user_id );
	}

	/**
	 * Get the wpcom user data of the current|specified connected user.
	 *
	 * @param Integer $user_id the user identifier.
	 * @return Object the user object.
	 */
	public function get_connected_user_data( $user_id = null ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		$transient_key    = "jetpack_connected_user_data_$user_id";
		$cached_user_data = get_transient( $transient_key );

		if ( $cached_user_data ) {
			return $cached_user_data;
		}

		\Jetpack::load_xml_rpc_client();
		$xml = new \Jetpack_IXR_Client(
			array(
				'user_id' => $user_id,
			)
		);
		$xml->query( 'wpcom.getUser' );
		if ( ! $xml->isError() ) {
			$user_data = $xml->getResponse();
			set_transient( $transient_key, $xml->getResponse(), DAY_IN_SECONDS );
			return $user_data;
		}

		return false;
	}

	/**
	 * Is the user the connection owner.
	 *
	 * @param Integer $user_id the user identifier.
	 * @return Boolean is the user the connection owner?
	 */
	public function is_connection_owner( $user_id ) {
		return $user_id;
	}

	/**
	 * Unlinks the current user from the linked WordPress.com user
	 *
	 * @param Integer $user_id the user identifier.
	 */
	public static function disconnect_user( $user_id ) {
		return $user_id;
	}

	/**
	 * Initializes a transport server, whatever it may be, saves into the object property.
	 * Should be changed to be protected.
	 */
	public function initialize_server() {

	}

	/**
	 * Checks if the current request is properly authenticated, bails if not.
	 * Should be changed to be protected.
	 */
	public function require_authentication() {

	}

	/**
	 * Verifies the correctness of the request signature.
	 * Should be changed to be protected.
	 */
	public function verify_signature() {

	}

	/**
	 * Returns the requested Jetpack API URL.
	 *
	 * @param String $relative_url the relative API path.
	 * @return String API URL.
	 */
	public function api_url( $relative_url ) {
		$api_base = Constants::get_constant( 'JETPACK__API_BASE' );
		$version  = Constants::get_constant( 'JETPACK__API_VERSION' );

		$api_base = $api_base ? $api_base : 'https://jetpack.wordpress.com/jetpack.';
		$version  = $version ? '/' . $version . '/' : '/1/';

		return rtrim( $api_base . $relative_url, '/\\' ) . $version;
	}

	/**
	 * Attempts Jetpack registration which sets up the site for connection. Should
	 * remain public because the call to action comes from the current site, not from
	 * WordPress.com.
	 *
	 * @param String $api_endpoint (optional) an API endpoint to use, defaults to 'register'.
	 * @return Integer zero on success, or a bitmask on failure.
	 */
	public function register( $api_endpoint = 'register' ) {
		add_action( 'pre_update_jetpack_option_register', array( '\\Jetpack_Options', 'delete_option' ) );
		$secrets = $this->generate_secrets( 'register', get_current_user_id(), 600 );

		if (
			empty( $secrets['secret_1'] ) ||
			empty( $secrets['secret_2'] ) ||
			empty( $secrets['exp'] )
		) {
			return new \WP_Error( 'missing_secrets' );
		}

		// Better to try (and fail) to set a higher timeout than this system
		// supports than to have register fail for more users than it should.
		$timeout = $this->set_min_time_limit( 60 ) / 2;

		$gmt_offset = get_option( 'gmt_offset' );
		if ( ! $gmt_offset ) {
			$gmt_offset = 0;
		}

		$stats_options = get_option( 'stats_options' );
		$stats_id      = isset( $stats_options['blog_id'] )
			? $stats_options['blog_id']
			: null;

		/**
		 * Filters the request body for additional property addition.
		 *
		 * @since 7.7.0
		 *
		 * @param Array $post_data request data.
		 * @param Array $token_data token data.
		 */
		$body = apply_filters(
			'jetpack_register_request_body',
			array(
				'siteurl'         => site_url(),
				'home'            => home_url(),
				'gmt_offset'      => $gmt_offset,
				'timezone_string' => (string) get_option( 'timezone_string' ),
				'site_name'       => (string) get_option( 'blogname' ),
				'secret_1'        => $secrets['secret_1'],
				'secret_2'        => $secrets['secret_2'],
				'site_lang'       => get_locale(),
				'timeout'         => $timeout,
				'stats_id'        => $stats_id,
				'state'           => get_current_user_id(),
				'site_created'    => $this->get_assumed_site_creation_date(),
				'jetpack_version' => Constants::get_constant( 'JETPACK__VERSION' ),
			)
		);

		$args = array(
			'method'  => 'POST',
			'body'    => $body,
			'headers' => array(
				'Accept' => 'application/json',
			),
			'timeout' => $timeout,
		);

		$args['body'] = $this->apply_activation_source_to_args( $args['body'] );

		// TODO: fix URLs for bad hosts.
		$response = Client::_wp_remote_request(
			$this->api_url( $api_endpoint ),
			$args,
			true
		);

		// Make sure the response is valid and does not contain any Jetpack errors.
		$registration_details = $this->validate_remote_register_response( $response );

		if ( is_wp_error( $registration_details ) ) {
			return $registration_details;
		} elseif ( ! $registration_details ) {
			return new \WP_Error(
				'unknown_error',
				'Unknown error registering your Jetpack site.',
				wp_remote_retrieve_response_code( $response )
			);
		}

		if ( empty( $registration_details->jetpack_secret ) || ! is_string( $registration_details->jetpack_secret ) ) {
			return new \WP_Error(
				'jetpack_secret',
				'Unable to validate registration of your Jetpack site.',
				wp_remote_retrieve_response_code( $response )
			);
		}

		if ( isset( $registration_details->jetpack_public ) ) {
			$jetpack_public = (int) $registration_details->jetpack_public;
		} else {
			$jetpack_public = false;
		}

		\Jetpack_Options::update_options(
			array(
				'id'         => (int) $registration_details->jetpack_id,
				'blog_token' => (string) $registration_details->jetpack_secret,
				'public'     => $jetpack_public,
			)
		);

		/**
		 * Fires when a site is registered on WordPress.com.
		 *
		 * @since 3.7.0
		 *
		 * @param int $json->jetpack_id Jetpack Blog ID.
		 * @param string $json->jetpack_secret Jetpack Blog Token.
		 * @param int|bool $jetpack_public Is the site public.
		 */
		do_action(
			'jetpack_site_registered',
			$registration_details->jetpack_id,
			$registration_details->jetpack_secret,
			$jetpack_public
		);

		if ( isset( $registration_details->token ) ) {
			/**
			 * Fires when a user token is sent along with the registration data.
			 *
			 * @since 7.6.0
			 *
			 * @param object $token the administrator token for the newly registered site.
			 */
			do_action( 'jetpack_site_registered_user_token', $registration_details->token );
		}

		return true;
	}

	/**
	 * Takes the response from the Jetpack register new site endpoint and
	 * verifies it worked properly.
	 *
	 * @since 2.6
	 *
	 * @param Mixed $response the response object, or the error object.
	 * @return string|WP_Error A JSON object on success or Jetpack_Error on failures
	 **/
	protected function validate_remote_register_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'register_http_request_failed',
				$response->get_error_message()
			);
		}

		$code   = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );

		if ( $entity ) {
			$registration_response = json_decode( $entity );
		} else {
			$registration_response = false;
		}

		$code_type = intval( $code / 100 );
		if ( 5 === $code_type ) {
			return new \WP_Error( 'wpcom_5??', $code );
		} elseif ( 408 === $code ) {
			return new \WP_Error( 'wpcom_408', $code );
		} elseif ( ! empty( $registration_response->error ) ) {
			if (
				'xml_rpc-32700' === $registration_response->error
				&& ! function_exists( 'xml_parser_create' )
			) {
				$error_description = __( "PHP's XML extension is not available. Jetpack requires the XML extension to communicate with WordPress.com. Please contact your hosting provider to enable PHP's XML extension.", 'jetpack' );
			} else {
				$error_description = isset( $registration_response->error_description )
					? (string) $registration_response->error_description
					: '';
			}

			return new \WP_Error(
				(string) $registration_response->error,
				$error_description,
				$code
			);
		} elseif ( 200 !== $code ) {
			return new \WP_Error( 'wpcom_bad_response', $code );
		}

		// Jetpack ID error block.
		if ( empty( $registration_response->jetpack_id ) ) {
			return new \WP_Error(
				'jetpack_id',
				/* translators: %s is an error message string */
				sprintf( __( 'Error Details: Jetpack ID is empty. Do not publicly post this error message! %s', 'jetpack' ), $entity ),
				$entity
			);
		} elseif ( ! is_scalar( $registration_response->jetpack_id ) ) {
			return new \WP_Error(
				'jetpack_id',
				/* translators: %s is an error message string */
				sprintf( __( 'Error Details: Jetpack ID is not a scalar. Do not publicly post this error message! %s', 'jetpack' ), $entity ),
				$entity
			);
		} elseif ( preg_match( '/[^0-9]/', $registration_response->jetpack_id ) ) {
			return new \WP_Error(
				'jetpack_id',
				/* translators: %s is an error message string */
				sprintf( __( 'Error Details: Jetpack ID begins with a numeral. Do not publicly post this error message! %s', 'jetpack' ), $entity ),
				$entity
			);
		}

		return $registration_response;
	}

	/**
	 * Adds a used nonce to a list of known nonces.
	 *
	 * @param int    $timestamp the current request timestamp.
	 * @param string $nonce the nonce value.
	 * @return bool whether the nonce is unique or not.
	 */
	public function add_nonce( $timestamp, $nonce ) {
		global $wpdb;
		static $nonces_used_this_request = array();

		if ( isset( $nonces_used_this_request[ "$timestamp:$nonce" ] ) ) {
			return $nonces_used_this_request[ "$timestamp:$nonce" ];
		}

		// This should always have gone through Jetpack_Signature::sign_request() first to check $timestamp an $nonce.
		$timestamp = (int) $timestamp;
		$nonce     = esc_sql( $nonce );

		// Raw query so we can avoid races: add_option will also update.
		$show_errors = $wpdb->show_errors( false );

		$old_nonce = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM `$wpdb->options` WHERE option_name = %s", "jetpack_nonce_{$timestamp}_{$nonce}" )
		);

		if ( is_null( $old_nonce ) ) {
			$return = $wpdb->query(
				$wpdb->prepare(
					"INSERT INTO `$wpdb->options` (`option_name`, `option_value`, `autoload`) VALUES (%s, %s, %s)",
					"jetpack_nonce_{$timestamp}_{$nonce}",
					time(),
					'no'
				)
			);
		} else {
			$return = false;
		}

		$wpdb->show_errors( $show_errors );

		$nonces_used_this_request[ "$timestamp:$nonce" ] = $return;

		return $return;
	}

	/**
	 * Cleans nonces that were saved when calling ::add_nonce.
	 *
	 * @todo Properly prepare the query before executing it.
	 *
	 * @param bool $all whether to clean even non-expired nonces.
	 */
	public function clean_nonces( $all = false ) {
		global $wpdb;

		$sql      = "DELETE FROM `$wpdb->options` WHERE `option_name` LIKE %s";
		$sql_args = array( $wpdb->esc_like( 'jetpack_nonce_' ) . '%' );

		if ( true !== $all ) {
			$sql       .= ' AND CAST( `option_value` AS UNSIGNED ) < %d';
			$sql_args[] = time() - 3600;
		}

		$sql .= ' ORDER BY `option_id` LIMIT 100';

		$sql = $wpdb->prepare( $sql, $sql_args ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

		for ( $i = 0; $i < 1000; $i++ ) {
			if ( ! $wpdb->query( $sql ) ) { // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				break;
			}
		}
	}

	/**
	 * Builds the timeout limit for queries talking with the wpcom servers.
	 *
	 * Based on local php max_execution_time in php.ini
	 *
	 * @since 5.4
	 * @return int
	 **/
	public function get_max_execution_time() {
		$timeout = (int) ini_get( 'max_execution_time' );

		// Ensure exec time set in php.ini.
		if ( ! $timeout ) {
			$timeout = 30;
		}
		return $timeout;
	}

	/**
	 * Sets a minimum request timeout, and returns the current timeout
	 *
	 * @since 5.4
	 * @param Integer $min_timeout the minimum timeout value.
	 **/
	public function set_min_time_limit( $min_timeout ) {
		$timeout = $this->get_max_execution_time();
		if ( $timeout < $min_timeout ) {
			$timeout = $min_timeout;
			set_time_limit( $timeout );
		}
		return $timeout;
	}

	/**
	 * Get our assumed site creation date.
	 * Calculated based on the earlier date of either:
	 * - Earliest admin user registration date.
	 * - Earliest date of post of any post type.
	 *
	 * @since 7.2.0
	 *
	 * @return string Assumed site creation date and time.
	 */
	public function get_assumed_site_creation_date() {
		$earliest_registered_users  = get_users(
			array(
				'role'    => 'administrator',
				'orderby' => 'user_registered',
				'order'   => 'ASC',
				'fields'  => array( 'user_registered' ),
				'number'  => 1,
			)
		);
		$earliest_registration_date = $earliest_registered_users[0]->user_registered;

		$earliest_posts = get_posts(
			array(
				'posts_per_page' => 1,
				'post_type'      => 'any',
				'post_status'    => 'any',
				'orderby'        => 'date',
				'order'          => 'ASC',
			)
		);

		// If there are no posts at all, we'll count only on user registration date.
		if ( $earliest_posts ) {
			$earliest_post_date = $earliest_posts[0]->post_date;
		} else {
			$earliest_post_date = PHP_INT_MAX;
		}

		return min( $earliest_registration_date, $earliest_post_date );
	}

	/**
	 * Adds the activation source string as a parameter to passed arguments.
	 *
	 * @param Array $args arguments that need to have the source added.
	 * @return Array $amended arguments.
	 */
	public static function apply_activation_source_to_args( $args ) {
		list( $activation_source_name, $activation_source_keyword ) = get_option( 'jetpack_activation_source' );

		if ( $activation_source_name ) {
			$args['_as'] = urlencode( $activation_source_name );
		}

		if ( $activation_source_keyword ) {
			$args['_ak'] = urlencode( $activation_source_keyword );
		}

		return $args;
	}

	/**
	 * Returns the callable that would be used to generate secrets.
	 *
	 * @return Callable a function that returns a secure string to be used as a secret.
	 */
	protected function get_secret_callable() {
		if ( ! isset( $this->secret_callable ) ) {
			/**
			 * Allows modification of the callable that is used to generate connection secrets.
			 *
			 * @param Callable a function or method that returns a secret string.
			 */
			$this->secret_callable = apply_filters( 'jetpack_connection_secret_generator', 'wp_generate_password' );
		}

		return $this->secret_callable;
	}

	/**
	 * Generates two secret tokens and the end of life timestamp for them.
	 *
	 * @param String  $action  The action name.
	 * @param Integer $user_id The user identifier.
	 * @param Integer $exp     Expiration time in seconds.
	 */
	public function generate_secrets( $action, $user_id, $exp ) {
		$callable = $this->get_secret_callable();

		$secrets = \Jetpack_Options::get_raw_option(
			self::SECRETS_OPTION_NAME,
			array()
		);

		$secret_name = 'jetpack_' . $action . '_' . $user_id;

		if (
			isset( $secrets[ $secret_name ] ) &&
			$secrets[ $secret_name ]['exp'] > time()
		) {
			return $secrets[ $secret_name ];
		}

		$secret_value = array(
			'secret_1' => call_user_func( $callable ),
			'secret_2' => call_user_func( $callable ),
			'exp'      => time() + $exp,
		);

		$secrets[ $secret_name ] = $secret_value;

		\Jetpack_Options::update_raw_option( self::SECRETS_OPTION_NAME, $secrets );
		return $secrets[ $secret_name ];
	}

	/**
	 * Returns two secret tokens and the end of life timestamp for them.
	 *
	 * @param String  $action  The action name.
	 * @param Integer $user_id The user identifier.
	 * @return string|array an array of secrets or an error string.
	 */
	public function get_secrets( $action, $user_id ) {
		$secret_name = 'jetpack_' . $action . '_' . $user_id;
		$secrets     = \Jetpack_Options::get_raw_option(
			self::SECRETS_OPTION_NAME,
			array()
		);

		if ( ! isset( $secrets[ $secret_name ] ) ) {
			return self::SECRETS_MISSING;
		}

		if ( $secrets[ $secret_name ]['exp'] < time() ) {
			$this->delete_secrets( $action, $user_id );
			return self::SECRETS_EXPIRED;
		}

		return $secrets[ $secret_name ];
	}

	/**
	 * Deletes secret tokens in case they, for example, have expired.
	 *
	 * @param String  $action  The action name.
	 * @param Integer $user_id The user identifier.
	 */
	public function delete_secrets( $action, $user_id ) {
		$secret_name = 'jetpack_' . $action . '_' . $user_id;
		$secrets     = \Jetpack_Options::get_raw_option(
			self::SECRETS_OPTION_NAME,
			array()
		);
		if ( isset( $secrets[ $secret_name ] ) ) {
			unset( $secrets[ $secret_name ] );
			\Jetpack_Options::update_raw_option( self::SECRETS_OPTION_NAME, $secrets );
		}
	}

	/**
	 * Responds to a WordPress.com call to register the current site.
	 * Should be changed to protected.
	 *
	 * @param array $registration_data Array of [ secret_1, user_id ].
	 */
	public function handle_registration( array $registration_data ) {
		list( $registration_secret_1, $registration_user_id ) = $registration_data;
		if ( empty( $registration_user_id ) ) {
			return new \WP_Error( 'registration_state_invalid', __( 'Invalid Registration State', 'jetpack' ), 400 );
		}

		return $this->verify_secrets( 'register', $registration_secret_1, (int) $registration_user_id );
	}

	/**
	 * Verify a Previously Generated Secret.
	 *
	 * @param string $action   The type of secret to verify.
	 * @param string $secret_1 The secret string to compare to what is stored.
	 * @param int    $user_id  The user ID of the owner of the secret.
	 */
	protected function verify_secrets( $action, $secret_1, $user_id ) {
		$allowed_actions = array( 'register', 'authorize', 'publicize' );
		if ( ! in_array( $action, $allowed_actions, true ) ) {
			return new \WP_Error( 'unknown_verification_action', 'Unknown Verification Action', 400 );
		}

		$user = get_user_by( 'id', $user_id );

		/**
		 * We've begun verifying the previously generated secret.
		 *
		 * @since 7.5.0
		 *
		 * @param string   $action The type of secret to verify.
		 * @param \WP_User $user The user object.
		 */
		do_action( 'jetpack_verify_secrets_begin', $action, $user );

		$return_error = function( \WP_Error $error ) use ( $action, $user ) {
			/**
			 * Verifying of the previously generated secret has failed.
			 *
			 * @since 7.5.0
			 *
			 * @param string    $action  The type of secret to verify.
			 * @param \WP_User  $user The user object.
			 * @param \WP_Error $error The error object.
			 */
			do_action( 'jetpack_verify_secrets_fail', $action, $user, $error );

			return $error;
		};

		$stored_secrets = $this->get_secrets( $action, $user_id );
		$this->delete_secrets( $action, $user_id );

		if ( empty( $secret_1 ) ) {
			return $return_error(
				new \WP_Error(
					'verify_secret_1_missing',
					/* translators: "%s" is the name of a paramter. It can be either "secret_1" or "state". */
					sprintf( __( 'The required "%s" parameter is missing.', 'jetpack' ), 'secret_1' ),
					400
				)
			);
		} elseif ( ! is_string( $secret_1 ) ) {
			return $return_error(
				new \WP_Error(
					'verify_secret_1_malformed',
					/* translators: "%s" is the name of a paramter. It can be either "secret_1" or "state". */
					sprintf( __( 'The required "%s" parameter is malformed.', 'jetpack' ), 'secret_1' ),
					400
				)
			);
		} elseif ( empty( $user_id ) ) {
			// $user_id is passed around during registration as "state".
			return $return_error(
				new \WP_Error(
					'state_missing',
					/* translators: "%s" is the name of a paramter. It can be either "secret_1" or "state". */
					sprintf( __( 'The required "%s" parameter is missing.', 'jetpack' ), 'state' ),
					400
				)
			);
		} elseif ( ! ctype_digit( (string) $user_id ) ) {
			return $return_error(
				new \WP_Error(
					'verify_secret_1_malformed',
					/* translators: "%s" is the name of a paramter. It can be either "secret_1" or "state". */
					sprintf( __( 'The required "%s" parameter is malformed.', 'jetpack' ), 'state' ),
					400
				)
			);
		}

		if ( ! $stored_secrets ) {
			return $return_error(
				new \WP_Error(
					'verify_secrets_missing',
					__( 'Verification secrets not found', 'jetpack' ),
					400
				)
			);
		} elseif ( is_wp_error( $stored_secrets ) ) {
			$stored_secrets->add_data( 400 );
			return $return_error( $stored_secrets );
		} elseif ( empty( $stored_secrets['secret_1'] ) || empty( $stored_secrets['secret_2'] ) || empty( $stored_secrets['exp'] ) ) {
			return $return_error(
				new \WP_Error(
					'verify_secrets_incomplete',
					__( 'Verification secrets are incomplete', 'jetpack' ),
					400
				)
			);
		} elseif ( ! hash_equals( $secret_1, $stored_secrets['secret_1'] ) ) {
			return $return_error(
				new \WP_Error(
					'verify_secrets_mismatch',
					__( 'Secret mismatch', 'jetpack' ),
					400
				)
			);
		}

		/**
		 * We've succeeded at verifying the previously generated secret.
		 *
		 * @since 7.5.0
		 *
		 * @param string   $action The type of secret to verify.
		 * @param \WP_User $user The user object.
		 */
		do_action( 'jetpack_verify_secrets_success', $action, $user );

		return $stored_secrets['secret_2'];
	}

	/**
	 * Responds to a WordPress.com call to authorize the current user.
	 * Should be changed to protected.
	 */
	public function handle_authorization() {

	}

	/**
	 * Builds a URL to the Jetpack connection auth page.
	 * This needs rethinking.
	 *
	 * @param bool        $raw If true, URL will not be escaped.
	 * @param bool|string $redirect If true, will redirect back to Jetpack wp-admin landing page after connection.
	 *                              If string, will be a custom redirect.
	 * @param bool|string $from If not false, adds 'from=$from' param to the connect URL.
	 * @param bool        $register If true, will generate a register URL regardless of the existing token, since 4.9.0.
	 *
	 * @return string Connect URL
	 */
	public function build_connect_url( $raw, $redirect, $from, $register ) {
		return array( $raw, $redirect, $from, $register );
	}

	/**
	 * Disconnects from the Jetpack servers.
	 * Forgets all connection details and tells the Jetpack servers to do the same.
	 */
	public function disconnect_site() {

	}

	/**
	 * The Base64 Encoding of the SHA1 Hash of the Input.
	 *
	 * @param string $text The string to hash.
	 * @return string
	 */
	public function sha1_base64( $text ) {
		return base64_encode( sha1( $text, true ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
	}

	/**
	 * This function mirrors Jetpack_Data::is_usable_domain() in the WPCOM codebase.
	 *
	 * @param string $domain The domain to check.
	 *
	 * @return bool|WP_Error
	 */
	public function is_usable_domain( $domain ) {

		// If it's empty, just fail out.
		if ( ! $domain ) {
			return new \WP_Error(
				'fail_domain_empty',
				/* translators: %1$s is a domain name. */
				sprintf( __( 'Domain `%1$s` just failed is_usable_domain check as it is empty.', 'jetpack' ), $domain )
			);
		}

		/**
		 * Skips the usuable domain check when connecting a site.
		 *
		 * Allows site administrators with domains that fail gethostname-based checks to pass the request to WP.com
		 *
		 * @since 4.1.0
		 *
		 * @param bool If the check should be skipped. Default false.
		 */
		if ( apply_filters( 'jetpack_skip_usuable_domain_check', false ) ) {
			return true;
		}

		// None of the explicit localhosts.
		$forbidden_domains = array(
			'wordpress.com',
			'localhost',
			'localhost.localdomain',
			'127.0.0.1',
			'local.wordpress.test',         // VVV pattern.
			'local.wordpress-trunk.test',   // VVV pattern.
			'src.wordpress-develop.test',   // VVV pattern.
			'build.wordpress-develop.test', // VVV pattern.
		);
		if ( in_array( $domain, $forbidden_domains, true ) ) {
			return new \WP_Error(
				'fail_domain_forbidden',
				sprintf(
					/* translators: %1$s is a domain name. */
					__(
						'Domain `%1$s` just failed is_usable_domain check as it is in the forbidden array.',
						'jetpack'
					),
					$domain
				)
			);
		}

		// No .test or .local domains.
		if ( preg_match( '#\.(test|local)$#i', $domain ) ) {
			return new \WP_Error(
				'fail_domain_tld',
				sprintf(
					/* translators: %1$s is a domain name. */
					__(
						'Domain `%1$s` just failed is_usable_domain check as it uses an invalid top level domain.',
						'jetpack'
					),
					$domain
				)
			);
		}

		// No WPCOM subdomains.
		if ( preg_match( '#\.WordPress\.com$#i', $domain ) ) {
			return new \WP_Error(
				'fail_subdomain_wpcom',
				sprintf(
					/* translators: %1$s is a domain name. */
					__(
						'Domain `%1$s` just failed is_usable_domain check as it is a subdomain of WordPress.com.',
						'jetpack'
					),
					$domain
				)
			);
		}

		// If PHP was compiled without support for the Filter module (very edge case).
		if ( ! function_exists( 'filter_var' ) ) {
			// Just pass back true for now, and let wpcom sort it out.
			return true;
		}

		return true;
	}

	/**
	 * Gets the requested token.
	 *
	 * Tokens are one of two types:
	 * 1. Blog Tokens: These are the "main" tokens. Each site typically has one Blog Token,
	 *    though some sites can have multiple "Special" Blog Tokens (see below). These tokens
	 *    are not associated with a user account. They represent the site's connection with
	 *    the Jetpack servers.
	 * 2. User Tokens: These are "sub-"tokens. Each connected user account has one User Token.
	 *
	 * All tokens look like "{$token_key}.{$private}". $token_key is a public ID for the
	 * token, and $private is a secret that should never be displayed anywhere or sent
	 * over the network; it's used only for signing things.
	 *
	 * Blog Tokens can be "Normal" or "Special".
	 * * Normal: The result of a normal connection flow. They look like
	 *   "{$random_string_1}.{$random_string_2}"
	 *   That is, $token_key and $private are both random strings.
	 *   Sites only have one Normal Blog Token. Normal Tokens are found in either
	 *   Jetpack_Options::get_option( 'blog_token' ) (usual) or the JETPACK_BLOG_TOKEN
	 *   constant (rare).
	 * * Special: A connection token for sites that have gone through an alternative
	 *   connection flow. They look like:
	 *   ";{$special_id}{$special_version};{$wpcom_blog_id};.{$random_string}"
	 *   That is, $private is a random string and $token_key has a special structure with
	 *   lots of semicolons.
	 *   Most sites have zero Special Blog Tokens. Special tokens are only found in the
	 *   JETPACK_BLOG_TOKEN constant.
	 *
	 * In particular, note that Normal Blog Tokens never start with ";" and that
	 * Special Blog Tokens always do.
	 *
	 * When searching for a matching Blog Tokens, Blog Tokens are examined in the following
	 * order:
	 * 1. Defined Special Blog Tokens (via the JETPACK_BLOG_TOKEN constant)
	 * 2. Stored Normal Tokens (via Jetpack_Options::get_option( 'blog_token' ))
	 * 3. Defined Normal Tokens (via the JETPACK_BLOG_TOKEN constant)
	 *
	 * @param int|false    $user_id   false: Return the Blog Token. int: Return that user's User Token.
	 * @param string|false $token_key If provided, check that the token matches the provided input.
	 * @param bool|true    $suppress_errors If true, return a falsy value when the token isn't found; When false, return a descriptive WP_Error when the token isn't found.
	 *
	 * @return object|false
	 */
	public function get_access_token( $user_id = false, $token_key = false, $suppress_errors = true ) {
		$possible_special_tokens = array();
		$possible_normal_tokens  = array();
		$user_tokens             = \Jetpack_Options::get_option( 'user_tokens' );

		if ( $user_id ) {
			if ( ! $user_tokens ) {
				return $suppress_errors ? false : new \WP_Error( 'no_user_tokens' );
			}
			if ( self::JETPACK_MASTER_USER === $user_id ) {
				$user_id = \Jetpack_Options::get_option( 'master_user' );
				if ( ! $user_id ) {
					return $suppress_errors ? false : new \WP_Error( 'empty_master_user_option' );
				}
			}
			if ( ! isset( $user_tokens[ $user_id ] ) || ! $user_tokens[ $user_id ] ) {
				return $suppress_errors ? false : new \WP_Error( 'no_token_for_user', sprintf( 'No token for user %d', $user_id ) );
			}
			$user_token_chunks = explode( '.', $user_tokens[ $user_id ] );
			if ( empty( $user_token_chunks[1] ) || empty( $user_token_chunks[2] ) ) {
				return $suppress_errors ? false : new \WP_Error( 'token_malformed', sprintf( 'Token for user %d is malformed', $user_id ) );
			}
			if ( $user_token_chunks[2] !== (string) $user_id ) {
				return $suppress_errors ? false : new \WP_Error( 'user_id_mismatch', sprintf( 'Requesting user_id %d does not match token user_id %d', $user_id, $user_token_chunks[2] ) );
			}
			$possible_normal_tokens[] = "{$user_token_chunks[0]}.{$user_token_chunks[1]}";
		} else {
			$stored_blog_token = \Jetpack_Options::get_option( 'blog_token' );
			if ( $stored_blog_token ) {
				$possible_normal_tokens[] = $stored_blog_token;
			}

			$defined_tokens_string = Constants::get_constant( 'JETPACK_BLOG_TOKEN' );

			if ( $defined_tokens_string ) {
				$defined_tokens = explode( ',', $defined_tokens_string );
				foreach ( $defined_tokens as $defined_token ) {
					if ( ';' === $defined_token[0] ) {
						$possible_special_tokens[] = $defined_token;
					} else {
						$possible_normal_tokens[] = $defined_token;
					}
				}
			}
		}

		if ( self::MAGIC_NORMAL_TOKEN_KEY === $token_key ) {
			$possible_tokens = $possible_normal_tokens;
		} else {
			$possible_tokens = array_merge( $possible_special_tokens, $possible_normal_tokens );
		}

		if ( ! $possible_tokens ) {
			return $suppress_errors ? false : new \WP_Error( 'no_possible_tokens' );
		}

		$valid_token = false;

		if ( false === $token_key ) {
			// Use first token.
			$valid_token = $possible_tokens[0];
		} elseif ( self::MAGIC_NORMAL_TOKEN_KEY === $token_key ) {
			// Use first normal token.
			$valid_token = $possible_tokens[0]; // $possible_tokens only contains normal tokens because of earlier check.
		} else {
			// Use the token matching $token_key or false if none.
			// Ensure we check the full key.
			$token_check = rtrim( $token_key, '.' ) . '.';

			foreach ( $possible_tokens as $possible_token ) {
				if ( hash_equals( substr( $possible_token, 0, strlen( $token_check ) ), $token_check ) ) {
					$valid_token = $possible_token;
					break;
				}
			}
		}

		if ( ! $valid_token ) {
			return $suppress_errors ? false : new \WP_Error( 'no_valid_token' );
		}

		return (object) array(
			'secret'           => $valid_token,
			'external_user_id' => (int) $user_id,
		);
	}

	/**
	 * In some setups, $HTTP_RAW_POST_DATA can be emptied during some IXR_Server paths
	 * since it is passed by reference to various methods.
	 * Capture it here so we can verify the signature later.
	 *
	 * @param Array $methods an array of available XMLRPC methods.
	 * @return Array the same array, since this method doesn't add or remove anything.
	 */
	public function xmlrpc_methods( $methods ) {
		$this->raw_post_data = $GLOBALS['HTTP_RAW_POST_DATA'];
		return $methods;
	}

	/**
	 * Resets the raw post data parameter for testing purposes.
	 */
	public function reset_raw_post_data() {
		$this->raw_post_data = null;
	}

	/**
	 * Registering an additional method.
	 *
	 * @param Array $methods an array of available XMLRPC methods.
	 * @return Array the amended array in case the method is added.
	 */
	public function public_xmlrpc_methods( $methods ) {
		if ( array_key_exists( 'wp.getOptions', $methods ) ) {
			$methods['wp.getOptions'] = array( $this, 'jetpack_getOptions' );
		}
		return $methods;
	}

	/**
	 * Handles a getOptions XMLRPC method call.
	 *
	 * @todo Audit whether we really need to use strings without textdomains.
	 *
	 * @param Array $args method call arguments.
	 * @return an amended XMLRPC server options array.
	 */
	public function jetpack_getOptions( $args ) {
		global $wp_xmlrpc_server;

		$wp_xmlrpc_server->escape( $args );

		$username = $args[1];
		$password = $args[2];

		$user = $wp_xmlrpc_server->login( $username, $password );
		if ( ! $user ) {
			return $wp_xmlrpc_server->error;
		}

		$options   = array();
		$user_data = $this->get_connected_user_data();
		if ( is_array( $user_data ) ) {
			$options['jetpack_user_id']         = array(
				'desc'     => __( 'The WP.com user ID of the connected user' ), // phpcs:ignore WordPress.WP.I18n.MissingArgDomain
				'readonly' => true,
				'value'    => $user_data['ID'],
			);
			$options['jetpack_user_login']      = array(
				'desc'     => __( 'The WP.com username of the connected user' ), // phpcs:ignore WordPress.WP.I18n.MissingArgDomain
				'readonly' => true,
				'value'    => $user_data['login'],
			);
			$options['jetpack_user_email']      = array(
				'desc'     => __( 'The WP.com user email of the connected user' ), // phpcs:ignore WordPress.WP.I18n.MissingArgDomain
				'readonly' => true,
				'value'    => $user_data['email'],
			);
			$options['jetpack_user_site_count'] = array(
				'desc'     => __( 'The number of sites of the connected WP.com user' ), // phpcs:ignore WordPress.WP.I18n.MissingArgDomain
				'readonly' => true,
				'value'    => $user_data['site_count'],
			);
		}
		$wp_xmlrpc_server->blog_options = array_merge( $wp_xmlrpc_server->blog_options, $options );
		$args                           = stripslashes_deep( $args );
		return $wp_xmlrpc_server->wp_getOptions( $args );
	}

	/**
	 * Adds Jetpack-specific options to the output of the XMLRPC options method.
	 *
	 * @todo Audit whether we really need to use strings without textdomains.
	 *
	 * @param Array $options standard Core options.
	 * @return Array amended options.
	 */
	public function xmlrpc_options( $options ) {
		$jetpack_client_id = false;
		if ( $this->is_active() ) {
			$jetpack_client_id = \Jetpack_Options::get_option( 'id' );
		}
		$options['jetpack_version'] = array(
			'desc'     => __( 'Jetpack Plugin Version' ), // phpcs:ignore WordPress.WP.I18n.MissingArgDomain
			'readonly' => true,
			'value'    => Constants::get_constant( 'JETPACK__VERSION' ),
		);

		$options['jetpack_client_id'] = array(
			'desc'     => __( 'The Client ID/WP.com Blog ID of this site' ), // phpcs:ignore WordPress.WP.I18n.MissingArgDomain
			'readonly' => true,
			'value'    => $jetpack_client_id,
		);
		return $options;
	}

	/**
	 * Resets the saved authentication state in between testing requests.
	 */
	public function reset_saved_auth_state() {
		$this->xmlrpc_verification = null;
	}
}
