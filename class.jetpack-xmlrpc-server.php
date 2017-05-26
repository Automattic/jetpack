<?php

/**
 * Just a sack of functions.  Not actually an IXR_Server
 */
class Jetpack_XMLRPC_Server {
	/**
	 * The current error object
	 */
	public $error = null;

	/**
	 * The current user
	 */
	public $user = null;

	/**
	 * Whitelist of the XML-RPC methods available to the Jetpack Server. If the
	 * user is not authenticated (->login()) then the methods are never added,
	 * so they will get a "does not exist" error.
	 */
	function xmlrpc_methods( $core_methods ) {
		$jetpack_methods = array(
			'jetpack.jsonAPI'      => array( $this, 'json_api' ),
			'jetpack.verifyAction' => array( $this, 'verify_action' ),
		);

		$this->user = $this->login();

		if ( $this->user ) {
			$jetpack_methods = array_merge( $jetpack_methods, array(
				'jetpack.testConnection'    => array( $this, 'test_connection' ),
				'jetpack.testAPIUserCode'   => array( $this, 'test_api_user_code' ),
				'jetpack.featuresAvailable' => array( $this, 'features_available' ),
				'jetpack.featuresEnabled'   => array( $this, 'features_enabled' ),
				'jetpack.disconnectBlog'    => array( $this, 'disconnect_blog' ),
				'jetpack.unlinkUser'        => array( $this, 'unlink_user' ),
				'jetpack.syncObject'        => array( $this, 'sync_object' ),
				'jetpack.idcUrlValidation'  => array( $this, 'validate_urls_for_idc_mitigation' ),
				'jetpack.addUserFromInvite' => array( $this, 'add_user_from_invite' ),
				'jetpack.addTokenOnInvite'  => array( $this, 'add_user_token_from_invite' ),
			) );

			if ( isset( $core_methods['metaWeblog.editPost'] ) ) {
				$jetpack_methods['metaWeblog.newMediaObject'] = $core_methods['metaWeblog.newMediaObject'];
				$jetpack_methods['jetpack.updateAttachmentParent'] = array( $this, 'update_attachment_parent' );
			}

			/**
			 * Filters the XML-RPC methods available to Jetpack for authenticated users.
			 *
			 * @since 1.1.0
			 *
			 * @param array $jetpack_methods XML-RPC methods available to the Jetpack Server.
			 * @param array $core_methods Available core XML-RPC methods.
			 * @param WP_User $user Information about a given WordPress user.
			 */
			$jetpack_methods = apply_filters( 'jetpack_xmlrpc_methods', $jetpack_methods, $core_methods, $this->user );
		}

		/**
		 * Filters the XML-RPC methods available to Jetpack for unauthenticated users.
		 *
		 * @since 3.0.0
		 *
		 * @param array $jetpack_methods XML-RPC methods available to the Jetpack Server.
		 * @param array $core_methods Available core XML-RPC methods.
		 */
		return apply_filters( 'jetpack_xmlrpc_unauthenticated_methods', $jetpack_methods, $core_methods );
	}

	/**
	 * Whitelist of the bootstrap XML-RPC methods
	 */
	function bootstrap_xmlrpc_methods() {
		return array(
			'jetpack.verifyRegistration' => array( $this, 'verify_registration' ),
			'jetpack.remoteAuthorize' => array( $this, 'remote_authorize' ),
		);
	}

	function authorize_xmlrpc_methods() {
		return array(
			'jetpack.remoteAuthorize' => array( $this, 'remote_authorize' ),
		);
	}

	function remote_authorize( $request ) {
		foreach( array( 'secret', 'state', 'redirect_uri', 'code' ) as $required ) {
			if ( ! isset( $request[ $required ] ) || empty( $request[ $required ] ) ) {
				return $this->error( new Jetpack_Error( 'missing_parameter', 'One or more parameters is missing from the request.', 400 ) );
			}
		}

		if ( ! get_user_by( 'id', $request['state'] ) ) {
			return $this->error( new Jetpack_Error( 'user_unknown', 'User not found.', 404 ) );
		}

		if ( Jetpack::is_active() && Jetpack::is_user_connected( $request['state'] ) ) {
			return $this->error( new Jetpack_Error( 'already_connected', 'User already connected.', 400 ) );
		}

		$verified = $this->verify_action( array( 'authorize', $request['secret'], $request['state'] ) );

		if ( is_a( $verified, 'IXR_Error' ) ) {
			return $verified;
		}

		wp_set_current_user( $request['state'] );

		$client_server = new Jetpack_Client_Server;
		$result = $client_server->authorize( $request );

		if ( is_wp_error( $result ) ) {
			return $this->error( $result );
		}

		$response = array(
			'result' => $result,
		);
		return $response;
	}

	/**
	* Verifies that Jetpack.WordPress.com received a registration request from this site
	*/
	function verify_registration( $data ) {
		return $this->verify_action( array( 'register', $data[0], $data[1] ) );
	}

	/**
	 * @return WP_Error|string secret_2 on success, WP_Error( error_code => error_code, error_message => error description, error_data => status code ) on failure
	 *
	 * Possible error_codes:
	 *
	 * verify_secret_1_missing
	 * verify_secret_1_malformed
	 * verify_secrets_missing: verification secrets are not found in database
	 * verify_secrets_incomplete: verification secrets are only partially found in database
	 * verify_secrets_expired: verification secrets have expired
	 * verify_secrets_mismatch: stored secret_1 does not match secret_1 sent by Jetpack.WordPress.com
	 * state_missing: required parameter of state not found
	 * state_malformed: state is not a digit
	 * invalid_state: state in request does not match the stored state
	 *
	 * The 'authorize' and 'register' actions have additional error codes
	 *
	 * state_missing: a state ( user id ) was not supplied
	 * state_malformed: state is not the correct data type
	 * invalid_state: supplied state does not match the stored state
	 */
	function verify_action( $params ) {
		$action = $params[0];
		$verify_secret = $params[1];
		$state = isset( $params[2] ) ? $params[2] : '';

		if ( empty( $verify_secret ) ) {
			return $this->error( new Jetpack_Error( 'verify_secret_1_missing', sprintf( 'The required "%s" parameter is missing.', 'secret_1' ), 400 ) );
		} else if ( ! is_string( $verify_secret ) ) {
			return $this->error( new Jetpack_Error( 'verify_secret_1_malformed', sprintf( 'The required "%s" parameter is malformed.', 'secret_1' ), 400 ) );
		} else if ( empty( $state ) ) {
			return $this->error( new Jetpack_Error( 'state_missing', sprintf( 'The required "%s" parameter is missing.', 'state' ), 400 ) );
		} else if ( ! ctype_digit( $state ) ) {
			return $this->error( new Jetpack_Error( 'state_malformed', sprintf( 'The required "%s" parameter is malformed.', 'state' ), 400 ) );
		}

		$secrets = Jetpack::get_secrets( $action, $state );

		if ( ! $secrets ) {
			Jetpack::delete_secrets( $action, $state );
			return $this->error( new Jetpack_Error( 'verify_secrets_missing', 'Verification secrets not found', 400 ) );
		}

		if ( is_wp_error( $secrets ) ) {
			Jetpack::delete_secrets( $action, $state );
			return $this->error( new Jetpack_Error( $secrets->get_error_code(), $secrets->get_error_message(), 400 ) );
		}

		if ( empty( $secrets['secret_1'] ) || empty( $secrets['secret_2'] ) || empty( $secrets['exp'] ) ) {
			Jetpack::delete_secrets( $action, $state );
			return $this->error( new Jetpack_Error( 'verify_secrets_incomplete', 'Verification secrets are incomplete', 400 ) );
		}

		if ( ! hash_equals( $verify_secret, $secrets['secret_1'] ) ) {
			Jetpack::delete_secrets( $action, $state );
			return $this->error( new Jetpack_Error( 'verify_secrets_mismatch', 'Secret mismatch', 400 ) );
		}

		Jetpack::delete_secrets( $action, $state );

		return $secrets['secret_2'];
	}

	/**
	 * Wrapper for wp_authenticate( $username, $password );
	 *
	 * @return WP_User|bool
	 */
	function login() {
		Jetpack::init()->require_jetpack_authentication();
		$user = wp_authenticate( 'username', 'password' );
		if ( is_wp_error( $user ) ) {
			if ( 'authentication_failed' == $user->get_error_code() ) { // Generic error could mean most anything.
				$this->error = new Jetpack_Error( 'invalid_request', 'Invalid Request', 403 );
			} else {
				$this->error = $user;
			}
			return false;
		} else if ( !$user ) { // Shouldn't happen.
			$this->error = new Jetpack_Error( 'invalid_request', 'Invalid Request', 403 );
			return false;
		}

		return $user;
	}

	/**
	 * Returns the current error as an IXR_Error
	 *
	 * @return bool|IXR_Error
	 */
	function error( $error = null ) {
		if ( !is_null( $error ) ) {
			$this->error = $error;
		}

		if ( is_wp_error( $this->error ) ) {
			$code = $this->error->get_error_data();
			if ( !$code ) {
				$code = -10520;
			}
			$message = sprintf( 'Jetpack: [%s] %s', $this->error->get_error_code(), $this->error->get_error_message() );
			return new IXR_Error( $code, $message );
		} else if ( is_a( $this->error, 'IXR_Error' ) ) {
			return $this->error;
		}

		return false;
	}

/* API Methods */

	/**
	 * Just authenticates with the given Jetpack credentials.
	 *
	 * @return string The current Jetpack version number
	 */
	function test_connection() {
		return JETPACK__VERSION;
	}

	function test_api_user_code( $args ) {
		$client_id = (int) $args[0];
		$user_id   = (int) $args[1];
		$nonce     = (string) $args[2];
		$verify    = (string) $args[3];

		if ( !$client_id || !$user_id || !strlen( $nonce ) || 32 !== strlen( $verify ) ) {
			return false;
		}

		$user = get_user_by( 'id', $user_id );
		if ( !$user || is_wp_error( $user ) ) {
			return false;
		}

		/* debugging
		error_log( "CLIENT: $client_id" );
		error_log( "USER:   $user_id" );
		error_log( "NONCE:  $nonce" );
		error_log( "VERIFY: $verify" );
		*/

		$jetpack_token = Jetpack_Data::get_access_token( $user_id );

		$api_user_code = get_user_meta( $user_id, "jetpack_json_api_$client_id", true );
		if ( !$api_user_code ) {
			return false;
		}

		$hmac = hash_hmac( 'md5', json_encode( (object) array(
			'client_id' => (int) $client_id,
			'user_id'   => (int) $user_id,
			'nonce'     => (string) $nonce,
			'code'      => (string) $api_user_code,
		) ), $jetpack_token->secret );

		if ( ! hash_equals( $hmac, $verify ) ) {
			return false;
		}

		return $user_id;
	}

	/**
	* Disconnect this blog from the connected wordpress.com account
	* @return boolean
	*/
	function disconnect_blog() {

		// For tracking
		if ( ! empty( $this->user->ID ) ) {
			wp_set_current_user( $this->user->ID );
		}

		Jetpack::log( 'disconnect' );
		Jetpack::disconnect();

		return true;
	}

	/**
	 * Unlink a user from WordPress.com
	 *
	 * This will fail if called by the Master User.
	 */
	function unlink_user() {
		Jetpack::log( 'unlink' );
		return Jetpack::unlink_user();
	}

	/**
	 * Returns any object that is able to be synced
	 */
	function sync_object( $args ) {
		// e.g. posts, post, 5
		list( $module_name, $object_type, $id ) = $args;
		require_once dirname( __FILE__ ) . '/sync/class.jetpack-sync-modules.php';
		require_once dirname( __FILE__ ) . '/sync/class.jetpack-sync-sender.php';

		$sync_module = Jetpack_Sync_Modules::get_module( $module_name );
		$codec = Jetpack_Sync_Sender::get_instance()->get_codec();

		return $codec->encode( $sync_module->get_object_by_id( $object_type, $id ) );
	}

	/**
	 * Returns the home URL and site URL for the current site which can be used on the WPCOM side for
	 * IDC mitigation to decide whether sync should be allowed if the home and siteurl values differ between WPCOM
	 * and the remote Jetpack site.
	 *
	 * @return array
	 */
	function validate_urls_for_idc_mitigation() {
		return array(
			'home'    => get_home_url(),
			'siteurl' => get_site_url(),
		);
	}

	/**
	 * @param object $user_data
	 *
	 * @return bool|int
	 */
	function add_user_from_invite( $user_data ) {
		require_once JETPACK__PLUGIN_DIR . 'modules/sso/class.jetpack-sso-helpers.php';

		$user_data = (object) $user_data;
		if ( ! $user_data || ! isset( $user_data->email ) ) {
			return false;
		}

		// Check for an existing user
		$user = get_user_by( 'email', $user_data->email );
		if ( $user ) {
			return $user->ID;
		}

		$user = Jetpack_SSO_Helpers::generate_user( $user_data );
		if ( ! $user ) {
			 return false;
		}

		return $user->ID;
	}

	/**
	 * @param array $args
	 *
	 * @return bool|WP_Error
	 */
	function add_user_token_from_invite( $args ) {
		if ( empty( $args['user_id'] ) || empty( $args['user_token'] ) ) {
			return false;
		}

		$user_id = (int) $args['user_id'];
		if ( ! get_user_by( 'id', $user_id ) ) {
			return new WP_Error( 'user_does_not_exist', __( 'The user does not exist', 'jetpack' ) );
		}
		if ( Jetpack::is_user_connected( $user_id ) ) {
			return new WP_Error( 'user_already_connected', __( 'The user is already connected', 'jetpack' ) );
		}

		// Need to update total number of connection here.
		// Should probably factor the logic out of Jetpack_Client_Server instead of duplicating

		$user_token = sanitize_text_field( $args['user_token'] );
		Jetpack::update_user_token( $user_id, sprintf( '%s.%d', $user_token, $user_id ), false );

		return true;
	}

	/**
	 * Returns what features are available. Uses the slug of the module files.
	 *
	 * @return array
	 */
	function features_available() {
		$raw_modules = Jetpack::get_available_modules();
		$modules = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	/**
	 * Returns what features are enabled. Uses the slug of the modules files.
	 *
	 * @return array
	 */
	function features_enabled() {
		$raw_modules = Jetpack::get_active_modules();
		$modules = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	function update_attachment_parent( $args ) {
		$attachment_id = (int) $args[0];
		$parent_id     = (int) $args[1];

		return wp_update_post( array(
			'ID'          => $attachment_id,
			'post_parent' => $parent_id,
		) );
	}

	function json_api( $args = array() ) {
		$json_api_args = $args[0];
		$verify_api_user_args = $args[1];

		$method       = (string) $json_api_args[0];
		$url          = (string) $json_api_args[1];
		$post_body    = is_null( $json_api_args[2] ) ? null : (string) $json_api_args[2];
		$user_details = (array) $json_api_args[4];
		$locale       = (string) $json_api_args[5];

		if ( !$verify_api_user_args ) {
			$user_id = 0;
		} elseif ( 'internal' === $verify_api_user_args[0] ) {
			$user_id = (int) $verify_api_user_args[1];
			if ( $user_id ) {
				$user = get_user_by( 'id', $user_id );
				if ( !$user || is_wp_error( $user ) ) {
					return false;
				}
			}
		} else {
			$user_id = call_user_func( array( $this, 'test_api_user_code' ), $verify_api_user_args );
			if ( !$user_id ) {
				return false;
			}
		}

		/* debugging
		error_log( "-- begin json api via jetpack debugging -- " );
		error_log( "METHOD: $method" );
		error_log( "URL: $url" );
		error_log( "POST BODY: $post_body" );
		error_log( "VERIFY_ARGS: " . print_r( $verify_api_user_args, 1 ) );
		error_log( "VERIFIED USER_ID: " . (int) $user_id );
		error_log( "-- end json api via jetpack debugging -- " );
		*/

		if ( 'en' !== $locale ) {
			// .org mo files are named slightly different from .com, and all we have is this the locale -- try to guess them.
			$new_locale = $locale;
			if ( strpos( $locale, '-' ) !== false ) {
				$locale_pieces = explode( '-', $locale );
				$new_locale = $locale_pieces[0];
				$new_locale .= ( ! empty( $locale_pieces[1] ) ) ? '_' . strtoupper( $locale_pieces[1] ) : '';
			} else {
				// .com might pass 'fr' because thats what our language files are named as, where core seems
				// to do fr_FR - so try that if we don't think we can load the file.
				if ( ! file_exists( WP_LANG_DIR . '/' . $locale . '.mo' ) ) {
					$new_locale =  $locale . '_' . strtoupper( $locale );
				}
			}

			if ( file_exists( WP_LANG_DIR . '/' . $new_locale . '.mo' ) ) {
				unload_textdomain( 'default' );
				load_textdomain( 'default', WP_LANG_DIR . '/' . $new_locale . '.mo' );
			}
		}

		$old_user = wp_get_current_user();
		wp_set_current_user( $user_id );

		$token = Jetpack_Data::get_access_token( get_current_user_id() );
		if ( !$token || is_wp_error( $token ) ) {
			return false;
		}

		define( 'REST_API_REQUEST', true );
		define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );

		// needed?
		require_once ABSPATH . 'wp-admin/includes/admin.php';

		require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
		$api = WPCOM_JSON_API::init( $method, $url, $post_body );
		$api->token_details['user'] = $user_details;
		require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

		$display_errors = ini_set( 'display_errors', 0 );
		ob_start();
		$content_type = $api->serve( false );
		$output = ob_get_clean();
		ini_set( 'display_errors', $display_errors );

		$nonce = wp_generate_password( 10, false );
		$hmac  = hash_hmac( 'md5', $nonce . $output, $token->secret );

		wp_set_current_user( isset( $old_user->ID ) ? $old_user->ID : 0 );

		return array(
			(string) $output,
			(string) $nonce,
			(string) $hmac,
		);
	}
}
