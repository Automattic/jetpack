<?php
/**
 * The Jetpack Connection manager class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Tracking;
use WP_Error;

/**
 * The Jetpack Connection Manager class that is used as a single gateway between WordPress.com
 * and Jetpack.
 */
class Manager {

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
	 * Plugin management object.
	 *
	 * @var Plugin
	 */
	private $plugin = null;

	/**
	 * Initialize the object.
	 * Make sure to call the "Configure" first.
	 *
	 * @param string $plugin_slug Slug of the plugin using the connection (optional, but encouraged).
	 *
	 * @see \Automattic\Jetpack\Config
	 */
	public function __construct( $plugin_slug = null ) {
		if ( $plugin_slug && is_string( $plugin_slug ) ) {
			$this->set_plugin_instance( new Plugin( $plugin_slug ) );
		}
	}

	/**
	 * Initializes required listeners. This is done separately from the constructors
	 * because some objects sometimes need to instantiate separate objects of this class.
	 *
	 * @todo Implement a proper nonce verification.
	 */
	public static function configure() {
		$manager = new self();

		add_filter(
			'jetpack_constant_default_value',
			__NAMESPACE__ . '\Utils::jetpack_api_constant_filter',
			10,
			2
		);

		$manager->setup_xmlrpc_handlers(
			$_GET, // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$manager->is_active(),
			$manager->verify_xml_rpc_signature()
		);

		$manager->error_handler = Error_Handler::get_instance();

		if ( $manager->is_active() ) {
			add_filter( 'xmlrpc_methods', array( $manager, 'public_xmlrpc_methods' ) );
		}

		add_action( 'rest_api_init', array( $manager, 'initialize_rest_api_registration_connector' ) );

		add_action( 'jetpack_clean_nonces', array( $manager, 'clean_nonces' ) );
		if ( ! wp_next_scheduled( 'jetpack_clean_nonces' ) ) {
			wp_schedule_event( time(), 'hourly', 'jetpack_clean_nonces' );
		}

		add_action( 'plugins_loaded', __NAMESPACE__ . '\Plugin_Storage::configure', 100 );

		add_filter( 'map_meta_cap', array( $manager, 'jetpack_connection_custom_caps' ), 1, 4 );
	}

	/**
	 * Sets up the XMLRPC request handlers.
	 *
	 * @param array                  $request_params incoming request parameters.
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
		add_filter( 'xmlrpc_blog_options', array( $this, 'xmlrpc_options' ), 1000, 2 );

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
	public function authenticate_jetpack( $user, $username, $password ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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
				 * @since 7.5.0
				 *
				 * @param WP_Error $signature_verification_error The verification error
				 */
				do_action( 'jetpack_verify_signature_error', $this->xmlrpc_verification );

				Error_Handler::get_instance()->report_error( $this->xmlrpc_verification );

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
	 * @todo Refactor to use proper nonce verification.
	 */
	private function internal_verify_xml_rpc_signature() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
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

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@list( $token_key, $version, $user_id ) = explode( ':', wp_unslash( $_GET['token'] ) );
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$jetpack_api_version = Constants::get_constant( 'JETPACK__API_VERSION' );

		if (
			empty( $token_key )
		||
			empty( $version ) || strval( $jetpack_api_version ) !== $version ) {
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

		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$timestamp = (int) $_GET['timestamp'];
		$nonce     = stripslashes( (string) $_GET['nonce'] );
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

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

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
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
		 * @param array $post_data request data.
		 * @param array $token_data token data.
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
	 * Returns true if the site has both a token and a blog id, which indicates a site has been registered.
	 *
	 * @access public
	 *
	 * @return bool
	 */
	public function is_registered() {
		$has_blog_id    = (bool) \Jetpack_Options::get_option( 'id' );
		$has_blog_token = (bool) $this->get_access_token( false );
		return $has_blog_id && $has_blog_token;
	}

	/**
	 * Checks to see if the connection owner of the site is missing.
	 *
	 * @return bool
	 */
	public function is_missing_connection_owner() {
		$connection_owner = $this->get_connection_owner_id();
		if ( ! get_user_by( 'id', $connection_owner ) ) {
			return true;
		}

		return false;
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
	 * Returns the local user ID of the connection owner.
	 *
	 * @return string|int Returns the ID of the connection owner or False if no connection owner found.
	 */
	public function get_connection_owner_id() {
		$user_token       = $this->get_access_token( self::JETPACK_MASTER_USER );
		$connection_owner = false;
		if ( $user_token && is_object( $user_token ) && isset( $user_token->external_user_id ) ) {
			$connection_owner = $user_token->external_user_id;
		}

		return $connection_owner;
	}

	/**
	 * Returns an array of user_id's that have user tokens for communicating with wpcom.
	 * Able to select by specific capability.
	 *
	 * @param string $capability The capability of the user.
	 * @return array Array of WP_User objects if found.
	 */
	public function get_connected_users( $capability = 'any' ) {
		$connected_users    = array();
		$connected_user_ids = array_keys( \Jetpack_Options::get_option( 'user_tokens' ) );

		if ( ! empty( $connected_user_ids ) ) {
			foreach ( $connected_user_ids as $id ) {
				// Check for capability.
				if ( 'any' !== $capability && ! user_can( $id, $capability ) ) {
					continue;
				}

				$connected_users[] = get_userdata( $id );
			}
		}

		return $connected_users;
	}

	/**
	 * Get the wpcom user data of the current|specified connected user.
	 *
	 * @todo Refactor to properly load the XMLRPC client independently.
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
	 * Returns a user object of the connection owner.
	 *
	 * @return object|false False if no connection owner found.
	 */
	public function get_connection_owner() {
		$user_token = $this->get_access_token( self::JETPACK_MASTER_USER );

		$connection_owner = false;
		if ( $user_token && is_object( $user_token ) && isset( $user_token->external_user_id ) ) {
			$connection_owner = get_userdata( $user_token->external_user_id );
		}

		return $connection_owner;
	}

	/**
	 * Returns true if the provided user is the Jetpack connection owner.
	 * If user ID is not specified, the current user will be used.
	 *
	 * @param Integer|Boolean $user_id the user identifier. False for current user.
	 * @return Boolean True the user the connection owner, false otherwise.
	 */
	public function is_connection_owner( $user_id = false ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		$user_token = $this->get_access_token( self::JETPACK_MASTER_USER );

		return $user_token && is_object( $user_token ) && isset( $user_token->external_user_id ) && $user_id === $user_token->external_user_id;
	}

	/**
	 * Connects the user with a specified ID to a WordPress.com user using the
	 * remote login flow.
	 *
	 * @access public
	 *
	 * @param Integer $user_id (optional) the user identifier, defaults to current user.
	 * @param String  $redirect_url the URL to redirect the user to for processing, defaults to
	 *                              admin_url().
	 * @return WP_Error only in case of a failed user lookup.
	 */
	public function connect_user( $user_id = null, $redirect_url = null ) {
		$user = null;
		if ( null === $user_id ) {
			$user = wp_get_current_user();
		} else {
			$user = get_user_by( 'ID', $user_id );
		}

		if ( empty( $user ) ) {
			return new \WP_Error( 'user_not_found', 'Attempting to connect a non-existent user.' );
		}

		if ( null === $redirect_url ) {
			$redirect_url = admin_url();
		}

		// Using wp_redirect intentionally because we're redirecting outside.
		wp_redirect( $this->get_authorization_url( $user ) ); // phpcs:ignore WordPress.Security.SafeRedirect
		exit();
	}

	/**
	 * Unlinks the current user from the linked WordPress.com user.
	 *
	 * @access public
	 * @static
	 *
	 * @todo Refactor to properly load the XMLRPC client independently.
	 *
	 * @param Integer $user_id the user identifier.
	 * @return Boolean Whether the disconnection of the user was successful.
	 */
	public static function disconnect_user( $user_id = null ) {
		$tokens = \Jetpack_Options::get_option( 'user_tokens' );
		if ( ! $tokens ) {
			return false;
		}

		$user_id = empty( $user_id ) ? get_current_user_id() : intval( $user_id );

		if ( \Jetpack_Options::get_option( 'master_user' ) === $user_id ) {
			return false;
		}

		if ( ! isset( $tokens[ $user_id ] ) ) {
			return false;
		}

		$xml = new \Jetpack_IXR_Client( compact( 'user_id' ) );
		$xml->query( 'jetpack.unlink_user', $user_id );

		unset( $tokens[ $user_id ] );

		\Jetpack_Options::update_option( 'user_tokens', $tokens );

		// Delete cached connected user data.
		$transient_key = "jetpack_connected_user_data_$user_id";
		delete_transient( $transient_key );

		/**
		 * Fires after the current user has been unlinked from WordPress.com.
		 *
		 * @since 4.1.0
		 *
		 * @param int $user_id The current user's ID.
		 */
		do_action( 'jetpack_unlinked_user', $user_id );

		return true;
	}

	/**
	 * Returns the requested Jetpack API URL.
	 *
	 * @param String $relative_url the relative API path.
	 * @return String API URL.
	 */
	public function api_url( $relative_url ) {
		$api_base    = Constants::get_constant( 'JETPACK__API_BASE' );
		$api_version = '/' . Constants::get_constant( 'JETPACK__API_VERSION' ) . '/';

		/**
		 * Filters whether the connection manager should use the iframe authorization
		 * flow instead of the regular redirect-based flow.
		 *
		 * @since 8.3.0
		 *
		 * @param Boolean $is_iframe_flow_used should the iframe flow be used, defaults to false.
		 */
		$iframe_flow = apply_filters( 'jetpack_use_iframe_authorization_flow', false );

		// Do not modify anything that is not related to authorize requests.
		if ( 'authorize' === $relative_url && $iframe_flow ) {
			$relative_url = 'authorize_iframe';
		}

		/**
		 * Filters the API URL that Jetpack uses for server communication.
		 *
		 * @since 8.0.0
		 *
		 * @param String $url the generated URL.
		 * @param String $relative_url the relative URL that was passed as an argument.
		 * @param String $api_base the API base string that is being used.
		 * @param String $api_version the API version string that is being used.
		 */
		return apply_filters(
			'jetpack_api_url',
			rtrim( $api_base . $relative_url, '/\\' ) . $api_version,
			$relative_url,
			$api_base,
			$api_version
		);
	}

	/**
	 * Returns the Jetpack XMLRPC WordPress.com API endpoint URL.
	 *
	 * @return String XMLRPC API URL.
	 */
	public function xmlrpc_api_url() {
		$base = preg_replace(
			'#(https?://[^?/]+)(/?.*)?$#',
			'\\1',
			Constants::get_constant( 'JETPACK__API_BASE' )
		);
		return untrailingslashit( $base ) . '/xmlrpc.php';
	}

	/**
	 * Attempts Jetpack registration which sets up the site for connection. Should
	 * remain public because the call to action comes from the current site, not from
	 * WordPress.com.
	 *
	 * @param String $api_endpoint (optional) an API endpoint to use, defaults to 'register'.
	 * @return true|WP_Error The error object.
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
		 * @param array $post_data request data.
		 * @param Array $token_data token data.
		 */
		$body = apply_filters(
			'jetpack_register_request_body',
			array(
				'siteurl'            => site_url(),
				'home'               => home_url(),
				'gmt_offset'         => $gmt_offset,
				'timezone_string'    => (string) get_option( 'timezone_string' ),
				'site_name'          => (string) get_option( 'blogname' ),
				'secret_1'           => $secrets['secret_1'],
				'secret_2'           => $secrets['secret_2'],
				'site_lang'          => get_locale(),
				'timeout'            => $timeout,
				'stats_id'           => $stats_id,
				'state'              => get_current_user_id(),
				'site_created'       => $this->get_assumed_site_creation_date(),
				'jetpack_version'    => Constants::get_constant( 'JETPACK__VERSION' ),
				'ABSPATH'            => Constants::get_constant( 'ABSPATH' ),
				'current_user_email' => wp_get_current_user()->user_email,
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
	 * @return string|WP_Error A JSON object on success or WP_Error on failures
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
	 * Sets the Connection custom capabilities.
	 *
	 * @param string[] $caps    Array of the user's capabilities.
	 * @param string   $cap     Capability name.
	 * @param int      $user_id The user ID.
	 * @param array    $args    Adds the context to the cap. Typically the object ID.
	 */
	public function jetpack_connection_custom_caps( $caps, $cap, $user_id, $args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$is_offline_mode = ( new Status() )->is_offline_mode();
		switch ( $cap ) {
			case 'jetpack_connect':
			case 'jetpack_reconnect':
				if ( $is_offline_mode ) {
					$caps = array( 'do_not_allow' );
					break;
				}
				// Pass through. If it's not offline mode, these should match disconnect.
				// Let users disconnect if it's offline mode, just in case things glitch.
			case 'jetpack_disconnect':
				/**
				 * Filters the jetpack_disconnect capability.
				 *
				 * @since 8.7.0
				 *
				 * @param array An array containing the capability name.
				 */
				$caps = apply_filters( 'jetpack_disconnect_cap', array( 'manage_options' ) );
				break;
			case 'jetpack_connect_user':
				if ( $is_offline_mode ) {
					$caps = array( 'do_not_allow' );
					break;
				}
				$caps = array( 'read' );
				break;
		}
		return $caps;
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
		$cached_date = get_transient( 'jetpack_assumed_site_creation_date' );
		if ( ! empty( $cached_date ) ) {
			return $cached_date;
		}

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

		$assumed_date = min( $earliest_registration_date, $earliest_post_date );
		set_transient( 'jetpack_assumed_site_creation_date', $assumed_date );

		return $assumed_date;
	}

	/**
	 * Adds the activation source string as a parameter to passed arguments.
	 *
	 * @todo Refactor to use rawurlencode() instead of urlencode().
	 *
	 * @param array $args arguments that need to have the source added.
	 * @return array $amended arguments.
	 */
	public static function apply_activation_source_to_args( $args ) {
		list( $activation_source_name, $activation_source_keyword ) = get_option( 'jetpack_activation_source' );

		if ( $activation_source_name ) {
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.urlencode_urlencode
			$args['_as'] = urlencode( $activation_source_name );
		}

		if ( $activation_source_keyword ) {
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.urlencode_urlencode
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
			$this->secret_callable = apply_filters( 'jetpack_connection_secret_generator', array( $this, 'secret_callable_method' ) );
		}

		return $this->secret_callable;
	}

	/**
	 * Runs the wp_generate_password function with the required parameters. This is the
	 * default implementation of the secret callable, can be overridden using the
	 * jetpack_connection_secret_generator filter.
	 *
	 * @return String $secret value.
	 */
	private function secret_callable_method() {
		return wp_generate_password( 32, false );
	}

	/**
	 * Generates two secret tokens and the end of life timestamp for them.
	 *
	 * @param String  $action  The action name.
	 * @param Integer $user_id The user identifier.
	 * @param Integer $exp     Expiration time in seconds.
	 */
	public function generate_secrets( $action, $user_id = false, $exp = 600 ) {
		if ( false === $user_id ) {
			$user_id = get_current_user_id();
		}

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
	 * Deletes all connection tokens and transients from the local Jetpack site.
	 * If the plugin object has been provided in the constructor, the function first checks
	 * whether it's the only active connection.
	 * If there are any other connections, the function will do nothing and return `false`
	 * (unless `$ignore_connected_plugins` is set to `true`).
	 *
	 * @param bool $ignore_connected_plugins Delete the tokens even if there are other connected plugins.
	 *
	 * @return bool True if disconnected successfully, false otherwise.
	 */
	public function delete_all_connection_tokens( $ignore_connected_plugins = false ) {
		if ( ! $ignore_connected_plugins && null !== $this->plugin && ! $this->plugin->is_only() ) {
			return false;
		}

		/**
		 * Fires upon the disconnect attempt.
		 * Return `false` to prevent the disconnect.
		 *
		 * @since 8.7.0
		 */
		if ( ! apply_filters( 'jetpack_connection_delete_all_tokens', true, $this ) ) {
			return false;
		}

		\Jetpack_Options::delete_option(
			array(
				'blog_token',
				'user_token',
				'user_tokens',
				'master_user',
				'time_diff',
				'fallback_no_verify_ssl_certs',
			)
		);

		\Jetpack_Options::delete_raw_option( 'jetpack_secrets' );

		// Delete cached connected user data.
		$transient_key = 'jetpack_connected_user_data_' . get_current_user_id();
		delete_transient( $transient_key );

		// Delete all XML-RPC errors.
		Error_Handler::get_instance()->delete_all_errors();

		return true;
	}

	/**
	 * Tells WordPress.com to disconnect the site and clear all tokens from cached site.
	 * If the plugin object has been provided in the constructor, the function first check
	 * whether it's the only active connection.
	 * If there are any other connections, the function will do nothing and return `false`
	 * (unless `$ignore_connected_plugins` is set to `true`).
	 *
	 * @param bool $ignore_connected_plugins Delete the tokens even if there are other connected plugins.
	 *
	 * @return bool True if disconnected successfully, false otherwise.
	 */
	public function disconnect_site_wpcom( $ignore_connected_plugins = false ) {
		if ( ! $ignore_connected_plugins && null !== $this->plugin && ! $this->plugin->is_only() ) {
			return false;
		}

		/**
		 * Fires upon the disconnect attempt.
		 * Return `false` to prevent the disconnect.
		 *
		 * @since 8.7.0
		 */
		if ( ! apply_filters( 'jetpack_connection_disconnect_site_wpcom', true, $this ) ) {
			return false;
		}

		$xml = new \Jetpack_IXR_Client();
		$xml->query( 'jetpack.deregister', get_current_user_id() );

		return true;
	}

	/**
	 * Disconnect the plugin and remove the tokens.
	 * This function will automatically perform "soft" or "hard" disconnect depending on whether other plugins are using the connection.
	 * This is a proxy method to simplify the Connection package API.
	 *
	 * @see Manager::disable_plugin()
	 * @see Manager::disconnect_site_wpcom()
	 * @see Manager::delete_all_connection_tokens()
	 *
	 * @return bool
	 */
	public function remove_connection() {
		$this->disable_plugin();
		$this->disconnect_site_wpcom();
		$this->delete_all_connection_tokens();

		return true;
	}

	/**
	 * Completely clearing up the connection, and initiating reconnect.
	 *
	 * @return true|WP_Error True if reconnected successfully, a `WP_Error` object otherwise.
	 */
	public function reconnect() {
		$this->disconnect_site_wpcom( true );
		$this->delete_all_connection_tokens( true );

		return $this->register();
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
	 * @return \WP_Error|string WP_Error on failure, secret_2 on success.
	 */
	public function verify_secrets( $action, $secret_1, $user_id ) {
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

		$error = null;
		if ( empty( $secret_1 ) ) {
			$error = $return_error(
				new \WP_Error(
					'verify_secret_1_missing',
					/* translators: "%s" is the name of a paramter. It can be either "secret_1" or "state". */
					sprintf( __( 'The required "%s" parameter is missing.', 'jetpack' ), 'secret_1' ),
					400
				)
			);
		} elseif ( ! is_string( $secret_1 ) ) {
			$error = $return_error(
				new \WP_Error(
					'verify_secret_1_malformed',
					/* translators: "%s" is the name of a paramter. It can be either "secret_1" or "state". */
					sprintf( __( 'The required "%s" parameter is malformed.', 'jetpack' ), 'secret_1' ),
					400
				)
			);
		} elseif ( empty( $user_id ) ) {
			// $user_id is passed around during registration as "state".
			$error = $return_error(
				new \WP_Error(
					'state_missing',
					/* translators: "%s" is the name of a paramter. It can be either "secret_1" or "state". */
					sprintf( __( 'The required "%s" parameter is missing.', 'jetpack' ), 'state' ),
					400
				)
			);
		} elseif ( ! ctype_digit( (string) $user_id ) ) {
			$error = $return_error(
				new \WP_Error(
					'state_malformed',
					/* translators: "%s" is the name of a paramter. It can be either "secret_1" or "state". */
					sprintf( __( 'The required "%s" parameter is malformed.', 'jetpack' ), 'state' ),
					400
				)
			);
		} elseif ( self::SECRETS_MISSING === $stored_secrets ) {
			$error = $return_error(
				new \WP_Error(
					'verify_secrets_missing',
					__( 'Verification secrets not found', 'jetpack' ),
					400
				)
			);
		} elseif ( self::SECRETS_EXPIRED === $stored_secrets ) {
			$error = $return_error(
				new \WP_Error(
					'verify_secrets_expired',
					__( 'Verification took too long', 'jetpack' ),
					400
				)
			);
		} elseif ( ! $stored_secrets ) {
			$error = $return_error(
				new \WP_Error(
					'verify_secrets_empty',
					__( 'Verification secrets are empty', 'jetpack' ),
					400
				)
			);
		} elseif ( is_wp_error( $stored_secrets ) ) {
			$stored_secrets->add_data( 400 );
			$error = $return_error( $stored_secrets );
		} elseif ( empty( $stored_secrets['secret_1'] ) || empty( $stored_secrets['secret_2'] ) || empty( $stored_secrets['exp'] ) ) {
			$error = $return_error(
				new \WP_Error(
					'verify_secrets_incomplete',
					__( 'Verification secrets are incomplete', 'jetpack' ),
					400
				)
			);
		} elseif ( ! hash_equals( $secret_1, $stored_secrets['secret_1'] ) ) {
			$error = $return_error(
				new \WP_Error(
					'verify_secrets_mismatch',
					__( 'Secret mismatch', 'jetpack' ),
					400
				)
			);
		}

		// Something went wrong during the checks, returning the error.
		if ( ! empty( $error ) ) {
			return $error;
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
	 * Obtains the auth token.
	 *
	 * @param array $data The request data.
	 * @return object|\WP_Error Returns the auth token on success.
	 *                          Returns a \WP_Error on failure.
	 */
	public function get_token( $data ) {
		$roles = new Roles();
		$role  = $roles->translate_current_user_to_role();

		if ( ! $role ) {
			return new \WP_Error( 'role', __( 'An administrator for this blog must set up the Jetpack connection.', 'jetpack' ) );
		}

		$client_secret = $this->get_access_token();
		if ( ! $client_secret ) {
			return new \WP_Error( 'client_secret', __( 'You need to register your Jetpack before connecting it.', 'jetpack' ) );
		}

		/**
		 * Filter the URL of the first time the user gets redirected back to your site for connection
		 * data processing.
		 *
		 * @since 8.0.0
		 *
		 * @param string $redirect_url Defaults to the site admin URL.
		 */
		$processing_url = apply_filters( 'jetpack_token_processing_url', admin_url( 'admin.php' ) );

		$redirect = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';

		/**
		* Filter the URL to redirect the user back to when the authentication process
		* is complete.
		*
		* @since 8.0.0
		*
		* @param string $redirect_url Defaults to the site URL.
		*/
		$redirect = apply_filters( 'jetpack_token_redirect_url', $redirect );

		$redirect_uri = ( 'calypso' === $data['auth_type'] )
			? $data['redirect_uri']
			: add_query_arg(
				array(
					'action'   => 'authorize',
					'_wpnonce' => wp_create_nonce( "jetpack-authorize_{$role}_{$redirect}" ),
					'redirect' => $redirect ? rawurlencode( $redirect ) : false,
				),
				esc_url( $processing_url )
			);

		/**
		 * Filters the token request data.
		 *
		 * @since 8.0.0
		 *
		 * @param array $request_data request data.
		 */
		$body = apply_filters(
			'jetpack_token_request_body',
			array(
				'client_id'     => \Jetpack_Options::get_option( 'id' ),
				'client_secret' => $client_secret->secret,
				'grant_type'    => 'authorization_code',
				'code'          => $data['code'],
				'redirect_uri'  => $redirect_uri,
			)
		);

		$args = array(
			'method'  => 'POST',
			'body'    => $body,
			'headers' => array(
				'Accept' => 'application/json',
			),
		);

		add_filter( 'http_request_timeout', array( $this, 'increase_timeout' ), PHP_INT_MAX - 1 );
		$response = Client::_wp_remote_request( Utils::fix_url_for_bad_hosts( $this->api_url( 'token' ) ), $args );
		remove_filter( 'http_request_timeout', array( $this, 'increase_timeout' ), PHP_INT_MAX - 1 );

		if ( is_wp_error( $response ) ) {
			return new \WP_Error( 'token_http_request_failed', $response->get_error_message() );
		}

		$code   = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );

		if ( $entity ) {
			$json = json_decode( $entity );
		} else {
			$json = false;
		}

		if ( 200 !== $code || ! empty( $json->error ) ) {
			if ( empty( $json->error ) ) {
				return new \WP_Error( 'unknown', '', $code );
			}

			/* translators: Error description string. */
			$error_description = isset( $json->error_description ) ? sprintf( __( 'Error Details: %s', 'jetpack' ), (string) $json->error_description ) : '';

			return new \WP_Error( (string) $json->error, $error_description, $code );
		}

		if ( empty( $json->access_token ) || ! is_scalar( $json->access_token ) ) {
			return new \WP_Error( 'access_token', '', $code );
		}

		if ( empty( $json->token_type ) || 'X_JETPACK' !== strtoupper( $json->token_type ) ) {
			return new \WP_Error( 'token_type', '', $code );
		}

		if ( empty( $json->scope ) ) {
			return new \WP_Error( 'scope', 'No Scope', $code );
		}

		// TODO: get rid of the error silencer.
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@list( $role, $hmac ) = explode( ':', $json->scope );
		if ( empty( $role ) || empty( $hmac ) ) {
			return new \WP_Error( 'scope', 'Malformed Scope', $code );
		}

		if ( $this->sign_role( $role ) !== $json->scope ) {
			return new \WP_Error( 'scope', 'Invalid Scope', $code );
		}

		$cap = $roles->translate_role_to_cap( $role );
		if ( ! $cap ) {
			return new \WP_Error( 'scope', 'No Cap', $code );
		}

		if ( ! current_user_can( $cap ) ) {
			return new \WP_Error( 'scope', 'current_user_cannot', $code );
		}

		/**
		 * Fires after user has successfully received an auth token.
		 *
		 * @since 3.9.0
		 */
		do_action( 'jetpack_user_authorized' );

		return (string) $json->access_token;
	}

	/**
	 * Increases the request timeout value to 30 seconds.
	 *
	 * @return int Returns 30.
	 */
	public function increase_timeout() {
		return 30;
	}

	/**
	 * Builds a URL to the Jetpack connection auth page.
	 *
	 * @param WP_User $user (optional) defaults to the current logged in user.
	 * @param String  $redirect (optional) a redirect URL to use instead of the default.
	 * @return string Connect URL.
	 */
	public function get_authorization_url( $user = null, $redirect = null ) {

		if ( empty( $user ) ) {
			$user = wp_get_current_user();
		}

		$roles       = new Roles();
		$role        = $roles->translate_user_to_role( $user );
		$signed_role = $this->sign_role( $role );

		/**
		 * Filter the URL of the first time the user gets redirected back to your site for connection
		 * data processing.
		 *
		 * @since 8.0.0
		 *
		 * @param string $redirect_url Defaults to the site admin URL.
		 */
		$processing_url = apply_filters( 'jetpack_connect_processing_url', admin_url( 'admin.php' ) );

		/**
		 * Filter the URL to redirect the user back to when the authorization process
		 * is complete.
		 *
		 * @since 8.0.0
		 *
		 * @param string $redirect_url Defaults to the site URL.
		 */
		$redirect = apply_filters( 'jetpack_connect_redirect_url', $redirect );

		$secrets = $this->generate_secrets( 'authorize', $user->ID, 2 * HOUR_IN_SECONDS );

		/**
		 * Filter the type of authorization.
		 * 'calypso' completes authorization on wordpress.com/jetpack/connect
		 * while 'jetpack' ( or any other value ) completes the authorization at jetpack.wordpress.com.
		 *
		 * @since 4.3.3
		 *
		 * @param string $auth_type Defaults to 'calypso', can also be 'jetpack'.
		 */
		$auth_type = apply_filters( 'jetpack_auth_type', 'calypso' );

		/**
		 * Filters the user connection request data for additional property addition.
		 *
		 * @since 8.0.0
		 *
		 * @param array $request_data request data.
		 */
		$body = apply_filters(
			'jetpack_connect_request_body',
			array(
				'response_type' => 'code',
				'client_id'     => \Jetpack_Options::get_option( 'id' ),
				'redirect_uri'  => add_query_arg(
					array(
						'action'   => 'authorize',
						'_wpnonce' => wp_create_nonce( "jetpack-authorize_{$role}_{$redirect}" ),
						'redirect' => rawurlencode( $redirect ),
					),
					esc_url( $processing_url )
				),
				'state'         => $user->ID,
				'scope'         => $signed_role,
				'user_email'    => $user->user_email,
				'user_login'    => $user->user_login,
				'is_active'     => $this->is_active(),
				'jp_version'    => Constants::get_constant( 'JETPACK__VERSION' ),
				'auth_type'     => $auth_type,
				'secret'        => $secrets['secret_1'],
				'blogname'      => get_option( 'blogname' ),
				'site_url'      => site_url(),
				'home_url'      => home_url(),
				'site_icon'     => get_site_icon_url(),
				'site_lang'     => get_locale(),
				'site_created'  => $this->get_assumed_site_creation_date(),
			)
		);

		$body = $this->apply_activation_source_to_args( urlencode_deep( $body ) );

		$api_url = $this->api_url( 'authorize' );

		return add_query_arg( $body, $api_url );
	}

	/**
	 * Authorizes the user by obtaining and storing the user token.
	 *
	 * @param array $data The request data.
	 * @return string|\WP_Error Returns a string on success.
	 *                          Returns a \WP_Error on failure.
	 */
	public function authorize( $data = array() ) {
		/**
		 * Action fired when user authorization starts.
		 *
		 * @since 8.0.0
		 */
		do_action( 'jetpack_authorize_starting' );

		$roles = new Roles();
		$role  = $roles->translate_current_user_to_role();

		if ( ! $role ) {
			return new \WP_Error( 'no_role', 'Invalid request.', 400 );
		}

		$cap = $roles->translate_role_to_cap( $role );
		if ( ! $cap ) {
			return new \WP_Error( 'no_cap', 'Invalid request.', 400 );
		}

		if ( ! empty( $data['error'] ) ) {
			return new \WP_Error( $data['error'], 'Error included in the request.', 400 );
		}

		if ( ! isset( $data['state'] ) ) {
			return new \WP_Error( 'no_state', 'Request must include state.', 400 );
		}

		if ( ! ctype_digit( $data['state'] ) ) {
			return new \WP_Error( $data['error'], 'State must be an integer.', 400 );
		}

		$current_user_id = get_current_user_id();
		if ( $current_user_id !== (int) $data['state'] ) {
			return new \WP_Error( 'wrong_state', 'State does not match current user.', 400 );
		}

		if ( empty( $data['code'] ) ) {
			return new \WP_Error( 'no_code', 'Request must include an authorization code.', 400 );
		}

		$token = $this->get_token( $data );

		if ( is_wp_error( $token ) ) {
			$code = $token->get_error_code();
			if ( empty( $code ) ) {
				$code = 'invalid_token';
			}
			return new \WP_Error( $code, $token->get_error_message(), 400 );
		}

		if ( ! $token ) {
			return new \WP_Error( 'no_token', 'Error generating token.', 400 );
		}

		$is_master_user = ! $this->is_active();

		Utils::update_user_token( $current_user_id, sprintf( '%s.%d', $token, $current_user_id ), $is_master_user );

		if ( ! $is_master_user ) {
			/**
			 * Action fired when a secondary user has been authorized.
			 *
			 * @since 8.0.0
			 */
			do_action( 'jetpack_authorize_ending_linked' );
			return 'linked';
		}

		/**
		 * Action fired when the master user has been authorized.
		 *
		 * @since 8.0.0
		 *
		 * @param array $data The request data.
		 */
		do_action( 'jetpack_authorize_ending_authorized', $data );

		\Jetpack_Options::delete_raw_option( 'jetpack_last_connect_url_check' );

		// Start nonce cleaner.
		wp_clear_scheduled_hook( 'jetpack_clean_nonces' );
		wp_schedule_event( time(), 'hourly', 'jetpack_clean_nonces' );

		return 'authorized';
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
				return $suppress_errors ? false : new \WP_Error( 'no_user_tokens', __( 'No user tokens found', 'jetpack' ) );
			}
			if ( self::JETPACK_MASTER_USER === $user_id ) {
				$user_id = \Jetpack_Options::get_option( 'master_user' );
				if ( ! $user_id ) {
					return $suppress_errors ? false : new \WP_Error( 'empty_master_user_option', __( 'No primary user defined', 'jetpack' ) );
				}
			}
			if ( ! isset( $user_tokens[ $user_id ] ) || ! $user_tokens[ $user_id ] ) {
				// translators: %s is the user ID.
				return $suppress_errors ? false : new \WP_Error( 'no_token_for_user', sprintf( __( 'No token for user %d', 'jetpack' ), $user_id ) );
			}
			$user_token_chunks = explode( '.', $user_tokens[ $user_id ] );
			if ( empty( $user_token_chunks[1] ) || empty( $user_token_chunks[2] ) ) {
				// translators: %s is the user ID.
				return $suppress_errors ? false : new \WP_Error( 'token_malformed', sprintf( __( 'Token for user %d is malformed', 'jetpack' ), $user_id ) );
			}
			if ( $user_token_chunks[2] !== (string) $user_id ) {
				// translators: %1$d is the ID of the requested user. %2$d is the user ID found in the token.
				return $suppress_errors ? false : new \WP_Error( 'user_id_mismatch', sprintf( __( 'Requesting user_id %1$d does not match token user_id %2$d', 'jetpack' ), $user_id, $user_token_chunks[2] ) );
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
			// If no user tokens were found, it would have failed earlier, so this is about blog token.
			return $suppress_errors ? false : new \WP_Error( 'no_possible_tokens', __( 'No blog token found', 'jetpack' ) );
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
			if ( $user_id ) {
				// translators: %d is the user ID.
				return $suppress_errors ? false : new \WP_Error( 'no_valid_token', sprintf( __( 'Invalid token for user %d', 'jetpack' ), $user_id ) );
			} else {
				return $suppress_errors ? false : new \WP_Error( 'no_valid_token', __( 'Invalid blog token', 'jetpack' ) );
			}
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
	 * @param array $methods an array of available XMLRPC methods.
	 * @return array the same array, since this method doesn't add or remove anything.
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
	 * @param array $methods an array of available XMLRPC methods.
	 * @return array the amended array in case the method is added.
	 */
	public function public_xmlrpc_methods( $methods ) {
		if ( array_key_exists( 'wp.getOptions', $methods ) ) {
			$methods['wp.getOptions'] = array( $this, 'jetpack_get_options' );
		}
		return $methods;
	}

	/**
	 * Handles a getOptions XMLRPC method call.
	 *
	 * @param array $args method call arguments.
	 * @return an amended XMLRPC server options array.
	 */
	public function jetpack_get_options( $args ) {
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
				'desc'     => __( 'The WP.com user ID of the connected user', 'jetpack' ),
				'readonly' => true,
				'value'    => $user_data['ID'],
			);
			$options['jetpack_user_login']      = array(
				'desc'     => __( 'The WP.com username of the connected user', 'jetpack' ),
				'readonly' => true,
				'value'    => $user_data['login'],
			);
			$options['jetpack_user_email']      = array(
				'desc'     => __( 'The WP.com user email of the connected user', 'jetpack' ),
				'readonly' => true,
				'value'    => $user_data['email'],
			);
			$options['jetpack_user_site_count'] = array(
				'desc'     => __( 'The number of sites of the connected WP.com user', 'jetpack' ),
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
	 * @param array $options standard Core options.
	 * @return array amended options.
	 */
	public function xmlrpc_options( $options ) {
		$jetpack_client_id = false;
		if ( $this->is_active() ) {
			$jetpack_client_id = \Jetpack_Options::get_option( 'id' );
		}
		$options['jetpack_version'] = array(
			'desc'     => __( 'Jetpack Plugin Version', 'jetpack' ),
			'readonly' => true,
			'value'    => Constants::get_constant( 'JETPACK__VERSION' ),
		);

		$options['jetpack_client_id'] = array(
			'desc'     => __( 'The Client ID/WP.com Blog ID of this site', 'jetpack' ),
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

	/**
	 * Sign a user role with the master access token.
	 * If not specified, will default to the current user.
	 *
	 * @access public
	 *
	 * @param string $role    User role.
	 * @param int    $user_id ID of the user.
	 * @return string Signed user role.
	 */
	public function sign_role( $role, $user_id = null ) {
		if ( empty( $user_id ) ) {
			$user_id = (int) get_current_user_id();
		}

		if ( ! $user_id ) {
			return false;
		}

		$token = $this->get_access_token();
		if ( ! $token || is_wp_error( $token ) ) {
			return false;
		}

		return $role . ':' . hash_hmac( 'md5', "{$role}|{$user_id}", $token->secret );
	}

	/**
	 * Set the plugin instance.
	 *
	 * @param Plugin $plugin_instance The plugin instance.
	 *
	 * @return $this
	 */
	public function set_plugin_instance( Plugin $plugin_instance ) {
		$this->plugin = $plugin_instance;

		return $this;
	}

	/**
	 * Retrieve the plugin management object.
	 *
	 * @return Plugin
	 */
	public function get_plugin() {
		return $this->plugin;
	}

	/**
	 * Get all connected plugins information, excluding those disconnected by user.
	 * WARNING: the method cannot be called until Plugin_Storage::configure is called, which happens on plugins_loaded
	 * Even if you don't use Jetpack Config, it may be introduced later by other plugins,
	 * so please make sure not to run the method too early in the code.
	 *
	 * @return array|WP_Error
	 */
	public function get_connected_plugins() {
		$maybe_plugins = Plugin_Storage::get_all( true );

		if ( $maybe_plugins instanceof WP_Error ) {
			return $maybe_plugins;
		}

		return $maybe_plugins;
	}

	/**
	 * Force plugin disconnect. After its called, the plugin will not be allowed to use the connection.
	 * Note: this method does not remove any access tokens.
	 *
	 * @return bool
	 */
	public function disable_plugin() {
		if ( ! $this->plugin ) {
			return false;
		}

		return $this->plugin->disable();
	}

	/**
	 * Force plugin reconnect after user-initiated disconnect.
	 * After its called, the plugin will be allowed to use the connection again.
	 * Note: this method does not initialize access tokens.
	 *
	 * @return bool
	 */
	public function enable_plugin() {
		if ( ! $this->plugin ) {
			return false;
		}

		return $this->plugin->enable();
	}

	/**
	 * Whether the plugin is allowed to use the connection, or it's been disconnected by user.
	 * If no plugin slug was passed into the constructor, always returns true.
	 *
	 * @return bool
	 */
	public function is_plugin_enabled() {
		if ( ! $this->plugin ) {
			return true;
		}

		return $this->plugin->is_enabled();
	}

}
